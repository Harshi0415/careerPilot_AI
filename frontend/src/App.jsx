
import { useState , useEffect  } from "react";
import "./App.css";
import ResumeAnalyzer from "./resumeAnalyzer.jsx";
//import "./components/DepthText.css";
import LandingPage from "./LandingPage.jsx";
import AuthPage from "./AuthPage.jsx";
import InterviewPrep from "./InterviewPrep.jsx";
import JobPlanner from "./JobPlanner.jsx";
import Dashboard from "./Dashboard.jsx";


const suggestions = [
  "Create a 30-day job search plan",
  "Prepare me for a Python interview",
  "Improve my developer resume",
];

function App() {
  //const [showLandingPage, setShowLandingPage] = useState(true);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activePage, setActivePage] = useState("chat");
  const [authPage, setAuthPage] = useState("landing");
  const [loggedInUser, setLoggedInUser] = useState(null);
  
const [checkingSession, setCheckingSession] = useState(true);


useEffect(() => {
  async function restoreSession() {
    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/me",
        {
          method: "GET",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (response.ok && data.authenticated && data.user) {
        setLoggedInUser(data.user);
        setAuthPage("app");
      } else {
        setLoggedInUser(null);
        setAuthPage("landing");
      }
    } catch (error) {
      console.error("Session restoration failed:", error);
      setLoggedInUser(null);
      setAuthPage("landing");
    } finally {
      setCheckingSession(false);
    }
  }

  restoreSession();
}, []);



  async function sendMessage(text = input) {
    const question = text.trim();

    if (!question || loading) return;

    // Save the current conversation before sending the request
    const updatedMessages = [
      ...messages,
      { role: "user", content: question },
    ];

    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch(
        "http://127.0.0.1:5000/api/chat",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: question,
            history: messages.map(({ role, content }) => ({
              role,
              content,
            })),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content: data.reply || "I couldn't generate a reply.",
        },
      ]);
    } catch (error) {
      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content:
            "I couldn't connect to the AI backend. Please check that Flask is running at http://127.0.0.1:5000 and Ollama is available. Details: " +
            error.message,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    sendMessage();
  }

async function handleLogout() {
  try {
    const response = await fetch(
      "http://localhost:5000/api/auth/logout",
      {
        method: "POST",
        credentials: "include",
      }
    );

    if (!response.ok) {
      throw new Error("Logout failed. Please try again.");
    }

    setLoggedInUser(null);
    setMessages([]);
    setInput("");
    setActivePage("chat");
    setAuthPage("landing");
  } catch (error) {
    console.error("Logout failed:", error);
    alert(error.message || "Unable to log out. Please try again.");
  }
}





  function startNewChat() {
    setMessages([]);
    setInput("");
    setActivePage("chat");

  }
  //if(showLandingPage){
    //return <LandingPage onEnterApp={() => setShowLandingPage(false)} />;
  //}
  if (checkingSession) {
  return <p>Restoring your session...</p>;
}
if (authPage !== "app") {
  if (authPage === "landing") {
    return (
      <LandingPage
        onGetStarted={() => setAuthPage("signup")}
        onSignIn={() => setAuthPage("login")}
      />
    );
  }

  return (
    <AuthPage
      mode={authPage}
      onModeChange={setAuthPage}
      onBackToHome={() => setAuthPage("landing")}
       onLoginSuccess={(user) => {
        setLoggedInUser(user)
        setAuthPage("app");}}
    />
  );
}


  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">C</div>
          <div>
            <h2>CareerPilot</h2>
            <span>AI CAREER ASSISTANT</span>
          </div>
        </div>

        <button className="new-chat" onClick={startNewChat}>
          <span>＋</span> New conversation
        </button>

        <div className="sidebar-section">
          <p className="section-label">YOUR CAREER TOOLKIT</p>

          <button
            className={`tool-item ${activePage === "jobs" ? "active" : ""}`}
            onClick={() => setActivePage("jobs")}
          >
            ✦ Job search planning
          </button>

          <button
            className={`tool-item ${activePage === "interview" ? "active" : ""}`}
            onClick={() => setActivePage("interview")}
          >
            ⌘ Interview preparation
          </button>

          <button
            className="tool-item"
            onClick={() => setActivePage("resume")}
          >
            ↗ Resume improvement
          </button>
          <button
  className={`tool-item ${activePage === "dashboard" ? "active" : ""}`}
  onClick={() => setActivePage("dashboard")}
>
  ▦ Dashboard Analytics
