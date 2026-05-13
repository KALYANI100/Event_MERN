import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client.js";
import "./MyRegistrations.css";

function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString();
}

export default function MyRegistrations() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get("/registrations/mine");
        if (!cancelled) setList(data);
      } catch {
        if (!cancelled) setError("Could not load registrations.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleUnregister(registrationId) {
    setError("");
    setRemovingId(registrationId);
    try {
      await api.delete(`/registrations/${registrationId}`);
      setList((prev) => prev.filter((item) => item._id !== registrationId));
    } catch {
      setError("Could not cancel registration.");
    } finally {
      setRemovingId(null);
    }
  }

  if (loading) {
    return (
      <div className="container">
        <p className="muted">Loading…</p>
      </div>
    );
  }

  return (
    <div className="container my-regs">
      <h1>My registrations</h1>
      {error && <div className="alert alert-error">{error}</div>}
      {list.length === 0 && !error && <p className="muted">You have not registered for any events yet.</p>}
      <ul className="reg-list">
        {list.map((r) => (
          <li key={r._id} className="card reg-item">
            <div>
              <h2>{r.event?.title || "Event"}</h2>
              <p className="muted small">{r.event?.location}</p>
              <p className="muted small">
                {r.fullName} · {r.email} · {r.phone}
              </p>
              {r.notes && <p className="notes">{r.notes}</p>}
            </div>
            <div className="reg-aside">
              <span className="muted small">{formatDate(r.createdAt)}</span>
              <div className="reg-actions">
                {r.event?._id && (
                  <Link to={`/events/${r.event._id}`} className="btn btn-ghost btn-sm">
                    Event page
                  </Link>
                )}
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => handleUnregister(r._id)}
                  disabled={removingId === r._id}
                >
                  {removingId === r._id ? "Cancelling…" : "Unregister"}
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
