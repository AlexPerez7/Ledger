import { useEffect, useState } from "react";
import { Check, AlertTriangle, ScanLine, Info, ChevronDown, ChevronUp, Pencil, Link2, X } from "lucide-react";
import { TOKENS } from "../lib/constants.js";
import { formatCLP, formatDateDisplay } from "../lib/utils.js";
import { Panel, EmptyNote, EmptyState, FieldInput } from "./Shared.jsx";

const MONTH_NAMES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
function fmtMonth(m) {
  if (!m) return "";
  const [y, mo] = m.split("-");
  return `${MONTH_NAMES[parseInt(mo, 10) - 1]} ${y}`;
}

export function Conciliacion({ currentMonth, reconcileStats, reconcileMonth, onEditManual, onManualMatch }) {
  const [result, setResult] = useState(null);
  const [showBankOnly, setShowBankOnly] = useState(false);
  const bankExists = reconcileStats?.bankExists;

  // conciliar es una operación segura de repetir (si no hay nada nuevo que
  // calce, no toca la base de datos) — se corre sola al entrar a un mes con
  // reporte del banco, en vez de obligar a tocar "Conciliar mes" primero.
  useEffect(() => {
    if (!currentMonth || !bankExists) return;
    const n = reconcileMonth(currentMonth);
    if (n > 0) setResult(n);
  }, [currentMonth, bankExists, reconcileMonth]);

  // colapsar la vista de "sin registro manual" al cambiar de mes — es la
  // sección menos accionable, no tiene sentido dejarla abierta de un mes
  // al revisar el siguiente.
  useEffect(() => setShowBankOnly(false), [currentMonth]);

  if (!currentMonth || !reconcileStats) {
    return (
      <EmptyState
        icon={ScanLine}
        title="Nada que conciliar todavía"
        text="Importa movimientos del banco para poder revisar qué coincide con tus registros manuales."
      />
    );
  }

  const { confirmed, pendingNoReport, pendingMismatch, bankOnly } = reconcileStats;

  return (
    <div>
      <Panel
        title={`Conciliar ${fmtMonth(currentMonth)}`}
        right={
          <button onClick={() => { const n = reconcileMonth(currentMonth); setResult(n); }} style={{ padding: "7px 14px", borderRadius: 8, border: "none", background: TOKENS.accent, color: TOKENS.bg, fontSize: 12.5, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
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
          {pendingMismatch.map((t) => (
            <MismatchRow key={t.id} t={t} bankCandidates={bankOnly} onEdit={onEditManual} onMatch={onManualMatch} />
          ))}
        </Panel>
      )}

      {bankOnly.length > 0 && (
        <Panel
          title={`Movimientos del banco sin registro manual (${bankOnly.length})`}
          right={
            <button
              onClick={() => setShowBankOnly((v) => !v)}
              aria-expanded={showBankOnly}
              style={{
                display: "flex", alignItems: "center", gap: 5, background: "none", border: "none",
                color: TOKENS.textMuted, fontSize: 12, cursor: "pointer", padding: 4,
              }}
            >
              {showBankOnly ? "Ocultar" : "Mostrar"}
              {showBankOnly ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          }
        >
          <div style={{ fontSize: 11.5, color: TOKENS.textFaint, marginBottom: showBankOnly ? 10 : 0 }}>
            Es normal: son movimientos que solo conoces por la cartola (compras con tarjeta, cargos automáticos, etc.) — no requieren nada de ti.
          </div>
          {showBankOnly && (
            <>
              {bankOnly.slice(0, 8).map((t) => <ReconcileRow key={t.id} t={t} icon={null} color={TOKENS.textMuted} />)}
              {bankOnly.length > 8 && <div style={{ fontSize: 11.5, color: TOKENS.textFaint, marginTop: 6 }}>+ {bankOnly.length - 8} más</div>}
            </>
          )}
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

// fila de "posible descuadre": además de mostrar el movimiento manual,
// deja corregirlo (fecha/monto — el caso más común es un typo) o vincularlo
// a mano con un movimiento del banco cuando el calce automático no lo
// encontró (ej. el banco demoró más días en procesarlo de lo esperado).
function MismatchRow({ t, bankCandidates, onEdit, onMatch }) {
  const [mode, setMode] = useState(null); // null | "edit" | "link"
  const [date, setDate] = useState(t.date);
  const [amount, setAmount] = useState(String(Math.abs(t.amount)));
  const [bankId, setBankId] = useState("");

  const close = () => setMode(null);

  const saveEdit = () => {
    const n = parseFloat(amount);
    if (!date || !n || n <= 0) return;
    onEdit(t.id, { date, amount: n });
    close();
  };

  const confirmMatch = () => {
    if (!bankId) return;
    onMatch(t.id, bankId);
    close();
  };

  return (
    <div style={{ padding: "7px 0", borderBottom: `1px solid ${TOKENS.border}` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, overflow: "hidden", flex: 1, minWidth: 0 }}>
          <AlertTriangle size={13} color={TOKENS.pending} style={{ flexShrink: 0 }} />
          <span className="mono" style={{ color: TOKENS.textFaint, fontSize: 11 }}>{formatDateDisplay(t.date)}</span>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.alias || t.description}</span>
        </div>
        <span className="mono" style={{ fontSize: 12, color: t.amount >= 0 ? TOKENS.income : TOKENS.expense, flexShrink: 0 }}>
          {formatCLP(t.amount)}
        </span>
        <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
          <button
            onClick={() => setMode((m) => (m === "edit" ? null : "edit"))}
            title="Corregir fecha o monto"
            aria-label="Corregir fecha o monto"
            style={{ background: "none", border: "none", cursor: "pointer", color: mode === "edit" ? TOKENS.accent : TOKENS.textFaint, padding: 5 }}
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={() => setMode((m) => (m === "link" ? null : "link"))}
            title="Vincular a mano con un movimiento del banco"
            aria-label="Vincular a mano con un movimiento del banco"
            disabled={bankCandidates.length === 0}
            style={{
              background: "none", border: "none", padding: 5,
              cursor: bankCandidates.length === 0 ? "default" : "pointer",
              color: mode === "link" ? TOKENS.accent : TOKENS.textFaint,
              opacity: bankCandidates.length === 0 ? 0.4 : 1,
            }}
          >
            <Link2 size={13} />
          </button>
        </div>
      </div>

      {mode === "edit" && (
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8, marginTop: 8, padding: "10px 12px", background: TOKENS.surfaceAlt, borderRadius: 8 }}>
          <FieldInput label="Fecha" type="date" value={date} onChange={setDate} style={{ flex: 1 }} />
          <FieldInput label="Monto (CLP)" type="number" value={amount} onChange={setAmount} style={{ flex: 1 }} />
          <button onClick={saveEdit} style={{ padding: "8px 12px", borderRadius: 7, border: "none", background: TOKENS.accent, color: TOKENS.bg, fontWeight: 600, fontSize: 12, cursor: "pointer" }}>
            Guardar
          </button>
          <button onClick={close} aria-label="Cancelar" style={{ padding: 8, borderRadius: 7, border: `1px solid ${TOKENS.border}`, background: "transparent", color: TOKENS.textMuted, cursor: "pointer" }}>
            <X size={14} />
          </button>
        </div>
      )}

      {mode === "link" && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, padding: "10px 12px", background: TOKENS.surfaceAlt, borderRadius: 8, flexWrap: "wrap" }}>
          <select
            value={bankId}
            onChange={(e) => setBankId(e.target.value)}
            style={{ flex: "1 1 220px", padding: "7px 9px", borderRadius: 7, border: `1px solid ${TOKENS.border}`, background: TOKENS.surface, color: TOKENS.text, fontSize: 12.5 }}
          >
            <option value="">Elige el movimiento del banco…</option>
            {bankCandidates.map((b) => (
              <option key={b.id} value={b.id}>
                {formatDateDisplay(b.date)} · {b.description} · {formatCLP(b.amount)}
              </option>
            ))}
          </select>
          <button
            onClick={confirmMatch}
            disabled={!bankId}
            style={{
              padding: "8px 12px", borderRadius: 7, border: "none", fontWeight: 600, fontSize: 12,
              background: TOKENS.accent, color: TOKENS.bg, cursor: bankId ? "pointer" : "default", opacity: bankId ? 1 : 0.6,
            }}
          >
            Vincular
          </button>
          <button onClick={close} aria-label="Cancelar" style={{ padding: 8, borderRadius: 7, border: `1px solid ${TOKENS.border}`, background: "transparent", color: TOKENS.textMuted, cursor: "pointer" }}>
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
