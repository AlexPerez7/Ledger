import { MERCHANT_RULES_DEFAULT, NOISE_TOKENS } from "./constants.js";

export function autoCategory(desc) {
  const d = desc.toUpperCase();
  if (d.includes("ASSERTIVA")) return "ingreso";
  for (const [keys, cat] of MERCHANT_RULES_DEFAULT) {
    if (keys.some((k) => d.includes(k))) return cat;
  }
  if (d.startsWith("TRANSF") || d.includes("TRANSF.") || d.includes("TRANSF ")) return "transferencias";
  return "otros";
}

// Sugiere una "llave de coincidencia" estable para una descripción: quita
// códigos de país, ciudades y ruido numérico al final, para que agrupe
// cargos repetidos del mismo comercio aunque el banco cambie la ciudad.
export function suggestMatchKey(desc) {
  const tokens = desc.toUpperCase().trim().split(/\s+/);
  while (tokens.length > 2) {
    const last = tokens[tokens.length - 1];
    if (NOISE_TOKENS.has(last) || /^\d+$/.test(last) || /^\d{4}-\d{2}-\d{2}$/.test(last)) {
      tokens.pop();
    } else break;
  }
  return tokens.join(" ");
}

export function applyMerchantRules(desc, rules) {
  const d = desc.toUpperCase();
  let best = null;
  for (const r of rules) {
    if (r.matchText && d.includes(r.matchText.toUpperCase())) {
      if (!best || r.matchText.length > best.matchText.length) best = r;
    }
  }
  return best;
}

export function parseClpNumber(raw) {
  if (raw === undefined || raw === null || raw === "") return 0;
  if (typeof raw === "number") return raw;
  const cleaned = String(raw).replace(/\$/g, "").replace(/\s/g, "").replace(/\./g, "").replace(/,/g, ".");
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

export function parseBankDate(raw) {
  if (typeof raw === "number") {
    const epoch = new Date(Date.UTC(1899, 11, 30));
    const d = new Date(epoch.getTime() + raw * 86400000);
    return d.toISOString().slice(0, 10);
  }
  const s = String(raw).trim();
  const m = s.match(/^(\d{2})[-\/](\d{2})[-\/](\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  return s;
}

export function makeKey(date, desc, cargo, abono) {
  return [date, desc.trim().toUpperCase().replace(/\s+/g, " "), cargo, abono].join("|");
}

export function formatCLP(n) {
  const sign = n < 0 ? "-" : "";
  return `${sign}$${Math.abs(Math.round(n)).toLocaleString("es-CL")}`;
}

export function formatDateDisplay(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}-${m}-${y}`;
}

export function monthKey(iso) {
  return iso ? iso.slice(0, 7) : "";
}

export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
