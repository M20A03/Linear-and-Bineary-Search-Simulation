from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
import random
import time
from database import get_db, ChatLog, User

app = FastAPI(title="Space Explorer API")

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all for local dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class ChatRequest(BaseModel):
    message: str

@app.post("/api/register")
async def register_user(user: UserCreate, db: Session = Depends(get_db)):
    # Check if email exists
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Store plain-text for this local learning project
    new_user = User(name=user.name, email=user.email, password=user.password)
    db.add(new_user)
    db.commit()
    
    return {
        "status": "success", 
        "message": "User registered successfully",
        "token": "galactic-auth-token-999",
        "user": {
            "name": new_user.name,
            "email": new_user.email
        }
    }

@app.post("/api/login")
async def login(req: UserLogin, db: Session = Depends(get_db)):
    user_record = db.query(User).filter(User.email == req.email, User.password == req.password).first()
    
    if user_record:
        return {
            "status": "success", 
            "token": "galactic-auth-token-999",
            "user": {
                "name": user_record.name,
                "email": user_record.email
            }
        }
    
    raise HTTPException(status_code=401, detail="Access Denied. Invalid Email or Password.")

@app.post("/api/chat")
async def chat(req: ChatRequest, db: Session = Depends(get_db)):
    msg = req.message.lower()
    
    # Save the user's message to Database
    user_log = ChatLog(role="user", message=req.message)
    db.add(user_log)
    db.commit()

    time.sleep(1) # Simulate AI thinking time
    
    ai_response = ""
    if "linear search" in msg and "how" not in msg:
        ai_response = "Linear Search is like scanning sector by sector, from one end of the galaxy to the other, until you find your target. It's reliable but slow for massive amounts of data. Time Complexity: O(n)."
    elif "binary search" in msg and "how" not in msg:
        ai_response = "Binary Search requires your star map to be sorted! It jumps to the middle of the available sectors, immediately eliminating half the universe where the target cannot be. It's incredibly fast! Time Complexity: O(log n)."
    elif "how" in msg and "work" in msg:
        ai_response = "The Visualizer generates an array of 'coordinates'. Linear search checks each one sequentially. Binary search checks the middle coordinate, and if it's too high or too low, discards half of the remaining array, halving the search space every jump!"
    elif "hello" in msg or "hi" in msg:
        ai_response = "Greetings, Explorer! I am the Star-Command AI. Ask me about Linear Search or Binary Search missions."
    elif "time complexity" in msg or "o(n)" in msg or "o(log n)" in msg:
        ai_response = "Linear Search is O(n), meaning the time it takes grows directly with the number of sectors. Binary Search is O(log n), meaning the time it takes grows very slowly, making it perfect for massive galaxies of data!"
    elif "who" in msg and ("made" in msg or "created" in msg):
        ai_response = "This Space Explorer Visualizer was engineered for your GitHub portfolio to showcase React, Python, and algorithm expertise!"
    else:
        responses = [
            "My databanks are focused on planetary searching algorithms. Ask me 'how it works' or about Linear or Binary Search!",
            "I'm afraid I cannot process that request. The nebula interference is too strong.",
            "Please specify if you want to know about O(n) or O(log n) search algorithms."
        ]
        ai_response = random.choice(responses)
        
    # Save AI response to DB
    bot_log = ChatLog(role="bot", message=ai_response)
    db.add(bot_log)
    db.commit()

    return {"response": ai_response}

@app.get("/api/history")
async def get_history(db: Session = Depends(get_db)):
    logs = db.query(ChatLog).order_by(ChatLog.timestamp.asc()).all()
    # Format exactly like the React component expects messages
    formatted_logs = [{"text": log.message, "isUser": log.role == "user"} for log in logs]
    return {"history": formatted_logs}

@app.get("/api/health")
def health_check():
    return {"status": "online", "systems": "nominal"}
