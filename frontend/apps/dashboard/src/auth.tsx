import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { LoginRequest, RegisterRequest, User } from "@scopewise/shared/dashboard";
import { api } from "./api.ts";

interface AuthState {
  /** undefined while the session is being checked. */
  user: User | null | undefined;
  login(body: LoginRequest): Promise<void>;
  register(body: RegisterRequest): Promise<void>;
  logout(): Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    api.me().then(setUser, () => setUser(null));
  }, []);

  const value: AuthState = {
    user,
    login: async (body) => setUser(await api.login(body)),
    register: async (body) => setUser(await api.register(body)),
    logout: async () => {
      await api.logout();
      setUser(null);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
