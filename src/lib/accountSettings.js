// account_settings es una tabla de un solo registro por usuario (no una
// lista como transactions/categories), así que no encaja en el patrón
// array-diffing de storage.js — se maneja aparte con get/save directos.
import { supabase } from "./supabaseClient.js";

// Devuelve null tanto si el usuario todavía no ajustó su saldo (no hay fila)
// como si falló la lectura — en ambos casos el dashboard debe mostrar el
// estado "sin ajustar" en vez de romper.
export async function getAccountSettings() {
  try {
    const { data, error } = await supabase.from("account_settings").select("base_balance, last_sync_date").maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return { baseBalance: Number(data.base_balance), lastSyncDate: data.last_sync_date };
  } catch (e) {
    console.error("No se pudo leer account_settings desde Supabase", e);
    return null;
  }
}

// user_id no se manda: la columna tiene `default auth.uid()`, y como es la
// primary key, Postgres la resuelve antes de evaluar el ON CONFLICT — mismo
// patrón que ya usa storage.js para las demás tablas.
// lastSyncDate es opcional: el ajuste manual usa "ahora" (default), pero la
// conciliación automática al importar el .xls necesita fijarlo a la fecha
// exacta de la fila más reciente del banco, no al momento de la importación.
export async function saveAccountSettings(baseBalance, lastSyncDate = new Date().toISOString()) {
  try {
    const { error } = await supabase
      .from("account_settings")
      .upsert({ base_balance: baseBalance, last_sync_date: lastSyncDate }, { onConflict: "user_id" });
    if (error) throw error;
    return { baseBalance, lastSyncDate };
  } catch (e) {
    console.error("No se pudo guardar account_settings en Supabase", e);
    return null;
  }
}
