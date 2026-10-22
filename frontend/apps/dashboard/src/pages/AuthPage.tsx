import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { useAuth } from "../auth.tsx";

export function AuthPage({ mode }: { mode: "login" | "register" }) {
  const { login, register } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const isLogin = mode === "login";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));
    setBusy(true);
    setError(null);
    try {
      if (isLogin) await login({ email, password });
      else await register({ email, password, agencyName: String(form.get("agencyName")) });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setBusy(false);
    }
  };

  return (
    <div className="auth">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="brand">
          <span className="brand-mark" aria-hidden="true" />
          Scopewise
        </div>
        <h1>{isLogin ? "Welcome back" : "Create your agency account"}</h1>

        {!isLogin && (
          <label className="field">
            Agency name
            <input name="agencyName" required autoComplete="organization" />
          </label>
        )}
        <label className="field">
          Email
          <input name="email" type="email" required autoComplete="email" />
        </label>
        <label className="field">
          Password
          <input
            name="password"
            type="password"
            required
            minLength={isLogin ? undefined : 8}
            autoComplete={isLogin ? "current-password" : "new-password"}
          />
        </label>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <button className="btn primary block" type="submit" disabled={busy}>
          {busy ? "Please wait…" : isLogin ? "Log in" : "Create account"}
        </button>

        <p className="auth-switch">
          {isLogin ? (
            <>
              New to Scopewise? <Link to="/register">Create an account</Link>
            </>
          ) : (
            <>
              Already have an account? <Link to="/login">Log in</Link>
            </>
          )}
        </p>
      </form>
    </div>
  );
}
