# app/lesson_plan.py

import json
import os
from typing import Any, Dict, List, Tuple
import time

import faiss
import numpy as np

from app.config import BASE_LESSON_DIR
from app.ollama_client import query_ollama, extract_json_from_model_output
from app.rag import get_embedder, chunk_text


def slugify(text: str) -> str:
    return "".join(c.lower() if c.isalnum() else "_" for c in text).strip("_")


# ---------- PLANNING RAG INDEX (in-memory) ----------

def build_planning_index(doc_text: str) -> Tuple[faiss.Index, List[str]]:
    """
    Build an in-memory FAISS index for planning (topics/subtopics/micro-sections).
    Uses the same embedder + chunking as runtime RAG.
    """
    chunks = chunk_text(doc_text, chunk_size=800, overlap=200)
    if not chunks:
        chunks = [doc_text]

    embedder = get_embedder()
    vectors = embedder.encode(chunks, show_progress_bar=False)
    vectors = np.asarray(vectors, dtype=np.float32)

    dim = vectors.shape[1]
    index = faiss.IndexFlatIP(dim)
    faiss.normalize_L2(vectors)
    index.add(vectors)

    return index, chunks


def planning_search(
    index: faiss.Index,
    chunks: List[str],
    query: str,
    min_chars: int = 900,
    initial_k: int = 6,
) -> str:
    """
    Get relevant text for planning:
    – start with k chunks
    – if too short, increase k
    """
    if not chunks:
        return ""

    embedder = get_embedder()
    q_vec = embedder.encode([query], show_progress_bar=False)
    q_vec = np.asarray(q_vec, dtype=np.float32)
    faiss.normalize_L2(q_vec)

    k = min(initial_k, len(chunks))
    D, I = index.search(q_vec, k)
    selected = [chunks[i] for i in I[0]]
    context = "\n\n".join(selected)

    if len(context) < min_chars and k < len(chunks):
        k2 = min(k * 2, len(chunks))
        D, I = index.search(q_vec, k2)
        selected = [chunks[i] for i in I[0]]
        context = "\n\n".join(selected)

    return context


# ---------- COMMON LLM HELPERS ----------

def _llm_json_call(system_prompt: str, user_prompt: str, desc: str, max_retries: int = 2):
    last_raw = ""
    for attempt in range(max_retries + 1):
        raw = query_ollama(
            [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ]
        )
        last_raw = raw
        data = extract_json_from_model_output(raw)
        if data is not None:
            return data
    # if everything failed, return None; caller decides fallback
    print(f"[WARN] JSON LLM call failed for {desc}. Last raw:\n{last_raw[:500]}...")
    return None


def _clean_string_list(obj: Any, max_items: int, label: str) -> List[str]:
    if not isinstance(obj, list):
        return []
    cleaned: List[str] = []
    for item in obj:
        if isinstance(item, str):
            s = item.strip()
            if s:
                cleaned.append(s)
    if not cleaned:
        return []
    return cleaned[:max_items]


# ---------- PASS 1: TOPICS ----------

def _fallback_topics_from_text(doc_text: str, max_topics: int = 5) -> List[str]:
    """
    If the model fails to generate topics, fall back to naive chunk-based parts.
    """
    chunks = chunk_text(doc_text, chunk_size=2500, overlap=300)
    if not chunks:
        return ["Overview"]
    n = min(len(chunks), max_topics)
    return [f"Part {i + 1}" for i in range(n)]


