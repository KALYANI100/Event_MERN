import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import "./Layout.css";

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();

  return (
    <div className="layout">
      <header className="header">
        <div className="container header-inner">
          <Link to="/" className="logo">
            EventHub
          </Link>
          <nav className="nav">
            <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>
              Home
            </NavLink>
            <NavLink to="/events" className={({ isActive }) => (isActive ? "active" : "")}>
              Events
            </NavLink>
            {user && (
              <NavLink to="/my-registrations" className={({ isActive }) => (isActive ? "active" : "")}>
                My registrations
              </NavLink>
            )}
            {isAdmin && (
              <NavLink to="/admin" className={({ isActive }) => (isActive ? "active" : "")}>
                Admin
              </NavLink>
            )}
          </nav>
          <div className="header-actions">
            {user ? (
              <>
                <span className="user-pill">{user.name}</span>
                <button type="button" className="btn btn-ghost btn-sm" onClick={logout}>
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost btn-sm">
                  Log in
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm">
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="main">
        <Outlet />
      </main>
      <footer className="footer">
        <div className="container muted">EventHub — discover and join events near you.</div>
      </footer>
    </div>
  );
}
