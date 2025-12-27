import subprocess
import time
import threading

import requests
import uvicorn

OLLAMA_URL = "http://localhost:11434/api/chat"
MODEL_NAME = "phi3:mini"


def is_ollama_running() -> bool:
    try:
        # lightweight check – just hit /api/tags instead of sending a full chat request
        resp = requests.get("http://localhost:11434/api/tags", timeout=2)
        return resp.status_code == 200
    except Exception:
        return False


def start_ollama():
    print("🚀 Starting Ollama (streaming logs as [OLLAMA] ...)")
    process = subprocess.Popen(
        ["ollama", "serve"],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
    )

    def stream_logs():
        # Read line by line and prefix with [OLLAMA]
        for line in process.stdout:
            line = line.rstrip()
            if line:
                print(f"[OLLAMA] {line}")

    t = threading.Thread(target=stream_logs, daemon=True)
    t.start()


def ensure_model():
    print(f"📦 Ensuring model '{MODEL_NAME}' is available...")
    try:
        # this will pull if missing, no-op if already present
        subprocess.run(["ollama", "pull", MODEL_NAME], check=False)
    except Exception as e:
        print(f"⚠️ Could not auto-run 'ollama pull {MODEL_NAME}'.")
        print(e)


def wait_for_ollama(timeout: int = 40) -> bool:
    print("⏳ Waiting for Ollama service to become responsive...")
    start = time.time()
    while time.time() - start < timeout:
        if is_ollama_running():
            print("✅ Ollama service is running.")
            return True
        time.sleep(1)
    print("❌ Ollama did not become ready in time. Check the [OLLAMA] logs above.")
    return False


if __name__ == "__main__":
    if not is_ollama_running():
        start_ollama()
        wait_for_ollama()

    ensure_model()

    print("🔥 Starting AI Tutor FastAPI server on http://localhost:8000")
    uvicorn.run("app.api:app", host="0.0.0.0", port=8000, reload=True)
