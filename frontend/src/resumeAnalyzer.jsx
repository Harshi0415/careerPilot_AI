
import { useState } from "react";
import "./resumeAnalyzer.css";
import jsPDF from "jspdf";

function ResumeAnalyzer() {
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState("");

  const [analysis, setAnalysis] = useState("");
  const [report, setReport] = useState(null);
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
    setReport(null);

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
setReport(mode === "analyze" ? data.report || null : null);
    } catch (err) {
      setError(
        err.message || "Could not connect to the Flask backend."
      );
    } finally {
      setLoading(false);
    }
  }

//for downloading a PDF report

function downloadReport() {
  if (!analysis) return;

  const pdf = new jsPDF();
  const margin = 15;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const usableWidth = pageWidth - margin * 2;
  let y = 20;

  function addText(text, fontSize = 10, gap = 6) {
    pdf.setFontSize(fontSize);
    const lines = pdf.splitTextToSize(String(text), usableWidth);

    for (const line of lines) {
      if (y > pageHeight - margin) {
        pdf.addPage();
        y = 20;
      }

      pdf.text(line, margin, y);
      y += gap;
    }
  }

  pdf.setFont("helvetica", "bold");
  addText("CareerPilot AI", 20, 10);
  pdf.setFont("helvetica", "normal");
  addText(
    mode === "match"
      ? "Resume–Job Match Report"
      : "Resume Analysis Report",
    14,
    9
  );

  addText(`Generated: ${new Date().toLocaleDateString()}`, 9, 8);
  addText("", 10, 4);

  if (mode === "analyze" && report) {
    addText(`Resume Score: ${report.score}/100`, 14, 8);
    addText(report.score_explanation || "", 10, 6);
    addText("", 10, 4);

    const sections = [
      ["Key Strengths", report.strengths],
      ["Technical Skills", report.technical_skills],
      ["Weak or Missing Areas", report.weak_areas],
      ["Recommended Improvements", report.improvements],
    ];

    for (const [heading, items] of sections) {
      addText(heading, 12, 8);

      if (Array.isArray(items) && items.length) {
        items.forEach((item, index) => {
          addText(`${index + 1}. ${item}`, 10, 6);
        });
      } else {
        addText("No items provided.", 10, 6);
      }

      addText("", 10, 4);
    }

    addText(
      "Note: This is an AI-generated estimate, not an official ATS score.",
      9,
      6
    );
  } else {
    addText(analysis, 10, 6);
  }

  pdf.save(
    mode === "match"
      ? "CareerPilot-Resume-Job-Match.pdf"
      : "CareerPilot-Resume-Analysis.pdf"
  );
}


function getReportSections(text) {
  const headings = [
    "MATCHING SKILLS",
    "MISSING KEYWORDS",
    "RELEVANT EXPERIENCE",
    "ATS CHECKLIST",
    "IMPROVEMENTS",
    "OVERALL ASSESSMENT",
  ];

  const sections = {};
  let currentHeading = "";

  text.split("\n").forEach((line) => {
    const trimmed = line.trim();
    const matchedHeading = headings.find(
      (heading) => trimmed.toUpperCase() === heading
    );

    if (matchedHeading) {
      currentHeading = matchedHeading;
      sections[currentHeading] = [];
    } else if (currentHeading && trimmed) {
      sections[currentHeading].push(trimmed);
    }
  });

  return sections;
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
            setReport(null);
            setError("");
          }}
        >
          Job Matching
        </button>
        <button
          type="button"
          className="download-report-button"
          onClick={downloadReport}
>
  Download PDF Report
</button>
      </div>

      <section className="upload-section">
        <h3>1. Upload your resume</h3>

        <label className="resume-dropzone">
  <input
    type="file"
    accept=".pdf,application/pdf"
    onChange={(event) => {
      const selectedFile = event.target.files?.[0] || null;
      setFile(selectedFile);
      setAnalysis("");
      setError("");
    }}
  />

  <span className="upload-symbol">↑</span>
  <strong>
    {file ? file.name : "Choose your resume PDF"}
  </strong>
  <span className="upload-hint">
    {file
      ? "PDF selected successfully"
      : "Click to browse files · PDF format"}
  </span>
</label>
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
    <div className="results-heading">
      <div>
        <span className="results-eyebrow">CAREERPILOT AI REPORT</span>
        <h3>
          {mode === "match"
            ? "Resume–Job Match Results"
            : "Your Resume Feedback"}
        </h3>
      </div>
      <span className="results-status">Analysis complete</span>
    </div>

    {mode === "analyze" && report ? (
      <>
        <div className="score-card">
          <span className="score-label">Resume Score</span>
          <div className="score-value">
            {report.score}<span>/100</span>
          </div>
          <p>{report.score_explanation}</p>
          <div
            className="score-track"
            role="progressbar"
            aria-label="Resume score"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={report.score}
          >
            <div
              className="score-fill"
              style={{
                width: `${Math.max(0, Math.min(100, report.score))}%`,
              }}
            />
          </div>
          <small>
            AI estimate based on resume content, not an official ATS score.
          </small>
        </div>

        <div className="report-grid">
          <div className="report-card">
            <h4>Key Strengths</h4>
            <ul>
              {(report.strengths || []).map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="report-card">
            <h4>Technical Skills</h4>
            <ul>
              {(report.technical_skills || []).map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="report-card">
            <h4>Weak or Missing Areas</h4>
            <ul>
              {(report.weak_areas || []).map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="report-card">
            <h4>Recommended Improvements</h4>
            <ol>
              {(report.improvements || []).map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ol>
          </div>
        </div>
      </>
      
) : mode === "match" ? (
  <div className="report-grid">
    {Object.entries(getReportSections(analysis)).length > 0 ? (
      Object.entries(getReportSections(analysis)).map(
        ([heading, items]) => (
          <div className="report-card" key={heading}>
            <h4>{heading}</h4>
            <ul>
              {items.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        )
      )
    ) : (
      <div className="results-content">
        <pre>{analysis}</pre>
      </div>
    )}
  </div>
) : (
  <div className="results-content">
    <pre>{analysis}</pre>
  </div>
)}


    
  </section>
)}

    </div>
  );
}

export default ResumeAnalyzer;
