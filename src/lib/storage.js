// Reemplaza al localStorage por tablas en Supabase (Postgres + RLS), pero
// mantiene la misma interfaz get/set que usaba App.jsx: cada "key" es en
// realidad una tabla completa, y get/set sincronizan el array JSON contra
// las filas de esa tabla para el usuario autenticado.
import { supabase } from "./supabaseClient.js";

const TABLES = {
  transactions: {
    table: "transactions",
    toRow: (t) => ({
      id: t.id,
      key: t.key,
      date: t.date,
      description: t.description,
      alias: t.alias,
      amount: t.amount,
      category: t.category,
      source: t.source,
      reconciled: t.reconciled,
      matched_id: t.matchedId,
    }),
    fromRow: (r) => ({
      id: r.id,
      key: r.key,
      date: r.date,
      description: r.description,
      alias: r.alias,
      amount: Number(r.amount),
      category: r.category,
      source: r.source,
      reconciled: r.reconciled,
      matchedId: r.matched_id,
    }),
  },
  categories: {
    table: "categories",
    toRow: (c) => ({ id: c.id, label: c.label, color: c.color, icon: c.icon }),
    fromRow: (r) => ({ id: r.id, label: r.label, color: r.color, icon: r.icon }),
  },
  merchantRules: {
    table: "merchant_rules",
    toRow: (m) => ({ id: m.id, match_text: m.matchText, category_id: m.categoryId, alias: m.alias }),
    fromRow: (r) => ({ id: r.id, matchText: r.match_text, categoryId: r.category_id, alias: r.alias }),
  },
};

export const storage = {
  async get(key) {
    const spec = TABLES[key];
    if (!spec) return null;
    try {
      const { data, error } = await supabase.from(spec.table).select("*");
      if (error) throw error;
      return { key, value: JSON.stringify(data.map(spec.fromRow)) };
    } catch (e) {
      console.error(`No se pudo leer "${key}" desde Supabase`, e);
      return null;
    }
  },

  async set(key, value) {
    const spec = TABLES[key];
    if (!spec) return null;
    try {
      const items = JSON.parse(value);

      const { data: existing, error: selError } = await supabase.from(spec.table).select("*");
      if (selError) throw selError;
      // comparamos en "forma de app" (fromRow), no la fila cruda de la DB:
      // así ignoramos columnas que la app no conoce (user_id) y evitamos
      // falsos positivos por tipos (ej. numeric que vuelve como string).
      const existingById = new Map(existing.map((r) => [r.id, spec.fromRow(r)]));

      // solo mandamos a upsert lo que es nuevo o realmente cambió — en vez
      // de reenviar la tabla completa en cada guardado.
      const changed = items.filter((item) => {
        const prev = existingById.get(item.id);
        return !prev || !shallowEqual(prev, item);
      });
      const nextIds = new Set(items.map((i) => i.id));
      const toDelete = existing.map((r) => r.id).filter((id) => !nextIds.has(id));

      if (changed.length > 0) {
        const { error: upsertError } = await supabase.from(spec.table).upsert(changed.map(spec.toRow));
        if (upsertError) throw upsertError;
      }
      if (toDelete.length > 0) {
        const { error: delError } = await supabase.from(spec.table).delete().in("id", toDelete);
        if (delError) throw delError;
      }
      return { key, value };
    } catch (e) {
      console.error(`No se pudo guardar "${key}" en Supabase`, e);
      return null;
    }
  },
};

function shallowEqual(a, b) {
  const keys = Object.keys(a);
  if (keys.length !== Object.keys(b).length) return false;
  return keys.every((k) => a[k] === b[k]);
}
