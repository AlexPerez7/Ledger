import { useState } from "react";
import { TOKENS, ICONS, ICON_NAMES, PALETTE, DEFAULT_CATEGORY_ICON } from "../lib/constants.js";

export function Skeleton({ width = "100%", height = 14, radius = 6, style }) {
  return <div className="skeleton" style={{ width, height, borderRadius: radius, background: TOKENS.surfaceAlt, ...style }} />;
}

export function AppShellSkeleton() {
  return (
    <div style={{ background: TOKENS.bg, minHeight: "100vh" }} aria-hidden="true">
      <div style={{ borderBottom: `1px solid ${TOKENS.border}`, padding: "16px 24px" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Skeleton width={110} height={24} radius={6} />
          <Skeleton width={160} height={32} radius={8} />
        </div>
      </div>
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "28px 24px" }}>
        <ResumenSkeleton />
      </div>
    </div>
  );
}

export function ResumenSkeleton() {
  return (
    <div aria-hidden="true">
      <Skeleton height={92} radius={12} style={{ marginBottom: 16 }} />
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <Skeleton height={64} radius={12} style={{ flex: "1 1 160px" }} />
        <Skeleton height={64} radius={12} style={{ flex: "1 1 160px" }} />
        <Skeleton height={64} radius={12} style={{ flex: "1 1 160px" }} />
      </div>
      <div className="resumen-charts-grid" style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 16, marginBottom: 16 }}>
        <Skeleton height={220} radius={12} />
        <Skeleton height={220} radius={12} />
      </div>
      <Skeleton height={130} radius={12} />
    </div>
  );
}

export function MovimientosSkeleton() {
  return (
    <div aria-hidden="true">
      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        <Skeleton height={36} radius={8} style={{ flex: "1 1 220px" }} />
        <Skeleton height={36} radius={8} width={140} />
      </div>
      <div style={{ background: TOKENS.surface, border: `1px solid ${TOKENS.border}`, borderRadius: 12, overflow: "hidden" }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderBottom: i < 4 ? `1px solid ${TOKENS.border}` : "none" }}>
            <Skeleton width={32} height={32} radius={8} />
            <div style={{ flex: 1 }}>
              <Skeleton height={12} width="55%" style={{ marginBottom: 6 }} />
              <Skeleton height={10} width="30%" />
            </div>
            <Skeleton height={12} width={60} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function Panel({ title, right, children }) {
  return (
    <div style={{ background: TOKENS.surface, border: `1px solid ${TOKENS.border}`, borderRadius: 12, padding: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div className="display" style={{ fontSize: 13.5, fontWeight: 600 }}>{title}</div>
        {right}
      </div>
      {children}
    </div>
  );
}

export function EmptyNote({ text }) {
  return <div style={{ color: TOKENS.textFaint, fontSize: 12.5, padding: "30px 0", textAlign: "center" }}>{text}</div>;
}

export function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div style={{ textAlign: "center", padding: "40px 20px" }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12, background: TOKENS.surfaceAlt, display: "flex",
        alignItems: "center", justifyContent: "center", margin: "0 auto 14px",
      }}>
        <Icon size={20} color={TOKENS.textFaint} />
      </div>
      <div className="display" style={{ fontSize: 14, fontWeight: 600, color: TOKENS.text, marginBottom: 5 }}>{title}</div>
      <div style={{ fontSize: 12.5, color: TOKENS.textFaint, maxWidth: 320, margin: "0 auto", lineHeight: 1.5 }}>{text}</div>
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  );
}

