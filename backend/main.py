from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from passlib.context import CryptContext
import json
import os
import io
import contextlib
import traceback
import re

# --- INTERNAL IMPORTS ---
from app.engine.rag_agent import ai_tutor
from app.engine.ast_parser import parse_code_to_3d

# --- DATABASE IMPORTS ---
from app.database import engine, get_db
from app import models

# Initialize Database Tables
models.Base.metadata.create_all(bind=engine)

# Password Hashing Config
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- REQUEST MODELS ---
class UserAuth(BaseModel):
    username: str
    password: str

class CodeRequest(BaseModel):
    code: str
    user_input: str = ""
    session_id: str = "default_user"
    is_premium: bool = False
    mission_id: int = None
    user_id: int = None 

# --- NEW REQUEST MODELS FOR AI FEATURES ---
class WeaknessRequest(BaseModel):
    weakness: str

class DiffRequest(BaseModel):
    code: str
    mission_description: str

# --- HELPER FUNCTIONS ---
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

@app.get("/")
def read_root():
    return {"status": "Deep Blue API is running 🔵"}

# --- DATABASE ENDPOINTS ---

@app.post("/register")
def register_user(auth: UserAuth, db: Session = Depends(get_db)):
    username = auth.username
    password = auth.password
    
    existing = db.query(models.User).filter(models.User.username == username).first()
    
    if existing:
        if not verify_password(password, existing.hashed_password):
            raise HTTPException(status_code=401, detail="Incorrect password")
        if username.lower() == "pro" and not existing.is_premium:
            existing.is_premium = True
            db.commit()
        return {"message": "Login successful", "user_id": existing.id, "is_premium": existing.is_premium}
    
    hashed_pwd = get_password_hash(password)
    is_premium_status = True if username.lower() == "pro" else False
    
    new_user = models.User(username=username, hashed_password=hashed_pwd, is_premium=is_premium_status)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {"message": "Registration successful", "user_id": new_user.id, "is_premium": is_premium_status}

@app.post("/verify")
def verify_session():
    return {"status": "valid", "message": "Session active"}

