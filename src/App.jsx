import { useState, useEffect, useMemo, useCallback, lazy, Suspense } from "react";

import { TOKENS, DEFAULT_CATEGORIES, PALETTE, DEFAULT_CATEGORY_ICON, resolveCategoryIcon } from "./lib/constants.js";
import { storage } from "./lib/storage.js";
import { useToasts } from "./lib/useToasts.js";
import { readFileWithProgress } from "./lib/readFile.js";
import {
  autoCategory, applyMerchantRules, parseClpNumber, parseBankDate,
  makeKey, monthKey, uid, computeInsights,
} from "./lib/utils.js";

import { Header, MonthBar } from "./components/Header.jsx";
import { CategoryManager } from "./components/CategoryManager.jsx";
import { Conciliacion } from "./components/Conciliacion.jsx";
import { ToastStack } from "./components/Toast.jsx";
import { ErrorBoundary } from "./components/ErrorBoundary.jsx";
import { Onboarding } from "./components/Onboarding.jsx";

// recharts y framer-motion solo hacen falta en sus tabs — se separan en sus
// propios chunks para no pesar la carga inicial (que arranca en Resumen).
const Resumen = lazy(() => import("./components/Resumen.jsx").then((m) => ({ default: m.Resumen })));
const Movimientos = lazy(() => import("./components/Movimientos.jsx").then((m) => ({ default: m.Movimientos })));

const ONBOARDING_KEY = "ledger:onboarding-done";

