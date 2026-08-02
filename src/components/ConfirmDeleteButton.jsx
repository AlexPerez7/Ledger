import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Trash2 } from "lucide-react";
import { TOKENS } from "../lib/constants.js";

// Popover en portal (no absolute anidado) para que no lo recorten los
// contenedores con overflow:hidden que usan las listas de la app.
export function ConfirmDeleteButton({ onConfirm, text = "¿Eliminar?", size = 13, color, title = "Eliminar" }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState(null);
  const btnRef = useRef(null);
  const popRef = useRef(null);

  const openPopover = () => {
    const rect = btnRef.current.getBoundingClientRect();
    setCoords({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (popRef.current?.contains(e.target) || btnRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        title={title}
        aria-label={title}
        onClick={(e) => { e.stopPropagation(); openPopover(); }}
        style={{ background: "none", border: "none", cursor: "pointer", color: color || TOKENS.textFaint, padding: 4 }}
      >
        <Trash2 size={size} />
      </button>
      {open && coords && createPortal(
        <div
          ref={popRef}
          style={{
            position: "fixed", top: coords.top, right: coords.right, zIndex: 1000, width: 190,
            background: TOKENS.surfaceAlt, border: `1px solid ${TOKENS.border}`, borderRadius: 10,
            padding: 10, boxShadow: "0 10px 28px rgba(0,0,0,0.45)",
          }}
        >
          <div style={{ fontSize: 12, color: TOKENS.text, marginBottom: 8, lineHeight: 1.4 }}>{text}</div>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={() => { setOpen(false); onConfirm(); }}
              style={{ flex: 1, padding: "6px 0", borderRadius: 6, border: "none", background: TOKENS.expense, color: "#fff", fontSize: 11.5, fontWeight: 600, cursor: "pointer" }}
            >
              Eliminar
            </button>
            <button
              onClick={() => setOpen(false)}
              style={{ flex: 1, padding: "6px 0", borderRadius: 6, border: `1px solid ${TOKENS.border}`, background: "transparent", color: TOKENS.textMuted, fontSize: 11.5, cursor: "pointer" }}
            >
              Cancelar
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
