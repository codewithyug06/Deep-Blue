<div align="center">

# 🧊 Deep Blue
### The Socratic Coding Tutor & 3D Logic Visualizer

[![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Gemini](https://img.shields.io/badge/Gemini_2.0_Flash-4285F4?style=flat-square&logo=google&logoColor=white)](https://deepmind.google/technologies/gemini/)
[![LangChain](https://img.shields.io/badge/LangChain-1C3C3C?style=flat-square&logo=langchain&logoColor=white)](https://langchain.com/)
[![Three.js](https://img.shields.io/badge/Three.js-000000?style=flat-square&logo=threedotjs&logoColor=white)](https://threejs.org/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

**Deep Blue is a next-generation interactive Python learning environment built on the Socratic Method.**  
Rather than giving direct solutions, the AI mentor asks guiding questions that train you to think and debug logically.  
The system also features a futuristic **3D Abstract Syntax Tree (AST) Visualizer** — see your code come alive as a dynamic 3D node graph.

</div>

---

## 🚀 Features

### 🤖 Socratic AI Tutor
- Powered by **Google Gemini 2.0 Flash** + **LangChain**
- Guides students through **questions and reasoning**, never direct answers
- Builds genuine problem-solving intuition, not copy-paste habits

### 🎥 3D Code Visualizer *(Pro Feature)*
- Converts Python code into an **interactive 3D node graph** in real time
- Built with **React Three Fiber**, **Three.js**, and **Drei**
- Color-coded node types for instant visual comprehension:

| Node Type | Color |
|---|---|
| Functions | 🔵 Blue |
| Loops | 🟢 Green |
| Conditionals | 🟠 Orange |

### 🎮 Gamified Missions
- Alien signal decryption puzzles
- Broken beacon repair missions
- Step-by-step guided coding quests with progression

### 🔐 Freemium Architecture

| Tier | Access |
|---|---|
| **Free** | Code Editor, Socratic Tutor, Easy Missions |
| **Pro** | 3D Visualizer, Haptic Feedback, Medium/Hard Missions |

> Free Tier access to 3D data is hard-enforced at the backend — not just hidden on the frontend.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React, Vite, Tailwind CSS |
| **3D Rendering** | Three.js, React Three Fiber, Drei |
| **Backend** | FastAPI, Python, Uvicorn |
| **AI Engine** | Google Gemini 2.0 Flash, LangChain |
| **Code Parsing** | Python `ast` module |
| **Networking** | Axios |
| **Infrastructure** | Docker, Docker Compose |

---

## 📁 Project Structure

```
deepblue/
├── docker-compose.yml
│
├── backend/
│   ├── app/
│   │   ├── data/               # Missions JSON definitions
│   │   └── engine/
│   │       ├── rag_agent.py    # LangChain + Gemini Socratic Agent
│   │       └── ast_parser.py   # AST → 3D Node coordinate parser
│   ├── main.py                 # FastAPI entry point
│   ├── Dockerfile
│   └── requirements.txt
│
└── frontend/
    ├── src/
    │   ├── components/         # UI Elements
    │   ├── three-scene/        # 3D Visualizer components
    │   ├── App.jsx
    │   └── main.jsx
    ├── Dockerfile
    └── tailwind.config.js
```

---

## 📦 Installation & Setup

### Prerequisites
- **Docker & Docker Compose** *(recommended)* — OR — **Node.js 18+** & **Python 3.9+**
- A valid **Google Gemini API Key**

---

### ⚡ Option 1 — Docker (Recommended)

```bash
# 1. Clone the repository
git clone https://github.com/codewithyug06/Deep-Blue.git
cd Deep-Blue

# 2. Add your API key — create backend/.env
echo "GEMINI_API_KEY=your_api_key_here" > backend/.env

# 3. Build and run
docker-compose up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API Docs | http://localhost:8000/docs |

---

### 🔧 Option 2 — Manual Setup

**Backend**
```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
```

---

## 🖥️ How to Use

**1. Write Python Code**
Use the left editor panel to write or paste your Python program.

**2. Analyze Logic**
Click **Analyze Logic** — the Socratic tutor responds with guiding questions, not answers. Your reasoning muscle gets trained with every session.

**3. Visualize in 3D** *(Pro)*
Enable Pro mode → the backend parses your AST and sends 3D node coordinates → the visualizer renders your code structure in real time.

**4. Missions**
Open the Missions tab to tackle logic puzzles, decryption challenges, and guided coding raids in order of difficulty.

---

## 🧠 How the Socratic Agent Works

```
User submits code + question
        │
        ▼
FastAPI receives request
        │
        ▼
ast_parser.py → extracts code structure
        │
        ▼
rag_agent.py → builds prompt context with LangChain
        │
        ▼
Gemini 2.0 Flash → generates Socratic question chain
        │
        ▼
Response returned → no direct fix, only guided reasoning
```

---

## 🗺️ Roadmap

- [ ] Voice-based Socratic tutor (speech-to-text + TTS)
- [ ] Multi-language support (JavaScript, C++)
- [ ] Peer learning rooms with shared 3D visualization
- [ ] Progress dashboard with skill tree
- [ ] LMS integration (Google Classroom, Moodle)

---

## 🤝 Contributing

Contributions are welcome! Please open an issue first to discuss what you'd like to change. Pull requests should target the `main` branch.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">

**Deep Blue** — *Learn to think. Not just to code.* 🧊

</div>
