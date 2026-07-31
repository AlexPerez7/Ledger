# Ledger — gestor de gastos personal

App de gestión de gastos hecha en React + Vite, pensada para trabajar con las
cartolas/reportes de movimientos de Banco Falabella (aunque el parser de
`Fecha | Descripción | Cargo | Abono | Saldo` sirve para cualquier banco que
exporte en ese formato).

## Qué hace

- **Importa el `.xls` de movimientos del banco** directo en el navegador (no
  se sube a ningún servidor). Detecta y omite duplicados si vuelves a subir
  un archivo que se traslapa con datos ya cargados.
- **Carga manual** de gastos e ingresos que aún no aparecen en el banco.
- **Conciliación mensual**: compara lo manual contra el reporte oficial del
  banco y separa lo confirmado, lo que aún no tiene reporte importado, y lo
  que sí tiene reporte pero no calza (posible descuadre).
- **Categorías editables** y una "memoria de comercio": puedes indicar que
  una descripción como `GOOGLE PLAY...` corresponde a "Claude", y la app
  recuerda esa regla para futuras importaciones (y corrige las anteriores).
- Resumen con gráfico de gasto por categoría y evolución de los últimos
  6 meses.

## Requisitos

- Node.js 18 o superior.

## Instalación y desarrollo

```bash
npm install
npm run dev
```

Abre la URL que te muestre la terminal (por defecto `http://localhost:5173`).

## Build de producción

```bash
npm run build
npm run preview   # para probar el build localmente
```

El resultado queda en `dist/`.

## Dónde quedan los datos

Todo se guarda en el `localStorage` del navegador (ver `src/lib/storage.js`).
No hay backend ni base de datos: es 100% local a tu equipo. Si limpias los
datos del sitio en el navegador, se pierde el historial — conviene no
depender solo de esto para algo crítico.

## Estructura

```
src/
  main.jsx              punto de entrada
  App.jsx                estado global, import de XLS, persistencia
  index.css               fuentes y estilos base
  lib/
    constants.js           tokens de diseño, categorías por defecto, reglas de comercio
    utils.js                parseo de fechas/montos, categorización automática
    storage.js               wrapper sobre localStorage
  components/
    Header.jsx                encabezado y selector de mes
    CategoryManager.jsx        alta/edición/borrado de categorías
    Resumen.jsx                  tarjetas de stats + gráficos
    Movimientos.jsx               import, alta manual, tabla editable
    Conciliacion.jsx               vista de conciliación mensual
    Shared.jsx                     Panel, EmptyNote, StatCard, FieldInput
```

## Publicar en GitHub

```bash
git init
git add .
git commit -m "Primer commit: gestor de gastos"
git branch -M main
git remote add origin https://github.com/<tu-usuario>/<tu-repo>.git
git push -u origin main
```

## Desplegar (opcional)

Al ser un sitio estático (`npm run build` genera `dist/`), se puede alojar
gratis en GitHub Pages, Vercel o Netlify. Como los datos viven en
`localStorage` del navegador, el hosting no afecta la privacidad de tus
movimientos — igual quedan solo en tu dispositivo.
