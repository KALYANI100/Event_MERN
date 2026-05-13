import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import "./EventDetail.css";

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [event, setEvent] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadError("");
      try {
        const { data } = await api.get(`/events/${id}`);
        if (!cancelled) setEvent(data);
      } catch {
        if (!cancelled) setLoadError("Event not found.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (user) {
      setFullName((n) => n || user.name);
      setEmail((e) => e || user.email);
    }
  }, [user]);

  async function handleRegister(e) {
    e.preventDefault();
    if (!user) {
      navigate("/login", { state: { from: { pathname: `/events/${id}` } } });
      return;
    }
    setFormError("");
    setSuccess(false);
    setSubmitting(true);
    try {
      await api.post("/registrations", {
        eventId: id,
        fullName,
        email,
        phone,
        notes,
      });
      setSuccess(true);
    } catch (err) {
      setFormError(err.response?.data?.message || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (loadError) {
    return (
      <div className="container">
        <p className="alert alert-error">{loadError}</p>
        <Link to="/events">Back to events</Link>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container">
        <p className="muted">Loading…</p>
      </div>
    );
  }

  const full =
    event.capacity != null && event.spotsLeft != null && event.spotsLeft <= 0;

  return (
    <div className="container event-detail">
      <Link to="/events" className="back-link muted">
        ← All events
      </Link>
      <article className="detail-hero card">
        <h1>{event.title}</h1>
        <p className="detail-date">{formatDate(event.date)}</p>
        <p className="detail-location">{event.location}</p>
        {event.description && <div className="detail-body">{event.description}</div>}
        <p className="muted small">
          {event.registrationCount ?? 0} registered
          {event.capacity != null ? ` · ${event.spotsLeft} spots left` : ""}
        </p>
      </article>

      <section className="card register-panel">
        <h2>Register for this event</h2>
        {!user && !authLoading && (
          <p className="muted">
            <Link to="/login" state={{ from: { pathname: `/events/${id}` } }}>
              Log in
            </Link>{" "}
            or{" "}
            <Link to="/register" state={{ from: { pathname: `/events/${id}` } }}>
              sign up
            </Link>{" "}
            to submit your details.
          </p>
        )}
        {success && <div className="alert alert-success">You are registered for this event.</div>}
        {formError && <div className="alert alert-error">{formError}</div>}
        {full && <div className="alert alert-error">This event is at full capacity.</div>}
        <form onSubmit={handleRegister}>
          <div className="field">
            <label htmlFor="fullName">Full name</label>
            <input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              disabled={!user || full}
            />
          </div>
          <div className="field">
            <label htmlFor="reg-email">Email</label>
            <input
              id="reg-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={!user || full}
            />
          </div>
          <div className="field">
            <label htmlFor="phone">Phone</label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              disabled={!user || full}
            />
          </div>
          <div className="field">
            <label htmlFor="notes">Notes (optional)</label>
            <textarea
              id="notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={!user || full}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={!user || submitting || full}>
            {user ? (submitting ? "Submitting…" : "Confirm registration") : "Log in to register"}
          </button>
        </form>
      </section>
    </div>
  );
}
