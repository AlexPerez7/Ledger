import { useState } from "react";
import { Check, AlertTriangle, ScanLine, Info } from "lucide-react";
import { TOKENS } from "../lib/constants.js";
import { formatCLP, formatDateDisplay } from "../lib/utils.js";
import { Panel, EmptyNote, EmptyState } from "./Shared.jsx";

const MONTH_NAMES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
function fmtMonth(m) {
  if (!m) return "";
  const [y, mo] = m.split("-");
  return `${MONTH_NAMES[parseInt(mo, 10) - 1]} ${y}`;
}

export function Conciliacion({ currentMonth, reconcileStats, reconcileMonth }) {
  const [result, setResult] = useState(null);

  if (!currentMonth || !reconcileStats) {
    return (
      <EmptyState
        icon={ScanLine}
        title="Nada que conciliar todavía"
        text="Importa movimientos del banco para poder revisar qué coincide con tus registros manuales."
      />
    );
  }

  const { confirmed, pendingNoReport, pendingMismatch, bankOnly, bankExists } = reconcileStats;

  return (
    <div>
      <Panel
        title={`Conciliar ${fmtMonth(currentMonth)}`}
        right={
          <button onClick={() => { const n = reconcileMonth(currentMonth); setResult(n); }} style={{ padding: "7px 14px", borderRadius: 8, border: "none", background: TOKENS.accent, color: "#0E141B", fontSize: 12.5, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            <ScanLine size={13} /> Conciliar mes
          </button>
        }
      >
        <div style={{ fontSize: 12.5, color: TOKENS.textMuted, marginBottom: 4 }}>
          El reporte del banco es la fuente oficial: compara tus movimientos manuales contra él (mismo monto, fecha con hasta 3 días de diferencia) y confirma los que calzan.
        </div>
        {result !== null && (
          <div style={{ fontSize: 12, color: TOKENS.income, marginTop: 6 }}>
            {result > 0 ? `${result} movimiento${result === 1 ? "" : "s"} confirmado${result === 1 ? "" : "s"} en esta pasada.` : "No se encontraron nuevas coincidencias."}
          </div>
        )}
        {!bankExists && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: TOKENS.pending, marginTop: 8 }}>
            <Info size={13} /> Todavía no has importado el reporte del banco de este mes — no se puede confirmar nada hasta que lo subas.
          </div>
        )}
      </Panel>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
        <Panel title={`Confirmados (${confirmed.length})`}>
          {confirmed.length === 0 ? <EmptyNote text="Aún ninguno." /> : confirmed.map((t) => <ReconcileRow key={t.id} t={t} icon={Check} color={TOKENS.income} />)}
        </Panel>

        <Panel title={`Sin reporte del banco (${pendingNoReport.length})`}>
          {pendingNoReport.length === 0 ? <EmptyNote text="—" /> : (
            <>
              <div style={{ fontSize: 11, color: TOKENS.textFaint, marginBottom: 8 }}>Aún no importas el .xls de este mes, así que no se pueden comparar todavía.</div>
              {pendingNoReport.map((t) => <ReconcileRow key={t.id} t={t} icon={null} color={TOKENS.textMuted} />)}
            </>
          )}
        </Panel>
      </div>

      {bankExists && pendingMismatch.length > 0 && (
        <Panel title={`⚠ Posible descuadre — no coinciden con el reporte (${pendingMismatch.length})`} right={null}>
          <div style={{ fontSize: 11.5, color: TOKENS.textFaint, marginBottom: 10 }}>
            Ya subiste el reporte de este mes, pero estos movimientos manuales no encontraron un cargo o abono equivalente. Revisa el monto, la fecha, o si el banco aún no procesa ese movimiento.
          </div>
          {pendingMismatch.map((t) => <ReconcileRow key={t.id} t={t} icon={AlertTriangle} color={TOKENS.pending} />)}
        </Panel>
      )}

      {bankOnly.length > 0 && (
        <Panel title={`Movimientos del banco sin registro manual (${bankOnly.length})`} right={null}>
          <div style={{ fontSize: 11.5, color: TOKENS.textFaint, marginBottom: 10 }}>
            Es normal: son movimientos que solo conoces por la cartola (compras con tarjeta, cargos automáticos, etc.).
          </div>
          {bankOnly.slice(0, 8).map((t) => <ReconcileRow key={t.id} t={t} icon={null} color={TOKENS.textMuted} />)}
          {bankOnly.length > 8 && <div style={{ fontSize: 11.5, color: TOKENS.textFaint, marginTop: 6 }}>+ {bankOnly.length - 8} más</div>}
        </Panel>
      )}
    </div>
  );
}

function ReconcileRow({ t, icon: Icon, color }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${TOKENS.border}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, overflow: "hidden" }}>
        {Icon && <Icon size={13} color={color} style={{ flexShrink: 0 }} />}
        <span className="mono" style={{ color: TOKENS.textFaint, fontSize: 11 }}>{formatDateDisplay(t.date)}</span>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.alias || t.description}</span>
      </div>
      <span className="mono" style={{ fontSize: 12, color: t.amount >= 0 ? TOKENS.income : TOKENS.expense, flexShrink: 0, marginLeft: 8 }}>
        {formatCLP(t.amount)}
      </span>
    </div>
  );
}
