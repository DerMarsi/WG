"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export type Role = "admin" | "member";

export interface User {
  id: string;
  name: string;
  role: Role;
}

export const USERS: User[] = [
  { id: "1", name: "Ebubekir Abi", role: "admin" },
  { id: "2", name: "Yusuf Abi", role: "admin" },
  { id: "3", name: "Emre Abi", role: "member" },
  { id: "4", name: "Adil Abi", role: "member" },
  { id: "5", name: "Erkam Abi", role: "member" },
];

interface AuthContextType {
  user: User | null;
  login: (id: string, pin: string) => boolean;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const storedUserId = localStorage.getItem("wg_user_id");
    if (storedUserId) {
      const foundUser = USERS.find((u) => u.id === storedUserId);
      if (foundUser) {
        setUser(foundUser);
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isLoading && !user && pathname !== '/login') {
      router.push('/login');
    }
  }, [user, isLoading, pathname, router]);

  const login = (id: string, pin: string) => {
    // For MVP, simple mock PIN check (e.g. 1234 for everyone for now)
    if (pin !== "1234") return false;

    const foundUser = USERS.find((u) => u.id === id);
    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem("wg_user_id", id);
      router.push('/');
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("wg_user_id");
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {isLoading ? null : children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
