import { useState, useRef, useEffect } from "react";
import { motion, useAnimation } from "framer-motion";
import { Upload, Plus, Check, Pencil, X, Inbox, SearchX, CalendarX2, Download, Loader2, Trash2 } from "lucide-react";
import { TOKENS } from "../lib/constants.js";
import { formatCLP, suggestMatchKey, groupByDate, formatDayHeading } from "../lib/utils.js";
import { EmptyState, FieldInput } from "./Shared.jsx";
import { ConfirmDeleteButton } from "./ConfirmDeleteButton.jsx";
import { useIsMobile } from "../lib/useIsMobile.js";
import { exportBackup } from "../lib/exportBackup.js";

const SWIPE_ACTION_WIDTH = 128; // ancho de los 2 botones (editar + borrar) revelados al deslizar

const actionBtnStyle = {
  display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: 8,
  border: `1px solid ${TOKENS.border}`, background: TOKENS.surface, color: TOKENS.textMuted,
  fontSize: 12.5, cursor: "pointer", whiteSpace: "nowrap",
};

export function Movimientos({
  filteredTx, hasTransactions, categories, getCat, search, setSearch, catFilter, setCatFilter,
  saveTxEdit, deleteTransaction, showManualForm, setShowManualForm, addManual, handleFile, pushToast,
  onBulkDelete, onBulkChangeCategory,
}) {
  const [exportingBackup, setExportingBackup] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  // Selección múltiple: por ahora solo rastrea IDs elegidos (base para
  // futuras acciones masivas — categorizar/borrar en lote, etc.), sin
  // ninguna acción real todavía.
  const [selectedIds, setSelectedIds] = useState([]);
  const selectAllRef = useRef(null);

  const toggleSelectOne = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const visibleIds = filteredTx.map((t) => t.id);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));
  const someVisibleSelected = visibleIds.some((id) => selectedIds.includes(id));

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  // el estado "indeterminado" (algunas, no todas) del checkbox nativo solo
  // se puede setear vía DOM, no existe como prop de React
  useEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = someVisibleSelected && !allVisibleSelected;
  }, [someVisibleSelected, allVisibleSelected]);

  // acciones masivas: onBulkDelete/onBulkChangeCategory ya hablan con
  // Supabase (vía persistTx en App.jsx) y devuelven si funcionó o no —
  // aquí solo se limpia la selección cuando la acción realmente terminó bien.
  const handleBulkDelete = async () => {
    const count = selectedIds.length;
    const ok = await onBulkDelete(selectedIds);
    if (ok) {
      pushToast?.("ok", `${count} movimiento${count === 1 ? "" : "s"} eliminado${count === 1 ? "" : "s"}.`);
      setSelectedIds([]);
    } else {
      pushToast?.("error", "No se pudo borrar. Revisa tu conexión e inténtalo de nuevo.");
    }
    return ok;
  };

  const handleBulkCategoryChange = async (categoryId) => {
    const count = selectedIds.length;
    const ok = await onBulkChangeCategory(selectedIds, categoryId);
    if (ok) {
      pushToast?.("ok", `Categoría actualizada en ${count} movimiento${count === 1 ? "" : "s"}.`);
      setSelectedIds([]);
    } else {
      pushToast?.("error", "No se pudo cambiar la categoría. Revisa tu conexión e inténtalo de nuevo.");
    }
    return ok;
  };

  const handleExportBackup = async () => {
    if (exportingBackup) return;
    setExportingBackup(true);
    try {
      await exportBackup();
    } catch (e) {
      console.error(e);
      pushToast?.("error", "No se pudo generar el respaldo. Revisa tu conexión e inténtalo de nuevo.");
    } finally {
      setExportingBackup(false);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
        <button
          onClick={handleExportBackup}
          disabled={exportingBackup}
          title="Descarga un .json con todos tus movimientos y categorías"
          style={{
            display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 8,
            border: `1px solid ${TOKENS.border}`, background: TOKENS.surface, color: TOKENS.textMuted,
            fontSize: 12, cursor: exportingBackup ? "default" : "pointer", opacity: exportingBackup ? 0.7 : 1,
          }}
        >
          {exportingBackup ? <Loader2 size={13} className="spin" /> : <Download size={13} />}
          {exportingBackup ? "Generando respaldo…" : "Descargar respaldo"}
        </button>
      </div>

      {/* recién al primer uso: sin datos todavía, conviene la invitación grande
          a importar/agregar. Una vez que hay movimientos, esas dos áreas
          gigantes solo ocupan espacio — se reemplazan por botones compactos
          junto a la búsqueda. */}
      {!hasTransactions && (
        <div className="form-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
          <ImportDropzone onFile={handleFile} />
          <button onClick={() => setShowManualForm(true)} style={{
            border: `1.5px solid ${TOKENS.border}`, borderRadius: 12, padding: "18px 16px", background: TOKENS.surface,
            display: "flex", alignItems: "center", gap: 12, cursor: "pointer", color: TOKENS.text, textAlign: "left",
          }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: TOKENS.surfaceAlt, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Plus size={16} color={TOKENS.pending} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>Agregar gasto o ingreso manual</div>
              <div style={{ fontSize: 11.5, color: TOKENS.textFaint }}>Para movimientos que aún no aparecen en el banco</div>
            </div>
          </button>
        </div>
      )}

      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
        {hasTransactions && (
          <div style={{ display: "flex", alignItems: "center", gap: 7, flexShrink: 0 }}>
            <input
              ref={selectAllRef}
              type="checkbox"
              checked={allVisibleSelected}
              onChange={toggleSelectAll}
              disabled={filteredTx.length === 0}
              aria-label={allVisibleSelected ? "Deseleccionar todo" : "Seleccionar todo"}
              title={allVisibleSelected ? "Deseleccionar todo" : "Seleccionar todo"}
              style={{ accentColor: TOKENS.accent, cursor: filteredTx.length === 0 ? "default" : "pointer", width: 15, height: 15 }}
            />
            {selectedIds.length > 0 && (
              <span style={{ fontSize: 12, color: TOKENS.textMuted, whiteSpace: "nowrap" }}>
                {selectedIds.length} seleccionado{selectedIds.length === 1 ? "" : "s"}
              </span>
            )}
          </div>
        )}
        <div style={{ position: "relative", flex: "1 1 220px" }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar movimiento…"
            style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${TOKENS.border}`, background: TOKENS.surface, color: TOKENS.text, fontSize: 13 }}
          />
        </div>
        <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} style={{ padding: "8px 10px", borderRadius: 8, border: `1px solid ${TOKENS.border}`, background: TOKENS.surface, color: TOKENS.text, fontSize: 13 }}>
          <option value="all">Todas las categorías</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
        {hasTransactions && (
          <>
            <button onClick={() => setShowImportModal(true)} style={actionBtnStyle} title="Importar movimientos del banco desde un .xls">
              <Upload size={13} /> Importar Excel
            </button>
            <button onClick={() => setShowManualForm((v) => !v)} className="new-record-btn" style={actionBtnStyle} title="Agregar un gasto o ingreso manual">
              <Plus size={13} /> Nuevo registro
            </button>
          </>
        )}
      </div>

      {showManualForm && <ManualForm categories={categories} onClose={() => setShowManualForm(false)} onSubmit={addManual} />}

      {showImportModal && (
        <ImportModal onClose={() => setShowImportModal(false)} onFile={(f) => { handleFile(f); setShowImportModal(false); }} />
      )}

      {hasTransactions && selectedIds.length === 0 && (
        <button
          onClick={() => setShowManualForm((v) => !v)}
          className="fab-add-btn"
          aria-label="Agregar gasto o ingreso manual"
          title="Agregar gasto o ingreso manual"
        >
          <Plus size={24} />
        </button>
      )}

      <div style={{ background: TOKENS.surface, border: `1px solid ${TOKENS.border}`, borderRadius: 12, overflow: "hidden" }}>
        {filteredTx.length === 0 ? (
          !hasTransactions ? (
            <EmptyState
              icon={Inbox}
              title="Todavía no hay movimientos"
              text="Sube el .xls de tu banco o agrega un gasto o ingreso manual (arriba) para empezar a ver tus finanzas aquí."
            />
          ) : search || catFilter !== "all" ? (
            <EmptyState
              icon={SearchX}
              title="Sin resultados"
              text="Ningún movimiento coincide con tu búsqueda o filtro de categoría."
              action={
                <button onClick={() => { setSearch(""); setCatFilter("all"); }} style={{
                  padding: "7px 14px", borderRadius: 8, border: `1px solid ${TOKENS.border}`, background: "transparent",
                  color: TOKENS.textMuted, fontSize: 12.5, cursor: "pointer",
                }}>
                  Limpiar filtros
                </button>
              }
            />
          ) : (
            <EmptyState
              icon={CalendarX2}
              title="Sin movimientos este mes"
              text="Prueba seleccionando 'Todo' en los meses de arriba, o sube el reporte del banco para este período."
            />
          )
        ) : (
          groupByDate(filteredTx).map((group) => (
            <div key={group.date}>
              <div
                style={{
                  padding: "9px 16px", fontSize: 11, fontWeight: 600, color: TOKENS.textFaint,
                  textTransform: "uppercase", letterSpacing: "0.03em", background: TOKENS.surfaceAlt,
                  borderBottom: `1px solid ${TOKENS.border}`,
                }}
              >
                {formatDayHeading(group.date)}
              </div>
              {group.items.map((t, i) => (
                <TxRow
                  key={t.id}
                  t={t}
                  isLast={i === group.items.length - 1}
                  categories={categories}
                  getCat={getCat}
                  saveTxEdit={saveTxEdit}
                  onDelete={deleteTransaction}
                  selected={selectedIds.includes(t.id)}
                  onToggleSelect={toggleSelectOne}
                />
              ))}
            </div>
          ))
        )}
      </div>

      {selectedIds.length > 0 && (
        <BulkActionsBar
          count={selectedIds.length}
          categories={categories}
          onDelete={handleBulkDelete}
          onChangeCategory={handleBulkCategoryChange}
          onClose={() => setSelectedIds([])}
        />
      )}
    </div>
  );
}

// Barra flotante contextual: solo existe mientras hay algo seleccionado.
// "Cambiar categoría" es un <select> normal (sin opción propia elegible) que
// dispara la acción apenas el usuario elige una categoría, en vez de un botón
// + dropdown separados — menos clics, mismo resultado.
function BulkActionsBar({ count, categories, onDelete, onChangeCategory, onClose }) {
  const [busy, setBusy] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const handleDeleteClick = async () => {
    setBusy(true);
    try {
      await onDelete();
    } finally {
      setBusy(false);
      setConfirmingDelete(false);
    }
  };

  const handleCategorySelect = async (e) => {
    const categoryId = e.target.value;
    if (!categoryId) return;
    setBusy(true);
    try {
      await onChangeCategory(categoryId);
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  };

  return (
    <div
      className="bulk-action-bar"
      style={{
        position: "fixed", left: "50%", bottom: 20, transform: "translateX(-50%)", zIndex: 1500,
        display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12,
        background: TOKENS.surfaceAlt, border: `1px solid ${TOKENS.border}`,
        boxShadow: "0 10px 28px rgba(0,0,0,0.4)", maxWidth: "calc(100vw - 28px)", flexWrap: "wrap", justifyContent: "center",
      }}
    >
      <span style={{ fontSize: 12.5, fontWeight: 600, color: TOKENS.text, whiteSpace: "nowrap" }}>
        {count} seleccionado{count === 1 ? "" : "s"}
      </span>

      <select
        onChange={handleCategorySelect}
        disabled={busy}
        defaultValue=""
        aria-label="Cambiar categoría de los movimientos seleccionados"
        style={{ padding: "7px 9px", borderRadius: 8, border: `1px solid ${TOKENS.border}`, background: TOKENS.surface, color: TOKENS.text, fontSize: 12.5 }}
      >
        <option value="" disabled>Cambiar categoría…</option>
        {categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
      </select>

      {confirmingDelete ? (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 12, color: TOKENS.textMuted }}>¿Seguro?</span>
          <button
            onClick={handleDeleteClick}
            disabled={busy}
            style={{
              display: "flex", alignItems: "center", gap: 5, padding: "6px 10px", borderRadius: 7, border: "none",
              background: TOKENS.expense, color: "#fff", fontSize: 12, fontWeight: 600, cursor: busy ? "default" : "pointer",
            }}
          >
            {busy ? <Loader2 size={12} className="spin" /> : "Confirmar"}
          </button>
          <button
            onClick={() => setConfirmingDelete(false)}
            disabled={busy}
            style={{ padding: "6px 10px", borderRadius: 7, border: `1px solid ${TOKENS.border}`, background: "transparent", color: TOKENS.textMuted, fontSize: 12, cursor: "pointer" }}
          >
            Cancelar
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConfirmingDelete(true)}
          disabled={busy}
          style={{
            display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 8, border: "none",
            background: "var(--tint-expense)", color: TOKENS.expense, fontSize: 12.5, fontWeight: 600, cursor: "pointer",
          }}
        >
          <Trash2 size={13} /> Borrar seleccionados
        </button>
      )}

      <button
        onClick={onClose}
        disabled={busy}
        aria-label="Cerrar selección"
        title="Cerrar selección"
        style={{ background: "none", border: "none", color: TOKENS.textFaint, cursor: "pointer", padding: 4 }}
      >
        <X size={15} />
      </button>
    </div>
  );
}

// Zona de drag & drop para el .xls del banco — se usa tanto en la invitación
// grande de primer uso como dentro del modal de importar (mismo componente,
// misma lógica, para no duplicar el manejo de drag/drop).
function ImportDropzone({ onFile }) {
  const [dragOver, setDragOver] = useState(false);
  return (
    <label
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) onFile(f); }}
      style={{
        border: `1.5px dashed ${dragOver ? TOKENS.accent : TOKENS.border}`, borderRadius: 12, padding: "18px 16px",
        display: "flex", alignItems: "center", gap: 12, cursor: "pointer",
        background: dragOver ? "var(--tint-accent-soft)" : TOKENS.surface,
      }}
    >
      <input type="file" accept=".xls,.xlsx" style={{ display: "none" }} onChange={(e) => e.target.files[0] && onFile(e.target.files[0])} />
      <div style={{ width: 34, height: 34, borderRadius: 8, background: TOKENS.surfaceAlt, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Upload size={16} color={TOKENS.accent} />
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 500 }}>Subir movimientos del banco</div>
        <div style={{ fontSize: 11.5, color: TOKENS.textFaint }}>Arrastra el .xls de reportCollection o haz clic para elegirlo</div>
      </div>
    </label>
  );
}

function ImportModal({ onClose, onFile }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex",
      alignItems: "center", justifyContent: "center", zIndex: 2000, padding: 20,
    }}>
      <div style={{
        background: TOKENS.surface, border: `1px solid ${TOKENS.border}`, borderRadius: 16,
        padding: 22, maxWidth: 420, width: "100%",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div className="display" style={{ fontSize: 14.5, fontWeight: 600 }}>Importar movimientos</div>
          <button onClick={onClose} aria-label="Cerrar" title="Cerrar" style={{ background: "none", border: "none", color: TOKENS.textFaint, cursor: "pointer" }}>
            <X size={16} />
          </button>
        </div>
        <ImportDropzone onFile={onFile} />
      </div>
    </div>
  );
}

function TxRow({ t, isLast, categories, getCat, saveTxEdit, onDelete, selected, onToggleSelect }) {
  const [editing, setEditing] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const cat = getCat(t.category);
  const CatIcon = cat.icon;
  const isMobile = useIsMobile();
  const swipeControls = useAnimation();
  const closeSwipe = () => swipeControls.start({ x: 0, transition: { duration: 0.18 } });

  // espera a que termine la animación de colapso antes de sacarla del estado
  const handleDelete = () => {
    closeSwipe();
    setLeaving(true);
    setTimeout(() => onDelete(t.id), 220);
  };

  const handleDragEnd = (_e, info) => {
    if (info.offset.x < -SWIPE_ACTION_WIDTH / 2) swipeControls.start({ x: -SWIPE_ACTION_WIDTH, transition: { duration: 0.18 } });
    else closeSwipe();
  };

  return (
    <div style={{ borderBottom: isLast ? "none" : `1px solid ${TOKENS.border}` }}>
      <div
        className={`tx-row-wrap tx-row-enter${leaving ? " tx-row-leaving" : ""}`}
      >
      <div className="tx-swipe-clip">
        {isMobile && (
          <div className="tx-swipe-actions" style={{ width: SWIPE_ACTION_WIDTH }}>
            <button
              className="tx-swipe-btn tx-swipe-edit"
              onClick={() => { closeSwipe(); setEditing((v) => !v); }}
              aria-label={editing ? "Cerrar edición" : "Editar movimiento"}
              title="Editar"
            >
              <Pencil size={16} />
            </button>
            <div className="tx-swipe-btn tx-swipe-delete">
              <ConfirmDeleteButton onConfirm={handleDelete} text="¿Eliminar este movimiento?" title="Eliminar movimiento" size={16} color="#fff" />
            </div>
          </div>
        )}
        <motion.div
          className="txrow-grid"
          style={{
            display: "grid", gridTemplateColumns: "20px 1fr 170px 130px auto", alignItems: "center", gap: 10,
            padding: "11px 16px", background: TOKENS.surface, touchAction: "pan-y", position: "relative",
          }}
          drag={isMobile ? "x" : false}
          dragConstraints={{ left: -SWIPE_ACTION_WIDTH, right: 0 }}
          dragElastic={0.06}
          animate={swipeControls}
          onDragEnd={handleDragEnd}
        >
        <div className="tx-check">
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggleSelect(t.id)}
            aria-label={`Seleccionar movimiento: ${t.alias || t.description}`}
            style={{ accentColor: TOKENS.accent, cursor: "pointer", width: 15, height: 15 }}
          />
        </div>
        <div className="tx-desc" style={{ fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {t.alias ? (
            <>
              <span style={{ fontWeight: 500 }}>{t.alias}</span>
              <span style={{ color: TOKENS.textFaint, fontSize: 11.5 }}> · {t.description}</span>
            </>
          ) : t.description}
          <span style={{ marginLeft: 8, fontSize: 10, color: TOKENS.textFaint, border: `1px solid ${TOKENS.border}`, borderRadius: 4, padding: "1px 5px" }}>
            {t.source === "bank" ? "banco" : "manual"}
          </span>
          {t.source === "manual" && t.reconciled && <Check size={11} color={TOKENS.income} style={{ marginLeft: 5, verticalAlign: "-1px" }} />}
        </div>
        <div className="tx-cat" style={{ fontSize: 11.5, color: cat.color, display: "flex", alignItems: "center", gap: 6, overflow: "hidden" }}>
          <span style={{
            width: 20, height: 20, borderRadius: 6, background: `${cat.color}22`, display: "flex",
            alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <CatIcon size={12} color={cat.color} />
          </span>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cat.label}</span>
        </div>
        <div className="tx-amount mono" style={{ fontSize: 13, textAlign: "right", fontWeight: 500, color: t.amount >= 0 ? TOKENS.income : TOKENS.expense }}>
          {formatCLP(t.amount)}
        </div>
        <div className="tx-actions" style={{ display: "flex" }}>
          <button onClick={() => setEditing((v) => !v)} aria-label={editing ? "Cerrar edición" : "Editar movimiento"} title="Editar" style={{ background: "none", border: "none", cursor: "pointer", color: editing ? TOKENS.accent : TOKENS.textFaint, padding: 4 }}>
            <Pencil size={13} />
          </button>
          <ConfirmDeleteButton onConfirm={handleDelete} text="¿Eliminar este movimiento?" title="Eliminar movimiento" size={13} />
        </div>
        </motion.div>
      </div>
      </div>
      {editing && <TxEditPanel t={t} categories={categories} onSave={(payload) => { saveTxEdit(t.id, payload); setEditing(false); }} onCancel={() => setEditing(false)} />}
    </div>
  );
}

function TxEditPanel({ t, categories, onSave, onCancel }) {
  const [category, setCategory] = useState(t.category);
  const [alias, setAlias] = useState(t.alias || "");
  const [remember, setRemember] = useState(t.source === "bank");
  const [matchText, setMatchText] = useState(suggestMatchKey(t.description));

  return (
    <div style={{ background: TOKENS.surfaceAlt, padding: "14px 16px", borderTop: `1px solid ${TOKENS.border}` }}>
      <div className="form-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 11, color: TOKENS.textFaint, marginBottom: 4 }}>Categoría</div>
          <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ width: "100%", padding: "7px 9px", borderRadius: 7, border: `1px solid ${TOKENS.border}`, background: TOKENS.surface, color: TOKENS.text, fontSize: 12.5 }}>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </div>
        <div>
          <div style={{ fontSize: 11, color: TOKENS.textFaint, marginBottom: 4 }}>Nombre para mostrar (opcional)</div>
          <input value={alias} onChange={(e) => setAlias(e.target.value)} placeholder="Ej: Claude" style={{ width: "100%", padding: "7px 9px", borderRadius: 7, border: `1px solid ${TOKENS.border}`, background: TOKENS.surface, color: TOKENS.text, fontSize: 12.5 }} />
        </div>
      </div>

      {t.source === "bank" && (
        <div style={{ marginBottom: 10 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: TOKENS.textMuted, marginBottom: remember ? 7 : 0, cursor: "pointer" }}>
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
            Recordar esto para futuros movimientos con una descripción parecida
          </label>
          {remember && (
            <div>
              <div style={{ fontSize: 10.5, color: TOKENS.textFaint, marginBottom: 3 }}>Se aplicará a movimientos cuya descripción contenga:</div>
              <input value={matchText} onChange={(e) => setMatchText(e.target.value)} className="mono" style={{ width: "100%", padding: "7px 9px", borderRadius: 7, border: `1px solid ${TOKENS.border}`, background: TOKENS.surface, color: TOKENS.accent, fontSize: 11.5 }} />
            </div>
          )}
        </div>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => onSave({ category, alias, remember, matchText })} style={{ padding: "7px 14px", borderRadius: 7, border: "none", background: TOKENS.accent, color: TOKENS.bg, fontWeight: 600, fontSize: 12, cursor: "pointer" }}>
          Guardar
        </button>
        <button onClick={onCancel} style={{ padding: "7px 14px", borderRadius: 7, border: `1px solid ${TOKENS.border}`, background: "transparent", color: TOKENS.textMuted, fontSize: 12, cursor: "pointer" }}>
          Cancelar
        </button>
      </div>
    </div>
  );
}

function ManualForm({ categories, onClose, onSubmit }) {
  const [type, setType] = useState("expense");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("otros");

  const submit = () => {
    const amt = parseFloat(amount);
    if (!description || !amt || amt <= 0) return;
    onSubmit({ type, date, description, amount: amt, category });
  };

  return (
    <div style={{ background: TOKENS.surfaceAlt, border: `1px solid ${TOKENS.border}`, borderRadius: 12, padding: 18, marginBottom: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
        <div className="display" style={{ fontSize: 13.5, fontWeight: 600 }}>Nuevo movimiento manual</div>
        <button onClick={onClose} aria-label="Cerrar" title="Cerrar" style={{ background: "none", border: "none", color: TOKENS.textFaint, cursor: "pointer" }}><X size={16} /></button>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {["expense", "income"].map((v) => (
          <button key={v} onClick={() => setType(v)} style={{
            flex: 1, padding: "7px 0", borderRadius: 8, fontSize: 12.5, cursor: "pointer",
            border: `1px solid ${type === v ? (v === "expense" ? TOKENS.expense : TOKENS.income) : TOKENS.border}`,
            background: type === v ? (v === "expense" ? "var(--tint-expense)" : "var(--tint-income)") : "transparent",
            color: type === v ? (v === "expense" ? TOKENS.expense : TOKENS.income) : TOKENS.textMuted,
          }}>
            {v === "expense" ? "Gasto" : "Ingreso"}
          </button>
        ))}
      </div>
      <div className="form-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
        <FieldInput label="Fecha" type="date" value={date} onChange={setDate} />
        <FieldInput label="Monto (CLP)" type="number" value={amount} onChange={setAmount} placeholder="0" />
      </div>
      <FieldInput label="Descripción" value={description} onChange={setDescription} placeholder="Ej: Almuerzo con Facu" style={{ marginBottom: 10 }} />
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: TOKENS.textFaint, marginBottom: 4 }}>Categoría</div>
        <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${TOKENS.border}`, background: TOKENS.surface, color: TOKENS.text, fontSize: 13 }}>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
      </div>
      <button onClick={submit} style={{ width: "100%", padding: "10px 0", borderRadius: 8, border: "none", cursor: "pointer", background: TOKENS.accent, color: TOKENS.bg, fontWeight: 600, fontSize: 13 }}>
        Guardar movimiento
      </button>
    </div>
  );
}