def generate_topics(doc_text: str) -> List[str]:
    """
    Generate 3–7 high-level topics. If the model fails or returns junk,
    fall back to naive chunk-based topics so the pipeline never hard-fails.
    """
    system_prompt = """
You are an expert curriculum designer.

Task:
- Read the provided document excerpt.
- Identify 3 to 7 high-level topics that would make sense to teach
  as separate parts of a lesson.

Rules:
- Return ONLY a JSON array of strings.
- Each string is a short topic title (max 8 words).
- The topics must be clearly grounded in the document content.
- Do NOT invent unrelated topics.
- If you are unsure, still produce 3 to 5 reasonable, generic topics.
"""

    excerpt = doc_text[:8000]
    user_prompt = (
        "Document excerpt:\n"
        f"{excerpt}\n\n"
        "Now return ONLY the JSON array of topic titles."
    )

    raw_topics = _llm_json_call(system_prompt, user_prompt, desc="topics")
    topics = _clean_string_list(raw_topics, max_items=7, label="topic")
    time.sleep(0.25)

    if not topics:
        topics = _fallback_topics_from_text(doc_text)

    return topics


# ---------- PASS 2: SUBTOPICS ----------

def generate_subtopics(topic_title: str, topic_context: str) -> List[str]:
    """
    Generate 2–5 subtopics for a topic, using topic-specific context.
    Fallback: single 'Main Ideas' subtopic if LLM fails.
    """
    system_prompt = """
You are an expert teacher creating a structured lesson.

Task:
- Given a TOPIC and a DOCUMENT EXCERPT, break the topic into 2 to 5 subtopics.

Rules:
- Return ONLY a JSON array of strings.
- Each subtopic title should be short (max 10 words).
- Subtopics must clearly belong under the given topic.
- Use ONLY information that is clearly supported by the document excerpt.
- You may summarize and group ideas, but do NOT introduce unrelated concepts.
"""

    user_prompt = (
        f"TOPIC: {topic_title}\n\n"
        "Relevant document excerpt:\n"
        f"{topic_context[:8000]}\n\n"
        "Now return ONLY the JSON array of subtopic titles."
    )

    raw_sub = _llm_json_call(
        system_prompt, user_prompt, desc=f"subtopics for '{topic_title}'"
    )
    subtopics = _clean_string_list(raw_sub, max_items=5, label="subtopic")
    time.sleep(0.25)
    if not subtopics:
        subtopics = ["Main Ideas"]

    return subtopics


# ---------- PASS 3: MICRO-SECTIONS (TUTOR SCRIPT) ----------

def _fallback_micro_sections(context_text: str, max_sections: int = 6) -> List[str]:
    """
    Fallback: split context into short paragraphs as micro-sections.
    """
    paras = [p.strip() for p in context_text.split("\n\n") if p.strip()]
    if not paras:
        return ["Let's briefly review this concept. (Content missing)"]
    return paras[:max_sections]


def generate_micro_sections(topic_title: str, subtopic_title: str, context_text: str) -> List[str]:
    """
    Generate 3–7 micro-lessons (each 2–3 short sentences) for a subtopic.
    Result is already in "tutor script" style.
    Uses only RAG-selected context_text; has a robust fallback.
    """
    system_prompt = """
You are an AI tutor speaking to a student.

Task:
- For the given TOPIC and SUBTOPIC, generate a sequence of micro-lessons.
- Each micro-lesson is 2–3 SHORT sentences.
- Speak in a friendly, conversational tone (like a real tutor).
- Progress from basic idea to slightly deeper understanding.

Rules:
- Return ONLY a JSON array of strings.
- Each string is ONE micro-lesson.
- Use ONLY information from the provided document excerpt.
- You may rephrase and simplify, but do NOT add external facts.
- Aim for 3 to 7 micro-lessons.
"""

    user_prompt = (
        f"TOPIC: {topic_title}\n"
        f"SUBTOPIC: {subtopic_title}\n\n"
        "Relevant document excerpt:\n"
        f"{context_text[:8000]}\n\n"
        "Now return ONLY the JSON array of micro-lessons."
    )

    raw_micro = _llm_json_call(
        system_prompt,
        user_prompt,
        desc=f"micro sections for '{topic_title}' / '{subtopic_title}'",
    )

    micro_sections = _clean_string_list(raw_micro, max_items=7, label="micro")
    time.sleep(0.25)
    if not micro_sections:
        micro_sections = _fallback_micro_sections(context_text)

    return micro_sections


