import { Link } from "react-router-dom";
import "./Landing.css";

export default function Landing() {
  return (
    <div className="landing">
      <section className="hero container">
        <p className="hero-tag">Simple event registration</p>
        <h1>
          Find events.
          <br />
          <span className="gradient-text">Join in seconds.</span>
        </h1>
        <p className="hero-lead">
          Browse upcoming gatherings, secure your spot with a short form, and keep track of everything
          in one place. Organizers can publish events from the admin dashboard.
        </p>
        <div className="hero-actions">
          <Link to="/events" className="btn btn-primary">
            Browse events
          </Link>
          <Link to="/register" className="btn btn-ghost">
            Create an account
          </Link>
        </div>
        <div className="hero-stats">
          <div>
            <strong>Fast</strong>
            <span className="muted">Register in under a minute</span>
          </div>
          <div>
            <strong>Clear</strong>
            <span className="muted">See capacity and details upfront</span>
          </div>
          <div>
            <strong>For teams</strong>
            <span className="muted">Admin tools for organizers</span>
          </div>
        </div>
      </section>
    </div>
  );
}
