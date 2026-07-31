// Reemplaza al `window.storage` que solo existe dentro de los artifacts de
// Claude. Misma forma de la API (get/set async) pero respaldado en el
// localStorage del navegador, así que todos los datos quedan solo en tu
// equipo — nada se envía a ningún servidor.
const PREFIX = "ledger:";

export const storage = {
  async get(key) {
    try {
      const raw = window.localStorage.getItem(PREFIX + key);
      if (raw === null) return null;
      return { key, value: raw };
    } catch (e) {
      return null;
    }
  },
  async set(key, value) {
    try {
      window.localStorage.setItem(PREFIX + key, value);
      return { key, value };
    } catch (e) {
      console.error("No se pudo guardar en localStorage", e);
      return null;
    }
  },
};
