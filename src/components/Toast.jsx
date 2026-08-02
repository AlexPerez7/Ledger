import { CheckCircle2, AlertTriangle, XCircle, Loader2, X } from "lucide-react";
import { TOKENS } from "../lib/constants.js";

const KIND = {
  loading: { icon: Loader2, color: TOKENS.accent, spin: true },
  ok: { icon: CheckCircle2, color: TOKENS.income },
  warn: { icon: AlertTriangle, color: TOKENS.pending },
  error: { icon: XCircle, color: TOKENS.expense },
};

export function ToastStack({ toasts, onDismiss }) {
  if (toasts.length === 0) return null;
  return (
    <div className="toast-stack">
      {toasts.map((t) => {
        const { icon: Icon, color, spin } = KIND[t.type] || KIND.ok;
        return (
          <div key={t.id} role="status" className={`toast${t.leaving ? " toast-leaving" : ""}`} style={{
            display: "flex", alignItems: "flex-start", gap: 10, padding: "11px 12px", borderRadius: 10,
            background: TOKENS.surface, border: `1px solid ${TOKENS.border}`, boxShadow: "0 10px 28px rgba(0,0,0,0.4)",
          }}>
            <Icon size={16} color={color} className={spin ? "spin" : undefined} style={{ flexShrink: 0, marginTop: 1 }} />
            <div style={{ fontSize: 12.5, color: TOKENS.text, flex: 1, lineHeight: 1.4 }}>{t.text}</div>
            {t.type !== "loading" && (
              <button onClick={() => onDismiss(t.id)} aria-label="Cerrar notificación" style={{ background: "none", border: "none", cursor: "pointer", color: TOKENS.textFaint, padding: 0, flexShrink: 0, marginTop: 1 }}>
                <X size={14} />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
