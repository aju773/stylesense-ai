import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import * as authApi from "../api/auth";
import type { User } from "../api/auth";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();
  // On mount: check if user has a valid cookie
  useEffect(() => {
    authApi
      .getMe()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);
  // Per-user server state must not outlive the session that fetched it.
  // Without this, logging out and back in as someone else shows the previous
  // user's bag from cache until the refetch lands.
  const purgeUserCaches = useCallback(() => {
    queryClient.removeQueries({ queryKey: ["cart"] });
  }, [queryClient]);

  const login = useCallback(
    async (email: string, password: string) => {
      purgeUserCaches();
      const userData = await authApi.login(email, password);
      setUser(userData);
    },
    [purgeUserCaches]
  );
  const register = useCallback(
    async (email: string, password: string) => {
      purgeUserCaches();
      const userData = await authApi.register(email, password);
      setUser(userData);
    },
    [purgeUserCaches]
  );
  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
    purgeUserCaches();
  }, [purgeUserCaches]);
  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
