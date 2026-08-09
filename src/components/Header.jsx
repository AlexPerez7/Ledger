import { useMemo, useState } from "react";
import { Wallet, Tag, ListChecks, LayoutGrid, ScanLine, LogOut, Sun, Moon } from "lucide-react";
import { TOKENS } from "../lib/constants.js";
import { pillStyle } from "./Shared.jsx";

export function Header({ tab, setTab, onManageCats, onSignOut, theme, onToggleTheme }) {
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
                <button key={it.id} onClick={() => setTab(it.id)} aria-label={it.label} aria-current={active ? "page" : undefined} style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 7,
                  border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500,
                  background: active ? TOKENS.bg : "transparent", color: active ? TOKENS.text : TOKENS.textMuted,
                }}>
                  <Icon size={14} /> <span className="nav-label">{it.label}</span>
                </button>
              );
            })}
          </nav>
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              title={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
              aria-label={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
              style={{
              display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 8,
              border: `1px solid ${TOKENS.border}`, background: "transparent", color: TOKENS.textMuted, fontSize: 12.5, cursor: "pointer",
            }}>
              {theme === "dark" ? <Sun size={13} /> : <Moon size={13} />}
            </button>
          )}
          {onSignOut && (
            <button onClick={onSignOut} title="Cerrar sesión" aria-label="Cerrar sesión" style={{
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
  const [yearOverride, setYearOverride] = useState(null);
  const names = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  const label = (m) => { const [, mo] = m.split("-"); return names[parseInt(mo, 10) - 1]; };
  const years = useMemo(() => Array.from(new Set(months.map((m) => m.split("-")[0]))).sort().reverse(), [months]);

  if (months.length === 0) return null;

  const activeYear = monthFilter !== "all" ? monthFilter.split("-")[0] : years[0];
  const selectedYear = yearOverride && years.includes(yearOverride) ? yearOverride : activeYear;
  const monthsInYear = months.filter((m) => m.startsWith(selectedYear));

  return (
    <div style={{ marginBottom: 22 }}>
      {years.length > 1 && (
        <div style={{ display: "flex", gap: 4, background: TOKENS.surfaceAlt, padding: 4, borderRadius: 10, border: `1px solid ${TOKENS.border}`, width: "fit-content", marginBottom: 10 }}>
          {years.map((y) => {
            const active = y === selectedYear;
            return (
              <button key={y} onClick={() => setYearOverride(y)} style={{
                padding: "5px 12px", borderRadius: 7, border: "none", cursor: "pointer",
                fontSize: 12.5, fontWeight: 500,
                background: active ? TOKENS.bg : "transparent", color: active ? TOKENS.text : TOKENS.textMuted,
              }}>
                {y}
              </button>
            );
          })}
        </div>
      )}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={() => setMonthFilter("all")} style={pillStyle(monthFilter === "all")}>Todo</button>
        {monthsInYear.map((m) => (
          <button key={m} onClick={() => setMonthFilter(m)} style={pillStyle(monthFilter === m)}>{label(m)}</button>
        ))}
      </div>
    </div>
  );
}
