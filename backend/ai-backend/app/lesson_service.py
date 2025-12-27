from app.utils.pdf_reader import extract_text_from_pdf
from app.lesson_plan import generate_lesson_plan_from_text, save_lesson_plan
from app.rag import build_rag_index

def create_lesson(pdf_path: str, title: str):
    text = extract_text_from_pdf(pdf_path)
    plan = generate_lesson_plan_from_text(title, text)
    lesson_id = save_lesson_plan(title, plan)
    build_rag_index(lesson_id, text)
    return {"lesson_id": lesson_id, "title": title}
