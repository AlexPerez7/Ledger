import { useState } from "react";
import { X } from "lucide-react";
import { TOKENS, ICONS, ICON_NAMES, PALETTE, DEFAULT_CATEGORY_ICON, resolveCategoryIcon, categoryType } from "../lib/constants.js";
import { ConfirmDeleteButton } from "./ConfirmDeleteButton.jsx";
import { ToggleSwitch, FieldInput } from "./Shared.jsx";

export function CategoryManager({ categories, onAdd, onRename, onDelete, onIconChange, onColorChange, onToggleExpense, onBudgetChange, onTypeChange }) {
  const [newLabel, setNewLabel] = useState("");
  const [newIcon, setNewIcon] = useState("Shapes");
  const [newColor, setNewColor] = useState(PALETTE[0]);
  const [newType, setNewType] = useState("expense");
  // "new" identifica el picker de la fila para agregar categoría; cualquier
  // otro valor es el id de una categoría existente que se está editando.
  const [pickerFor, setPickerFor] = useState(null);

  const submitAdd = () => {
    if (!newLabel.trim()) return;
    onAdd(newLabel.trim(), newIcon, newColor, newType);
    setNewLabel("");
    setNewIcon("Shapes");
    setNewColor(PALETTE[0]);
    setNewType("expense");
    setPickerFor(null);
  };

  const NewIcon = ICONS[newIcon] || DEFAULT_CATEGORY_ICON;

  return (
    <div style={{ background: TOKENS.surface, border: `1px solid ${TOKENS.border}`, borderRadius: 12, padding: 18, marginBottom: 20 }}>
      <div style={{ marginBottom: 14 }}>
        <div className="display" style={{ fontSize: 13.5, fontWeight: 600 }}>Categorías</div>
        <div style={{ fontSize: 11, color: TOKENS.textFaint, marginTop: 3, lineHeight: 1.4, maxWidth: 320 }}>
          El interruptor de cada fila define si esa categoría cuenta como gasto en resúmenes y gráficos.
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
        {categories.map((c) => {
          const CatIcon = resolveCategoryIcon(c);
          const pickerOpen = pickerFor === c.id;
          // Los ingresos son montos positivos: el filtro de gasto (t.amount < 0)
          // ya los excluye siempre, sin importar este flag — mostrar el
          // interruptor ahí sería un control que no hace nada.
          const isIncome = categoryType(c) === "income";
          return (
            <div key={c.id} style={{ background: TOKENS.surfaceAlt, border: `1px solid ${TOKENS.border}`, borderRadius: 10, padding: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  onClick={() => setPickerFor(pickerOpen ? null : c.id)}
                  title="Cambiar ícono y color"
                  aria-label={`Cambiar ícono y color de ${c.label}`}
                  aria-expanded={pickerOpen}
                  style={{
                    width: 32, height: 32, borderRadius: 8, background: `${c.color}22`, display: "flex",
                    alignItems: "center", justifyContent: "center", flexShrink: 0, border: pickerOpen ? `1px solid ${c.color}` : "1px solid transparent",
                    cursor: "pointer", padding: 0,
                  }}
                >
                  <CatIcon size={16} color={c.color} />
                </button>
                <input
                  defaultValue={c.label}
                  onBlur={(e) => { if (e.target.value.trim() && e.target.value !== c.label) onRename(c.id, e.target.value.trim()); }}
                  style={{ flex: 1, minWidth: 0, padding: "6px 9px", borderRadius: 6, border: "none", background: "transparent", color: TOKENS.text, fontSize: 12.5 }}
                />
                <ToggleSwitch
                  checked={!c.excludeFromExpense}
                  onChange={() => onToggleExpense(c.id)}
                  disabled={isIncome}
                  ariaLabel={`${c.label} cuenta como gasto`}
                  title={isIncome ? "Los ingresos nunca cuentan como gasto" : "Cuenta como gasto en resúmenes y gráficos"}
                />
                <div style={{ width: 1, height: 20, background: TOKENS.border, flexShrink: 0 }} />
                <ConfirmDeleteButton
                  onConfirm={() => onDelete(c.id)}
                  text={`Los movimientos en "${c.label}" van a pasar a Otros. ¿Eliminar la categoría?`}
                  size={13}
                  title="Eliminar (los movimientos pasan a Otros)"
                />
              </div>
              {pickerOpen && (
                <AppearancePicker
                  color={c.color}
                  icon={c.icon || "Shapes"}
                  budget={c.budget}
                  type={categoryType(c)}
                  onColorChange={(color) => onColorChange(c.id, color)}
                  onIconChange={(icon) => onIconChange(c.id, icon)}
                  onBudgetChange={(budget) => onBudgetChange(c.id, budget)}
                  onTypeChange={(type) => onTypeChange(c.id, type)}
                  onClose={() => setPickerFor(null)}
                />
              )}
            </div>
          );
        })}
      </div>

      <div style={{ background: TOKENS.surfaceAlt, border: `1px solid ${TOKENS.border}`, borderRadius: 10, padding: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={() => setPickerFor(pickerFor === "new" ? null : "new")}
            title="Elegir ícono y color"
            aria-label="Elegir ícono y color de la nueva categoría"
            aria-expanded={pickerFor === "new"}
            style={{
              width: 32, height: 32, borderRadius: 8, background: `${newColor}22`, display: "flex",
              alignItems: "center", justifyContent: "center", flexShrink: 0, border: pickerFor === "new" ? `1px solid ${newColor}` : "1px solid transparent",
              cursor: "pointer", padding: 0,
            }}
          >
            <NewIcon size={16} color={newColor} />
          </button>
          <input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") submitAdd(); }}
            placeholder="Nueva categoría, ej: Claude / IA"
            style={{ flex: 1, minWidth: 0, padding: "6px 9px", borderRadius: 6, border: "none", background: "transparent", color: TOKENS.text, fontSize: 12.5 }}
          />
          <button
            onClick={submitAdd}
            style={{ padding: "7px 14px", borderRadius: 8, border: "none", background: TOKENS.accent, color: TOKENS.bg, fontWeight: 600, fontSize: 12.5, cursor: "pointer", flexShrink: 0 }}
          >
            Agregar
          </button>
        </div>
        {pickerFor === "new" && (
          <AppearancePicker
            color={newColor}
            icon={newIcon}
            type={newType}
            onColorChange={setNewColor}
            onIconChange={setNewIcon}
            onTypeChange={setNewType}
            onClose={() => setPickerFor(null)}
          />
        )}
      </div>
    </div>
  );
}

// selector combinado de color + ícono — se usa tanto para editar una
// categoría existente como para la que se está creando, así ambos flujos
// tienen la misma experiencia.
function AppearancePicker({ color, icon, budget, type, onColorChange, onIconChange, onBudgetChange, onTypeChange, onClose }) {
  const [budgetInput, setBudgetInput] = useState(budget != null ? String(budget) : "");
  return (
    <div style={{
      marginTop: 8, padding: 10, background: TOKENS.surface, border: `1px solid ${TOKENS.border}`, borderRadius: 8,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ fontSize: 10.5, color: TOKENS.textFaint }}>Color</div>
        <button onClick={onClose} aria-label="Cerrar selector" title="Listo" style={{ background: "none", border: "none", color: TOKENS.textFaint, cursor: "pointer", padding: 2 }}>
          <X size={13} />
        </button>
      </div>

      {onTypeChange && (
        <>
          <div style={{ fontSize: 10.5, color: TOKENS.textFaint, marginBottom: 8 }}>Tipo</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            {[["expense", "Gasto", TOKENS.expense], ["income", "Ingreso", TOKENS.income], ["both", "Ambos", TOKENS.accent]].map(([v, text, accent]) => {
              const selected = (type || "expense") === v;
              return (
                <button
                  key={v}
                  onClick={() => onTypeChange(v)}
                  aria-pressed={selected}
                  title={v === "both" ? "Se sugiere tanto al cargar gastos como ingresos (ej. transferencias)" : undefined}
                  style={{
                    flex: 1, padding: "7px 0", borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer",
                    border: `1px solid ${selected ? accent : TOKENS.border}`,
                    background: selected ? `${accent}22` : "transparent",
                    color: selected ? accent : TOKENS.textMuted,
                  }}
                >
                  {text}
                </button>
              );
            })}
          </div>
        </>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
        {PALETTE.map((col) => {
          const selected = col === color;
          return (
            <button
              key={col}
              onClick={() => onColorChange(col)}
              title={col}
              aria-label={`Usar color ${col}`}
              aria-pressed={selected}
              style={{
                width: 26, height: 26, borderRadius: "50%", background: col, cursor: "pointer", padding: 0,
                border: selected ? `2px solid ${TOKENS.text}` : "2px solid transparent", boxShadow: selected ? `0 0 0 1px ${TOKENS.surface}` : "none",
              }}
            />
          );
        })}
      </div>

      <div style={{ fontSize: 10.5, color: TOKENS.textFaint, marginBottom: 8 }}>Ícono</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {ICON_NAMES.map((name) => {
          const OptionIcon = ICONS[name];
          const selected = (icon || "Shapes") === name;
          return (
            <button
              key={name}
              title={name}
              onClick={() => onIconChange(name)}
              style={{
                width: 36, height: 36, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
                background: selected ? `${color}33` : "transparent",
                border: `1px solid ${selected ? color : TOKENS.border}`, cursor: "pointer", padding: 0,
              }}
            >
              <OptionIcon size={16} color={selected ? color : TOKENS.textMuted} />
            </button>
          );
        })}
      </div>

      {onBudgetChange && type !== "income" && (
        <>
          <div style={{ width: "100%", height: 1, background: TOKENS.border, margin: "12px 0" }} />
          <FieldInput
            label="Presupuesto mensual (CLP, opcional)"
            type="number"
            value={budgetInput}
            onChange={setBudgetInput}
            onBlur={() => onBudgetChange(budgetInput === "" ? null : parseFloat(budgetInput))}
            placeholder="Sin límite"
          />
        </>
      )}
    </div>
  );
}
