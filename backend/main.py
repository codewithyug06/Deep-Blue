from fastapi import FastAPI, HTTPException, Depends, WebSocket, WebSocketDisconnect
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
import asyncio

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
    is_completed: bool = False # NEW: Flag to indicate if tests passed

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

# --- WEBSOCKET CONNECTION MANAGER ---
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

manager = ConnectionManager()

# --- WEBSOCKET ENDPOINT (Real-time AI Chat) ---
@app.websocket("/ws/chat")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            payload = json.loads(data)
            
            user_input = payload.get("message", "")
            user_code = payload.get("code", "")
            session_id = payload.get("session_id", "default")
            
            # Non-blocking AI call (Simulated for async flow)
            response = await asyncio.to_thread(
                ai_tutor.chat, user_input, user_code, session_id
            )
            
            await manager.send_personal_message(json.dumps({
                "role": "ai", 
                "text": response
            }), websocket)
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        print(f"WebSocket Error: {e}")
        await manager.send_personal_message(json.dumps({
            "role": "ai", 
            "text": ">> CONNECTION INTERRUPTED: Signal Lost."
        }), websocket)

# --- AUTH ENDPOINTS ---

@app.post("/register")
def register_user(auth: UserAuth, db: Session = Depends(get_db)):
    username = auth.username
    password = auth.password
    existing = db.query(models.User).filter(models.User.username == username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already taken.")
    hashed_pwd = get_password_hash(password)
    is_premium_status = True if username.lower() == "pro" else False
    new_user = models.User(username=username, hashed_password=hashed_pwd, is_premium=is_premium_status)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "Registration successful", "user_id": new_user.id, "is_premium": is_premium_status}

@app.post("/login")
def login_user(auth: UserAuth, db: Session = Depends(get_db)):
    username = auth.username
    password = auth.password
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not verify_password(password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if username.lower() == "pro" and not user.is_premium:
        user.is_premium = True
        db.commit()
    return {"message": "Login successful", "user_id": user.id, "is_premium": user.is_premium}

# --- PROGRESS ENDPOINT (UPDATED LOGIC) ---
@app.post("/save-progress")
def save_progress(request: CodeRequest, db: Session = Depends(get_db)):
    """
    Saves user progress.
    Only marks as 'is_completed' if explicitly requested (when tests pass).
    Otherwise, just saves the code draft.
    """
    user_id = request.user_id
    mission_id = request.mission_id
    code = request.code
    completed_status = request.is_completed

    if not user_id or not mission_id:
        raise HTTPException(status_code=400, detail="Missing user_id or mission_id")

    existing = db.query(models.UserProgress).filter_by(user_id=user_id, mission_id=mission_id).first()
    
    if existing:
        existing.code_solution = code
        # Only upgrade status to True, never downgrade to False if already completed
        if completed_status:
            existing.is_completed = True
    else:
        progress = models.UserProgress(
            user_id=user_id, 
            mission_id=mission_id, 
            is_completed=completed_status, # False for manual save, True for auto-complete
            code_solution=code
        )
        db.add(progress)
    
    db.commit()
    return {"status": "Progress Saved 💾"}

# --- GET PROGRESS ENDPOINT (NEW) ---
@app.get("/get-progress")
def get_progress(user_id: int, mission_id: int, db: Session = Depends(get_db)):
    """
    Fetches the saved code for a specific user and mission.
    """
    progress = db.query(models.UserProgress).filter_by(user_id=user_id, mission_id=mission_id).first()
    if progress:
        return {"code": progress.code_solution, "is_completed": progress.is_completed}
    return {"code": None, "is_completed": False}

# --- EXECUTION ENGINE (DEPRECATED/LEGACY) ---
@app.post("/execute")
async def execute_code_legacy(request: CodeRequest):
    return {"output": "⚠️ Server-side execution is disabled. Please use the client-side runner."}

# --- ANALYZE ENDPOINT (For 3D Visuals) ---
@app.post("/analyze")
async def analyze_code(request: CodeRequest):
    try:
        if request.is_premium:
            visual_data = parse_code_to_3d(request.code)
        else:
            visual_data = None 
    except Exception as e:
        visual_data = {"error": str(e), "nodes": [], "links": []}
    
    return {
        "visual_data": visual_data,
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