import { NavLink, Outlet } from "react-router";
import { useAuth } from "../auth.tsx";

export function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true" />
          Scopewise
        </div>
        <nav className="nav">
          <NavLink to="/" end>
            Surveys
          </NavLink>
        </nav>
        <div className="account">
          <div className="account-name">{user?.agencyName}</div>
          <div className="account-email">{user?.email}</div>
          <button className="btn ghost small" type="button" onClick={() => void logout()}>
            Log out
          </button>
        </div>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
