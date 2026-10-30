
import os
from datetime import timedelta
from job_applications import job_applications_bp

from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
from auth import auth_bp
from resumeAnalyzer import resume_bp

# Load Backend/.env before reading environment variables
load_dotenv()

app = Flask(__name__)


app.config.update(
    SECRET_KEY=os.getenv("FLASK_SECRET_KEY"),
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Lax",
    SESSION_COOKIE_SECURE=False,  # Local HTTP development only
    PERMANENT_SESSION_LIFETIME=timedelta(days=7),
)

if not app.config["SECRET_KEY"]:
    raise RuntimeError(
        "FLASK_SECRET_KEY is missing. Check your Backend/.env file."
    )

CORS(
    app,
    resources={
        r"/*" : {
            "origins": [
                "http://localhost:5173",
                "http://127.0.0.1:5173",
                "http://localhost:5175",
                "http://127.0.0.1:5175",
                "http://localhost:5176",
                "http://127.0.0.1:5176",
            ],
             "supports_credentials": True,
        }
    },
    supports_credentials=True,
)


app.register_blueprint(resume_bp)
app.register_blueprint(auth_bp)
app.register_blueprint(job_applications_bp)

OLLAMA_URL = "http://127.0.0.1:11434/api/generate"
MODEL_NAME = "llama3.2:1b"


@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "healthy",
        "project": "CareerPilot AI"
    })


    
@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.get_json(silent=True) or {}

    message = data.get("message", "").strip()
    history = data.get("history", [])

    if not message:
        return jsonify({"error": "Message is required"}), 400

    if not isinstance(history, list):
        return jsonify({"error": "History must be a list"}), 400

    # Keep only recent, valid conversation messages.
    valid_history = []
    for item in history[-10:]:
        if (
            isinstance(item, dict)
            and item.get("role") in ("user", "assistant")
            and isinstance(item.get("content"), str)
        ):
            valid_history.append(
                f"{item['role'].capitalize()}: {item['content'][:2000]}"
            )

    conversation = "\n".join(valid_history)

    prompt = (
        "You are CareerPilot AI, a helpful career assistant for students "
        "and fresh graduates. Help with Python, full-stack development, "
        "resumes, job searches, and interviews. Give practical answers. "
        "In interview mode, evaluate the user's latest answer, suggest "
        "an improved answer, and ask one next question.\n\n"
        f"Previous conversation:\n{conversation}\n\n"
        f"User: {message}\nAssistant:"
    )

    try:
        response = requests.post(
            OLLAMA_URL,
            json={
                "model": MODEL_NAME,
                "prompt": prompt,
                "stream": False
            },
            timeout=180
        )
        response.raise_for_status()

        return jsonify({
            "reply": response.json().get("response", "").strip()
        })

    except requests.RequestException as error:
        app.logger.exception("Ollama request failed")
        return jsonify({
            "error": "Could not connect to Ollama or generate a response.",
            "details": str(error)
        }), 503



if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=False)
