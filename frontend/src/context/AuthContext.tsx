import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { api, mensajeError } from "../lib/api";
import type { UsuarioAutenticado } from "../types";

interface AuthContextValue {
  usuario: UsuarioAutenticado | null;
  cargando: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function leerUsuarioGuardado(): UsuarioAutenticado | null {
  const raw = localStorage.getItem("mif_usuario");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UsuarioAutenticado;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioAutenticado | null>(leerUsuarioGuardado);
  const [cargando, setCargando] = useState(false);

  const login = async (email: string, password: string) => {
    setCargando(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      localStorage.setItem("mif_token", data.token);
      localStorage.setItem("mif_usuario", JSON.stringify(data.usuario));
      setUsuario(data.usuario);
    } catch (err) {
      throw new Error(mensajeError(err));
    } finally {
      setCargando(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("mif_token");
    localStorage.removeItem("mif_usuario");
    setUsuario(null);
  };

  const value = useMemo(() => ({ usuario, cargando, login, logout }), [usuario, cargando]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
