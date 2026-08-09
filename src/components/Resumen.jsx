import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Legend,
} from "recharts";
import { ArrowUpRight, ArrowDownRight, PieChart as PieChartIcon, BarChart3, ImageDown, Loader2, Pencil, X } from "lucide-react";
import { TOKENS } from "../lib/constants.js";
import { formatCLP } from "../lib/utils.js";
import { Panel, EmptyState, StatCard, FieldInput } from "./Shared.jsx";
import { SpendHeatmap } from "./Heatmap.jsx";
import { HeroStat } from "./HeroStat.jsx";
import { Insights } from "./Insights.jsx";
import { ErrorBoundary } from "./ErrorBoundary.jsx";

const MONTH_NAMES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
function fmtMonth(m) {
  if (!m) return "";
  const [y, mo] = m.split("-");
  return `${MONTH_NAMES[parseInt(mo, 10) - 1]} ${y}`;
}

// lastSyncDate es un timestamp completo (hora incluida), no una fecha simple
// como las que maneja formatDateDisplay — se muestra con el formato local.
function formatSyncDate(iso) {
  return new Date(iso).toLocaleString("es-CL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function Resumen({
  stats, byCategory, byMonth, currentMonth, dailySpend, hasTransactions, heroStat, insights, pushToast,
  dynamicBalance, lastSyncDate, onAdjustBalance,
}) {
  const captureRef = useRef(null);
  const [exporting, setExporting] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);

  const handleExport = async () => {
    if (!captureRef.current || exporting) return;
    setExporting(true);
    try {
      const bg = getComputedStyle(document.documentElement).getPropertyValue("--color-bg").trim();
      const dataUrl = await toPng(captureRef.current, { backgroundColor: bg || undefined, pixelRatio: 2, skipFonts: true });
      const link = document.createElement("a");
      link.download = `resumen-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error(e);
      pushToast?.("error", "No se pudo generar la imagen del resumen.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      {hasTransactions && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
          <button
            onClick={handleExport}
            disabled={exporting}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 8,
              border: `1px solid ${TOKENS.border}`, background: TOKENS.surface, color: TOKENS.textMuted,
              fontSize: 12, cursor: exporting ? "default" : "pointer", opacity: exporting ? 0.7 : 1,
            }}
          >
            {exporting ? <Loader2 size={13} className="spin" /> : <ImageDown size={13} />}
            {exporting ? "Generando…" : "Guardar resumen"}
          </button>
        </div>
      )}

      <div ref={captureRef}>
      {hasTransactions && <Insights items={insights} />}

      {hasTransactions && heroStat && (
        <ErrorBoundary>
          <HeroStat {...heroStat} />
        </ErrorBoundary>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, marginBottom: 24 }}>
        <StatCard
          label="Saldo actual"
          value={dynamicBalance != null ? formatCLP(dynamicBalance) : "—"}
          sub={lastSyncDate ? `ajustado el ${formatSyncDate(lastSyncDate)}` : "ajusta tu saldo para verlo actualizado"}
          accent={TOKENS.accent}
          action={
            <button
              onClick={() => setShowAdjustModal(true)}
              aria-label="Ajustar saldo"
              title="Ajustar saldo"
              style={{ background: "none", border: "none", cursor: "pointer", color: TOKENS.textFaint, padding: 0 }}
            >
              <Pencil size={13} />
            </button>
          }
        />
        <StatCard label="Ingresos" value={formatCLP(stats.income)} icon={ArrowUpRight} accent={TOKENS.income} />
        <StatCard label="Gastos" value={formatCLP(stats.expense)} icon={ArrowDownRight} accent={TOKENS.expense} />
        <StatCard label="Balance del período" value={formatCLP(stats.balance)} accent={stats.balance >= 0 ? TOKENS.income : TOKENS.expense} />
      </div>

      <div className="resumen-charts-grid" style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 16, marginBottom: 16 }}>
        <Panel title={`Gasto por categoría${currentMonth ? ` · ${fmtMonth(currentMonth)}` : ""}`}>
          {byCategory.length === 0 ? (
            <EmptyState icon={PieChartIcon} title="Sin gastos este período" text="Los gastos categorizados van a aparecer aquí apenas importes o agregues movimientos." />
          ) : (
            <div className="category-chart-row" style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div className="category-chart-pie" style={{ width: "55%", flexShrink: 0 }}>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius={52} outerRadius={82} paddingAngle={2}>
                      {byCategory.map((entry) => <Cell key={entry.id} fill={entry.color} stroke={TOKENS.surface} strokeWidth={2} />)}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: TOKENS.surfaceAlt, border: `1px solid ${TOKENS.border}`, borderRadius: 8, fontSize: 12 }}
                      itemStyle={{ color: TOKENS.text }}
                      labelStyle={{ color: TOKENS.text }}
                      formatter={(v) => formatCLP(v)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 7 }}>
                {byCategory.slice(0, 6).map((c) => {
                  const CatIcon = c.icon;
                  return (
                    <div key={c.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12.5 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7, color: TOKENS.textMuted }}>
                        <span style={{
                          width: 18, height: 18, borderRadius: 5, background: `${c.color}22`, display: "flex",
                          alignItems: "center", justifyContent: "center", flexShrink: 0,
                        }}>
                          <CatIcon size={11} color={c.color} />
                        </span>
                        {c.name}
                      </div>
                      <span className="mono" style={{ color: TOKENS.text }}>{formatCLP(c.value)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Panel>

        <Panel title="Últimos 6 meses">
          {byMonth.length === 0 ? (
            <EmptyState icon={BarChart3} title="Sin historial todavía" text="Importa movimientos del banco para ver cómo evoluciona tu gasto mes a mes." />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke={TOKENS.border} vertical={false} />
                <XAxis dataKey="month" tickFormatter={fmtMonth} stroke={TOKENS.textFaint} fontSize={11} />
                <YAxis stroke={TOKENS.textFaint} fontSize={11} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                <Tooltip
                  contentStyle={{ background: TOKENS.surfaceAlt, border: `1px solid ${TOKENS.border}`, borderRadius: 8, fontSize: 12 }}
                  itemStyle={{ color: TOKENS.text }}
                  labelStyle={{ color: TOKENS.text, marginBottom: 2 }}
                  labelFormatter={fmtMonth}
                  formatter={(v) => formatCLP(v)}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="ingresos" fill={TOKENS.income} radius={[3, 3, 0, 0]} />
                <Bar dataKey="gastos" fill={TOKENS.expense} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Panel>
      </div>

      <Panel title="Actividad de gasto diaria">
        <ErrorBoundary>
          <SpendHeatmap dailySpend={dailySpend} hasTransactions={hasTransactions} />
        </ErrorBoundary>
      </Panel>
      </div>

      {showAdjustModal && (
        <AdjustBalanceModal
          currentBalance={dynamicBalance}
          onAdjust={onAdjustBalance}
          onClose={() => setShowAdjustModal(false)}
          pushToast={pushToast}
        />
      )}
    </div>
  );
}

function AdjustBalanceModal({ currentBalance, onAdjust, onClose, pushToast }) {
  const [value, setValue] = useState(currentBalance != null ? String(Math.round(currentBalance)) : "");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const n = parseFloat(value);
    if (isNaN(n) || saving) return;
    setSaving(true);
    const ok = await onAdjust(n);
    setSaving(false);
    if (ok) {
      pushToast?.("ok", "Saldo ajustado correctamente.");
      onClose();
    } else {
      pushToast?.("error", "No se pudo ajustar el saldo. Revisa tu conexión e inténtalo de nuevo.");
    }
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex",
        alignItems: "center", justifyContent: "center", zIndex: 2000, padding: 20,
      }}
    >
      <div style={{ background: TOKENS.surface, border: `1px solid ${TOKENS.border}`, borderRadius: 16, padding: 22, maxWidth: 360, width: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <div className="display" style={{ fontSize: 14.5, fontWeight: 600 }}>Ajustar saldo</div>
          <button onClick={onClose} aria-label="Cerrar" title="Cerrar" style={{ background: "none", border: "none", color: TOKENS.textFaint, cursor: "pointer" }}>
            <X size={16} />
          </button>
        </div>
        <div style={{ fontSize: 12, color: TOKENS.textMuted, marginBottom: 14, lineHeight: 1.4 }}>
          Ingresa el saldo real de tu cuenta ahora mismo (el que muestra tu banco). Desde este momento, la app suma o resta tus movimientos manuales para mantenerlo actualizado.
        </div>
        <FieldInput label="Saldo actual (CLP)" type="number" value={value} onChange={setValue} placeholder="0" style={{ marginBottom: 14 }} />
        <button
          onClick={submit}
          disabled={saving || value === ""}
          style={{
            width: "100%", padding: "10px 0", borderRadius: 8, border: "none", cursor: saving ? "default" : "pointer",
            background: TOKENS.accent, color: TOKENS.bg, fontWeight: 600, fontSize: 13, opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? "Guardando…" : "Guardar saldo"}
        </button>
      </div>
    </div>
  );
}
