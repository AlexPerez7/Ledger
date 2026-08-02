import { Lightbulb } from "lucide-react";
import { TOKENS } from "../lib/constants.js";

export function Insights({ items }) {
  if (!items || items.length === 0) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
      {items.map((text, i) => (
        <div
          key={i}
          style={{
            display: "flex", alignItems: "center", gap: 10, background: TOKENS.surface,
            border: `1px solid ${TOKENS.border}`, borderRadius: 10, padding: "10px 14px",
            fontSize: 12.5, color: TOKENS.textMuted, lineHeight: 1.4,
          }}
        >
          <Lightbulb size={14} color={TOKENS.accent} style={{ flexShrink: 0 }} />
          <span>{text}</span>
        </div>
      ))}
    </div>
  );
}
