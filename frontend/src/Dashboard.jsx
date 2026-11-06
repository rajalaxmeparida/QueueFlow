import { useCallback, useEffect, useState } from "react";
import "./Dashboard.css";
import Sidebar from "./Sidebar";
import QueueDetails from "./QueueDetails";
import Analytics from "./Analytics";
import { API_URL } from "./api";

function Dashboard() {
  const [queues, setQueues] = useState([]);
  const [queueName, setQueueName] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedQueue, setSelectedQueue] = useState(null);
  const [activePage, setActivePage] = useState("dashboard");

  const [editingQueue, setEditingQueue] = useState(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editLoading, setEditLoading] = useState(false);

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

      await fetchQueues();
      setMessage("Queue created successfully!");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Open edit form
  const handleOpenEdit = (queue) => {
    setEditingQueue(queue);
    setEditName(queue.name);
    setEditDescription(queue.description || "");
    setMessage("");
  };

  // Close edit form
  const handleCloseEdit = () => {
    if (editLoading) return;

    setEditingQueue(null);
    setEditName("");
    setEditDescription("");
  };

  // Update queue
  const handleUpdateQueue = async (e) => {
    e.preventDefault();

    if (!editName.trim()) {
      setMessage("Queue name is required.");
      return;
    }

    setEditLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/api/queues/${editingQueue._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: editName.trim(),
            description: editDescription.trim(),
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update queue");
      }

      await fetchQueues();

      setEditingQueue(null);
      setEditName("");
      setEditDescription("");
      setMessage("Queue updated successfully!");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setEditLoading(false);
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
                          type="button"
                          className="edit-queue-button"
                          onClick={() => handleOpenEdit(queue)}
                          title="Edit queue"
                          aria-label={`Edit ${queue.name}`}
                        >
                          ✎
                        </button>

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

      {/* Edit Queue Modal */}
      {editingQueue && (
        <div
          onClick={handleCloseEdit}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "450px",
              background: "#ffffff",
              borderRadius: "16px",
              padding: "30px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
            }}
          >
            <h2 style={{ margin: "0 0 8px", color: "#17233c" }}>Edit Queue</h2>

            <p style={{ margin: "0 0 24px", color: "#788399" }}>
              Update your queue name and description.
            </p>

            <form
              onSubmit={handleUpdateQueue}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              <label
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  color: "#34415a",
                  fontWeight: 600,
                }}
              >
                Queue Name
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Enter queue name"
                  maxLength={100}
                  required
                  autoFocus
                  style={{
                    width: "100%",
                    padding: "13px",
                    border: "1px solid #dfe5ef",
                    borderRadius: "8px",
                    fontSize: "15px",
                    boxSizing: "border-box",
                  }}
                />
              </label>

              <label
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  color: "#34415a",
                  fontWeight: 600,
                }}
              >
                Description
                <input
                  type="text"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Enter queue description"
                  style={{
                    width: "100%",
                    padding: "13px",
                    border: "1px solid #dfe5ef",
                    borderRadius: "8px",
                    fontSize: "15px",
                    boxSizing: "border-box",
                  }}
                />
              </label>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                  marginTop: "8px",
                }}
              >
                <button
                  type="button"
                  onClick={handleCloseEdit}
                  disabled={editLoading}
                  style={{
                    padding: "11px 18px",
                    border: "1px solid #dfe5ef",
                    borderRadius: "8px",
                    background: "#ffffff",
                    color: "#34415a",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={editLoading || !editName.trim()}
                  style={{
                    padding: "11px 20px",
                    border: "none",
                    borderRadius: "8px",
                    background: "#315fce",
                    color: "#ffffff",
                    fontWeight: 600,
                    cursor: editLoading ? "not-allowed" : "pointer",
                    opacity: editLoading ? 0.7 : 1,
                  }}
                >
                  {editLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
