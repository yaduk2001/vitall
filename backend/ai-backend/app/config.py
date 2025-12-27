import os

# Use internal Docker hostname so FastAPI can reach Ollama container
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434/api/chat")

# Default model that exists
MODEL_NAME = os.getenv("MODEL_NAME", "phi3:mini")
REQUEST_TIMEOUT = int(os.getenv("REQUEST_TIMEOUT", "120"))


BASE_LESSON_DIR = os.path.join(os.path.dirname(__file__), "lessons")
os.makedirs(BASE_LESSON_DIR, exist_ok=True)
