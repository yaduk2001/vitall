from app.lesson_plan import load_lesson_plan
from app.rag import load_rag_index, rag_search
from app.ollama_client import query_ollama
from app.tutor import build_qa_messages

_sessions = {}

def start_session(user_id: str, lesson_id: str):
    plan = load_lesson_plan(lesson_id)
    index, chunks = load_rag_index(lesson_id)

    _sessions[user_id] = {
        "lesson_id": lesson_id,
        "plan": plan,
        "topic": 0,
        "sub": 0,
        "micro": 0,
        "index": index,
        "chunks": chunks,
        "started": False
    }

    return {"session_id": user_id, "content": current_step(user_id)}

def current_step(session_id: str):
    s = _sessions[session_id]
    topic = s["plan"]["topics"][s["topic"]]
    subtopic = topic["subtopics"][s["sub"]]
    micro = subtopic["micro_sections"][s["micro"]]

    # First time the session is started
    if not s["started"]:
        s["started"] = True
        opening = f"Let's begin the lesson titled: {s['plan']['title']}.\n"
        opening += f"Our first topic is: {topic['title']}.\n"
        opening += f"We'll start with the subtopic: {subtopic['title']}.\n\n"
        opening += micro
        return opening

    # If micro-index > 0, we're continuing the same subtopic
    return micro

def next_step(session_id: str):
    s = _sessions[session_id]
    plan = s["plan"]

    s["micro"] += 1
    topic = plan["topics"][s["topic"]]
    subtopic = topic["subtopics"][s["sub"]]

    # Still inside same subtopic
    if s["micro"] < len(subtopic["micro_sections"]):
        return {"content": f"Continuing...\n{current_step(session_id)}"}

    # Move to next subtopic
    s["sub"] += 1
    s["micro"] = 0

    if s["sub"] < len(topic["subtopics"]):
        new_sub = topic["subtopics"][s["sub"]]
        return {"content": f"Moving on to a new subtopic: {new_sub['title']}.\n\n{current_step(session_id)}"}

    # Move to next topic
    s["topic"] += 1
    s["sub"] = 0
    s["micro"] = 0

    if s["topic"] < len(plan["topics"]):
        new_topic = plan["topics"][s["topic"]]
        return {"content": f"Great progress so far.\nNow we will move into the next major topic: {new_topic['title']}.\n\n{current_step(session_id)}"}

    # End of lesson
    return {"content": "You've completed the entire lesson. Great work."}

def ask_question(session_id: str, question: str):
    s = _sessions[session_id]
    context = rag_search(s["index"], s["chunks"], question)

    topic = s["plan"]["topics"][s["topic"]]
    sub = topic["subtopics"][s["sub"]]

    messages = build_qa_messages(question, topic["title"], sub["title"], sub["micro_sections"], context)
    reply = query_ollama(messages)
    
    return {"answer": reply}
