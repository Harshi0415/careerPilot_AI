import { useState } from "react";
import "./AuthPage.css";

export default function AuthPage({
  mode,
  onModeChange,
  onBackToHome,
  onLoginSuccess,
}) {
  const isSignup = mode === "signup";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("error");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setMessage("");
    setMessageType("error");

    if (isSubmitting) return;

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      setMessage("Please enter your email and password.");
      return;
    }

    if (isSignup && !name.trim()) {
      setMessage("Please enter your full name.");
      return;
    }

    if (isSignup && password !== confirmPassword) {
      setMessage("Your passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setMessage("Your password must contain at least 8 characters.");
      return;
    }

    setIsSubmitting(true);

    try {
      const endpoint = isSignup
        ? "/api/auth/signup"
        : "/api/auth/login";

      const payload = isSignup
         ? { name: name.trim(), email: cleanEmail, password }
  : { email: cleanEmail, password };

      const response = await fetch(
        `https://careerpilot-ai-1-qq4i.onrender.com${endpoint}`,
        {
          method: "POST",
           credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to complete your request."
        );
      }

      if (isSignup) {
        setMessageType("success");
        setMessage(
          "Account created successfully! Please sign in."
        );

        setPassword("");
        setConfirmPassword("");

        // Move to login after displaying the signup result.
        setTimeout(() => {
          setMessage("");
          onModeChange("login");
        }, 1200);
      } else {
        
setMessageType("success");
setMessage("Login successful! Opening your workspace...");

const user = data.user;

if (!user) {
  throw new Error("Login succeeded, but user details were not returned.");
}

if (typeof onLoginSuccess === "function") {
  onLoginSuccess({
    id: user.id,
    name: user.name,
    email: user.email || cleanEmail,
  });
}

      }
    } catch (error) {
      setMessageType("error");

      if (
        error instanceof TypeError &&
        error.message.toLowerCase().includes("fetch")
      ) {
        setMessage(
          "Unable to connect to the server. Please try again."
        );
      } else {
        setMessage(
          error.message || "Something went wrong. Please try again."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function switchMode(nextMode) {
    setMessage("");
    setMessageType("error");
    onModeChange(nextMode);
  }

  return (
    <main className="auth-page">
      
<div className="auth-visual-panel">
  <div className="auth-visual-content">
    <div className="auth-brand">
      <span className="auth-brand-mark">C</span>
      <span>CareerPilot AI</span>
    </div>

    <div className="auth-visual-badge">
      YOUR CAREER, YOUR NEXT CHAPTER
    </div>

    <h1>Build your future with confidence.</h1>

    <p>
      Your personal AI career assistant for stronger resumes,
      interview preparation, and a more organized job search.
    </p>
  </div>
</div>

      <section className="auth-form-panel">
        <button
          className="auth-home-link"
          type="button"
          onClick={onBackToHome}
        >
          ← Back to home
        </button>

        <div className="auth-form-container">
          <div className="auth-mobile-brand">
            <span className="auth-brand-mark">✦</span>
            <span>
              CareerPilot<span> AI</span>
            </span>
          </div>

          <div className="auth-form-heading">
            <span className="auth-eyebrow">
              {isSignup ? "GET STARTED" : "WELCOME BACK"}
            </span>

            <h2>
              {isSignup ? "Create your account" : "Welcome back"}
            </h2>

            <p>
              {isSignup
                ? "Create your workspace and take the next step in your career."
                : "Sign in to continue your career journey."}
            </p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {isSignup && (
              <label className="auth-field">
                <span>Full name</span>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  autoComplete="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  maxLength={100}
                  required
                />
              </label>
            )}

            <label className="auth-field">
              <span>Email address</span>
              <input
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                maxLength={255}
                required
              />
            </label>

            <label className="auth-field">
              <span>Password</span>
              <div className="auth-password-wrap">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 8 characters"
                  autoComplete={
                    isSignup ? "new-password" : "current-password"
                  }
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  minLength={8}
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword((previous) => !previous)
                  }
                  aria-label={
                    showPassword ? "Hide password" : "Show password"
                  }
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </label>

            {isSignup && (
              <label className="auth-field">
                <span>Confirm password</span>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password again"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(event.target.value)
                  }
                  minLength={8}
                  required
                />
              </label>
            )}

            {!isSignup && (
              <div className="auth-form-options">
                <label className="auth-remember">
                  <input type="checkbox" />
                  <span>Remember me</span>
                </label>
                <span className="auth-forgot-note">
                  Forgot password?
                </span>
              </div>
            )}

            {message && (
              <div
                className={`auth-message ${
                  messageType === "success"
                    ? "auth-message-success"
                    : "auth-message-error"
                }`}
                role={messageType === "error" ? "alert" : "status"}
              >
                {message}
              </div>
            )}

            <button
              className="auth-submit"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Please wait..."
                : isSignup
                ? "Create account"
                : "Sign in"}
              <span aria-hidden="true">→</span>
            </button>
          </form>

          <div className="auth-switch">
            {isSignup
              ? "Already have an account?"
              : "New to CareerPilot AI?"}{" "}
            <button
              type="button"
              onClick={() =>
                switchMode(isSignup ? "login" : "signup")
              }
            >
              {isSignup ? "Sign in" : "Create an account"}
            </button>
          </div>

          <button
            type="button"
            className="auth-demo-link"
            onClick={() => onModeChange("app")}
          >
            Preview workspace without signing in →
          </button>

          <p className="auth-legal">
            By continuing, you agree to use CareerPilot AI responsibly.
          </p>
        </div>

        <div className="auth-bottom-note">
          Your career journey deserves a better starting point.
        </div>
      </section>
    </main>
  );
}