export default function App({ onSignOut, theme, onToggleTheme }) {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [merchantRules, setMerchantRules] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [syncError, setSyncError] = useState(null);
  const [tab, setTab] = useState("resumen");
  const [monthFilter, setMonthFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const { toasts, push: pushToast, update: updateToast, dismiss: dismissToast } = useToasts();
  const [showManualForm, setShowManualForm] = useState(false);
  const [showCatManager, setShowCatManager] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    try { return localStorage.getItem(ONBOARDING_KEY) !== "1"; } catch { return false; }
  });
  const dismissOnboarding = useCallback(() => {
    try { localStorage.setItem(ONBOARDING_KEY, "1"); } catch { /* localStorage puede fallar en modo privado */ }
    setShowOnboarding(false);
  }, []);

  const catMap = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, { ...c, icon: resolveCategoryIcon(c) }])),
    [categories]
  );
  const getCat = useCallback((id) => catMap[id] || { id, label: id, color: TOKENS.textFaint, icon: DEFAULT_CATEGORY_ICON }, [catMap]);

  // optimista: aplica el cambio ya, pero si Supabase rechaza el guardado
  // revierte el estado local en vez de dejarlo "aplicado" solo de mentira.
  const persistTx = useCallback(async (next) => {
    const prev = transactions;
    setTransactions(next);
    const res = await storage.set("transactions", JSON.stringify(next));
    if (!res) {
      setTransactions(prev);
      setSyncError("No se pudo guardar en el servidor. Revisa tu conexión — se revirtió el cambio, inténtalo de nuevo.");
    } else {
      setSyncError(null);
    }
    return !!res;
  }, [transactions]);
  const persistCats = useCallback(async (next) => {
    const prev = categories;
    setCategories(next);
    const res = await storage.set("categories", JSON.stringify(next));
    if (!res) {
      setCategories(prev);
      setSyncError("No se pudo guardar en el servidor. Revisa tu conexión — se revirtió el cambio, inténtalo de nuevo.");
    } else {
      setSyncError(null);
    }
  }, [categories]);
  const persistRules = useCallback(async (next) => {
    const prev = merchantRules;
    setMerchantRules(next);
    const res = await storage.set("merchantRules", JSON.stringify(next));
    if (!res) {
      setMerchantRules(prev);
      setSyncError("No se pudo guardar en el servidor. Revisa tu conexión — se revirtió el cambio, inténtalo de nuevo.");
    } else {
      setSyncError(null);
    }
  }, [merchantRules]);

  // ---- persistence (Supabase, vía src/lib/storage.js) ----------------------
  useEffect(() => {
    (async () => {
      const tx = await storage.get("transactions");
      if (tx) setTransactions(JSON.parse(tx.value));

      const cats = await storage.get("categories");
      if (cats) {
        const parsedCats = JSON.parse(cats.value);
        // usuario nuevo, o que quedó sin categorías: sembramos las por defecto
        if (parsedCats.length === 0) await persistCats(DEFAULT_CATEGORIES);
        else setCategories(parsedCats);
      }

      const rules = await storage.get("merchantRules");
      if (rules) setMerchantRules(JSON.parse(rules.value));

      if (!tx || !cats || !rules) {
        setSyncError("No se pudieron cargar todos tus datos. Revisa tu conexión y recarga la página.");
      }
      setLoaded(true);
      // eslint-disable-next-line react-hooks/exhaustive-deps -- carga inicial: debe correr una sola vez al montar
    })();
  }, []);

  // ---- import xls -----------------------------------------------------------
  const handleFile = useCallback(
    async (file) => {
      const toastId = pushToast("loading", "Leyendo archivo…", 0);
      try {
        const XLSX = await import("xlsx"); // solo se descarga al importar un archivo
        const buf = await readFileWithProgress(file, (pct) => updateToast(toastId, "loading", "Leyendo archivo…", pct));
        updateToast(toastId, "loading", "Procesando movimientos…");
        const wb = XLSX.read(buf, { type: "array" });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: "" });

        let headerIdx = rows.findIndex((r) => r.some((c) => String(c).trim().toLowerCase() === "fecha"));
        if (headerIdx === -1) headerIdx = 0;
        const dataRows = rows.slice(headerIdx + 1).filter((r) => r[0] && String(r[0]).trim() !== "");

        const existingKeys = new Set(transactions.filter((t) => t.source === "bank").map((t) => t.key));
        const imported = [];
        let skipped = 0;

        for (const r of dataRows) {
          const [fecha, desc, cargo, abono] = r;
          if (!desc) continue;
          const date = parseBankDate(fecha);
          const cargoN = parseClpNumber(cargo);
          const abonoN = parseClpNumber(abono);
          const key = makeKey(date, String(desc), cargoN, abonoN);
          if (existingKeys.has(key)) { skipped++; continue; }
          existingKeys.add(key);
          const amount = abonoN > 0 ? abonoN : -cargoN;
          const cleanDesc = String(desc).trim().replace(/\s+/g, " ");
          const rule = applyMerchantRules(cleanDesc, merchantRules);
          imported.push({
            id: uid(),
            key,
            date,
            description: cleanDesc,
            alias: rule ? rule.alias : "",
            amount,
            category: rule ? rule.categoryId : autoCategory(cleanDesc),
            source: "bank",
            reconciled: false,
            matchedId: null,
          });
        }

        if (imported.length === 0) {
          updateToast(
            toastId,
            skipped > 0 ? "warn" : "error",
            skipped > 0
              ? `Este archivo ya estaba importado — los ${skipped} movimientos que trae ya existían, no se agregó nada nuevo.`
              : "No se reconocieron movimientos en este archivo."
          );
          return;
        }

        const next = [...transactions, ...imported];
        await persistTx(next);
        updateToast(
          toastId,
          "ok",
          `${imported.length} movimiento${imported.length === 1 ? "" : "s"} nuevo${imported.length === 1 ? "" : "s"} importado${imported.length === 1 ? "" : "s"}${skipped ? `, ${skipped} ya existía${skipped === 1 ? "" : "n"} (omitidos).` : "."}`
        );
      } catch (e) {
        console.error(e);
        updateToast(toastId, "error", "No se pudo leer el archivo. ¿Es el .xls de movimientos del banco?");
      }
    },
    [transactions, merchantRules, persistTx, pushToast, updateToast]
  );

  // ---- manual entries ---------------------------------------------------------
  const addManual = useCallback(
    async (entry) => {
      const t = {
        id: uid(),
        key: makeKey(entry.date, entry.description, entry.type === "expense" ? entry.amount : 0, entry.type === "income" ? entry.amount : 0),
        date: entry.date,
        description: entry.description,
        alias: "",
        amount: entry.type === "expense" ? -Math.abs(entry.amount) : Math.abs(entry.amount),
        category: entry.category,
        source: "manual",
        reconciled: false,
        matchedId: null,
      };
      await persistTx([...transactions, t]);
      setShowManualForm(false);
    },
    [transactions, persistTx]
  );

  const deleteTransaction = useCallback((id) => { persistTx(transactions.filter((t) => t.id !== id)); }, [transactions, persistTx]);

  // acciones masivas (bulk): mismo camino que cualquier otro cambio de
  // transactions — persistTx ya diffea contra Supabase (borra lo que falta,
  // upsertea lo que cambió) y hace rollback si el guardado falla, así que
  // acá solo arma el array `next` y devuelve si funcionó o no.
  const bulkDeleteTransactions = useCallback(
    async (ids) => {
      const idSet = new Set(ids);
      return persistTx(transactions.filter((t) => !idSet.has(t.id)));
    },
    [transactions, persistTx]
  );
  const bulkChangeCategory = useCallback(
    async (ids, categoryId) => {
      const idSet = new Set(ids);
      return persistTx(transactions.map((t) => (idSet.has(t.id) ? { ...t, category: categoryId } : t)));
    },
    [transactions, persistTx]
  );

  // edita un movimiento y, opcionalmente, recuerda una regla de comercio que
  // se aplica retroactivamente a todo lo que ya coincida
  const saveTxEdit = useCallback(
    async (txId, { category, alias, remember, matchText }) => {
      let nextRules = merchantRules;
      if (remember && matchText && matchText.trim()) {
        const mt = matchText.trim();
        const others = merchantRules.filter((r) => r.matchText.toUpperCase() !== mt.toUpperCase());
        nextRules = [...others, { id: uid(), matchText: mt, categoryId: category, alias: alias || "" }];
        await persistRules(nextRules);
      }
      const next = transactions.map((t) => {
        if (t.id === txId) return { ...t, category, alias: alias || "" };
        if (remember && matchText && t.source === "bank" && t.description.toUpperCase().includes(matchText.trim().toUpperCase())) {
          return { ...t, category, alias: alias || t.alias };
        }
        return t;
      });
      await persistTx(next);
    },
    [transactions, merchantRules, persistTx, persistRules]
  );

  // ---- category management ------------------------------------------------------
  const addCategory = useCallback(
    (label) => {
      const id = "cat_" + uid();
      const color = PALETTE[categories.length % PALETTE.length];
      persistCats([...categories, { id, label, color, icon: "Shapes", excludeFromExpense: false }]);
    },
    [categories, persistCats]
  );
  const renameCategory = useCallback((id, label) => { persistCats(categories.map((c) => (c.id === id ? { ...c, label } : c))); }, [categories, persistCats]);
  const changeCategoryIcon = useCallback((id, icon) => { persistCats(categories.map((c) => (c.id === id ? { ...c, icon } : c))); }, [categories, persistCats]);
  const toggleCategoryExpense = useCallback(
    (id) => { persistCats(categories.map((c) => (c.id === id ? { ...c, excludeFromExpense: !c.excludeFromExpense } : c))); },
    [categories, persistCats]
  );
  const deleteCategory = useCallback(
    (id) => {
      persistCats(categories.filter((c) => c.id !== id));
      persistTx(transactions.map((t) => (t.category === id ? { ...t, category: "otros" } : t)));
    },
    [categories, transactions, persistCats, persistTx]
  );

  // ---- reconciliation ---------------------------------------------------------
  const reconcileMonth = useCallback(
    (mKey) => {
      const inMonth = transactions.filter((t) => monthKey(t.date) === mKey);
      const manuals = inMonth.filter((t) => t.source === "manual" && !t.reconciled);
      const banks = inMonth.filter((t) => t.source === "bank");

      const updates = new Map();
      for (const m of manuals) {
        const match = banks.find((b) => {
          if (updates.has(b.id) || b.matchedId) return false;
          const sameAmount = Math.abs(b.amount - m.amount) < 1;
          const dDate = Math.abs(new Date(b.date) - new Date(m.date)) / 86400000;
          return sameAmount && dDate <= 3;
        });
        if (match) {
          updates.set(m.id, { ...m, reconciled: true, matchedId: match.id });
          updates.set(match.id, { ...match, matchedId: match.id });
        }
      }
      if (updates.size === 0) return 0;
      const next = transactions.map((t) => updates.get(t.id) || t);
      persistTx(next);
      return updates.size / 2;
    },
    [transactions, persistTx]
  );

  // ---- derived data -----------------------------------------------------------
  const months = useMemo(() => {
    const s = new Set(transactions.map((t) => monthKey(t.date)));
    return Array.from(s).filter(Boolean).sort().reverse();
  }, [transactions]);

  const currentMonth = monthFilter === "all" ? months[0] : monthFilter;

  const monthTx = useMemo(
    () => transactions.filter((t) => monthFilter === "all" || monthKey(t.date) === monthFilter),
    [transactions, monthFilter]
  );

  const filteredTx = useMemo(() => {
    return monthTx
      .filter((t) => catFilter === "all" || t.category === catFilter)
      .filter((t) => !search || t.description.toLowerCase().includes(search.toLowerCase()) || (t.alias || "").toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  }, [monthTx, catFilter, search]);

  // categorías marcadas "no cuenta como gasto" (ej. transferencias a tus
  // propias cuentas) — se excluyen de todo cálculo de gasto, pero siguen
  // apareciendo normalmente en la lista de movimientos.
  const excludedCategoryIds = useMemo(
    () => new Set(categories.filter((c) => c.excludeFromExpense).map((c) => c.id)),
    [categories]
  );
  const isRealExpense = useCallback((t) => t.amount < 0 && !excludedCategoryIds.has(t.category), [excludedCategoryIds]);

  const stats = useMemo(() => {
    const income = monthTx.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
    const expense = monthTx.filter(isRealExpense).reduce((s, t) => s + t.amount, 0);
    const lastBank = [...transactions].filter((t) => t.source === "bank").sort((a, b) => (a.date > b.date ? -1 : 1))[0];
    return { income, expense, balance: income + expense, lastKnown: lastBank };
  }, [monthTx, transactions, isRealExpense]);

  const byCategory = useMemo(() => {
    const map = {};
    monthTx.filter(isRealExpense).forEach((t) => { map[t.category] = (map[t.category] || 0) + Math.abs(t.amount); });
    return Object.entries(map)
      .map(([id, value]) => ({ id, name: getCat(id).label, value, color: getCat(id).color, icon: getCat(id).icon }))
      .sort((a, b) => b.value - a.value);
  }, [monthTx, getCat, isRealExpense]);

  const byMonth = useMemo(() => {
    const map = {};
    transactions.forEach((t) => {
      const mk = monthKey(t.date);
      if (!mk) return;
      if (!map[mk]) map[mk] = { month: mk, ingresos: 0, gastos: 0 };
      if (t.amount > 0) map[mk].ingresos += t.amount; else if (isRealExpense(t)) map[mk].gastos += Math.abs(t.amount);
    });
    return Object.values(map).sort((a, b) => (a.month > b.month ? 1 : -1)).slice(-6);
  }, [transactions, isRealExpense]);

  const dailySpend = useMemo(() => {
    const map = {};
    transactions.forEach((t) => {
      if (!t.date || !isRealExpense(t)) return;
      map[t.date] = (map[t.date] || 0) + Math.abs(t.amount);
    });
    return map;
  }, [transactions, isRealExpense]);

  // "hero" del dashboard: TODO lo gastado con fecha en el mes real (no del
  // filtro de arriba), sin importar el día — el banco a veces le pone fecha
  // del lunes siguiente a movimientos del fin de semana, así que un cargo
  // fechado "mañana" igual cuenta como gasto de este mes.
  const heroStat = useMemo(() => {
    const now = new Date();
    const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const dayOfMonth = now.getDate();

    let spentSoFar = 0;
    for (const [date, amt] of Object.entries(dailySpend)) {
      if (date.slice(0, 7) === thisMonthKey) spentSoFar += amt;
    }

    // "ritmo habitual": mismo tramo (día 1 al día actual) pero del mes
    // calendario inmediatamente anterior — "manzanas con manzanas". La
    // versión anterior escalaba el TOTAL del mes por una fracción de días
    // (total * día/díasDelMes), lo que asume gasto parejo día a día y
    // distorsiona el % apenas hay un gasto grande fuera de ese tramo (ej. un
    // pago grande el día 25 "contaba" como si ya hubiera pasado el día 5).
    // Comparar el mismo rango real de fechas evita esa distorsión.
    const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthKey = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, "0")}`;
    const hasPrevMonthData = transactions.some((t) => monthKey(t.date) === prevMonthKey);

    let typicalPace = null;
    if (hasPrevMonthData) {
      typicalPace = 0;
      for (const [date, amt] of Object.entries(dailySpend)) {
        if (date.slice(0, 7) !== prevMonthKey) continue;
        const day = Number(date.slice(8, 10));
        if (day <= dayOfMonth) typicalPace += amt;
      }
    }

    return { spentSoFar, typicalPace, dayOfMonth, monthKey: thisMonthKey };
  }, [dailySpend, transactions]);

  const insights = useMemo(
    () => computeInsights(transactions, excludedCategoryIds, (id) => getCat(id).label),
    [transactions, excludedCategoryIds, getCat]
  );

  const reconcileStats = useMemo(() => {
    if (!currentMonth) return null;
    const inMonth = transactions.filter((t) => monthKey(t.date) === currentMonth);
    const manuals = inMonth.filter((t) => t.source === "manual");
    const banks = inMonth.filter((t) => t.source === "bank");
    const confirmed = manuals.filter((t) => t.reconciled);
    const pending = manuals.filter((t) => !t.reconciled);
    const bankExists = banks.length > 0;
    return {
      manuals, confirmed, pending, bankExists,
      pendingNoReport: bankExists ? [] : pending,
      pendingMismatch: bankExists ? pending : [],
      bankOnly: banks.filter((t) => !t.matchedId),
    };
  }, [transactions, currentMonth]);

  if (!loaded) {
    return (
      <div style={{ background: TOKENS.bg, color: TOKENS.textMuted, height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        Cargando…
      </div>
    );
  }

  return (
    <div style={{ background: TOKENS.bg, minHeight: "100vh", color: TOKENS.text, fontFamily: "'Inter', sans-serif" }}>
      <Header tab={tab} setTab={setTab} onManageCats={() => setShowCatManager(true)} onSignOut={onSignOut} theme={theme} onToggleTheme={onToggleTheme} />

      <main className="app-main" style={{ maxWidth: 1080, margin: "0 auto", padding: "28px 24px 80px" }}>
        {syncError && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
            background: "var(--tint-expense)", border: `1px solid ${TOKENS.expense}`, color: TOKENS.expense,
            borderRadius: 10, padding: "10px 14px", fontSize: 12.5, marginBottom: 18,
          }}>
            <span>{syncError}</span>
            <button onClick={() => setSyncError(null)} style={{ background: "transparent", border: "none", color: TOKENS.expense, cursor: "pointer", fontSize: 12.5 }}>
              Cerrar
            </button>
          </div>
        )}
        <MonthBar months={months} monthFilter={monthFilter} setMonthFilter={setMonthFilter} />

        {showCatManager && (
          <CategoryManager categories={categories} onAdd={addCategory} onRename={renameCategory} onDelete={deleteCategory} onIconChange={changeCategoryIcon} onToggleExpense={toggleCategoryExpense} onClose={() => setShowCatManager(false)} />
        )}

        {tab === "resumen" && (
          <ErrorBoundary>
            <Suspense fallback={<div style={{ color: TOKENS.textFaint, padding: "40px 0", textAlign: "center", fontSize: 12.5 }}>Cargando…</div>}>
              <Resumen
                stats={stats} byCategory={byCategory} byMonth={byMonth} currentMonth={currentMonth}
                dailySpend={dailySpend} hasTransactions={transactions.length > 0} heroStat={heroStat}
                insights={insights} pushToast={pushToast}
              />
            </Suspense>
          </ErrorBoundary>
        )}

        {tab === "movimientos" && (
          <ErrorBoundary>
            <Suspense fallback={<div style={{ color: TOKENS.textFaint, padding: "40px 0", textAlign: "center", fontSize: 12.5 }}>Cargando…</div>}>
              <Movimientos
                filteredTx={filteredTx}
                hasTransactions={transactions.length > 0}
                categories={categories}
                getCat={getCat}
                search={search} setSearch={setSearch}
                catFilter={catFilter} setCatFilter={setCatFilter}
                saveTxEdit={saveTxEdit}
                deleteTransaction={deleteTransaction}
                showManualForm={showManualForm} setShowManualForm={setShowManualForm}
                addManual={addManual}
                handleFile={handleFile}
                pushToast={pushToast}
                onBulkDelete={bulkDeleteTransactions}
                onBulkChangeCategory={bulkChangeCategory}
              />
            </Suspense>
          </ErrorBoundary>
        )}

        {tab === "conciliacion" && (
          <ErrorBoundary>
            <Conciliacion currentMonth={currentMonth} reconcileStats={reconcileStats} reconcileMonth={reconcileMonth} />
          </ErrorBoundary>
        )}
      </main>

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
      {showOnboarding && <Onboarding onDone={dismissOnboarding} />}
    </div>
  );
}
