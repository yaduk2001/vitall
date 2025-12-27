# app/tutor.py

"""
This file originally handled interactive keyboard-based tutoring using the console.
Since this project is now an API service, the interactive loop is removed.

We keep only the helper logic used by the backend (e.g., formatting messages for LLM).
"""

def build_qa_messages(question, topic, subtopic, micro_sections, context):
    """
    Build a structured dialogue message to send to the language model
    for context-aware question answering.
    """
    return [
        {
            "role": "system",
            "content": (
                "You are an AI tutor helping a student understand lesson content. "
                "Keep responses simple, direct, and focused on the lesson context."
            )
        },
        {
            "role": "user",
            "content": f"""
Student Question: {question}

Current Topic: {topic}
Subtopic: {subtopic}

Relevant Micro-Sections:
{micro_sections}

Retrieved Context:
{context}

Respond in a clear and helpful way, as a tutor.
"""
        }
    ]
