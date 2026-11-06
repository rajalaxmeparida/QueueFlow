import { useEffect, useState } from "react";
import { API_URL } from "./api";
import "./Analytics.css";

function Analytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    const controller = new AbortController();

    fetch(`${API_URL}/api/analytics/overview`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load analytics");
        }

        return data;
      })
      .then((data) => {
        setAnalytics(data);
        setError("");
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          setError(err.message);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [token]);

  if (loading) {
    return <div className="analytics-state">Loading analytics...</div>;
  }

  if (error) {
    return (
      <div className="analytics-state analytics-error">
        <h3>Unable to load analytics</h3>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  if (!analytics) return null;

  const summary = analytics.summary || {};
  const trends = analytics.dailyTrends || [];

  const statCards = [
    { label: "Total Queues", value: summary.totalQueues ?? 0, icon: "▤" },
    { label: "Active Queues", value: summary.activeQueues ?? 0, icon: "✓" },
    { label: "Total Tokens", value: summary.totalTokens ?? 0, icon: "▣" },
    { label: "Waiting", value: summary.waiting ?? 0, icon: "◷" },
    { label: "Currently Serving", value: summary.serving ?? 0, icon: "↗" },
    { label: "Served", value: summary.served ?? 0, icon: "✓" },
    { label: "Cancelled", value: summary.cancelled ?? 0, icon: "×" },
  ];

  const maxWaiting = Math.max(
    ...trends.map((item) => item.waitingTokens || 0),
    1,
  );

  return (
    <div className="analytics-page">
      <div className="analytics-heading">
        <div>
          <p className="dashboard-eyebrow">PERFORMANCE OVERVIEW</p>
          <h2>Queue Analytics</h2>
          <p>Monitor your queue operations and performance.</p>
        </div>
      </div>

      <section className="analytics-stats">
        {statCards.map((card) => (
          <div className="analytics-stat-card" key={card.label}>
            <div className="analytics-stat-top">
              <span>{card.label}</span>
              <span className="analytics-stat-icon">{card.icon}</span>
            </div>
            <strong>{card.value}</strong>
          </div>
        ))}
      </section>

      <section className="analytics-time-grid">
        <div className="analytics-time-card">
          <span>Average Waiting Time</span>
          <strong>
            {analytics.averageWaitingTimeMinutes ?? 0}
            <small> min</small>
          </strong>
          <p>Time from token creation to being called</p>
        </div>

        <div className="analytics-time-card">
          <span>Average Service Time</span>
          <strong>
            {analytics.averageServiceTimeMinutes ?? 0}
            <small> min</small>
          </strong>
          <p>Time taken to serve a customer</p>
        </div>
      </section>

      <section className="analytics-chart-card">
        <div className="analytics-chart-heading">
          <div>
            <h3>Queue Length Trends</h3>
            <p>Daily waiting tokens over the last 7 days</p>
          </div>
          <span className="chart-legend">
            <span></span> Waiting tokens
          </span>
        </div>

        {trends.length === 0 ? (
          <p className="analytics-empty">No trend data available yet.</p>
        ) : (
          <div className="trend-chart">
            {trends.map((item) => {
              const value = item.waitingTokens || 0;
              const height = (value / maxWaiting) * 100;

              return (
                <div className="trend-column" key={item.date}>
                  <strong>{value}</strong>
                  <div className="trend-bar-area">
                    <div
                      className="trend-bar"
                      style={{
                        height: `${Math.max(height, 3)}%`,
                      }}
                      title={`${value} waiting tokens`}
                    ></div>
                  </div>
                  <span>
                    {new Date(`${item.date}T00:00:00`).toLocaleDateString(
                      "en-IN",
                      { day: "2-digit", month: "short" },
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default Analytics;
