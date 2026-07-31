import { useState } from "react";
import { Trash2, X } from "lucide-react";
import { TOKENS } from "../lib/constants.js";

export function CategoryManager({ categories, onAdd, onRename, onDelete, onClose }) {
  const [newLabel, setNewLabel] = useState("");
  return (
    <div style={{ background: TOKENS.surface, border: `1px solid ${TOKENS.border}`, borderRadius: 12, padding: 18, marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
        <div className="display" style={{ fontSize: 13.5, fontWeight: 600 }}>Categorías</div>
        <button onClick={onClose} style={{ background: "none", border: "none", color: TOKENS.textFaint, cursor: "pointer" }}><X size={16} /></button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
        {categories.map((c) => (
          <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: c.color, flexShrink: 0 }} />
            <input
              defaultValue={c.label}
              onBlur={(e) => { if (e.target.value.trim() && e.target.value !== c.label) onRename(c.id, e.target.value.trim()); }}
              style={{ flex: 1, padding: "6px 9px", borderRadius: 6, border: `1px solid ${TOKENS.border}`, background: TOKENS.surfaceAlt, color: TOKENS.text, fontSize: 12.5 }}
            />
            <button onClick={() => onDelete(c.id)} style={{ background: "none", border: "none", color: TOKENS.textFaint, cursor: "pointer" }} title="Eliminar (los movimientos pasan a Otros)">
              <Trash2 size={13} />
            </button>
          </div>
        ))}
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