</button>




        </div>

        
<div className="sidebar-footer">
  {loggedInUser && (
    <div className="sidebar-user-account">
      <div className="sidebar-user-avatar">
        {(loggedInUser.name || loggedInUser.email || "U")
          .charAt(0)
          .toUpperCase()}
      </div>

      <div className="sidebar-user-details">
        <span className="sidebar-user-name">
          {loggedInUser.name || "User"}
        </span>

        <span className="sidebar-user-email">
          {loggedInUser.email || ""}
        </span>
      </div>
    </div>
  )}

  <div className="sidebar-model-status">
    <div className="status-dot" />
    <span>Local AI model · Ollama</span>
    
{loggedInUser && (
  <button
    type="button"
    className="logout-button"
    onClick={handleLogout}
  >
    <span aria-hidden="true">↪</span>
    <span>Log out</span>
  </button>
)}

  </div>
</div>

      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <span className="topbar-title">
              {activePage === "chat"
                ? "Career Assistant"
                : activePage === "resume"
                ? "Resume Analyzer"
                : activePage === "interview"
                ? "Interview Preparation"
                : activePage === "dashboard"
                ? "Dashboard Analytics"
                : "Job Search Dashboard"
              }
            </span>
            {activePage === "chat" && (
              <span className="model-tag">LLAMA 3.2 · 1B</span>
            )}
          </div>

          <span className="online-status">
            <span className="status-dot" />
            Local environment
          </span>
        </header>

        <nav className="main-navigation">
          <button
            className={activePage === "chat" ? "active" : ""}
            onClick={() => setActivePage("chat")}
          >
            AI Chat
          </button>

          <button
            className={activePage === "resume" ? "active" : ""}
            onClick={() => setActivePage("resume")}
          >
            Resume Analyzer
          </button>
        </nav>

        {activePage === "chat" ? (
          <>
            <section className="chat-area">
              {messages.length === 0 ? (
                <div className="welcome">
                  <div className="welcome-icon">✦</div>

                  <p className="eyebrow">
                    YOUR NEXT CHAPTER STARTS HERE
                  </p>

                  <h1>
                    Build your career
                    <br />
                    with confidence.
                  </h1>

                  <p className="welcome-description">
                    I'm CareerPilot AI. Ask me about job applications,
                    coding interviews, resumes, or your next career move.
                  </p>

                  <div className="suggestions">
                    {suggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        className="suggestion"
                        onClick={() => sendMessage(suggestion)}
                        disabled={loading}
                      >
                        <span>✦</span>
                        {suggestion}
                        <span className="suggestion-arrow">↗</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="messages">
                  {messages.map((message, index) => (
                    <div
                      className={`message-row ${message.role}`}
                      key={index}
                    >
                      <div className="message-avatar">
                        {message.role === "user" ? "Y" : "✦"}
                      </div>

                      <div className="message-content">
                        <span className="message-author">
                          {message.role === "user"
                            ? "You"
                            : "CareerPilot AI"}
                        </span>
                        <p>{message.content}</p>
                      </div>
                    </div>
                  ))}

                  {loading && (
                    <div className="message-row assistant">
                      <div className="message-avatar">✦</div>
                      <div className="message-content">
                        <span className="message-author">
                          CareerPilot AI
                        </span>
                        <p className="typing">
                          Thinking<span>.</span>
                          <span>.</span>
                          <span>.</span>
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>

            <div className="composer-wrapper">
              <form className="composer" onSubmit={handleSubmit}>
                <textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" &&
                      !event.shiftKey
                    ) {
                      event.preventDefault();
                      handleSubmit(event);
                    }
                  }}
                  placeholder="Ask about jobs, interviews, or your career..."
                  rows={2}
                  disabled={loading}
                />

                <div className="composer-bottom">
                  <span>Powered by your local AI model</span>

                  <button
                    type="submit"
                    className="send-button"
                    disabled={!input.trim() || loading}
                    aria-label="Send message"
                  >
                    ↑
                  </button>
                </div>
              </form>

              <p className="disclaimer">
                AI can make mistakes. Verify important career information.
              </p>
            </div>
          </>
                ) : activePage === "resume" ? (
  <div className="resume-page">
    <ResumeAnalyzer />
  </div>
) : activePage === "interview" ? (
  <InterviewPrep />
  ) : activePage === "dashboard" ? (
  <Dashboard />
) : activePage === "jobs" ? (
  <JobPlanner />
) : null}

      
      </main>
    </div>
  );
}

export default App;
