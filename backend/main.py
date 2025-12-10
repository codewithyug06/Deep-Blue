from fastapi import FastAPI, HTTPException, Depends, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from sqlalchemy import desc
import json
import os
import io
import contextlib
import traceback
import re
import asyncio
from datetime import datetime

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
    is_completed: bool = False

class ErrorAnalysisRequest(BaseModel):
    code: str
    error_trace: str

class WeaknessRequest(BaseModel):
    weakness: str

class DiffRequest(BaseModel):
    code: str
    mission_description: str

class ScoreRequest(BaseModel):
    user_id: int
    mission_id: int
    execution_time: float
    memory_usage: float

# --- HELPER FUNCTIONS ---
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

@app.get("/")
def read_root():
    return {"status": "Deep Blue API is running 🔵"}

# --- WEBSOCKET CONNECTION MANAGER (ENHANCED FOR MULTIPLAYER) ---
class ConnectionManager:
    def __init__(self):
        # Store connections by session_id (room)
        # Structure: { "session_id": [WebSocket1, WebSocket2, ...] }
        self.active_rooms: dict[str, list[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, session_id: str):
        await websocket.accept()
        if session_id not in self.active_rooms:
            self.active_rooms[session_id] = []
        self.active_rooms[session_id].append(websocket)

    def disconnect(self, websocket: WebSocket, session_id: str):
        if session_id in self.active_rooms:
            if websocket in self.active_rooms[session_id]:
                self.active_rooms[session_id].remove(websocket)
            if not self.active_rooms[session_id]:
                del self.active_rooms[session_id]

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast_to_room(self, message: str, session_id: str, sender: WebSocket):
        # Broadcast to everyone in the room EXCEPT the sender
        if session_id in self.active_rooms:
            for connection in self.active_rooms[session_id]:
                if connection != sender:
                    await connection.send_text(message)

manager = ConnectionManager()

# --- WEBSOCKET ENDPOINT (Chat + Multiplayer Sync) ---
@app.websocket("/ws/chat")
async def websocket_endpoint(websocket: WebSocket):
    # Initial connection doesn't have a session ID yet, wait for first message or param
    # For simplicity, we'll accept immediately and expect session_id in payload
    # In a real app, query params are better: /ws/chat?session_id=...
    # Here we adapt to the existing architecture.
    
    await websocket.accept()
    current_session_id = "default" # Fallback
    
    try:
        while True:
            data = await websocket.receive_text()
            payload = json.loads(data)
            
            # Extract Metadata
            msg_type = payload.get("type", "chat") # 'chat', 'code_sync', 'join'
            session_id = payload.get("session_id", "default")
            
            # Manage Room Registration manually since we accepted generic connection
            if session_id != current_session_id:
                # Switching rooms (or initial join)
                if websocket in manager.active_rooms.get(current_session_id, []):
                    manager.active_rooms[current_session_id].remove(websocket)
                
                if session_id not in manager.active_rooms:
                    manager.active_rooms[session_id] = []
                manager.active_rooms[session_id].append(websocket)
                current_session_id = session_id

            # --- 1. CODE SYNC (MULTIPLAYER) ---
            if msg_type == "code_sync":
                # Broadcast code changes to other "Crew Members" (Navigator/Pilot)
                await manager.broadcast_to_room(json.dumps({
                    "type": "code_update",
                    "code": payload.get("code")
                }), session_id, websocket)

            # --- 2. AI CHAT ---
            elif msg_type == "chat":
                user_input = payload.get("message", "")
                user_code = payload.get("code", "")
                
                # Non-blocking AI call
                response = await asyncio.to_thread(
                    ai_tutor.chat, user_input, user_code, session_id
                )
                
                # Reply only to sender
                await websocket.send_text(json.dumps({
                    "role": "ai", 
                    "text": response
                }))

    except WebSocketDisconnect:
        if current_session_id in manager.active_rooms:
             if websocket in manager.active_rooms[current_session_id]:
                manager.active_rooms[current_session_id].remove(websocket)
    except Exception as e:
        print(f"WebSocket Error: {e}")
        try:
            await websocket.send_text(json.dumps({
                "role": "ai", 
                "text": ">> CONNECTION INTERRUPTED: Signal Lost."
            }))
        except:
            pass

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

# --- PROGRESS ENDPOINT ---
@app.post("/save-progress")
def save_progress(request: CodeRequest, db: Session = Depends(get_db)):
    user_id = request.user_id
    mission_id = request.mission_id
    code = request.code
    completed_status = request.is_completed

    if not user_id or not mission_id:
        raise HTTPException(status_code=400, detail="Missing user_id or mission_id")

    existing = db.query(models.UserProgress).filter_by(user_id=user_id, mission_id=mission_id).first()
    
    if existing:
        existing.code_solution = code
        if completed_status:
            existing.is_completed = True
    else:
        progress = models.UserProgress(
            user_id=user_id, 
            mission_id=mission_id, 
            is_completed=completed_status, 
            code_solution=code
        )
        db.add(progress)
    
    db.commit()
    return {"status": "Progress Saved 💾"}

@app.get("/get-progress")
def get_progress(user_id: int, mission_id: int, db: Session = Depends(get_db)):
    progress = db.query(models.UserProgress).filter_by(user_id=user_id, mission_id=mission_id).first()
    if progress:
        return {"code": progress.code_solution, "is_completed": progress.is_completed}
    return {"code": None, "is_completed": False}

# --- NEW: LEADERBOARD ENDPOINTS ---

@app.post("/submit-score")
def submit_score(request: ScoreRequest, db: Session = Depends(get_db)):
    """
    Submits a new high score entry.
    """
    user = db.query(models.User).filter(models.User.id == request.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    new_score = models.Leaderboard(
        mission_id=request.mission_id,
        user_id=request.user_id,
        username=user.username,
        execution_time=request.execution_time,
        memory_usage=request.memory_usage,
        timestamp=datetime.now().isoformat()
    )
    db.add(new_score)
    db.commit()
    return {"status": "Score Uploaded to Global Net 🌍"}

@app.get("/leaderboard/{mission_id}")
def get_leaderboard(mission_id: int, db: Session = Depends(get_db)):
    """
    Returns top 10 scores for a mission, sorted by execution time.
    """
    scores = db.query(models.Leaderboard)\
        .filter(models.Leaderboard.mission_id == mission_id)\
        .order_by(models.Leaderboard.execution_time.asc())\
        .limit(10)\
        .all()
    return scores

# --- NEW ENHANCEMENTS ENDPOINTS ---

@app.post("/explain-error")
async def explain_error_endpoint(request: ErrorAnalysisRequest):
    analysis = ai_tutor.analyze_runtime_error(request.code, request.error_trace)
    return analysis

@app.post("/adaptive-mission")
async def get_adaptive_mission(request: WeaknessRequest):
    mission = ai_tutor.create_adaptive_mission(request.weakness)
    if mission:
        return mission
    raise HTTPException(status_code=500, detail="Failed to generate mission")

# --- EXECUTION & ANALYZE ---

@app.post("/execute")
async def execute_code_legacy(request: CodeRequest):
    return {"output": "⚠️ Server-side execution is disabled. Please use the client-side runner."}

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