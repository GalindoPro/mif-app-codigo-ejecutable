import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:4000/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("mif_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("mif_token");
      localStorage.removeItem("mif_usuario");
      if (!location.pathname.startsWith("/login")) {
        location.href = "/login";
      }
    }
    return Promise.reject(err);
  },
);

export function mensajeError(err: unknown): string {
  if (axios.isCancel(err) || (err as { code?: string })?.code === "ERR_CANCELED") {
    return "";
  }
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { error?: string; detalles?: { mensaje: string }[] } | undefined;
    if (data?.detalles?.length) return data.detalles.map((d) => d.mensaje).join(" · ");
    if (err.message === "Network Error" || err.code === "ERR_NETWORK") {
      return "No se pudo conectar con el servidor (Error de Red). Verifica que el servicio esté activo.";
    }
    if (err.message && err.message !== "canceled") return err.message;
  }
  return "Ocurrió un error inesperado. Intenta de nuevo.";
}
