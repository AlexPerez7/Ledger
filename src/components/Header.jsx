import { Wallet, Tag, ListChecks, LayoutGrid, ScanLine, LogOut } from "lucide-react";
import { TOKENS } from "../lib/constants.js";
import { pillStyle } from "./Shared.jsx";

export function Header({ tab, setTab, onManageCats, onSignOut }) {
  const items = [
    { id: "resumen", label: "Resumen", icon: LayoutGrid },
    { id: "movimientos", label: "Movimientos", icon: ListChecks },
    { id: "conciliacion", label: "Conciliación", icon: ScanLine },
  ];
  return (
    <div style={{ borderBottom: `1px solid ${TOKENS.border}`, background: TOKENS.surface, position: "sticky", top: 0, zIndex: 10 }}>
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 7, background: TOKENS.income, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Wallet size={16} color={TOKENS.bg} />
          </div>
          <div className="display" style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em" }}>Ledger</div>
          <div className="header-subtitle" style={{ color: TOKENS.textFaint, fontSize: 12, marginLeft: 2 }}>· cuenta corriente CLP</div>
        </div>
        <div className="header-controls" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={onManageCats} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 8,
            border: `1px solid ${TOKENS.border}`, background: "transparent", color: TOKENS.textMuted, fontSize: 12.5, cursor: "pointer",
          }}>
            <Tag size={13} /> Categorías
          </button>
          <nav style={{ display: "flex", gap: 4, background: TOKENS.surfaceAlt, padding: 4, borderRadius: 10, border: `1px solid ${TOKENS.border}` }}>
            {items.map((it) => {
              const Icon = it.icon;
              const active = tab === it.id;
              return (
                <button key={it.id} onClick={() => setTab(it.id)} style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 7,
                  border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500,
                  background: active ? TOKENS.bg : "transparent", color: active ? TOKENS.text : TOKENS.textMuted,
                }}>
                  <Icon size={14} /> <span className="nav-label">{it.label}</span>
                </button>
              );
            })}
          </nav>
          {onSignOut && (
            <button onClick={onSignOut} title="Cerrar sesión" style={{
              display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 8,
              border: `1px solid ${TOKENS.border}`, background: "transparent", color: TOKENS.textMuted, fontSize: 12.5, cursor: "pointer",
            }}>
              <LogOut size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function MonthBar({ months, monthFilter, setMonthFilter }) {
  if (months.length === 0) return null;
  const names = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  const label = (m) => { const [y, mo] = m.split("-"); return `${names[parseInt(mo, 10) - 1]} ${y}`; };
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 22, flexWrap: "wrap" }}>
      <button onClick={() => setMonthFilter("all")} style={pillStyle(monthFilter === "all")}>Todo</button>
      {months.map((m) => (
        <button key={m} onClick={() => setMonthFilter(m)} style={pillStyle(monthFilter === m)}>{label(m)}</button>
      ))}
    </div>
  );
}
