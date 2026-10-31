
import os
import json
import logging
from io import BytesIO

import requests
from flask import Blueprint, request, jsonify
from pypdf import PdfReader


resume_bp = Blueprint("resume", __name__)

# AI configuration
IS_PRODUCTION = os.getenv("APP_ENV", "development") == "production"

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "openai/gpt-oss-20b"
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

OLLAMA_URL = "http://127.0.0.1:11434/api/generate"
OLLAMA_MODEL = "llama3.2:1b"


def generate_ai_response(prompt, json_mode=False):
    """Use Groq in production and Ollama locally."""

    if IS_PRODUCTION:
        if not GROQ_API_KEY:
            raise RuntimeError("GROQ_API_KEY is not configured on Render.")

        payload = {
            "model": GROQ_MODEL,
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": 0.2,
            "max_tokens": 1500
        }

        if json_mode:
            payload["response_format"] = {"type": "json_object"}

        response = requests.post(
            GROQ_API_URL,
            headers={
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json"
            },
            json=payload,
            timeout=120
        )

        response.raise_for_status()

        result = response.json()
        return result["choices"][0]["message"]["content"].strip()

    else:
        payload = {
            "model": OLLAMA_MODEL,
            "prompt": prompt,
            "stream": False
        }

        if json_mode:
            payload["format"] = "json"

        response = requests.post(
            OLLAMA_URL,
            json=payload,
            timeout=180
        )

        response.raise_for_status()

        return response.json().get("response", "").strip()


def extract_resume_text(file):
    """Extract readable text from an uploaded PDF."""

    if "resume" not in request.files:
        raise ValueError("Please upload your resume PDF.")

    file = request.files["resume"]

    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise ValueError("Please upload a valid PDF file.")

    pdf_bytes = file.read(5 * 1024 * 1024 + 1)

    if len(pdf_bytes) > 5 * 1024 * 1024:
        raise ValueError("Resume PDF must be 5 MB or smaller.")

    reader = PdfReader(BytesIO(pdf_bytes))

    if reader.is_encrypted:
        raise ValueError("Password-protected PDFs are not supported.")

    resume_text = "\n".join(
        page.extract_text() or "" for page in reader.pages
    )

    if not resume_text.strip():
        raise ValueError("No readable text found in this PDF.")

    return resume_text[:4000]