# ---------- FULL LESSON PLAN GENERATION PIPELINE ----------

def generate_lesson_plan_from_text(lesson_title: str, doc_text: str) -> Dict[str, Any]:
    """
    Build a hierarchical lesson plan:
    {
      "title": "...",
      "topics": [
        {
          "topic_id": 1,
          "title": "...",
          "subtopics": [
            {
              "sub_id": 1,
              "title": "...",
              "micro_sections": ["...", "..."]
            }
          ]
        }
      ]
    }

    Flow:
    1) Build in-memory planning index from full text.
    2) Generate topics (global, with fallbacks).
    3) For each topic, use planning RAG to get context.
    4) For each subtopic, get refined context and generate tutor-style micro-sections.
    """
    # 1) Planning index from full document
    planning_index, planning_chunks = build_planning_index(doc_text)

    # 2) High-level topics (with robust fallback)
    topics = generate_topics(doc_text)
    time.sleep(0.25)
    topic_objs: List[Dict[str, Any]] = []

    for t_idx, t_title in enumerate(topics, start=1):
        # 3a) Topic-specific context
        topic_query = t_title
        topic_context = planning_search(planning_index, planning_chunks, topic_query)

        # 3b) Subtopics grounded in topic context
        subtopics = generate_subtopics(t_title, topic_context)
        time.sleep(0.25)
        sub_objs: List[Dict[str, Any]] = []

        for s_idx, s_title in enumerate(subtopics, start=1):
            # 3c) Subtopic-specific context via planning RAG
            sub_query = f"{t_title}. {s_title}"
            micro_context = planning_search(planning_index, planning_chunks, sub_query)

            micro_sections = generate_micro_sections(t_title, s_title, micro_context)
            time.sleep(0.25)
            sub_objs.append(
                {
                    "sub_id": s_idx,
                    "title": s_title,
                    "micro_sections": micro_sections,
                }
            )

        topic_objs.append(
            {
                "topic_id": t_idx,
                "title": t_title,
                "subtopics": sub_objs,
            }
        )

    plan: Dict[str, Any] = {"title": lesson_title, "topics": topic_objs}
    return plan


# ---------- SAVE & LOAD ----------

def save_lesson_plan(lesson_title: str, plan: Dict[str, Any]) -> str:
    lesson_id = slugify(lesson_title)
    lesson_dir = os.path.join(BASE_LESSON_DIR, lesson_id)
    os.makedirs(lesson_dir, exist_ok=True)

    path = os.path.join(lesson_dir, "plan.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(plan, f, ensure_ascii=False, indent=2)

    print(f"✅ Saved lesson plan -> {path}")
    return lesson_id


def load_lesson_plan(lesson_id: str) -> Dict[str, Any]:
    path = os.path.join(BASE_LESSON_DIR, lesson_id, "plan.json")
    if not os.path.exists(path):
        raise FileNotFoundError(f"No lesson plan found for '{lesson_id}'")

    with open(path, "r", encoding="utf-8") as f:
        plan = json.load(f)

    # Backwards compatibility if old "sections"-style plan exists
    if "topics" not in plan and "sections" in plan:
        sections = plan["sections"]
        subtopics = []
        for i, sec in enumerate(sections, start=1):
            text = sec.get("teaching_text") or sec.get("content") or ""
            if not text:
                continue
            subtopics.append(
                {
                    "sub_id": i,
                    "title": sec.get("title", f"Part {i}"),
                    "micro_sections": [text],
                }
            )
        plan = {
            "title": plan.get("title", lesson_id),
            "topics": [
                {
                    "topic_id": 1,
                    "title": plan.get("title", "Lesson"),
                    "subtopics": subtopics,
                }
            ],
        }

    return plan
