import { Calendar } from "lucide-react";
import { TOKENS } from "../lib/constants.js";
import { formatCLP, formatDateDisplay } from "../lib/utils.js";
import { EmptyState } from "./Shared.jsx";

const MONTH_NAMES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const DOW_LABELS = ["Lun", "", "Mié", "", "Vie", "", ""];
const WEEKS = 53;
const CELL = 11;
const GAP = 3;

// niveles de intensidad — mismo tono que TOKENS.expense, más opaco a más gasto
const LEVEL_COLORS = [
  TOKENS.surfaceAlt,
  `${TOKENS.expense}33`,
  `${TOKENS.expense}66`,
  `${TOKENS.expense}99`,
  TOKENS.expense,
];

function toISODate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function levelFor(value, max) {
  if (!value || max === 0) return 0;
  const ratio = value / max;
  if (ratio > 0.75) return 4;
  if (ratio > 0.5) return 3;
  if (ratio > 0.25) return 2;
  return 1;
}

export function SpendHeatmap({ dailySpend, hasTransactions }) {
  if (!hasTransactions) {
    return (
      <EmptyState
        icon={Calendar}
        title="Sin actividad todavía"
        text="Importa movimientos o agrega gastos para ver tu mapa de actividad diaria."
      />
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayDow = (today.getDay() + 6) % 7; // 0 = lunes
  const gridEnd = new Date(today);
  gridEnd.setDate(today.getDate() + (6 - todayDow));
  const totalDays = WEEKS * 7;
  const gridStart = new Date(gridEnd);
  gridStart.setDate(gridEnd.getDate() - totalDays + 1);

  const weeks = [];
  for (let w = 0; w < WEEKS; w++) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      const day = new Date(gridStart);
      day.setDate(gridStart.getDate() + w * 7 + d);
      week.push(day);
    }
    weeks.push(week);
  }

  const maxVal = Math.max(0, ...Object.values(dailySpend));

  return (
    <div>
      <div style={{ overflowX: "auto", paddingBottom: 4 }}>
        <div style={{ display: "inline-flex", flexDirection: "column", gap: 4 }}>
          <div style={{ display: "flex", marginLeft: CELL + GAP + 6 }}>
            {weeks.map((week, wi) => {
              const firstOfMonth = week.find((d) => d.getDate() === 1);
              return (
                <div key={wi} style={{ width: CELL + GAP, fontSize: 10, color: TOKENS.textFaint, flexShrink: 0 }}>
                  {firstOfMonth ? MONTH_NAMES[firstOfMonth.getMonth()] : ""}
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: GAP }}>
            <div style={{ display: "flex", flexDirection: "column", gap: GAP, marginRight: 6, flexShrink: 0 }}>
              {DOW_LABELS.map((label, i) => (
                <div key={i} style={{ height: CELL, fontSize: 9, color: TOKENS.textFaint, lineHeight: `${CELL}px` }}>{label}</div>
              ))}
            </div>
            {weeks.map((week, wi) => (
              <div key={wi} style={{ display: "flex", flexDirection: "column", gap: GAP }}>
                {week.map((day, di) => {
                  if (day > today) return <div key={di} style={{ width: CELL, height: CELL }} />;
                  const iso = toISODate(day);
                  const value = dailySpend[iso] || 0;
                  const level = levelFor(value, maxVal);
                  return (
                    <div
                      key={di}
                      title={`${formatDateDisplay(iso)} · ${value ? formatCLP(value) : "Sin gastos"}`}
                      style={{ width: CELL, height: CELL, borderRadius: 3, background: LEVEL_COLORS[level] }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end", fontSize: 10.5, color: TOKENS.textFaint, marginTop: 8 }}>
        Menos
        {LEVEL_COLORS.map((c, i) => <div key={i} style={{ width: 10, height: 10, borderRadius: 3, background: c }} />)}
        Más
      </div>
    </div>
  );
}