@resume_bp.route("/api/resume/analyze", methods=["POST"])
def analyze_resume():

    try:
        resume_text = extract_resume_text(request.files.get("resume"))

        prompt = f"""
You are a careful resume reviewer for computer science freshers.

Review the resume below and return ONLY valid JSON.
Do not use markdown fences or add text outside the JSON.

Use this exact structure:
{{
  "score": 0,
  "score_explanation": "Brief explanation of the score",
  "strengths": ["strength 1", "strength 2"],
  "technical_skills": ["skill 1", "skill 2"],
  "weak_areas": ["weak area 1", "weak area 2"],
  "improvements": [
    "Specific improvement 1",
    "Specific improvement 2",
    "Specific improvement 3"
  ]
}}

SCORING RUBRIC (total 100):
- Education and relevant qualifications: 10 points
- Technical skills relevant to software roles: 15 points
- Projects and evidence of implementation: 25 points
- Internship or relevant experience: 15 points
- Demonstrated results or measurable impact: 10 points
- Resume sections and organization: 10 points
- Clarity and relevance: 15 points

RULES:
- Award points only for evidence in the resume.
- Do not invent skills, achievements, or qualifications.
- Assess freshers fairly based on projects and internships.
- Keep feedback concise, specific, and constructive.
- Return score as an integer between 0 and 100.
- The score is an approximate review, not an official ATS score.
- Include only skills supported by the resume.

RESUME:
{resume_text}
"""

        raw_result = generate_ai_response(prompt, json_mode=True)

        if not raw_result:
            return jsonify({
                "error": "The AI returned an empty analysis. Please retry."
            }), 502

        report = json.loads(raw_result)

        score = report.get("score")

        if (
            not isinstance(score, int)
            or isinstance(score, bool)
            or not 0 <= score <= 100
        ):
            raise ValueError("The AI returned an invalid resume score.")

        strengths = report.get("strengths", [])
        skills = report.get("technical_skills", [])
        weak_areas = report.get("weak_areas", [])
        improvements = report.get("improvements", [])

        if not all(
            isinstance(items, list)
            and all(isinstance(item, str) for item in items)
            for items in [strengths, skills, weak_areas, improvements]
        ):
            raise ValueError("The AI returned an invalid report structure.")

        analysis = (
            f"RESUME SCORE: {score}/100\n\n"
            f"EXPLANATION:\n{report.get('score_explanation', '')}\n\n"
            f"KEY STRENGTHS:\n"
            + "\n".join(f"- {item}" for item in strengths)
            + "\n\nTECHNICAL SKILLS:\n"
            + "\n".join(f"- {item}" for item in skills)
            + "\n\nWEAK OR MISSING AREAS:\n"
            + "\n".join(f"- {item}" for item in weak_areas)
            + "\n\nTHREE IMPROVEMENTS:\n"
            + "\n".join(
                f"{i + 1}. {item}"
                for i, item in enumerate(improvements)
            )
        )

        return jsonify({
            "analysis": analysis,
            "report": report
        })

    except ValueError as error:
        return jsonify({"error": str(error)}), 400

    except requests.RequestException:
        logging.exception("AI service request failed during resume analysis")
        return jsonify({
            "error": "Could not connect to the AI service. Please try again."
        }), 503

    except Exception:
        logging.exception("Resume analysis failed")
        return jsonify({
            "error": "Resume analysis failed. Check the Flask logs for details."
        }), 500


@resume_bp.route("/api/resume/match", methods=["POST"])
def match_resume():

    try:
        resume_text = extract_resume_text(request.files.get("resume"))

        job_description = request.form.get(
            "job_description", ""
        ).strip()

        if not job_description:
            return jsonify({
                "error": "Please paste a job description."
            }), 400

        if len(job_description) > 6000:
            return jsonify({
                "error": "Job description must be under 6000 characters."
            }), 400

        prompt = f"""
You are a careful technical recruiter reviewing a resume against a job description.

Return a concise, evidence-based report using these exact sections:

1. MATCHING SKILLS
List skills explicitly supported by the resume.

2. MISSING KEYWORDS
List important job-description skills or terms not explicitly
found in the resume text. Missing keywords do not prove the
candidate lacks those skills.

3. RELEVANT EXPERIENCE
Identify relevant projects, internships, and experience supported
by the resume.

4. ATS CHECKLIST
Provide 5 to 8 important requirements from the job description.
For each item, label it:
- FOUND IN RESUME
- NOT FOUND IN RESUME

5. IMPROVEMENTS
Give three specific, practical suggestions for tailoring the resume.

6. OVERALL ASSESSMENT
Briefly explain how well the resume aligns with the role.

RULES:
- Do not invent skills, experience, or qualifications.
- Only mark a skill as found when the resume provides evidence.
- Prioritize important requirements in the job description.
- Keep the report concise and easy to read.
- Do not invent an ATS score or match percentage.

RESUME:
{resume_text}

JOB DESCRIPTION:
{job_description}
"""

        result = generate_ai_response(prompt)

        if not result:
            return jsonify({
                "error": "The AI returned an empty analysis. Please retry."
            }), 502

        return jsonify({"analysis": result})

    except ValueError as error:
        return jsonify({"error": str(error)}), 400

    except requests.RequestException:
        logging.exception("AI service request failed during job matching")
        return jsonify({
            "error": "Could not connect to the AI service. Please try again."
        }), 503

    except Exception:
        logging.exception("Job description matching failed")
        return jsonify({
            "error": "Job matching failed. Check the Flask logs for details."
        }), 500
