import { useCallback, useEffect, useState } from "react";
import "./Dashboard.css";
import Sidebar from "./Sidebar";
import QueueDetails from "./QueueDetails";
import Analytics from "./Analytics";

const API_URL = "http://127.0.0.1:5000";

function Dashboard() {
  const [queues, setQueues] = useState([]);
  const [queueName, setQueueName] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedQueue, setSelectedQueue] = useState(null);
  const [activePage, setActivePage] = useState("dashboard");

  const token = localStorage.getItem("token");

  const manager = (() => {
    try {
      return JSON.parse(localStorage.getItem("manager") || "{}");
    } catch {
      return {};
    }
  })();

  // Fetch manager's queues
  const fetchQueues = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/queues`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch queues");
      }

      setQueues(Array.isArray(data) ? data : data.queues || []);
      setMessage("");
    } catch (error) {
      setMessage(error.message);
    }
  }, [token]);

  // Load queues when dashboard opens
  useEffect(() => {
    let isMounted = true;

    const loadQueues = async () => {
      try {
        const response = await fetch(`${API_URL}/api/queues`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch queues");
        }

        if (isMounted) {
          setQueues(Array.isArray(data) ? data : data.queues || []);
          setMessage("");
        }
      } catch (error) {
        if (isMounted) {
          setMessage(error.message);
        }
      }
    };

    loadQueues();

    return () => {
      isMounted = false;
    };
  }, [token]);

  // Create queue
  const handleCreateQueue = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/api/queues`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: queueName.trim(),
          description: description.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Queue creation failed");
      }

      setQueueName("");
      setDescription("");
      setMessage("Queue created successfully!");

      await fetchQueues();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("manager");
    window.location.reload();
  };

  // Open queue details
  const handleSelectQueue = (queue) => {
    setSelectedQueue(queue);
  };

  // Return to dashboard
  if (selectedQueue) {
    return (
      <QueueDetails
        queue={selectedQueue}
        onBack={() => setSelectedQueue(null)}
      />
    );
  }

  const activeQueues = queues.filter((queue) => queue.isActive);

  return (
    <div className="dashboard-layout">
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        onLogout={handleLogout}
        manager={manager}
      />

      <div className="dashboard-content">
        <header className="dashboard-topbar">
          <div>
            <h1>
              {activePage === "dashboard"
                ? "Dashboard"
                : activePage === "queues"
                  ? "My Queues"
                  : "Analytics"}
            </h1>
            <p>Welcome back, {manager.name || "Manager"}</p>
          </div>

          <div className="dashboard-date">Manager Portal</div>
        </header>

        <main className="dashboard-main">
          {activePage === "dashboard" && (
            <>
              <section className="dashboard-welcome">
                <div>
                  <p className="dashboard-eyebrow">OVERVIEW</p>
                  <h2>Manager Dashboard</h2>
                  <p>Manage your queues and monitor daily operations.</p>
                </div>

                <button onClick={() => setActivePage("queues")}>
                  Manage Queues →
                </button>
              </section>

              <div className="stats-grid">
                <div className="stat-card">
                  <span className="stat-icon">▤</span>
                  <h3>Total Queues</h3>
                  <p>{queues.length}</p>
                  <small>All created queues</small>
                </div>

                <div className="stat-card">
                  <span className="stat-icon">✓</span>
                  <h3>Active Queues</h3>
                  <p>{activeQueues.length}</p>
                  <small>Currently available</small>
                </div>
              </div>

              <section className="dashboard-section">
                <div className="section-heading">
                  <div>
                    <h3>Recent Queues</h3>
                    <p>Your recently created queues</p>
                  </div>

                  <button
                    className="text-button"
                    onClick={() => setActivePage("queues")}
                  >
                    View all →
                  </button>
                </div>

                {queues.length === 0 ? (
                  <p>No queues available. Create your first queue.</p>
                ) : (
                  <div className="queue-list">
                    {queues.slice(0, 3).map((queue) => (
                      <div className="queue-card" key={queue._id}>
                        <div className="queue-info">
                          <h4>{queue.name}</h4>
                          <p>{queue.description || "No description"}</p>
                        </div>

                        <span
                          className={
                            queue.isActive ? "active-status" : "inactive-status"
                          }
                        >
                          {queue.isActive ? "Active" : "Inactive"}
                        </span>

                        <button
                          className="manage-queue-button"
                          onClick={() => handleSelectQueue(queue)}
                          disabled={!queue.isActive}
                        >
                          Manage →
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}

          {activePage === "queues" && (
            <>
              <section className="dashboard-section">
                <h3>Create a New Queue</h3>

                <form onSubmit={handleCreateQueue}>
                  <input
                    type="text"
                    placeholder="Queue name"
                    value={queueName}
                    onChange={(e) => setQueueName(e.target.value)}
                    required
                  />

                  <input
                    type="text"
                    placeholder="Description (optional)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />

                  <button type="submit" disabled={loading}>
                    {loading ? "Creating..." : "Create Queue"}
                  </button>
                </form>

                {message && <p className="dashboard-message">{message}</p>}
              </section>

              <section className="dashboard-section">
                <h3>Your Queues ({queues.length})</h3>

                {queues.length === 0 ? (
                  <p>No queues found. Create your first queue above.</p>
                ) : (
                  <div className="queue-list">
                    {queues.map((queue) => (
                      <div className="queue-card" key={queue._id}>
                        <div className="queue-info">
                          <h4>{queue.name}</h4>
                          <p>{queue.description || "No description"}</p>
                        </div>

                        <span
                          className={
                            queue.isActive ? "active-status" : "inactive-status"
                          }
                        >
                          {queue.isActive ? "Active" : "Inactive"}
                        </span>

                        <button
                          className="manage-queue-button"
                          onClick={() => handleSelectQueue(queue)}
                          disabled={!queue.isActive}
                        >
                          Manage Queue →
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}

          {activePage === "analytics" && <Analytics />}
        </main>
      </div>
    </div>
  );
}

export default Dashboard;
