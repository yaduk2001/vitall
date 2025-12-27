

---

# 🧠 AI Tutor Microservice — Local Runtime (Windows)

This service runs locally (no Docker) and uses **Ollama + FastAPI** to generate, store, and deliver interactive AI-driven lessons from PDFs.

---

## ⚙️ System Requirements

* **Windows 10 or newer**
* **Python 3.10 or 3.11** (⚠ FAISS does not support Python 3.12+)
* **Ollama installed locally**

Download Ollama:
👉 [https://ollama.com/download](https://ollama.com/download)

---

## 📦 Setup Instructions

### 1️⃣ Create and activate virtual environment

```powershell
python -m venv venv
or
py -3.10 -m venv venv
venv\Scripts\activate
```

### 2️⃣ Install dependencies

```powershell
pip install -r requirements.txt
```

### 4️⃣ Run the service

```powershell
python run.py
```

> This will automatically:
>
> * Start the Ollama server
> * Ensure the model (`phi3:mini`) is installed
> * Launch the FastAPI microservice

---

## 🚀 Accessing the API

Once running, the service is available at:

📍 Base URL:

```
http://localhost:8000
```

📄 Interactive API docs (Swagger):
👉 [http://localhost:8000/docs](http://localhost:8000/docs)

---

That's it — you're ready.
