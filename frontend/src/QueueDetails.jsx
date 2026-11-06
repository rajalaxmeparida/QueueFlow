import { useCallback, useEffect, useState } from "react";
import "./QueueDetails.css";

const API_URL = "http://127.0.0.1:5000";

function QueueDetails({ queue, onBack }) {
  const [tokens, setTokens] = useState([]);
  const [personName, setPersonName] = useState("");
  const [servingToken, setServingToken] = useState(null);

  const [message, setMessage] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");

  // Fetch waiting tokens
  const fetchTokens = useCallback(async () => {
    const response = await fetch(`${API_URL}/api/tokens/queue/${queue._id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch waiting tokens");
    }

    setTokens(data.tokens || []);
  }, [queue._id, token]);

  // Fetch currently serving token
  const fetchServingToken = useCallback(async () => {
    const response = await fetch(
      `${API_URL}/api/tokens/queue/${queue._id}/serving`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch serving token");
    }

    setServingToken(data.token || null);
  }, [queue._id, token]);

  // Refresh waiting and serving tokens
  const refreshQueue = useCallback(async () => {
    try {
      await Promise.all([fetchTokens(), fetchServingToken()]);
    } catch (error) {
      setActionMessage(error.message);
    }
  }, [fetchTokens, fetchServingToken]);

  // Load queue data when the selected queue changes
  useEffect(() => {
    let isMounted = true;

    const loadQueueData = async () => {
      try {
        const [tokensResponse, servingResponse] = await Promise.all([
          fetch(`${API_URL}/api/tokens/queue/${queue._id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),

          fetch(`${API_URL}/api/tokens/queue/${queue._id}/serving`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

        const tokensData = await tokensResponse.json();
        const servingData = await servingResponse.json();

        if (!tokensResponse.ok) {
          throw new Error(
            tokensData.message || "Failed to fetch waiting tokens",
          );
        }

        if (!servingResponse.ok) {
          throw new Error(
            servingData.message || "Failed to fetch serving token",
          );
        }

        if (isMounted) {
          setTokens(tokensData.tokens || []);
          setServingToken(servingData.token || null);
          setActionMessage("");
        }
      } catch (error) {
        if (isMounted) {
          setActionMessage(error.message);
        }
      }
    };

    loadQueueData();

    return () => {
      isMounted = false;
    };
  }, [queue._id, token]);

  // Generate a new token
  const handleAddToken = async (e) => {
    e.preventDefault();

    if (!personName.trim()) {
      setMessage("Please enter a person's name.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/api/tokens`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          personName: personName.trim(),
          queueId: queue._id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to generate token");
      }

      setPersonName("");
      setMessage(`Token #${data.token.tokenNumber} generated successfully!`);

      await refreshQueue();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Move, cancel, call next or mark as served
  const handleTokenAction = async (url, method = "PATCH", body = null) => {
    setLoading(true);
    setActionMessage("");

    try {
      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          ...(body ? { "Content-Type": "application/json" } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Operation failed");
      }

      setActionMessage(data.message || "Operation completed successfully.");
    } catch (error) {
      setActionMessage(error.message);
    } finally {
      await refreshQueue();
      setLoading(false);
    }
  };

  return (
    <div className="queue-details">
      <header className="queue-details-header">
        <button onClick={onBack}>← Back to Dashboard</button>

        <h1>{queue.name}</h1>
      </header>

      <main className="queue-details-main">
        {/* Generate New Token */}
        <section className="queue-panel">
          <h2>Generate New Token</h2>

          <form onSubmit={handleAddToken}>
            <input
              type="text"
              placeholder="Enter person's name"
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
              required
            />

            <button type="submit" disabled={loading}>
              {loading ? "Processing..." : "Generate Token"}
            </button>
          </form>

          {message && <p className="queue-message">{message}</p>}
        </section>

        {/* Currently Serving */}
        <section className="queue-panel serving-panel">
          <h2>Currently Serving</h2>

          {servingToken ? (
            <>
              <h3>Token #{servingToken.tokenNumber}</h3>

              <p>{servingToken.personName}</p>

              <button
                disabled={loading}
                onClick={() =>
                  handleTokenAction(
                    `${API_URL}/api/tokens/${servingToken._id}/serve`,
                  )
                }
              >
                Mark as Served
              </button>
            </>
          ) : (
            <p>No token is currently being served.</p>
          )}

          <button
            disabled={loading || Boolean(servingToken)}
            onClick={() =>
              handleTokenAction(
                `${API_URL}/api/tokens/queue/${queue._id}/call-next`,
              )
            }
          >
            {loading ? "Processing..." : "Call Next Token"}
          </button>

          {actionMessage && <p className="queue-message">{actionMessage}</p>}
        </section>

        {/* Waiting Tokens */}
        <section className="queue-panel">
          <h2>Waiting Tokens ({tokens.length})</h2>

          {tokens.length === 0 ? (
            <p>No people are currently waiting.</p>
          ) : (
            <div className="token-list">
              {tokens.map((item, index) => (
                <div className="token-card" key={item._id}>
                  <div>
                    <h3>Token #{item.tokenNumber}</h3>

                    <p>{item.personName}</p>

                    <small>Position: {index + 1}</small>
                  </div>

                  <div className="token-actions">
                    <button
                      disabled={loading || index === 0}
                      onClick={() =>
                        handleTokenAction(
                          `${API_URL}/api/tokens/${item._id}/move`,
                          "PATCH",
                          { direction: "up" },
                        )
                      }
                    >
                      ↑
                    </button>

                    <button
                      disabled={loading || index === tokens.length - 1}
                      onClick={() =>
                        handleTokenAction(
                          `${API_URL}/api/tokens/${item._id}/move`,
                          "PATCH",
                          { direction: "down" },
                        )
                      }
                    >
                      ↓
                    </button>

                    <button
                      disabled={loading}
                      onClick={() =>
                        handleTokenAction(
                          `${API_URL}/api/tokens/${item._id}/cancel`,
                        )
                      }
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default QueueDetails;
