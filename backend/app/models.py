from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Float, DateTime
from sqlalchemy.orm import relationship
from .database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    # This is the line your error says is missing:
    email = Column(String, unique=True, index=True) 
    hashed_password = Column(String)
    is_premium = Column(Boolean, default=False)
    progress = relationship("UserProgress", back_populates="user")
    scores = relationship("Leaderboard", back_populates="user")
    # New Relations
    world_progress = relationship("WorldProgress", back_populates="user", uselist=False)
    tokens = relationship("SoulboundToken", back_populates="user")

class UserProgress(Base):
    __tablename__ = "user_progress"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    mission_id = Column(Integer)
    is_completed = Column(Boolean, default=False)
    code_solution = Column(String)
    user = relationship("User", back_populates="progress")

class Leaderboard(Base):
    __tablename__ = "leaderboard"
    id = Column(Integer, primary_key=True, index=True)
    mission_id = Column(Integer, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    username = Column(String)
    execution_time = Column(Float)
    memory_usage = Column(Float)
    timestamp = Column(String)
    user = relationship("User", back_populates="scores")

class OTP(Base):
    __tablename__ = "otps"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, index=True)
    otp_code = Column(String)
    expires_at = Column(DateTime)

# --- NEW: RPG & ECONOMY MODELS ---

class WorldProgress(Base):
    __tablename__ = "world_progress"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    current_region = Column(String, default="Nexus Hub")
    # Storing unlocked regions as a comma-separated string for simplicity in SQLite
    unlocked_regions = Column(String, default="Nexus Hub") 
    user = relationship("User", back_populates="world_progress")

class SoulboundToken(Base):
    __tablename__ = "soulbound_tokens"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    skill_name = Column(String) # e.g., "Master of Recursion"
    token_hash = Column(String, unique=True, index=True) # Simulated Blockchain Hash
    minted_at = Column(DateTime, default=datetime.utcnow)
    user = relationship("User", back_populates="tokens")