from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Float
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String) # Stores Argon2 hashed password securely
    is_premium = Column(Boolean, default=False)
    progress = relationship("UserProgress", back_populates="user")
    scores = relationship("Leaderboard", back_populates="user") # New Relationship

class UserProgress(Base):
    __tablename__ = "user_progress"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    mission_id = Column(Integer)
    is_completed = Column(Boolean, default=False)
    code_solution = Column(String) 
    user = relationship("User", back_populates="progress")

# --- NEW: LEADERBOARD MODEL ---
class Leaderboard(Base):
    __tablename__ = "leaderboard"
    id = Column(Integer, primary_key=True, index=True)
    mission_id = Column(Integer, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    username = Column(String) # Denormalized for easier access
    execution_time = Column(Float) # Lower is better
    memory_usage = Column(Float) # Lower is better
    timestamp = Column(String)
    user = relationship("User", back_populates="scores")