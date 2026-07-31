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

export function StatCard({ label, value, sub, icon: Icon, accent }) {
  return (
    <div style={{ background: TOKENS.surface, border: `1px solid ${TOKENS.border}`, borderRadius: 12, padding: "16px 18px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ fontSize: 11.5, color: TOKENS.textMuted, marginBottom: 8, lineHeight: 1.4 }}>{label}</div>
        {Icon && <Icon size={14} color={accent} />}
      </div>
      <div className="mono" style={{ fontSize: 22, fontWeight: 600, color: accent }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: TOKENS.textFaint, marginTop: 4 }}>{sub}</div>}
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
    background: active ? "rgba(91,155,213,0.12)" : "transparent",
    color: active ? TOKENS.accent : TOKENS.textMuted,
    textTransform: "capitalize",
  };
}
