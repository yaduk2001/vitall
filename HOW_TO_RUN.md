# 🚀 How to Run the Project

This guide is designed for users who have **Docker** installed. You will need **3 separate terminals** to run the full stack.

## 📋 Prerequisites

Ensure you have the following installed:
1.  **Docker Desktop** (Running)
2.  **Node.js** (v16 or higher)
3.  **MongoDB** (Ensure it's running locally or you have a connection string)

---

## 🧠 Step 1: AI Backend (Terminal 1)

The AI backend is containerized with Docker for easy setup.

1.  **Open Terminal 1** and navigate to `ai-backend`:
    ```bash
    cd ai-backend
    ```

2.  **Start with Docker Compose**:
    ```bash
    docker compose up --build
    ```
    *This will automatically set up the Python environment, install dependencies, and start the server on port 8000.*

---

## 🔙 Step 2: Node.js Backend (Terminal 2)

The main backend runs on Node.js.

1.  **Open Terminal 2** and navigate to `backend`:
    ```bash
    cd backend
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

3.  **Start the Server**:
    ```bash
    npm start
    ```
    *Server should start on `http://localhost:5000`*

---

## 💻 Step 3: Frontend (Terminal 3)

The frontend is a Vite + React application.

1.  **Open Terminal 3** and navigate to `frontend`:
    ```bash
    cd frontend
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

3.  **Start the App**:
    ```bash
    npm run dev
    ```
    *App should be running at `http://localhost:5173`*

---

## ✅ Verification

1.  Open your browser to **http://localhost:5173**.
2.  Log in as a **Student**.
3.  Go to a course with a PDF document.
4.  The **Student Buddy** should greet you, indicating the AI is connected!

## ⚠️ Troubleshooting

*   **Docker Errors**: Ensure Docker Desktop is running. If `docker compose` fails, try `docker-compose` (with a hyphen).
*   **MongoDB Connection**: Ensure your local MongoDB service is started. The backend expects MongoDB at `mongodb://localhost:27017/vital` by default (check `.env` in `backend/` if needed).
*   **Port Conflicts**: Ensure ports 8000, 5000, and 5173 are free.
