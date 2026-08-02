import { TOKENS } from "../lib/constants.js";

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
export function StatCard({ label, value, sub, icon: Icon, accent }) {
  return (
    <div style={{ background: TOKENS.surface, border: `1px solid ${TOKENS.border}`, borderRadius: 12, padding: "13px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ fontSize: 11, color: TOKENS.textMuted, marginBottom: 6, lineHeight: 1.4 }}>{label}</div>
        {Icon && <Icon size={13} color={accent} />}
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

export function pillStyle(active) {
  return {
    padding: "6px 13px", borderRadius: 999, fontSize: 12.5, fontWeight: 500, cursor: "pointer",
    border: `1px solid ${active ? TOKENS.accent : TOKENS.border}`,
    background: active ? "var(--tint-accent)" : "transparent",
    color: active ? TOKENS.accent : TOKENS.textMuted,
    textTransform: "capitalize",
  };
}