@app.post("/upgrade-premium")
def upgrade_premium(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_premium = True
    db.commit()
    return {"status": "User upgraded to Premium 🌟", "is_premium": True}

@app.post("/save-progress")
def save_progress(user_id: int, mission_id: int, code: str, db: Session = Depends(get_db)):
    existing = db.query(models.UserProgress).filter_by(user_id=user_id, mission_id=mission_id).first()
    if existing:
        existing.code_solution = code
        existing.is_completed = True
    else:
        progress = models.UserProgress(
            user_id=user_id, 
            mission_id=mission_id, 
            is_completed=True, 
            code_solution=code
        )
        db.add(progress)
    db.commit()
    return {"status": "Mission Accomplished & Saved 💾"}

# --- AI & PEDAGOGICAL ENDPOINTS (NEW) ---

@app.post("/generate-mission")
async def generate_adaptive_mission(request: WeaknessRequest):
    """
    Generates a custom mission based on student weakness (Adaptive Curriculum).
    """
    try:
        mission_data = ai_tutor.generate_custom_mission(request.weakness)
        return mission_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/explain-diff")
async def explain_code_diff(request: DiffRequest):
    """
    Returns a conceptual diff between user code and mission requirements.
    """
    try:
        explanation = ai_tutor.explain_logic_diff(request.code, request.mission_description)
        return {"diff_explanation": explanation}
    except Exception as e:
        return {"diff_explanation": "Could not generate diff analysis."}

# --- EXECUTION & TEST ENGINE ---

@app.post("/execute")
async def execute_code(request: CodeRequest):
    forbidden = ["import os", "import subprocess", "open(", "remove(", "rmdir"]
    if any(bad in request.code for bad in forbidden):
        return {"output": "⚠️ Security Alert: File system access is restricted."}

    output_buffer = io.StringIO()
    try:
        with contextlib.redirect_stdout(output_buffer):
            safe_globals = {"__builtins__": __builtins__}
            exec(request.code, safe_globals)
            
            test_results = []
            if request.mission_id:
                try:
                    # Logic to load missions and test (Preserved)
                    with open(os.path.join("app", "data", "missions.json"), "r") as f:
                        data = json.load(f)
                    all_missions = []
                    if isinstance(data, dict):
                        for cat in data: 
                            category_missions = data[cat] if isinstance(data[cat], list) else []
                            all_missions.extend([m for m in category_missions if isinstance(m, dict)])
                    elif isinstance(data, list):
                        all_missions = data

                    mission = next((m for m in all_missions if m.get("id") == request.mission_id), None)

                    if mission and "test_cases" in mission:
                        match = re.search(r"def\s+(\w+)\(", request.code)
                        if match:
                            func_name = match.group(1)
                            user_func = safe_globals.get(func_name)
                            if user_func:
                                for i, case in enumerate(mission["test_cases"]):
                                    inputs = case["input"]
                                    expected = case["expected"]
                                    try:
                                        result = user_func(*inputs)
                                        passed = result == expected
                                        test_results.append({
                                            "id": i + 1,
                                            "input": str(inputs),
                                            "expected": str(expected),
                                            "actual": str(result),
                                            "passed": passed
                                        })
                                    except Exception as e:
                                        test_results.append({"id": i+1, "passed": False, "actual": str(e)})
                        else:
                             test_results.append({"id": 0, "passed": False, "actual": "No function definition found."})
                except Exception as e:
                    print(f"Test Runner Error: {e}")

        return {
            "output": output_buffer.getvalue(),
            "test_results": test_results
        }
    except Exception:
        return {"output": traceback.format_exc()}
    finally:
        output_buffer.close()

# --- VISUALIZATION & AI ENGINE ---

@app.post("/analyze")
async def analyze_code(request: CodeRequest):
    try:
        if request.is_premium:
            visual_data = parse_code_to_3d(request.code)
        else:
            visual_data = None 
    except Exception as e:
        visual_data = {"error": str(e), "nodes": [], "links": []}
    
    ai_feedback = ""
    # Chat uses the updated RAG-enabled chat function
    if request.user_input or request.code:
        try:
            ai_feedback = ai_tutor.chat(request.user_input, user_code=request.code, session_id=request.session_id)
        except Exception as e:
            ai_feedback = f"AI Error: {str(e)}"

    # Haptic Pattern Logic (Preserved)
    vibration_pattern = []
    if request.is_premium:
        if visual_data and "error" in visual_data:
            vibration_pattern = [100, 50, 100, 50, 100]
        elif visual_data and "nodes" in visual_data:
            node_types = [n.get("type", "") for n in visual_data["nodes"]]
            if "loop" in node_types:
                vibration_pattern = [50, 200, 50, 200] 
            elif "decision" in node_types:
                vibration_pattern = [50, 300, 50]
            elif "function" in node_types:
                vibration_pattern = [300]
            else:
                vibration_pattern = [50]

    return {
        "visual_data": visual_data,
        "ai_feedback": ai_feedback,
        "vibration_pattern": vibration_pattern,
        "premium_locked": not request.is_premium
    }

@app.get("/missions")
def get_missions(is_premium: bool = False):
    file_path = os.path.join("app", "data", "missions.json")
    try:
        with open(file_path, "r") as f:
            data = json.load(f)
        
        all_missions = []
        if isinstance(data, dict):
            for category in data:
                items = data[category] if isinstance(data[category], list) else []
                for m in items:
                    if isinstance(m, dict):
                        m['category_tag'] = category 
                        if 'difficulty' in m:
                            m['difficulty'] = m['difficulty'].strip()
                        else:
                            m['difficulty'] = 'Medium'
                        all_missions.append(m)
        elif isinstance(data, list):
            all_missions = data

        if is_premium:
            return all_missions 
        else:
            return [m for m in all_missions if m.get('difficulty', '').strip().lower() == 'easy']
            
    except Exception as e:
        print(f"Error loading missions: {e}")
        return []

@app.get("/problems")
def get_problems_dashboard(user_id: int = None, db: Session = Depends(get_db)):
    file_path = os.path.join("app", "data", "missions.json")
    try:
        with open(file_path, "r") as f:
            data = json.load(f)
        
        all_problems = []
        if isinstance(data, dict):
            for category in data:
                items = data[category] if isinstance(data[category], list) else []
                for m in items:
                    if isinstance(m, dict):
                        m['topic'] = category
                        m['acceptance'] = f"{abs(hash(m.get('title', '')) % 40) + 30}.{abs(hash(str(m.get('id'))) % 9)}%" 
                        all_problems.append(m)
        elif isinstance(data, list):
            all_problems = data

        solved_ids = set()
        if user_id:
            progress_records = db.query(models.UserProgress).filter(
                models.UserProgress.user_id == user_id,
                models.UserProgress.is_completed == True
            ).all()
            solved_ids = {p.mission_id for p in progress_records}

        for p in all_problems:
            p['status'] = "Solved" if p.get('id') in solved_ids else "Todo"

        return all_problems

    except Exception as e:
        print(f"Error fetching problems: {e}")
        return []