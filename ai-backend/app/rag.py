# app/rag.py

import json
import os
import re
from typing import List, Tuple

import faiss
import numpy as np
from sentence_transformers import SentenceTransformer

from app.config import BASE_LESSON_DIR

_EMBED_MODEL = None


def get_embedder() -> SentenceTransformer:
    global _EMBED_MODEL
    if _EMBED_MODEL is None:
        _EMBED_MODEL = SentenceTransformer("all-MiniLM-L6-v2")
    return _EMBED_MODEL


def _split_into_paragraphs(text: str) -> List[str]:
    # split on blank lines, collapse internal newlines
    paras = re.split(r"\n\s*\n+", text)
    cleaned = []
    for p in paras:
        p = p.strip()
        if not p:
            continue
        # normalize multiple spaces / newlines
        p = re.sub(r"[ \t]+", " ", p)
        cleaned.append(p)
    return cleaned


def chunk_text(text: str, chunk_size: int = 800, overlap: int = 200) -> List[str]:
    """
    Semantic-ish paragraph based chunking.

    – First split into paragraphs.
    – Greedily pack paragraphs into ~chunk_size chars.
    – Keep `overlap` chars from the end of previous chunk as prefix
      to the next, to preserve context.
    """
    paragraphs = _split_into_paragraphs(text)
    if not paragraphs:
        return []

    chunks: List[str] = []
    current = ""

    for para in paragraphs:
        if not current:
            current = para
            continue

        if len(current) + 2 + len(para) <= chunk_size:
            current = f"{current}\n\n{para}"
        else:
            chunks.append(current)

            # overlap: keep tail of previous chunk
            if overlap > 0 and len(current) > overlap:
                tail = current[-overlap:]
                current = f"{tail}\n\n{para}"
            else:
                current = para

    if current:
        chunks.append(current)

    return chunks


def build_rag_index(lesson_id: str, full_text: str) -> None:
    """
    Create chunks, embeddings, and FAISS index for a lesson.
    Saves into lessons/<lesson_id>/{index.faiss,chunks.json}
    """
    lesson_dir = os.path.join(BASE_LESSON_DIR, lesson_id)
    os.makedirs(lesson_dir, exist_ok=True)

    chunks = chunk_text(full_text)
    embedder = get_embedder()
    vectors = embedder.encode(chunks, show_progress_bar=False)
    vectors = np.asarray(vectors, dtype=np.float32)

    dim = vectors.shape[1]
    index = faiss.IndexFlatIP(dim)
    faiss.normalize_L2(vectors)
    index.add(vectors)

    index_path = os.path.join(lesson_dir, "index.faiss")
    faiss.write_index(index, index_path)

    chunks_path = os.path.join(lesson_dir, "chunks.json")
    with open(chunks_path, "w", encoding="utf-8") as f:
        json.dump(chunks, f, ensure_ascii=False, indent=2)

    print(f"✅ RAG index built for lesson '{lesson_id}' with {len(chunks)} chunks.")


def load_rag_index(lesson_id: str) -> Tuple[faiss.Index, List[str]]:
    lesson_dir = os.path.join(BASE_LESSON_DIR, lesson_id)
    index_path = os.path.join(lesson_dir, "index.faiss")
    chunks_path = os.path.join(lesson_dir, "chunks.json")

    if not (os.path.exists(index_path) and os.path.exists(chunks_path)):
        raise FileNotFoundError(f"No RAG data found for lesson '{lesson_id}'")

    index = faiss.read_index(index_path)
    with open(chunks_path, "r", encoding="utf-8") as f:
        chunks = json.load(f)

    return index, chunks


def rag_search(index, chunks: List[str], query: str, k: int = 4) -> List[str]:
    """Return top-k relevant chunks for a query."""
    if not chunks:
        return []

    embedder = get_embedder()
    q_vec = embedder.encode([query], show_progress_bar=False)
    q_vec = np.asarray(q_vec, dtype=np.float32)
    faiss.normalize_L2(q_vec)
    k = min(k, len(chunks))
    D, I = index.search(q_vec, k)
    return [chunks[i] for i in I[0]]
