import { useState } from "react";
import { X } from "lucide-react";
import { TOKENS, ICONS, ICON_NAMES, resolveCategoryIcon } from "../lib/constants.js";
import { ConfirmDeleteButton } from "./ConfirmDeleteButton.jsx";
import { ToggleSwitch } from "./Shared.jsx";

// Los ingresos son montos positivos: el filtro de gasto (t.amount < 0) ya los
// excluye siempre, sin importar este flag — mostrar el interruptor ahí sería
// un control que no hace nada, así que se deshabilita para esa categoría.
const INCOME_CATEGORY_ID = "ingreso";

export function CategoryManager({ categories, onAdd, onRename, onDelete, onIconChange, onToggleExpense, onClose }) {
  const [newLabel, setNewLabel] = useState("");
  const [pickerFor, setPickerFor] = useState(null);

  return (
    <div style={{ background: TOKENS.surface, border: `1px solid ${TOKENS.border}`, borderRadius: 12, padding: 18, marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div>
          <div className="display" style={{ fontSize: 13.5, fontWeight: 600 }}>Categorías</div>
          <div style={{ fontSize: 11, color: TOKENS.textFaint, marginTop: 3, lineHeight: 1.4, maxWidth: 320 }}>
            El interruptor de cada fila define si esa categoría cuenta como gasto en resúmenes y gráficos.
          </div>
        </div>
        <button onClick={onClose} aria-label="Cerrar" title="Cerrar" style={{ background: "none", border: "none", color: TOKENS.textFaint, cursor: "pointer", flexShrink: 0 }}><X size={16} /></button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
        {categories.map((c) => {
          const CatIcon = resolveCategoryIcon(c);
          const pickerOpen = pickerFor === c.id;
          const isIncome = c.id === INCOME_CATEGORY_ID;
          return (
            <div key={c.id}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  onClick={() => setPickerFor(pickerOpen ? null : c.id)}
                  title="Cambiar ícono"
                  aria-label={`Cambiar ícono de ${c.label}`}
                  aria-expanded={pickerOpen}
                  style={{
                    width: 22, height: 22, borderRadius: 6, background: `${c.color}22`, display: "flex",
                    alignItems: "center", justifyContent: "center", flexShrink: 0, border: pickerOpen ? `1px solid ${c.color}` : "1px solid transparent",
                    cursor: "pointer", padding: 0,
                  }}
                >
                  <CatIcon size={13} color={c.color} />
                </button>
                <input
                  defaultValue={c.label}
                  onBlur={(e) => { if (e.target.value.trim() && e.target.value !== c.label) onRename(c.id, e.target.value.trim()); }}
                  style={{ flex: 1, padding: "6px 9px", borderRadius: 6, border: `1px solid ${TOKENS.border}`, background: TOKENS.surfaceAlt, color: TOKENS.text, fontSize: 12.5 }}
                />
                <ToggleSwitch
                  checked={!c.excludeFromExpense}
                  onChange={() => onToggleExpense(c.id)}
                  disabled={isIncome}
                  ariaLabel={`${c.label} cuenta como gasto`}
                  title={isIncome ? "Los ingresos nunca cuentan como gasto" : "Cuenta como gasto en resúmenes y gráficos"}
                />
                <ConfirmDeleteButton
                  onConfirm={() => onDelete(c.id)}
                  text={`Los movimientos en "${c.label}" van a pasar a Otros. ¿Eliminar la categoría?`}
                  size={13}
                  title="Eliminar (los movimientos pasan a Otros)"
                />
              </div>
              {pickerOpen && (
                <div style={{
                  display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8, padding: 10,
                  background: TOKENS.surfaceAlt, border: `1px solid ${TOKENS.border}`, borderRadius: 8,
                }}>
                  {ICON_NAMES.map((name) => {
                    const OptionIcon = ICONS[name];
                    const selected = (c.icon || "Shapes") === name;
                    return (
                      <button
                        key={name}
                        title={name}
                        onClick={() => { onIconChange(c.id, name); setPickerFor(null); }}
                        style={{
                          width: 26, height: 26, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center",
                          background: selected ? `${c.color}33` : "transparent",
                          border: `1px solid ${selected ? c.color : TOKENS.border}`, cursor: "pointer", padding: 0,
                        }}
                      >
                        <OptionIcon size={13} color={selected ? c.color : TOKENS.textMuted} />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder="Nueva categoría, ej: Claude / IA"
          style={{ flex: 1, padding: "8px 10px", borderRadius: 8, border: `1px solid ${TOKENS.border}`, background: TOKENS.surfaceAlt, color: TOKENS.text, fontSize: 13 }}
        />
        <button
          onClick={() => { if (newLabel.trim()) { onAdd(newLabel.trim()); setNewLabel(""); } }}
          style={{ padding: "8px 14px", borderRadius: 8, border: "none", background: TOKENS.accent, color: TOKENS.bg, fontWeight: 600, fontSize: 12.5, cursor: "pointer" }}
        >
          Agregar
        </button>
      </div>
    </div>
  );
}
