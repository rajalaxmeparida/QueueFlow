import { useState } from "react";
import "./App.css";
import Dashboard from "./Dashboard";
import { API_URL } from "./api";

function App() {
  const [isSignup, setIsSignup] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("error");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [loggedIn, setLoggedIn] = useState(() => {
    try {
      return Boolean(localStorage.getItem("token"));
    } catch {
      return false;
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const endpoint = isSignup ? "register" : "login";

      const body = isSignup
        ? { name: name.trim(), email: email.trim(), password }
        : { email: email.trim(), password };

      const response = await fetch(`${API_URL}/api/auth/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Something went wrong.");
      }

      if (isSignup) {
        setIsSignup(false);
        setPassword("");
        setMessageType("success");
        setMessage("Account created successfully! Please sign in.");
      } else {
        localStorage.setItem("token", data.token);
        localStorage.setItem("manager", JSON.stringify(data.manager));
        setLoggedIn(true);
      }
    } catch (error) {
      setMessageType("error");
      setMessage(
        error.message === "Failed to fetch"
          ? "Unable to connect to the server. Please try again."
          : error.message,
      );
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setIsSignup(!isSignup);
    setMessage("");
    setPassword("");
  };

  if (loggedIn) {
    return <Dashboard />;
  }

  return (
    <main className="login-page">
      <div className="login-decoration login-decoration-one"></div>
      <div className="login-decoration login-decoration-two"></div>

      <section className="login-card">
        <div className="login-brand">
          <div className="brand-icon">Q</div>
          <span>QueueFlow</span>
        </div>

        <div className="login-heading">
          <p className="eyebrow">
            {isSignup ? "CREATE ACCOUNT" : "MANAGER PORTAL"}
          </p>

          <p className="login-subtitle">
            {isSignup
              ? "Create your account to start managing queues."
              : "Sign in to manage your queues and keep everything moving."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {isSignup && (
            <div className="form-field">
              <label htmlFor="name">Full name</label>
              <input
                id="name"
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                maxLength={80}
                required
              />
            </div>
          )}

          <div className="form-field">
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="form-field">
            <div className="password-label-row">
              <label htmlFor="password">Password</label>
            </div>

            <div className="password-input-wrapper">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder={
                  isSignup
                    ? "Create a password (min. 8 characters)"
                    : "Enter your password"
                }
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={isSignup ? "new-password" : "current-password"}
                minLength={isSignup ? 8 : undefined}
                required
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {message && (
            <div
              className={
                messageType === "success" ? "login-success" : "login-error"
              }
              role="alert"
            >
              {messageType === "error" && <span className="error-icon">!</span>}
              {message}
            </div>
          )}

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? (
              <>
                <span className="button-spinner"></span>
                {isSignup ? "Creating account..." : "Signing in..."}
              </>
            ) : isSignup ? (
              "Create Account"
            ) : (
              "Login"
            )}
          </button>
        </form>

        <div className="auth-switch">
          {isSignup ? "Already have an account?" : "Don't have an account?"}

          <button type="button" onClick={switchMode}>
            {isSignup ? "Sign In" : "Sign Up"}
          </button>
        </div>

        <div className="login-footer">
          <span className="footer-line"></span>
          <p>Queue management, made simple.</p>
          <span className="footer-line"></span>
        </div>
      </section>

      <p className="copyright">
        © {new Date().getFullYear()} QueueFlow. All rights reserved.
      </p>
    </main>
  );
}

export default App;
