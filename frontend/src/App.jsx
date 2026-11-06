import { useState } from "react";
import "./App.css";
import Dashboard from "./Dashboard";

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [loggedIn, setLoggedIn] = useState(() => {
    try {
      return Boolean(localStorage.getItem("token"));
    } catch {
      return false;
    }
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("http://127.0.0.1:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to sign in. Please try again.");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("manager", JSON.stringify(data.manager));

      setLoggedIn(true);
    } catch (error) {
      setMessage(
        error.message === "Failed to fetch"
          ? "Unable to connect to the server. Please check that the backend is running."
          : error.message,
      );
    } finally {
      setLoading(false);
    }
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
          <p className="eyebrow">MANAGER PORTAL</p>
          <p className="login-subtitle">
            Sign in to manage your queues and keep everything moving.
          </p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-field">
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
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
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
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
            <div className="login-error" role="alert">
              <span className="error-icon">!</span>
              {message}
            </div>
          )}

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? (
              <>
                <span className="button-spinner"></span>
                Signing in...
              </>
            ) : (
              "Sign in to your account"
            )}
          </button>
        </form>

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