// secundarias a propósito (fontSize/padding más chicos que antes): el hero
// number de arriba es el que debe destacar, estas son contexto de apoyo.
export function StatCard({ label, value, sub, icon: Icon, accent, action }) {
  return (
    <div style={{ background: TOKENS.surface, border: `1px solid ${TOKENS.border}`, borderRadius: 12, padding: "13px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ fontSize: 11, color: TOKENS.textMuted, marginBottom: 6, lineHeight: 1.4 }}>{label}</div>
        {action || (Icon && <Icon size={13} color={accent} />)}
      </div>
      <div className="mono" style={{ fontSize: 17, fontWeight: 600, color: accent }}>{value}</div>
      {sub && <div style={{ fontSize: 10.5, color: TOKENS.textFaint, marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

export function FieldInput({ label, style, ...props }) {
  return (
    <div style={style}>
      <div style={{ fontSize: 11, color: TOKENS.textFaint, marginBottom: 4 }}>{label}</div>
      <input
        {...props}
        onChange={(e) => props.onChange(e.target.value)}
        style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${TOKENS.border}`, background: TOKENS.surface, color: TOKENS.text, fontSize: 13 }}
      />
    </div>
  );
}

// Interruptor on/off — reemplaza a los checkboxes nativos donde se necesita
// una afirmación/negación visualmente clara (ej. "cuenta como gasto").
export function ToggleSwitch({ checked, onChange, disabled = false, title, ariaLabel }) {
  const width = 34, height = 18, knob = 14, pad = 2;
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      title={title}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      style={{
        width, height, borderRadius: height / 2, border: "none", padding: 0, position: "relative", flexShrink: 0,
        background: checked && !disabled ? TOKENS.accent : TOKENS.border,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        transition: "background 150ms ease",
      }}
    >
      <span
        style={{
          position: "absolute", top: pad, left: checked ? width - knob - pad : pad,
          width: knob, height: knob, borderRadius: "50%", background: "#fff",
          transition: "left 150ms ease", boxShadow: "0 1px 2px rgba(0,0,0,0.35)",
        }}
      />
    </button>
  );
}

export function pillStyle(active) {
  return {
    padding: "6px 13px", borderRadius: 999, fontSize: 12.5, fontWeight: 500, cursor: "pointer",
    border: `1px solid ${active ? TOKENS.accent : TOKENS.border}`,
    background: active ? "var(--tint-accent)" : "transparent",
    color: active ? TOKENS.accent : TOKENS.textMuted,
    textTransform: "capitalize",
  };
}

// panel compacto para crear una categoría (nombre + color + ícono) sin
// abandonar el flujo en el que se abrió — se usa tanto en "Nuevo movimiento"
// como en la pestaña Categorías, mismo look en los dos lados.
export function CategoryQuickAdd({ type, onAdd, onAddCategory, onCancel }) {
  const [label, setLabel] = useState("");
  const [icon, setIcon] = useState("Shapes");
  const [color, setColor] = useState(PALETTE[0]);
  const Icon = ICONS[icon] || DEFAULT_CATEGORY_ICON;

  const submit = () => {
    if (!label.trim()) return;
    const id = onAddCategory(label.trim(), icon, color, type);
    onAdd(id);
  };

  return (
    <div style={{ marginTop: 14, padding: 12, background: TOKENS.surfaceAlt, border: `1px solid ${TOKENS.border}`, borderRadius: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8, background: `${color}22`, display: "flex",
          alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <Icon size={15} color={color} />
        </div>
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
          placeholder={`Nueva categoría de ${type === "expense" ? "gasto" : "ingreso"}`}
          autoFocus
          style={{ flex: 1, minWidth: 0, padding: "6px 9px", borderRadius: 6, border: `1px solid ${TOKENS.border}`, background: TOKENS.surface, color: TOKENS.text, fontSize: 12.5 }}
        />
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
        {PALETTE.map((col) => (
          <button
            key={col}
            onClick={() => setColor(col)}
            title={col}
            aria-label={`Usar color ${col}`}
            aria-pressed={col === color}
            style={{
              width: 20, height: 20, borderRadius: "50%", background: col, cursor: "pointer", padding: 0,
              border: col === color ? `2px solid ${TOKENS.text}` : "2px solid transparent",
            }}
          />
        ))}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
        {ICON_NAMES.map((name) => {
          const OptionIcon = ICONS[name];
          const selected = icon === name;
          return (
            <button
              key={name}
              title={name}
              onClick={() => setIcon(name)}
              style={{
                width: 28, height: 28, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center",
                background: selected ? `${color}33` : "transparent",
                border: `1px solid ${selected ? color : TOKENS.border}`, cursor: "pointer", padding: 0,
              }}
            >
              <OptionIcon size={13} color={selected ? color : TOKENS.textMuted} />
            </button>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={submit}
          disabled={!label.trim()}
          style={{
            padding: "7px 14px", borderRadius: 7, border: "none", fontSize: 12, fontWeight: 600,
            background: TOKENS.accent, color: TOKENS.bg, cursor: label.trim() ? "pointer" : "default", opacity: label.trim() ? 1 : 0.6,
          }}
        >
          Crear y usar
        </button>
        <button onClick={onCancel} style={{ padding: "7px 14px", borderRadius: 7, border: `1px solid ${TOKENS.border}`, background: "transparent", color: TOKENS.textMuted, fontSize: 12, cursor: "pointer" }}>
          Cancelar
        </button>
      </div>
    </div>
  );
}
