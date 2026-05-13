import { useCallback, useEffect, useState } from "react";
import api from "../api/client.js";
import "./Admin.css";

function formatDate(iso) {
  return new Date(iso).toLocaleString();
}

const emptyForm = {
  title: "",
  description: "",
  date: "",
  location: "",
  capacity: "",
};

export default function Admin() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [regsLoading, setRegsLoading] = useState(false);

  const loadEvents = useCallback(async () => {
    setListError("");
    try {
      const { data } = await api.get("/events/admin/all");
      setEvents(data);
    } catch {
      setListError("Could not load events.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    if (!selectedId) {
      setRegistrations([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setRegsLoading(true);
      try {
        const { data } = await api.get(`/registrations/event/${selectedId}`);
        if (!cancelled) setRegistrations(data);
      } catch {
        if (!cancelled) setRegistrations([]);
      } finally {
        if (!cancelled) setRegsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  function updateField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleCreate(e) {
    e.preventDefault();
    setCreateError("");
    setCreateSuccess(false);
    setCreating(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        date: new Date(form.date).toISOString(),
        location: form.location.trim(),
      };
      if (form.capacity !== "" && form.capacity != null) {
        const n = Number(form.capacity);
        if (Number.isFinite(n) && n > 0) payload.capacity = n;
      }
      await api.post("/events", payload);
      setForm(emptyForm);
      setCreateSuccess(true);
      await loadEvents();
    } catch (err) {
      setCreateError(err.response?.data?.message || "Could not create event.");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this event and all its registrations?")) return;
    try {
      await api.delete(`/events/${id}`);
      if (selectedId === id) setSelectedId(null);
      await loadEvents();
    } catch {
      alert("Could not delete event.");
    }
  }

  return (
    <div className="container admin-page">
      <h1>Admin · Events</h1>
      <p className="muted admin-intro">Create events and review attendee registrations.</p>

      <div className="admin-layout">
        <section className="card admin-form-section">
          <h2>New event</h2>
          {createSuccess && <div className="alert alert-success">Event created.</div>}
          {createError && <div className="alert alert-error">{createError}</div>}
          <form onSubmit={handleCreate}>
            <div className="field">
              <label htmlFor="title">Title</label>
              <input
                id="title"
                value={form.title}
                onChange={(e) => updateField("title", e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                rows={4}
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
              />
            </div>
            <div className="field-row">
              <div className="field">
                <label htmlFor="date">Date & time</label>
                <input
                  id="date"
                  type="datetime-local"
                  value={form.date}
                  onChange={(e) => updateField("date", e.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="capacity">Capacity (optional)</label>
                <input
                  id="capacity"
                  type="number"
                  min={1}
                  placeholder="Unlimited"
                  value={form.capacity}
                  onChange={(e) => updateField("capacity", e.target.value)}
                />
              </div>
            </div>
            <div className="field">
              <label htmlFor="location">Location</label>
              <input
                id="location"
                value={form.location}
                onChange={(e) => updateField("location", e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={creating}>
              {creating ? "Creating…" : "Create event"}
            </button>
          </form>
        </section>

        <section className="admin-list-section">
          <h2>All events</h2>
          {loading && <p className="muted">Loading…</p>}
          {listError && <div className="alert alert-error">{listError}</div>}
          {!loading && events.length === 0 && <p className="muted">No events yet.</p>}
          <ul className="admin-event-list">
            {events.map((ev) => (
              <li key={ev._id}>
                <button
                  type="button"
                  className={`admin-event-row ${selectedId === ev._id ? "selected" : ""}`}
                  onClick={() => setSelectedId(ev._id)}
                >
                  <strong>{ev.title}</strong>
                  <span className="muted small">{formatDate(ev.date)}</span>
                  <span className="muted small">
                    {ev.registrationCount ?? 0} registered
                    {ev.capacity != null ? ` / cap ${ev.capacity}` : ""}
                  </span>
                </button>
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(ev._id);
                  }}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {selectedId && (
        <section className="card regs-section">
          <h2>Registrations</h2>
          {regsLoading && <p className="muted">Loading…</p>}
          {!regsLoading && registrations.length === 0 && (
            <p className="muted">No registrations for this event yet.</p>
          )}
          <div className="regs-table-wrap">
            <table className="regs-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>User</th>
                  <th>Registered</th>
                </tr>
              </thead>
              <tbody>
                {registrations.map((r) => (
                  <tr key={r._id}>
                    <td>{r.fullName}</td>
                    <td>{r.email}</td>
                    <td>{r.phone}</td>
                    <td>{r.user?.name || "—"}</td>
                    <td className="muted small">{formatDate(r.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
