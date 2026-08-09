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
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    const userId = userData?.user?.id;
    if (!userId) throw new Error("No hay usuario autenticado");

    // create-or-update explícito en dos pasos en vez de upsert: primero
    // intenta actualizar la fila del usuario, y si no existía (0 filas
    // afectadas), recién ahí la crea. Así el ajuste manual funciona sin
    // errores la primera vez que un usuario guarda su saldo, sin necesitar
    // que ya exista una fila en account_settings de antes.
    const { data: updated, error: updateError } = await supabase
      .from("account_settings")
      .update({ base_balance: baseBalance, last_sync_date: lastSyncDate })
      .eq("user_id", userId)
      .select();
    if (updateError) throw updateError;

    if (!updated || updated.length === 0) {
      const { error: insertError } = await supabase
        .from("account_settings")
        .insert({ user_id: userId, base_balance: baseBalance, last_sync_date: lastSyncDate });
      if (insertError) throw insertError;
    }

    return { baseBalance, lastSyncDate };
  } catch (e) {
    console.error("No se pudo guardar account_settings en Supabase", e);
    // se devuelve el mensaje real (no null) para poder mostrárselo al
    // usuario — sin esto, un fallo de Supabase (ej. RLS) queda invisible y
    // solo se ve en la consola del navegador, imposible de revisar en mobile.
    return { error: e.message || String(e) };
  }
}
