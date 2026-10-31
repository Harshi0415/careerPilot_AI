# 🚀 CareerPilot AI – Your AI-Powered Career Assistant

CareerPilot AI is a full-stack AI-powered career assistant designed to help job seekers simplify their job search and career preparation.

It provides intelligent resume analysis, job description matching, interview preparation, AI-powered career guidance, and job application tracking in one platform.

## 🌟 Features

### 1. AI Career Assistant
- Get AI-powered career guidance.
- Ask technical and career-related questions.
- Receive personalized job search suggestions.
- Powered by Groq in production and Ollama during local development.

### 2. Resume Analyzer
- Upload resumes in PDF format.
- Generate an AI-based resume score out of 100.
- Identify key strengths and technical skills.
- Discover weak or missing areas.
- Get actionable resume improvement suggestions.
- Download the resume analysis report as a PDF.

### 3. Resume–Job Description Matching
- Upload your resume and paste a job description.
- Identify matching skills.
- Find missing keywords.
- Review relevant projects and experience.
- Generate an ATS-oriented checklist.
- Get suggestions to tailor your resume to a job.

### 4. Interview Preparation
- Practice technical interview questions.
- Prepare for software development roles.
- Improve your interview readiness.

### 5. Job Application Tracker
- Add and manage job applications.
- Track application dates and sources.
- Update application statuses.
- Maintain notes for individual applications.

### 6. User Authentication
- User registration and login.
- Session-based authentication.
- Protected user-specific application data.

### 7. Dark and Light Mode
- Switch between dark and light themes.
- Save theme preferences across sessions.

## 🛠️ Tech Stack

| Category | Technologies |
|---|---|
| Frontend | React.js, Vite, JavaScript |
| Styling | CSS |
| Backend | Python, Flask |
| Database | MySQL |
| AI – Production | Groq API |
| AI – Local Development | Ollama, Llama 3.2 1B |
| PDF Processing | PyPDF |
| PDF Generation | jsPDF |
| API Communication | REST API |
| Deployment | Vercel, Render |
| Version Control | Git, GitHub |

## 🏗️ Project Architecture

```text
CareerPilotAI/
│
├── Backend/
│   ├── app.py
│   ├── auth.py
│   ├── resumeAnalyzer.py
│   ├── jobPlanner.py
│   ├── db.py
│   ├── requirements.txt
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── resumeAnalyzer.jsx
│   │   └── ...
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

*Note: The structure above highlights the main project files; individual folders may contain additional components and modules.*

## ⚙️ Installation and Setup

### Prerequisites

Install the following:

- Python 3.10+
- Node.js and npm
- MySQL
- Ollama (for local AI development)
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/Harshi0415/careerPilot_AI.git

cd careerPilot_AI
```

### 2. Backend Setup

Navigate to the backend directory:

```bash
cd Backend
```

Create a virtual environment:

```bash
python -m venv .venv
```

Activate it on Windows:

```powershell
.venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create a `.env` file and configure your local environment:

```env
APP_ENV=development
FLASK_SECRET_KEY=your_secret_key
```

Configure your MySQL connection using the database environment variables expected by `db.py`.

Start Ollama and download the model:

```bash
ollama pull llama3.2:1b
```

Start the Flask backend:

```bash
python app.py
```

Backend runs at:

`http://127.0.0.1:5000`

Health check:

`http://127.0.0.1:5000/health`

### 3. Frontend Setup

Open another terminal:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the local URL displayed by Vite in your terminal.

## 🔌 Main API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Backend health check |
| POST | `/api/resume/analyze` | Analyze an uploaded resume |
| POST | `/api/resume/match` | Match resume against a job description |
| POST | `/api/chat` | AI career assistant |

Authentication and job application endpoints are also available through the backend.

## 🤖 AI Integration

CareerPilot AI uses different AI providers depending on the environment.

**Local Development**
- Ollama
- Llama 3.2 1B
- Runs locally on the developer's machine.

**Production**
- Groq API
- Model: `openai/gpt-oss-20b`
- AI requests are processed through the hosted backend.

The API key is stored as a backend environment variable and should never be exposed in frontend code or committed to GitHub.

## ☁️ Deployment

The project is deployed using:

| Component | Platform |
|---|---|
| Frontend | Vercel |
| Backend | Render |
| Database | Aiven MySQL |
| AI Provider | Groq |

**Live Application:**  
https://career-pilot-ai-blush-mu.vercel.app

**GitHub Repository:**  
https://github.com/Harshi0415/careerPilot_AI

## 🔐 Security Considerations

- Keep API keys and database credentials in environment variables.
- Never commit `.env` files.
- Use secure session configuration in production.
- Validate uploaded PDF files.
- Restrict file uploads by size.
- Use HTTPS for production communication.

## 🎯 Future Enhancements

- Persistent AI conversation history.
- Personalized career roadmaps.
- More advanced job recommendations.
- Additional interview practice modes.
- Enhanced analytics for job applications.

## 👩‍💻 Developer

**Harshitha Narisetty**

2026 Computer Science and Engineering Graduate

Interested in Full Stack Development, Python, and AI-powered applications.

---

⭐ If you find this project interesting, consider giving the repository a star!

**Built with passion to make career preparation smarter and simpler.**
