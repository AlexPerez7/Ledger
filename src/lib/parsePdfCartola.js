import * as pdfjsLib from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

const DATE_RE = /^\d{2}\/\d{2}\/\d{4}$/;
const MONEY_RE = /^\$\s*[\d.,]+$/;

// Extrae las filas de la tabla "Detalle de Movimientos" de una cartola PDF de
// Banco Falabella, con la misma forma [fecha, desc, cargo, abono, saldo] que
// entrega el .xls — así el resto del flujo de importación no distingue el
// formato de origen. El texto del PDF no trae columnas (solo texto por
// posición X/Y), así que hay que reconstruir cada fila por su coordenada Y y
// clasificar cada monto como Cargo/Abono comparando su X contra la posición
// de esas columnas en el encabezado de la propia página (se repite en cada
// página del PDF, por eso se recalcula por página en vez de una vez sola).
export async function parsePdfRows(buf) {
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buf) }).promise;
  const dataRows = [];

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();

    const rowsByY = new Map();
    for (const item of content.items) {
      const str = item.str.trim();
      if (!str) continue;
      const y = Math.round(item.transform[5]);
      if (!rowsByY.has(y)) rowsByY.set(y, []);
      rowsByY.get(y).push({ x: item.transform[4], str });
    }
    const ys = Array.from(rowsByY.keys()).sort((a, b) => b - a); // de arriba a abajo (Y del PDF crece hacia arriba)

    let cargoX = null;
    let abonoX = null;
    let descX = null;
    let sawHeader = false;

    for (const y of ys) {
      const items = rowsByY.get(y).sort((a, b) => a.x - b.x);

      if (!sawHeader) {
        const cargoItem = items.find((i) => i.str === "Cargo");
        const abonoItem = items.find((i) => i.str === "Abono");
        const descItem = items.find((i) => i.str.startsWith("Descripci"));
        if (cargoItem && abonoItem && descItem) {
          cargoX = cargoItem.x;
          abonoX = abonoItem.x;
          descX = descItem.x;
          sawHeader = true;
        }
        continue; // todo lo anterior al encabezado es el resumen de saldos, no movimientos
      }

      if (!DATE_RE.test(items[0].str)) continue; // no es una fila de movimiento (footer, etc.)

      const fecha = items[0].str;
      const moneyItems = items.filter((i) => MONEY_RE.test(i.str)).sort((a, b) => a.x - b.x);
      if (moneyItems.length === 0) continue;

      // el monto más a la derecha siempre es el Saldo (columna final); el o
      // los montos restantes son Cargo/Abono — se clasifican por posición X
      // relativa a esas dos columnas en el encabezado de esta página.
      const saldoItem = moneyItems[moneyItems.length - 1];
      const rest = moneyItems.slice(0, -1);
      let cargo = "";
      let abono = "";
      if (rest.length === 1) {
        const mid = (cargoX + abonoX) / 2;
        if (rest[0].x < mid) cargo = rest[0].str; else abono = rest[0].str;
      } else if (rest.length >= 2) {
        cargo = rest[0].str;
        abono = rest[1].str;
      }

      // solo el texto de la columna "Descripción" (se excluyen Oficina y Nro
      // Doc, que van antes) — así la descripción queda igual a la del .xls
      // (que no trae esas columnas) y la deduplicación entre ambos formatos
      // funciona: son la misma clave para el mismo movimiento.
      const descItems = items.filter((i) => i.x >= descX - 5 && !MONEY_RE.test(i.str));
      const desc = descItems.map((i) => i.str).join(" ").replace(/\s+/g, " ").trim();

      dataRows.push([fecha, desc, cargo, abono, saldoItem.str]);
    }
  }

  return dataRows;
}
