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
        <div className="brand">
          <span className="name">MIF</span>
          <span className="sub">Sistema integral</span>
        </div>
        <nav className="nav">
          <NavLink to="/tablero" className={cls}>
            Tablero
          </NavLink>
          <NavLink to="/socios" className={cls}>
            Socios
          </NavLink>
          {usuario?.rol !== "PROMOTOR" && (
            <>
              <NavLink to="/auxiliar-caja" className={cls}>
                Auxiliar de caja
              </NavLink>
              <NavLink to="/caja-chica" className={cls}>
                Caja chica
              </NavLink>
            </>
          )}
          {usuario?.rol !== "CAJERO" && (
            <NavLink to="/creditos" className={cls}>
              Créditos
            </NavLink>
          )}
          {TIPOS_AHORRO.map((t) => (
            <NavLink key={t.slug} to={`/ahorros/${t.slug}`} className={cls}>
              {t.titulo}
            </NavLink>
          ))}
          {(usuario?.rol === "ADMIN" || usuario?.rol === "GERENCIA") && (
            <>
              <NavLink to="/usuarios" className={cls}>
                Usuarios
              </NavLink>
              <NavLink to="/agencias" className={cls}>
                Agencias
              </NavLink>
            </>
          )}
        </nav>
        <div className="sidebar-footer">
          <div className="who">{usuario?.nombre}</div>
          <div className="role">{usuario ? ROL_LABEL[usuario.rol] : ""}</div>
          <button
            className="link-btn"
            onClick={() => {
              logout();
              navigate("/login", { replace: true });
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
