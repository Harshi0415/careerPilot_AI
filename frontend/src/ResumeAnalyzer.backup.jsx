
import { useState } from "react";

function ResumeAnalyzer() {
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [analysis, setAnalysis] = useState("");
  const [mode, setMode] = useState("analyze");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!file) {
      setError("Please select your resume PDF first.");
      return;
    }

    if (mode === "match" && !jobDescription.trim()) {
      setError("Please paste the job description.");
      return;
    }

    const formData = new FormData();
    formData.append("resume", file);

    let endpoint = "http://127.0.0.1:5000/api/resume/analyze";

    if (mode === "match") {
      endpoint = "http://127.0.0.1:5000/api/resume/match";
      formData.append("job_description", jobDescription.trim());
    }

    setLoading(true);
    setError("");
    setAnalysis("");

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Request failed.");
      }

      setAnalysis(data.analysis || "No analysis was returned.");
    } catch (err) {
      setError(
        err.message || "Could not connect to the Flask backend."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="resume-analyzer">
      <h2>CareerPilot AI</h2>
      <p>Analyze your resume or compare it with a target job.</p>

      <div className="analyzer-tabs">
        <button
          type="button"
          className={mode === "analyze" ? "active" : ""}
          onClick={() => {
            setMode("analyze");
            setAnalysis("");
            setError("");
          }}
        >
          Analyze Resume
        </button>

        <button
          type="button"
          className={mode === "match" ? "active" : ""}
          onClick={() => {
            setMode("match");
            setAnalysis("");
            setError("");
          }}
        >
          Job Matching
        </button>
      </div>

      <section className="upload-section">
        <h3>1. Upload your resume</h3>

        <input
          type="file"
          accept=".pdf,application/pdf"
          onChange={(event) => {
            setFile(event.target.files?.[0] || null);
            setAnalysis("");
            setError("");
          }}
        />

        {file && <p>Selected file: {file.name}</p>}
      </section>

      {mode === "match" && (
        <section className="job-description-section">
          <h3>2. Paste the job description</h3>

          <textarea
            value={jobDescription}
            onChange={(event) => setJobDescription(event.target.value)}
            placeholder="Paste the job responsibilities, required skills, and qualifications here..."
            rows={8}
            maxLength={6000}
          />

          <p>{jobDescription.length}/6000 characters</p>
        </section>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={loading}
        className="analyze-button"
      >
        {loading
          ? "Analyzing... Please wait"
          : mode === "match"
          ? "Match My Resume"
          : "Analyze Resume"}
      </button>

      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}

      {analysis && (
        <section className="analysis-results">
          <h3>
            {mode === "match"
              ? "Resume–Job Match Results"
              : "Your Resume Feedback"}
          </h3>

          <pre>{analysis}</pre>
        </section>
      )}
    </div>
  );
}

export default ResumeAnalyzer;
