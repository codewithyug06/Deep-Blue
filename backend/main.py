from fastapi import FastAPI, HTTPException, Depends, WebSocket, WebSocketDisconnect, BackgroundTasks, status
from pydantic import BaseModel, EmailStr
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
import random
import string
from datetime import datetime, timedelta
import uuid
from dotenv import load_dotenv

# --- MAIL MODULES ---
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType

# --- INTERNAL IMPORTS ---
from app.engine.rag_agent import ai_tutor
from app.engine.ast_parser import parse_code_to_3d
from app.engine.memory_tracer import MemoryTracer

try:
    import radon.complexity as radon_cc
except ImportError:
    radon_cc = None

from app.database import engine, get_db
from app import models

load_dotenv()

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

# --- EMAIL CONFIGURATION ---
conf = ConnectionConfig(
    MAIL_USERNAME=os.getenv("MAIL_USERNAME"),
    MAIL_PASSWORD=os.getenv("MAIL_PASSWORD"),
    MAIL_FROM=os.getenv("MAIL_FROM", os.getenv("MAIL_USERNAME")),
    MAIL_PORT=int(os.getenv("MAIL_PORT", 587)),
    MAIL_SERVER=os.getenv("MAIL_SERVER", "smtp.gmail.com"),
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True
)

# --- REQUEST MODELS ---
class UserAuth(BaseModel):
    username: str
    password: str

class RegisterUser(BaseModel):
    username: str
    email: EmailStr
    password: str
    otp: str

class OTPRequest(BaseModel):
    email: EmailStr

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

class ScoreRequest(BaseModel):
    user_id: int
    mission_id: int
    execution_time: float
    memory_usage: float

# --- NEW: SETTINGS REQUEST MODELS ---
class PasswordChangeRequest(BaseModel):
    user_id: int
    old_password: str
    new_password: str

class ProfileUpdateRequest(BaseModel):
    user_id: int
    new_username: str
    new_email: EmailStr

class DeleteAccountRequest(BaseModel):
    user_id: int
    password: str

# --- HELPER FUNCTIONS ---
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def generate_otp(length=6):
    return ''.join(random.choices(string.digits, k=length))

@app.get("/")
def read_root():
    return {"status": "Deep Blue API is running 🔵"}

