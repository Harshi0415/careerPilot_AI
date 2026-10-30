
import { useState } from "react";
import "./InterviewPrep.css";

const topics = [
  "Python",
  "Full Stack Development",
  "SQL",
  "AI / ML",
];

function InterviewPrep() {
  const [topic, setTopic] = useState("Python");
  const [answer, setAnswer] = useState("");
  const [question, setQuestion] = useState(
    "Tell me about yourself and your technical background."
  );
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submitAnswer() {
    if (!answer.trim() || loading) {
      setError("Please write your answer first.");
      return;
    }

    setLoading(true);
    setError("");
    setFeedback("");

    try {
      const response = await fetch(
        "http://127.0.0.1:5000/api/chat",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: `Act as a supportive technical interviewer for a fresher applying for software developer jobs.

Interview topic: ${topic}
Interview question: ${question}
Candidate's answer: ${answer}

Evaluate only the candidate's answer. Return:
1. What was good
2. What needs improvement
3. A stronger sample answer that sounds natural for a fresher
4. One follow-up interview question

Be specific, constructive, concise, and technically accurate. Do not invent the candidate's experience or achievements.`,
            history: [],
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not evaluate your answer.");
      }

      setFeedback(data.reply || "No feedback was returned.");
    } catch (err) {
      setError(
        err.message || "Could not connect to the AI backend."
      );
    } finally {
      setLoading(false);
    }
  }

  function nextQuestion() {
    setQuestion("");
    setAnswer("");
    setFeedback("");
    setError("");
  }

  return (
    <div className="interview-page">
      <div className="interview-heading">
        <span className="interview-eyebrow">PRACTICE MODE</span>
        <h1>Interview Preparation</h1>
        <p>
          Practise your answers, receive feedback, and build
          confidence one question at a time.
        </p>
      </div>

      <section className="interview-card">
        <label htmlFor="interview-topic">Choose your interview topic</label>

        <select
          id="interview-topic"
          value={topic}
          onChange={(event) => {
            setTopic(event.target.value);
            setFeedback("");
            setError("");
          }}
        >
          {topics.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <label htmlFor="interview-question">Interview question</label>

        <textarea
          id="interview-question"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          rows={3}
          placeholder="Enter an interview question..."
        />

        <label htmlFor="interview-answer">Your answer</label>

        <textarea
          id="interview-answer"
          value={answer}
          onChange={(event) => {
            setAnswer(event.target.value);
            setError("");
          }}
          rows={7}
          placeholder="Answer as if you are speaking to an interviewer..."
        />

        <button
          type="button"
          className="evaluate-answer-button"
          onClick={submitAnswer}
          disabled={loading || !answer.trim() || !question.trim()}
        >
          {loading ? "Evaluating your answer..." : "Evaluate My Answer"}
        </button>

        {error && (
          <p className="interview-error" role="alert">
            {error}
          </p>
        )}
      </section>

      {feedback && (
        <section className="interview-card interview-feedback">
          <h2>AI Interview Feedback</h2>
          <div className="feedback-text">{feedback}</div>

          <button
            type="button"
            className="next-question-button"
            onClick={nextQuestion}
          >
            Practise another question
          </button>
          <p className="next-question-hint">
            Enter your next question above, then write a fresh answer.
          </p>
        </section>
      )}
    </div>
  );
}

export default InterviewPrep;
