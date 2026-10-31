
import os
from pathlib import Path
from datetime import timedelta

import requests
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS

from auth import auth_bp
from resumeAnalyzer import resume_bp
from job_applications import job_applications_bp

# Load Backend/.env
load_dotenv(Path(__file__).with_name(".env"))

app = Flask(__name__)

IS_PRODUCTION = os.getenv("APP_ENV", "development") == "production"

app.config.update(
    SECRET_KEY=os.getenv("FLASK_SECRET_KEY"),
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="None" if IS_PRODUCTION else "Lax",
    SESSION_COOKIE_SECURE=IS_PRODUCTION,
    PERMANENT_SESSION_LIFETIME=timedelta(days=7),
)

if not app.config["SECRET_KEY"]:
    raise RuntimeError(
        "FLASK_SECRET_KEY is missing. Check your environment variables."
    )

# Allow local development and the deployed frontend.
allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5175",
    "http://127.0.0.1:5175",
    "http://localhost:5176",
    "http://127.0.0.1:5176",
]

frontend_url = os.getenv("FRONTEND_URL", "").strip()

if frontend_url:
    allowed_origins.extend(
        origin.strip()
        for origin in frontend_url.split(",")
        if origin.strip()
    )

CORS(
    app,
    resources={r"/*": {"origins": allowed_origins}},
    supports_credentials=True,
)

# Register existing API blueprints
app.register_blueprint(resume_bp)
app.register_blueprint(auth_bp)
app.register_blueprint(job_applications_bp)

# AI configuration
OLLAMA_URL = os.getenv(
    "OLLAMA_URL",
    "http://127.0.0.1:11434/api/generate"
)

MODEL_NAME = os.getenv("MODEL_NAME", "llama3.2:1b")


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

    except requests.RequestException:
        app.logger.exception("AI request failed")

        return jsonify({
            "error": "Could not connect to the AI service."
        }), 503


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