# --- OTP ENDPOINT ---
@app.post("/send-otp")
async def send_otp(request: OTPRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    email = request.email
    existing_user = db.query(models.User).filter(models.User.email == email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered.")

    otp_code = generate_otp()
    expiration = datetime.utcnow() + timedelta(minutes=5)

    existing_otp = db.query(models.OTP).filter(models.OTP.email == email).first()
    if existing_otp:
        existing_otp.otp_code = otp_code
        existing_otp.expires_at = expiration
    else:
        new_otp = models.OTP(email=email, otp_code=otp_code, expires_at=expiration)
        db.add(new_otp)
    
    db.commit()

    message = MessageSchema(
        subject="Deep Blue Identity Verification",
        recipients=[email],
        body=f"<h3>Deep Blue Neural Interface</h3><p>Your verification code is:</p><h1>{otp_code}</h1><p>Expires in 5 minutes.</p>",
        subtype=MessageType.html
    )

    fm = FastMail(conf)
    background_tasks.add_task(fm.send_message, message)

    return {"message": "OTP Sent"}

# --- AUTH ENDPOINTS ---
@app.post("/register")
def register_user(auth: RegisterUser, db: Session = Depends(get_db)):
    otp_record = db.query(models.OTP).filter(models.OTP.email == auth.email).first()
    if not otp_record:
        raise HTTPException(status_code=400, detail="OTP not found. Request a new one.")
    if otp_record.otp_code != auth.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP.")
    if datetime.utcnow() > otp_record.expires_at:
        raise HTTPException(status_code=400, detail="OTP Expired.")

    existing_user = db.query(models.User).filter(models.User.username == auth.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already taken.")

    hashed_pwd = get_password_hash(auth.password)
    is_premium_status = True if auth.username.lower() == "pro" else False
    
    new_user = models.User(
        username=auth.username, 
        email=auth.email, 
        hashed_password=hashed_pwd, 
        is_premium=is_premium_status
    )
    
    db.add(new_user)
    db.delete(otp_record)
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
    return {"message": "Login successful", "user_id": user.id, "is_premium": user.is_premium}

# --- NEW: SETTINGS & PROFILE MANAGEMENT ENDPOINTS ---

@app.post("/settings/change-password")
def change_password(request: PasswordChangeRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == request.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Verify old password
    if not verify_password(request.old_password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect current password")
    
    # Update with new hashed password
    user.hashed_password = get_password_hash(request.new_password)
    db.commit()
    return {"status": "success", "message": "Password updated securely."}

@app.post("/settings/update-profile")
def update_profile(request: ProfileUpdateRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == request.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if new username is taken by ANOTHER user
    existing_username = db.query(models.User).filter(
        models.User.username == request.new_username, 
        models.User.id != request.user_id
    ).first()
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already taken.")

    # Check if new email is taken by ANOTHER user
    existing_email = db.query(models.User).filter(
        models.User.email == request.new_email, 
        models.User.id != request.user_id
    ).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already linked to another account.")
    
    user.username = request.new_username
    user.email = request.new_email
    db.commit()
    return {"status": "success", "message": "Profile updated."}

@app.delete("/settings/delete-account")
def delete_account(request: DeleteAccountRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == request.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Verify password before deletion
    if not verify_password(request.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect password. Cannot delete account.")
    
    # Delete User (Cascade delete will handle UserProgress if configured in DB, 
    # otherwise we should manually delete related records to be safe)
    db.query(models.UserProgress).filter(models.UserProgress.user_id == request.user_id).delete()
    db.query(models.Leaderboard).filter(models.Leaderboard.user_id == request.user_id).delete()
    db.delete(user)
    db.commit()
    
    return {"status": "success", "message": "Account terminated permanently."}

# --- VISUALIZATION & ANALYSIS ---
@app.post("/visualize")
async def visualize_code(request: CodeRequest):
    tracer = MemoryTracer()
    trace_json_string = tracer.run(request.code)
    try:
        trace_data = json.loads(trace_json_string)
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Failed to parse trace data")
    return trace_data

@app.post("/analyze-quality")
async def analyze_quality(request: CodeRequest):
    if not radon_cc:
        return {"error": "Radon library not installed on server."}
    try:
        blocks = radon_cc.cc_visit(request.code)
        if not blocks:
            return {"complexity_score": 1, "rank": "A", "feedback": "Simple script. Looks clean!"}
        
        max_cc = max(block.complexity for block in blocks)
        avg_cc = sum(block.complexity for block in blocks) / len(blocks)
        
        if max_cc <= 5: rank, feedback = "A", "Pristine. Logic is simple and easy to read."
        elif max_cc <= 10: rank, feedback = "B", "Acceptable. A bit of logic, but manageable."
        elif max_cc <= 20: rank, feedback = "C", "Complex. Consider extracting methods or reducing nesting."
        else: rank, feedback = "F", "Spaghetti Code detected! High risk of bugs. Refactor immediately."

        return {
            "complexity_score": max_cc,
            "average_complexity": avg_cc,
            "rank": rank,
            "feedback": feedback,
            "blocks": [{"name": b.name, "complexity": b.complexity} for b in blocks]
        }
    except Exception as e:
        return {"error": f"Analysis failed: {str(e)}"}

class ConnectionManager:
    def __init__(self):
        self.active_rooms: dict[str, list[WebSocket]] = {}
        self.matchmaking_queue: list[WebSocket] = []
        self.active_duels: dict[str, list[WebSocket]] = {}
        self.ws_to_duel: dict[WebSocket, str] = {}

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
        if websocket in self.matchmaking_queue:
            self.matchmaking_queue.remove(websocket)
        if websocket in self.ws_to_duel:
            duel_id = self.ws_to_duel[websocket]
            if duel_id in self.active_duels:
                opponent = next((ws for ws in self.active_duels[duel_id] if ws != websocket), None)
                if opponent:
                    asyncio.create_task(opponent.send_text(json.dumps({"type": "duel_end", "result": "win", "reason": "opponent_disconnected"})))
                del self.active_duels[duel_id]
            del self.ws_to_duel[websocket]

    async def broadcast_to_room(self, message: str, session_id: str, sender: WebSocket):
        if session_id in self.active_rooms:
            for connection in self.active_rooms[session_id]:
                if connection != sender:
                    await connection.send_text(message)

    async def handle_matchmaking(self, websocket: WebSocket):
        if websocket not in self.matchmaking_queue:
            self.matchmaking_queue.append(websocket)
        if len(self.matchmaking_queue) >= 2:
            player1 = self.matchmaking_queue.pop(0)
            player2 = self.matchmaking_queue.pop(0)
            duel_id = str(uuid.uuid4())
            self.active_duels[duel_id] = [player1, player2]
            self.ws_to_duel[player1] = duel_id
            self.ws_to_duel[player2] = duel_id
            start_msg = json.dumps({"type": "duel_start", "duel_id": duel_id})
            await player1.send_text(start_msg)
            await player2.send_text(start_msg)

    async def broadcast_duel_update(self, websocket: WebSocket, payload: dict):
        duel_id = self.ws_to_duel.get(websocket)
        if duel_id and duel_id in self.active_duels:
            for connection in self.active_duels[duel_id]:
                if connection != websocket:
                    await connection.send_text(json.dumps(payload))

manager = ConnectionManager()

@app.websocket("/ws/chat")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    current_session_id = "default" 
    try:
        while True:
            data = await websocket.receive_text()
            payload = json.loads(data)
            msg_type = payload.get("type", "chat") 
            session_id = payload.get("session_id", "default")
            
            if session_id != current_session_id:
                if websocket in manager.active_rooms.get(current_session_id, []):
                    manager.active_rooms[current_session_id].remove(websocket)
                if session_id not in manager.active_rooms:
                    manager.active_rooms[session_id] = []
                manager.active_rooms[session_id].append(websocket)
                current_session_id = session_id

            if msg_type == "code_sync":
                await manager.broadcast_to_room(json.dumps({"type": "code_update", "code": payload.get("code")}), session_id, websocket)
            elif msg_type == "bridge_output":
                await manager.broadcast_to_room(json.dumps({"type": "terminal_update", "output": payload.get("output")}), session_id, websocket)
            elif msg_type == "find_match":
                await manager.handle_matchmaking(websocket)
            elif msg_type == "duel_visual_update":
                await manager.broadcast_duel_update(websocket, {"type": "opponent_visual", "data": payload.get("data")})
            elif msg_type == "duel_win":
                await manager.broadcast_duel_update(websocket, {"type": "duel_end", "result": "lose", "reason": "opponent_completed"})
            elif msg_type == "chat":
                user_input = payload.get("message", "")
                user_code = payload.get("code", "")
                response = await asyncio.to_thread(ai_tutor.chat, user_input, user_code, session_id)
                await websocket.send_text(json.dumps({"role": "ai", "text": response}))
    except WebSocketDisconnect:
        manager.disconnect(websocket, current_session_id)
    except Exception as e:
        print(f"WebSocket Error: {e}")

@app.post("/save-progress")
def save_progress(request: CodeRequest, db: Session = Depends(get_db)):
    user_id = request.user_id
    mission_id = request.mission_id
    code = request.code
    completed_status = request.is_completed
    existing = db.query(models.UserProgress).filter_by(user_id=user_id, mission_id=mission_id).first()
    if existing:
        existing.code_solution = code
        if completed_status: existing.is_completed = True
    else:
        progress = models.UserProgress(user_id=user_id, mission_id=mission_id, is_completed=completed_status, code_solution=code)
        db.add(progress)
    db.commit()
    return {"status": "Progress Saved 💾"}

@app.get("/get-progress")
def get_progress(user_id: int, mission_id: int, db: Session = Depends(get_db)):
    progress = db.query(models.UserProgress).filter_by(user_id=user_id, mission_id=mission_id).first()
    if progress: return {"code": progress.code_solution, "is_completed": progress.is_completed}
    return {"code": None, "is_completed": False}

@app.post("/submit-score")
def submit_score(request: ScoreRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == request.user_id).first()
    if not user: raise HTTPException(status_code=404, detail="User not found")
    new_score = models.Leaderboard(mission_id=request.mission_id, user_id=request.user_id, username=user.username, execution_time=request.execution_time, memory_usage=request.memory_usage, timestamp=datetime.now().isoformat())
    db.add(new_score)
    db.commit()
    return {"status": "Score Uploaded"}

@app.get("/leaderboard/{mission_id}")
def get_leaderboard(mission_id: int, db: Session = Depends(get_db)):
    return db.query(models.Leaderboard).filter(models.Leaderboard.mission_id == mission_id).order_by(models.Leaderboard.execution_time.asc()).limit(10).all()

@app.post("/explain-error")
async def explain_error_endpoint(request: ErrorAnalysisRequest):
    return ai_tutor.analyze_runtime_error(request.code, request.error_trace)

@app.post("/adaptive-mission")
async def get_adaptive_mission(request: WeaknessRequest):
    return ai_tutor.create_adaptive_mission(request.weakness)

@app.post("/execute")
async def execute_code_legacy(request: CodeRequest):
    return {"output": "⚠️ Use client-side runner."}

@app.post("/analyze")
async def analyze_code(request: CodeRequest):
    try:
        visual_data = parse_code_to_3d(request.code) if request.is_premium else None 
    except Exception as e:
        visual_data = {"error": str(e), "nodes": [], "links": []}
    return {"visual_data": visual_data, "premium_locked": not request.is_premium}

@app.post("/extension/sync")
async def sync_extension(request: CodeRequest):
    analysis = await analyze_code(request)
    analysis["source"] = "vscode_neural_link"
    analysis["status"] = "synced"
    return analysis

@app.get("/problems")
def get_problems(user_id: int = None, db: Session = Depends(get_db)):
    file_path = os.path.join("app", "data", "missions.json")
    try:
        with open(file_path, "r") as f:
            data = json.load(f)
        all_problems = []
        if isinstance(data, dict):
            for category, items in data.items():
                for p in items:
                    p['topic'] = category
                    if user_id:
                        progress = db.query(models.UserProgress).filter_by(user_id=user_id, mission_id=p['id'], is_completed=True).first()
                        p['status'] = 'Solved' if progress else 'Active'
                    else:
                        p['status'] = 'Locked'
                    p['acceptance'] = f"{min(99, max(10, (p['id'] % 100)))}%" 
                    all_problems.append(p)
        elif isinstance(data, list):
            all_problems = data
        return all_problems
    except Exception as e:
        print(f"Error fetching problems: {e}")
        return []

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
                    m['category_tag'] = category
                    all_missions.append(m)
        elif isinstance(data, list):
            all_missions = data
        return all_missions if is_premium else [m for m in all_missions if m.get('difficulty', '').lower() == 'easy']
    except:
        return []