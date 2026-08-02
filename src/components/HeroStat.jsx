import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { TOKENS } from "../lib/constants.js";
import { formatCLP } from "../lib/utils.js";

const MONTH_NAMES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

export function HeroStat({ spentSoFar, typicalPace, dayOfMonth, monthKey }) {
  const monthLabel = MONTH_NAMES[Number(monthKey.slice(5, 7)) - 1];
  const hasComparison = typicalPace != null && typicalPace > 0;
  const diffPct = hasComparison ? Math.round(((spentSoFar - typicalPace) / typicalPace) * 100) : null;
  const isOver = diffPct != null && diffPct > 5;
  const isUnder = diffPct != null && diffPct < -5;
  const color = isOver ? TOKENS.expense : isUnder ? TOKENS.income : TOKENS.accent;
  const tint = isOver ? "var(--tint-expense)" : isUnder ? "var(--tint-income)" : "var(--tint-accent)";
  const Icon = isOver ? TrendingUp : isUnder ? TrendingDown : Minus;

  return (
    <div style={{
      background: TOKENS.surface, border: `1px solid ${TOKENS.border}`, borderRadius: 14,
      padding: "22px 24px", marginBottom: 20,
    }}>
      <div style={{ fontSize: 12.5, color: TOKENS.textMuted, marginBottom: 6 }}>
        Llevas gastado en {monthLabel} · día {dayOfMonth}
      </div>
      <div className="mono" style={{ fontSize: 34, fontWeight: 700, color: TOKENS.text, letterSpacing: "-0.01em", lineHeight: 1.1 }}>
        {formatCLP(spentSoFar)}
      </div>
      {hasComparison ? (
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6, marginTop: 12,
          padding: "5px 10px", borderRadius: 999, background: tint,
        }}>
          <Icon size={13} color={color} />
          <span style={{ fontSize: 12.5, color, fontWeight: 600 }}>
            {isOver && `${diffPct}% más que tu ritmo habitual`}
            {isUnder && `${Math.abs(diffPct)}% menos que tu ritmo habitual`}
            {!isOver && !isUnder && "en línea con tu ritmo habitual"}
          </span>
        </div>
      ) : (
        <div style={{ fontSize: 12, color: TOKENS.textFaint, marginTop: 12 }}>
          Todavía no hay suficiente historial para comparar tu ritmo de gasto.
        </div>
      )}
    </div>
  );
}
