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

// lastSyncDate es opcional: el ajuste manual usa "ahora" (default), pero la
// conciliación automática al importar el .xls necesita fijarlo a la fecha
// exacta de la fila más reciente del banco, no al momento de la importación.
export async function saveAccountSettings(baseBalance, lastSyncDate = new Date().toISOString()) {
  try {
    // user_id SÍ hay que mandarlo explícito en el payload: con
    // onConflict: "user_id", PostgREST arma el INSERT ... ON CONFLICT
    // (user_id) usando solo las columnas presentes en el body. Si user_id no
    // viene (aunque la columna tenga default auth.uid()), la primera vez
    // igual inserta bien (no hay fila previa), pero en la segunda llamada ya
    // existe una fila con ese user_id y el upsert no la detecta como
    // conflicto — revienta con una violación de unicidad silenciosa
    // (se cae al catch de abajo). Por eso este bug no aparecía al usar
    // "Ajustar saldo" por primera vez, solo al reconciliar después.
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    const userId = userData?.user?.id;
    if (!userId) throw new Error("No hay usuario autenticado");

    const { error } = await supabase
      .from("account_settings")
      .upsert({ user_id: userId, base_balance: baseBalance, last_sync_date: lastSyncDate }, { onConflict: "user_id" });
    if (error) throw error;
    return { baseBalance, lastSyncDate };
  } catch (e) {
    console.error("No se pudo guardar account_settings en Supabase", e);
    return null;
  }
}
