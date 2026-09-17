import { useState, useRef, useCallback } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ROL_LABEL, TIPOS_AHORRO } from "../types";
import { api, mensajeError } from "../lib/api";

// ── TOOLTIP GLOBAL (portal-style via fixed position) ──
interface TooltipState {
  text: string;
  x: number;
  y: number;
}

export default function Layout() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [reseteando, setReseteando] = useState(false);
  const [recargando, setRecargando] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const tooltipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const closeSidebar = () => setSidebarOpen(false);

  // Show tooltip after 300ms delay
  const showTooltip = useCallback((e: React.MouseEvent<HTMLAnchorElement>, label: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (tooltipTimer.current) clearTimeout(tooltipTimer.current);
    tooltipTimer.current = setTimeout(() => {
      setTooltip({
        text: label,
        x: rect.right + 10,
        y: rect.top + rect.height / 2,
      });
    }, 300);
  }, []);

  const hideTooltip = useCallback(() => {
    if (tooltipTimer.current) clearTimeout(tooltipTimer.current);
    setTooltip(null);
  }, []);

  async function handleResetGlobal() {
    const confirmado = window.confirm(
      "⚠️ ¿Estás seguro de que deseas REINICIAR EL SISTEMA DESDE CERO?\n\n" +
      "Esta acción vaciará todas las tablas (socios, créditos, ahorros, movimientos, cajas) para empezar limpio."
    );
    if (!confirmado) return;
    setReseteando(true);
    try {
      const { data } = await api.post<{ ok: boolean; mensaje: string }>("/sistema/reset");
      alert(data.mensaje);
      window.location.reload();
    } catch (err) {
      alert(mensajeError(err));
    } finally {
      setReseteando(false);
    }
  }

  async function handleRecargarGlobal() {
    const confirmado = window.confirm(
      "📥 ¿Deseas RECARGAR TODOS LOS DATOS EXISTENTES de los libros Excel?\n\n" +
      "Esta acción restaurará la base de datos oficial:\n" +
      "• 568 asociados con sus aportaciones\n" +
      "• 65 préstamos de cartera viva\n" +
      "• 692 certificados de plazo fijo"
    );
    if (!confirmado) return;
    setRecargando(true);
    try {
      const { data } = await api.post<{ ok: boolean; mensaje: string }>("/sistema/recargar-datos");
      alert(data.mensaje);
      window.location.reload();
    } catch (err) {
      alert(mensajeError(err));
    } finally {
      setRecargando(false);
    }
  }

  const cls = ({ isActive }: { isActive: boolean }) => (isActive ? "active" : "");

  const iniciales = usuario?.nombre
    ? usuario.nombre.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()
    : "U";

  // NavItem with universal tooltip
  function NavItem({ to, icon, label, onClick }: { to: string; icon: string; label: string; onClick?: () => void }) {
    return (
      <NavLink
        to={to}
        className={cls}
        onClick={onClick}
        onMouseEnter={(e) => showTooltip(e, label)}
        onMouseLeave={hideTooltip}
      >
        <span className="nav-icon">{icon}</span>
        <span className="nav-label">{label}</span>
      </NavLink>
    );
  }

  function Section({ label }: { label: string }) {
    return <div className="nav-section">{label}</div>;
  }

  return (
    <div className={`shell${collapsed ? " sidebar-collapsed" : ""}`}>

      {/* ── GLOBAL TOOLTIP (floating pill) ── */}
      {tooltip && (
        <div
          style={{
            position: "fixed",
            left: tooltip.x,
            top: tooltip.y,
            transform: "translateY(-50%)",
            zIndex: 9999,
            pointerEvents: "none",
            animation: "tooltip-in 0.12s ease forwards",
          }}
        >
          {/* Arrow */}
          <div style={{
            position: "absolute",
            left: -6,
            top: "50%",
            transform: "translateY(-50%)",
            width: 0, height: 0,
            borderTop: "5px solid transparent",
            borderBottom: "5px solid transparent",
            borderRight: "6px solid #162033",
          }} />
          {/* Pill */}
          <div style={{
            background: "#162033",
            color: "#e2e8f0",
            fontSize: "0.76rem",
            fontWeight: 600,
            padding: "0.3rem 0.75rem",
            borderRadius: "8px",
            whiteSpace: "nowrap",
            border: "1px solid rgba(52,211,153,0.22)",
            boxShadow: "0 6px 20px rgba(0,0,0,0.5), 0 1px 3px rgba(0,0,0,0.3)",
            letterSpacing: "0.01em",
          }}>
            {tooltip.text}
          </div>
        </div>
      )}

      {/* ── MOBILE TOP BAR ── */}
      <div className="mobile-header">
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div style={{
            width: 28, height: 28,
            background: "linear-gradient(135deg, #047857 0%, #065f46 100%)",
            color: "#fff", borderRadius: "7px",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 900, fontSize: "0.9rem",
          }}>M</div>
          <span style={{ fontSize: "0.9rem", fontWeight: 800, color: "#ffffff", letterSpacing: "0.02em" }}>COOP COMIF R.L.</span>
        </div>
        <button className="hamburger-btn" onClick={() => setSidebarOpen(true)} title="Abrir Menú">☰</button>
      </div>

      <div className={`sidebar-backdrop ${sidebarOpen ? "show" : ""}`} onClick={closeSidebar} />

      {/* ══════════════════════════════════════════════
           SIDEBAR COLLAPSIBLE ICON-RAIL
      ══════════════════════════════════════════════ */}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>

        {/* ── BRAND + TOGGLE ── */}
        <div className="brand">
          <button
            className="sidebar-toggle"
            onClick={() => setCollapsed((c) => !c)}
            title={collapsed ? "Expandir menú" : "Colapsar menú"}
          >
            <div className="sidebar-toggle-logo">M</div>
            <div className="sidebar-toggle-text">
              <span className="name">COOP COMIF R.L.</span>
              <span className="sub">Maya Inversiones Futuras</span>
            </div>
            <i className="sidebar-chevron">‹</i>
          </button>
          <div className="agency-badge">
            <span className="agency-badge-dot" />
            <span className="agency-badge-text">Agencia Chajul · Activa</span>
          </div>
        </div>

        {/* ── NAV ── */}
        <nav className="nav">

          {/* ── CAJERO (Auxiliar de Caja) ── */}
          {usuario?.rol === "CAJERO" && (<>
            <Section label="Ventanilla y Caja" />
            <NavItem to="/auxiliar-caja" icon="💵" label="Auxiliar de Caja"   onClick={closeSidebar} />
            <Section label="Consultas y Cobros" />
            <NavItem to="/socios"   icon="👥" label="Consultar Socios"  onClick={closeSidebar} />
            <NavItem to="/creditos" icon="📄" label="Cobro de Créditos" onClick={closeSidebar} />
          </>)}

          {/* ── CAJA CHICA ── */}
          {usuario?.rol === "CAJA_CHICA" && (<>
            <Section label="Caja y Ventanilla" />
            <NavItem to="/auxiliar-caja" icon="💵" label="Auxiliar de Caja" onClick={closeSidebar} />
            <NavItem to="/caja-chica"    icon="📥" label="Caja Chica"       onClick={closeSidebar} />
            <Section label="Socios" />
            <NavItem to="/socios"        icon="👥" label="Consultar Socios" onClick={closeSidebar} />
          </>)}

          {/* ── PROMOTOR ── */}
          {usuario?.rol === "PROMOTOR" && (<>
            <Section label="Gestión de Campo" />
            <NavItem to="/promotor/cartera"  icon="📂" label="Kardex Cartera"       onClick={closeSidebar} />
            <NavItem to="/socios"            icon="👥" label="Socios en Campo"      onClick={closeSidebar} />
            <NavItem to="/creditos"          icon="📄" label="Créditos y Simulador" onClick={closeSidebar} />
          </>)}

          {/* ── SUPERVISOR ── */}
          {usuario?.rol === "SUPERVISOR" && (<>
            <Section label="Supervisión y Control" />
            <NavItem to="/tablero"         icon="📊" label="Tablero y Analítica"    onClick={closeSidebar} />
            <NavItem to="/arqueos/mensual" icon="📑" label="Libro Mensual Arqueos"  onClick={closeSidebar} />
            <Section label="Cartera y Créditos" />
            <NavItem to="/creditos"         icon="📄" label="Bandeja de Créditos"   onClick={closeSidebar} />
            <NavItem to="/promotor/cartera" icon="📂" label="Kardex Cartera"        onClick={closeSidebar} />
            <NavItem to="/auxiliar-caja"    icon="💵" label="Arqueos e Hist. Caja"  onClick={closeSidebar} />
            <Section label="Padrón y Captaciones" />
            <NavItem to="/socios"             icon="👥" label="Padrón de Socios"     onClick={closeSidebar} />
            <NavItem to="/aportaciones"       icon="🏛️" label="Aportaciones Capital" onClick={closeSidebar} />
            <NavItem to="/ahorros/corriente"  icon="💰" label="Cuentas de Ahorro"    onClick={closeSidebar} />
            <NavItem to="/ahorros/plazo-fijo" icon="📈" label="Plazo Fijo"           onClick={closeSidebar} />
          </>)}

          {/* ── GERENCIA (control total) ── */}
          {usuario?.rol === "GERENCIA" && (<>
            <Section label="Control General" />
            <NavItem to="/tablero"         icon="📊" label="Tablero Global"        onClick={closeSidebar} />
            <NavItem to="/arqueos/mensual" icon="📑" label="Libro Mensual Arqueos" onClick={closeSidebar} />

            <Section label="Operaciones" />
            <NavItem to="/auxiliar-caja"    icon="💵" label="Auxiliar de Caja" onClick={closeSidebar} />
            <NavItem to="/caja-chica"       icon="📥" label="Caja Chica"       onClick={closeSidebar} />
            <NavItem to="/creditos"         icon="📄" label="Créditos"         onClick={closeSidebar} />
            <NavItem to="/promotor/cartera" icon="📂" label="Kardex Cartera"   onClick={closeSidebar} />

            <Section label="Socios y Captaciones" />
            <NavItem to="/socios"       icon="👥" label="Socios"       onClick={closeSidebar} />
            <NavItem to="/aportaciones" icon="🏛️" label="Aportaciones" onClick={closeSidebar} />
            {TIPOS_AHORRO.map((t) => (
              <NavItem key={t.slug} to={`/ahorros/${t.slug}`} icon="🏦" label={t.titulo} onClick={closeSidebar} />
            ))}

            <Section label="Administración" />
            <NavItem to="/alertas"   icon="🔔" label="Panel de Alertas"      onClick={closeSidebar} />
            <NavItem to="/usuarios"  icon="👤" label="Usuarios"              onClick={closeSidebar} />
            <NavItem to="/agencias"  icon="🏢" label="Agencias"              onClick={closeSidebar} />
            <NavItem to="/auditoria" icon="🔍" label="Bitácora de Auditoría" onClick={closeSidebar} />
            <NavItem to="/sesiones"  icon="🛡️" label="Sesiones Activas"      onClick={closeSidebar} />
          </>)}
        </nav>

        {/* ── CONTROL DE DATOS (solo ADMIN) ── */}
        {usuario?.rol === "GERENCIA" && !collapsed && (
          <div style={{
            padding: "0.5rem 0.75rem",
            background: "rgba(2,132,199,0.07)",
            borderTop: "1px solid rgba(255,255,255,0.04)",
            borderBottom: "1px solid rgba(255,255,255,0.04)",
            flexShrink: 0,
          }}>
            <div style={{
              fontSize: "0.56rem", fontWeight: 800, color: "rgba(56,189,248,0.6)",
              textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.35rem",
            }}>
              ⚙️ Control de Datos
            </div>
            <div style={{ display: "flex", gap: "0.3rem" }}>
              <button
                type="button" onClick={handleRecargarGlobal}
                disabled={recargando || reseteando}
                style={{
                  flex: 1, fontSize: "0.66rem", padding: "0.3rem 0.35rem",
                  background: "rgba(2,132,199,0.15)", color: "#38bdf8",
                  border: "1px solid rgba(56,189,248,0.2)", borderRadius: "6px",
                  cursor: "pointer", fontWeight: 600,
                  opacity: recargando || reseteando ? 0.5 : 1,
                }}
                title="Restaurar datos de Excel"
              >{recargando ? "⏳ …" : "📥 Excel"}</button>
              <button
                type="button" onClick={handleResetGlobal}
                disabled={reseteando || recargando}
                style={{
                  flex: 1, fontSize: "0.66rem", padding: "0.3rem 0.35rem",
                  background: "rgba(220,38,38,0.15)", color: "#f87171",
                  border: "1px solid rgba(248,113,113,0.2)", borderRadius: "6px",
                  cursor: "pointer", fontWeight: 600,
                  opacity: reseteando || recargando ? 0.5 : 1,
                }}
                title="Reiniciar sistema a cero"
              >{reseteando ? "⏳ …" : "⚠️ Reset"}</button>
            </div>
          </div>
        )}

        {/* ── FOOTER / USUARIO ── */}
        <div className="sidebar-footer">
          <div className="sidebar-footer-inner">
            <div
              title={usuario?.nombre}
              style={{
                width: 30, height: 30, borderRadius: "50%",
                background: "linear-gradient(135deg, #059669, #047857)",
                color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 700, fontSize: "0.75rem", flexShrink: 0,
                boxShadow: "0 2px 8px rgba(5,150,105,0.4)", cursor: "default",
              }}
            >{iniciales}</div>

            <div className="sidebar-footer-text">
              <div className="who">{usuario?.nombre}</div>
              <div className="role">{usuario ? ROL_LABEL[usuario.rol] : ""}</div>
            </div>

            <button
              className="sidebar-footer-logout"
              title="Cerrar sesión"
              onClick={() => { logout(); navigate("/login", { replace: true }); }}
              style={{
                background: "rgba(239,68,68,0.12)",
                border: "1px solid rgba(239,68,68,0.22)",
                borderRadius: "6px", color: "#f87171", cursor: "pointer",
                padding: "0.28rem 0.38rem", fontSize: "0.75rem",
                flexShrink: 0, transition: "background 0.15s",
              }}
              onMouseEnter={(e) => { (e.currentTarget.style.background = "rgba(239,68,68,0.28)"); }}
              onMouseLeave={(e) => { (e.currentTarget.style.background = "rgba(239,68,68,0.12)"); }}
            >⏏️</button>
          </div>
        </div>
      </aside>

      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
