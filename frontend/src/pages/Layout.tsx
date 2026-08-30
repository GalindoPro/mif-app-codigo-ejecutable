import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ROL_LABEL, TIPOS_AHORRO } from "../types";

export default function Layout() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const cls = ({ isActive }: { isActive: boolean }) => (isActive ? "active" : "");

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand" style={{ padding: "0.25rem 0.25rem 0.75rem", borderBottom: "1px solid var(--line)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                background: "linear-gradient(135deg, #047857 0%, #065f46 100%)",
                color: "#ffffff",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
                fontSize: "1.1rem",
                boxShadow: "0 2px 4px rgba(4, 120, 87, 0.25)",
              }}
            >
              M
            </div>
            <div>
              <span className="name" style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--ink)", display: "block", lineHeight: 1.1 }}>
                MIF COOP
              </span>
              <span className="sub" style={{ fontSize: "0.68rem", color: "var(--accent)", fontWeight: 700 }}>
                Maya Inversiones Futuras
              </span>
            </div>
          </div>
          <div
            style={{
              marginTop: "0.65rem",
              background: "#ecfdf5",
              color: "#065f46",
              padding: "0.25rem 0.5rem",
              borderRadius: "6px",
              fontSize: "0.72rem",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
            }}
          >
            <span>🟢</span> Agencia Chajul · Activa
          </div>
        </div>

        <nav className="nav">
          {/* CAJERO: Ventanilla, Caja Chica y Consulta de Socios */}
          {usuario?.rol === "CAJERO" && (
            <>
              <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0.5rem 0 0.2rem 0.5rem" }}>
                Ventanilla y Caja
              </div>
              <NavLink to="/auxiliar-caja" className={cls}>
                💵 Auxiliar de caja
              </NavLink>
              <NavLink to="/caja-chica" className={cls}>
                📥 Caja chica
              </NavLink>
              <NavLink to="/socios" className={cls}>
                👥 Consultar Socios
              </NavLink>
            </>
          )}

          {/* PROMOTOR: Cartera de Préstamos, Socios en campo, Solicitudes y Apertura de Ahorros */}
          {usuario?.rol === "PROMOTOR" && (
            <>
              <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0.5rem 0 0.2rem 0.5rem" }}>
                Gestión de Campo
              </div>
              <NavLink to="/promotor/cartera" className={cls}>
                📂 Kardex Cartera
              </NavLink>
              <NavLink to="/socios" className={cls}>
                👥 Socios en campo
              </NavLink>
              <NavLink to="/creditos" className={cls}>
                📄 Créditos & Simulador
              </NavLink>
              <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0.75rem 0 0.2rem 0.5rem" }}>
                Ahorros
              </div>
              {TIPOS_AHORRO.map((t) => (
                <NavLink key={t.slug} to={`/ahorros/${t.slug}`} className={cls}>
                  {t.titulo}
                </NavLink>
              ))}
            </>
          )}

          {/* SUPERVISOR: Tablero con analítica de servicios, Libro de Arqueos para Comisión de Vigilancia, Aprobación de Créditos y Auditoría */}
          {usuario?.rol === "SUPERVISOR" && (
            <>
              <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0.5rem 0 0.2rem 0.5rem" }}>
                Supervisión y Control
              </div>
              <NavLink to="/tablero" className={cls}>
                📊 Tablero & Servicios
              </NavLink>
              <NavLink to="/arqueos/mensual" className={cls}>
                📑 Libro Mensual Arqueos
              </NavLink>
              <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0.75rem 0 0.2rem 0.5rem" }}>
                Cartera y Cajas
              </div>
              <NavLink to="/creditos" className={cls}>
                📄 Bandeja de Créditos
              </NavLink>
              <NavLink to="/promotor/cartera" className={cls}>
                📂 Kardex Cartera
              </NavLink>
              <NavLink to="/auxiliar-caja" className={cls}>
                💵 Historial de Cajas
              </NavLink>
              <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0.75rem 0 0.2rem 0.5rem" }}>
                Padrón y Ahorros
              </div>
              <NavLink to="/socios" className={cls}>
                👥 Socios
              </NavLink>
              <NavLink to="/aportaciones" className={cls}>
                🏛️ Aportaciones
              </NavLink>
              {TIPOS_AHORRO.map((t) => (
                <NavLink key={t.slug} to={`/ahorros/${t.slug}`} className={cls}>
                  {t.titulo}
                </NavLink>
              ))}
            </>
          )}

          {/* ADMIN y GERENCIA: Acceso total */}
          {(usuario?.rol === "ADMIN" || usuario?.rol === "GERENCIA") && (
            <>
              <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0.2rem 0 0.2rem 0.5rem" }}>
                Control General
              </div>
              <NavLink to="/tablero" className={cls}>
                📊 Tablero Global
              </NavLink>
              <NavLink to="/arqueos/mensual" className={cls}>
                📑 Libro Mensual Arqueos
              </NavLink>
              <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0.6rem 0 0.2rem 0.5rem" }}>
                Operaciones
              </div>
              <NavLink to="/auxiliar-caja" className={cls}>
                💵 Auxiliar de caja
              </NavLink>
              <NavLink to="/caja-chica" className={cls}>
                📥 Caja chica
              </NavLink>
              <NavLink to="/creditos" className={cls}>
                📄 Créditos
              </NavLink>
              <NavLink to="/promotor/cartera" className={cls}>
                📂 Kardex Cartera
              </NavLink>
              <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0.6rem 0 0.2rem 0.5rem" }}>
                Socios y Ahorro
              </div>
              <NavLink to="/socios" className={cls}>
                👥 Socios
              </NavLink>
              <NavLink to="/aportaciones" className={cls}>
                🏛️ Aportaciones
              </NavLink>
              {TIPOS_AHORRO.map((t) => (
                <NavLink key={t.slug} to={`/ahorros/${t.slug}`} className={cls}>
                  {t.titulo}
                </NavLink>
              ))}
              <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0.6rem 0 0.2rem 0.5rem" }}>
                Administración
              </div>
              <NavLink to="/usuarios" className={cls}>
                👤 Usuarios
              </NavLink>
              <NavLink to="/agencias" className={cls}>
                🏢 Agencias
              </NavLink>
            </>
          )}
        </nav>

        <div className="sidebar-footer" style={{ padding: "0.75rem 0.5rem", background: "var(--mono-bg)", borderRadius: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div
              style={{
                width: "30px",
                height: "30px",
                borderRadius: "50%",
                background: "var(--accent)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: "0.85rem",
              }}
            >
              {usuario?.nombre?.charAt(0) || "U"}
            </div>
            <div style={{ overflow: "hidden" }}>
              <div className="who" style={{ fontSize: "0.85rem", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
                {usuario?.nombre}
              </div>
              <div className="role" style={{ fontSize: "0.72rem", color: "var(--ink-soft)" }}>
                {usuario ? ROL_LABEL[usuario.rol] : ""}
              </div>
            </div>
          </div>
          <button
            className="link-btn"
            style={{ color: "#b91c1c", marginTop: "0.5rem", display: "inline-block", fontSize: "0.78rem" }}
            onClick={() => {
              logout();
              navigate("/login", { replace: true });
            }}
          >
            🚪 Cerrar sesión
          </button>
        </div>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
