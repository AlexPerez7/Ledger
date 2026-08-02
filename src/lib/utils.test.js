import { describe, it, expect } from "vitest";
import {
  autoCategory, suggestMatchKey, applyMerchantRules, parseClpNumber,
  parseBankDate, makeKey, formatCLP, formatDateDisplay, monthKey, uid,
} from "./utils.js";

describe("parseClpNumber", () => {
  it("parsea formato chileno con puntos de miles y coma decimal", () => {
    expect(parseClpNumber("1.234,56")).toBeCloseTo(1234.56);
  });
  it("parsea con símbolo de peso y espacios", () => {
    expect(parseClpNumber("$ 12.500")).toBe(12500);
  });
  it("devuelve el número tal cual si ya es number", () => {
    expect(parseClpNumber(500)).toBe(500);
  });
  it("devuelve 0 para vacío, null o undefined", () => {
    expect(parseClpNumber("")).toBe(0);
    expect(parseClpNumber(null)).toBe(0);
    expect(parseClpNumber(undefined)).toBe(0);
  });
  it("devuelve 0 si no se puede parsear", () => {
    expect(parseClpNumber("no es un número")).toBe(0);
  });
});

describe("parseBankDate", () => {
  it("convierte una fecha serial de Excel a ISO", () => {
    // 45000 = 2023-03-15 en el epoch de Excel (1899-12-30)
    expect(parseBankDate(45000)).toBe("2023-03-15");
  });
  it("convierte dd-mm-yyyy a yyyy-mm-dd", () => {
    expect(parseBankDate("15-03-2023")).toBe("2023-03-15");
  });
  it("convierte dd/mm/yyyy a yyyy-mm-dd", () => {
    expect(parseBankDate("05/01/2024")).toBe("2024-01-05");
  });
  it("deja pasar strings que no matchean el formato esperado", () => {
    expect(parseBankDate("2024-01-05")).toBe("2024-01-05");
  });
});

describe("formatCLP", () => {
  it("formatea con separador de miles y símbolo de peso", () => {
    expect(formatCLP(1234567)).toBe("$1.234.567");
  });
  it("antepone el signo para negativos, después del símbolo se ve el valor absoluto", () => {
    expect(formatCLP(-12500)).toBe("-$12.500");
  });
  it("redondea decimales", () => {
    expect(formatCLP(999.6)).toBe("$1.000");
  });
  it("formatea cero", () => {
    expect(formatCLP(0)).toBe("$0");
  });
});

describe("formatDateDisplay", () => {
  it("convierte yyyy-mm-dd a dd-mm-yyyy", () => {
    expect(formatDateDisplay("2026-07-28")).toBe("28-07-2026");
  });
  it("devuelve vacío para input vacío", () => {
    expect(formatDateDisplay("")).toBe("");
    expect(formatDateDisplay(null)).toBe("");
  });
});

describe("monthKey", () => {
  it("extrae yyyy-mm de una fecha ISO", () => {
    expect(monthKey("2026-07-28")).toBe("2026-07");
  });
  it("devuelve vacío si no hay fecha", () => {
    expect(monthKey("")).toBe("");
  });
});

describe("makeKey", () => {
  it("normaliza espacios y mayúsculas en la descripción", () => {
    expect(makeKey("2026-07-28", "  uber   eats  ", 12500, 0))
      .toBe("2026-07-28|UBER EATS|12500|0");
  });
});

describe("autoCategory", () => {
  it("reconoce comercios de comida", () => {
    expect(autoCategory("UBER EATS SANTIAGO CHL")).toBe("comida");
  });
  it("reconoce suscripciones", () => {
    expect(autoCategory("NETFLIX.COM")).toBe("suscripciones");
  });
  it("reconoce ingresos por Assertiva sin importar el resto del texto", () => {
    expect(autoCategory("ASSERTIVA SPA PAGO NOMINA")).toBe("ingreso");
  });
  it("reconoce transferencias por prefijo", () => {
    expect(autoCategory("TRANSF A JUAN PEREZ")).toBe("transferencias");
  });
  it("cae en 'otros' si no coincide nada", () => {
    expect(autoCategory("COMERCIO DESCONOCIDO XYZ")).toBe("otros");
  });
});

describe("suggestMatchKey", () => {
  it("quita códigos de país y ciudad al final", () => {
    expect(suggestMatchKey("UBER EATS SANTIAGO CHL")).toBe("UBER EATS");
  });
  it("quita ruido numérico y fechas al final", () => {
    expect(suggestMatchKey("FARMACIA NETFLIX.COM 12345 2024-01-05")).toBe("FARMACIA NETFLIX.COM");
  });
  it("nunca deja menos de 2 tokens", () => {
    expect(suggestMatchKey("CHL 0")).toBe("CHL 0");
  });
  it("no toca tokens que no son ruido", () => {
    expect(suggestMatchKey("FARMACIA CRUZ VERDE")).toBe("FARMACIA CRUZ VERDE");
  });
});

describe("applyMerchantRules", () => {
  const rules = [
    { id: "1", matchText: "UBER", categoryId: "transporte", alias: "" },
    { id: "2", matchText: "UBER EATS", categoryId: "comida", alias: "Delivery" },
  ];
  it("elige la regla más específica (match más largo) cuando varias coinciden", () => {
    const match = applyMerchantRules("UBER EATS SANTIAGO", rules);
    expect(match.categoryId).toBe("comida");
  });
  it("es case-insensitive", () => {
    const match = applyMerchantRules("uber eats santiago", rules);
    expect(match.categoryId).toBe("comida");
  });
  it("devuelve null si ninguna regla coincide", () => {
    expect(applyMerchantRules("FARMACIA AHUMADA", rules)).toBeNull();
  });
});

describe("uid", () => {
  it("genera un string no vacío", () => {
    const id = uid();
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
  });
  it("genera valores distintos en llamadas sucesivas", () => {
    expect(uid()).not.toBe(uid());
  });
});
