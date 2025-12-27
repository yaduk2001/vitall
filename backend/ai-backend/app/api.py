from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os, shutil

from app.lesson_service import create_lesson
from app.session_manager import start_session, next_step, ask_question
from app.lesson_plan import load_lesson_plan
from app.config import BASE_LESSON_DIR


app = FastAPI(title="AI Tutor Microservice")


# -------------------------------------------------
# CORS (Frontend must be able to call this service)
# -------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # change to frontend domain later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -------------------------------------------------
# Models for JSON requests
# -------------------------------------------------
class StartSession(BaseModel):
    user_id: str
    lesson_id: str


class StepRequest(BaseModel):
    session_id: str


class AskRequest(BaseModel):
    session_id: str
    question: str


# -------------------------------------------------
# Health Check
# -------------------------------------------------
@app.get("/")
def health():
    return {"status": "running"}


# -------------------------------------------------
# Upload PDF → Generate Lesson
# -------------------------------------------------
@app.post("/lesson/upload")
async def upload_lesson(title: str, file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    os.makedirs(BASE_LESSON_DIR, exist_ok=True)

    pdf_path = os.path.join(BASE_LESSON_DIR, f"{title}.pdf")

    with open(pdf_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    result = create_lesson(pdf_path, title)

    return {
        "status": "lesson_created",
        "lesson_id": result["lesson_id"],
        "title": result["title"]
    }


# -------------------------------------------------
# Get List of Lessons
# -------------------------------------------------
@app.get("/lessons")
def list_lessons():
    if not os.path.exists(BASE_LESSON_DIR):
        return {"lessons": []}

    lessons = []
    for folder in os.listdir(BASE_LESSON_DIR):
        plan_path = os.path.join(BASE_LESSON_DIR, folder, "plan.json")
        if os.path.exists(plan_path):
            lessons.append({"lesson_id": folder})

    return {"lessons": lessons}


# -------------------------------------------------
# Get Lesson Plan (Structure Only)
# -------------------------------------------------
@app.get("/lesson/{lesson_id}")
def get_lesson(lesson_id: str):
    try:
        plan = load_lesson_plan(lesson_id)
        return plan
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Lesson not found")


# -------------------------------------------------
# Tutor Session Controls
# -------------------------------------------------
@app.post("/session/start")
def route_start(req: StartSession):
    return start_session(req.user_id, req.lesson_id)


@app.post("/session/next")
def route_next(req: StepRequest):
    return next_step(req.session_id)


@app.post("/session/ask")
def route_ask(req: AskRequest):
    return ask_question(req.session_id, req.question)
