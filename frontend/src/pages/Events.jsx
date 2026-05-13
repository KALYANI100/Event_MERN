import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client.js";
import "./Events.css";

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setError("");
      try {
        const { data } = await api.get("/events");
        if (!cancelled) setEvents(data);
      } catch {
        if (!cancelled) setError("Could not load events.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="container">
        <p className="muted">Loading events…</p>
      </div>
    );
  }

  return (
    <div className="container events-page">
      <header className="page-header">
        <h1>Upcoming events</h1>
        <p className="muted">Choose an event and complete the short registration form.</p>
      </header>
      {error && <div className="alert alert-error">{error}</div>}
      {events.length === 0 && !error && (
        <p className="muted">No upcoming events yet. Check back soon.</p>
      )}
      <ul className="event-grid">
        {events.map((ev) => (
          <li key={ev._id}>
            <article className="card event-card">
              <h2>{ev.title}</h2>
              <p className="event-meta">{formatDate(ev.date)}</p>
              <p className="event-location muted">{ev.location}</p>
              <p className="event-desc">{ev.description?.slice(0, 140)}{ev.description?.length > 140 ? "…" : ""}</p>
              <div className="event-footer">
                <span className="muted small">
                  {ev.registrationCount ?? 0} registered
                  {ev.capacity != null ? ` · ${ev.spotsLeft} spots left` : ""}
                </span>
                <Link to={`/events/${ev._id}`} className="btn btn-primary btn-sm">
                  View & register
                </Link>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </div>
  );
}
