
from flask import Blueprint, request, jsonify
from pypdf import PdfReader
from io import BytesIO
import requests
import logging

resume_bp = Blueprint("resume", __name__)

@resume_bp.route("/api/resume/analyze", methods=["POST"])

@resume_bp.route("/api/resume/analyze", methods=["POST"])
def analyze_resume():
    if "resume" not in request.files:
        return jsonify({"error": "Please upload a PDF resume."}), 400

    file = request.files["resume"]

    if not file.filename or not file.filename.lower().endswith(".pdf"):
        return jsonify({"error": "Please upload a valid PDF file."}), 400

    try:
        # Limit the uploaded PDF to 5 MB
        pdf_bytes = file.read(5 * 1024 * 1024 + 1)

        if len(pdf_bytes) > 5 * 1024 * 1024:
            return jsonify({
                "error": "Resume PDF must be 5 MB or smaller."
            }), 400

        reader = PdfReader(BytesIO(pdf_bytes))

        if reader.is_encrypted:
            return jsonify({
                "error": "Password-protected PDFs are not supported."
            }), 400

        resume_text = "\n".join(
            page.extract_text() or "" for page in reader.pages
        )

        if not resume_text.strip():
            return jsonify({
                "error": "No readable text found in this PDF."
            }), 400

        resume_text = resume_text[:4000]

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
- Resume sections and organization, based on extracted text: 10 points
- Clarity and relevance of resume content: 15 points

Scoring rules:
- Award points only for evidence present in the resume.
- Do not assume missing information exists.
- A fresher may have no full-time experience; assess relevant projects
  and internships fairly.
- Do not invent skills, achievements, or qualifications.
- Keep feedback concise, specific, and constructive.
- The score is an approximate content-based review, not an official
  ATS score or a guarantee of getting interviews.
- "technical_skills" must contain only skills explicitly supported
  by the resume.
- Return score as an integer between 0 and 100.

RESUME:
{resume_text}
"""

        response = requests.post(
            "http://127.0.0.1:11434/api/generate",
            json={
                "model": "llama3.2:1b",
                "prompt": prompt,
                "stream": False,
                "format": "json"
            },
            timeout=180
        )

        response.raise_for_status()
        raw_result = response.json().get("response", "").strip()

        if not raw_result:
            return jsonify({
                "error": "The AI returned an empty analysis. Please retry."
            }), 502

        import json
        report = json.loads(raw_result)

        # Validate the key fields before returning the report
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

        # Keep "analysis" as text so the existing frontend still works.
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
            + "\n".join(f"{i + 1}. {item}" for i, item in enumerate(improvements))
        )

        return jsonify({
            "analysis": analysis,
            "report": report
        })

    except requests.RequestException:
        logging.exception("Ollama request failed during resume analysis")
        return jsonify({
            "error": "Could not connect to Ollama. Make sure Ollama is running."
        }), 503

    except Exception:
        logging.exception("Resume analysis failed")
        return jsonify({
            "error": "Resume analysis failed. Check the Flask terminal for details."
        }), 500


@resume_bp.route("/api/resume/match", methods=["POST"])
def match_resume():
    if "resume" not in request.files:
        return jsonify({"error": "Please upload your resume PDF."}), 400

    file = request.files["resume"]
    job_description = request.form.get("job_description", "").strip()

    if not file.filename or not file.filename.lower().endswith(".pdf"):
        return jsonify({"error": "Please upload a valid PDF file."}), 400

    if not job_description:
        return jsonify({"error": "Please paste a job description."}), 400

    if len(job_description) > 6000:
        return jsonify({
            "error": "Job description must be under 6000 characters."
        }), 400

    try:
        # Limit the uploaded PDF to 5 MB
        pdf_bytes = file.read(5 * 1024 * 1024 + 1)

        if len(pdf_bytes) > 5 * 1024 * 1024:
            return jsonify({
                "error": "Resume PDF must be 5 MB or smaller."
            }), 400

        reader = PdfReader(BytesIO(pdf_bytes))

        if reader.is_encrypted:
            return jsonify({
                "error": "Password-protected PDFs are not supported."
            }), 400

        resume_text = "\n".join(
            page.extract_text() or "" for page in reader.pages
        )

        if not resume_text.strip():
            return jsonify({
                "error": "No readable text found in this PDF."
            }), 400

        # Keep the prompt small for your local model
        resume_text = resume_text[:4000]

        prompt = f"""

prompt = f"
You are a careful technical recruiter reviewing a resume against a job description.

Return a concise, evidence-based report using these exact sections:

1. MATCHING SKILLS
List skills explicitly supported by the resume.

2. MISSING KEYWORDS
List important job-description skills or terms that are not explicitly
found in the resume text. These are missing from the text, not proof
that the candidate lacks the skills.

3. RELEVANT EXPERIENCE
Identify relevant projects, internships, and experience supported
by the resume.

4. ATS CHECKLIST
Provide a checklist of 5 to 8 important requirements from the job
description. For each item, label it:
- FOUND IN RESUME
- NOT FOUND IN RESUME

5. IMPROVEMENTS
Give three specific, practical suggestions for tailoring the resume.

6. OVERALL ASSESSMENT
Briefly explain how well the resume aligns with the role.

Rules:
- Do not invent skills, experience, or qualifications.
- Only mark a skill as found when the resume provides evidence.
- Prioritize important requirements in the job description.
- Keep the report concise and easy to read.
- Do not invent an ATS score or match percentage.
- A missing keyword does not necessarily mean the candidate lacks
  the underlying skill.

RESUME:
{resume_text}

JOB DESCRIPTION:
{job_description}
"""

        response = requests.post(
            "http://127.0.0.1:11434/api/generate",
            json={
                "model": "llama3.2:1b",
                "prompt": prompt,
                "stream": False
            },
            timeout=180
        )

        response.raise_for_status()
        result = response.json().get("response", "").strip()

        if not result:
            return jsonify({
                "error": "The AI returned an empty analysis. Please retry."
            }), 502

        return jsonify({"analysis": result})

    except Exception as error:
        logging.exception("Job description matching failed")
        return jsonify({
            "error": "Job matching failed. Check the Flask terminal for details."
        }), 500
