import {
  TrendingUp, Utensils, Car, Gamepad2, ShoppingBag, Receipt,
  HeartPulse, ArrowLeftRight, Banknote, Shapes, Home, Plane, Coffee, Gift,
  Book, Briefcase, Dumbbell, Wifi, Smartphone, Fuel, PawPrint, Film, Music,
  GraduationCap, Wrench, Shirt, Bus, CreditCard, PiggyBank, Users, MoreHorizontal,
} from "lucide-react";

// Design tokens — "ledger console": fondo tinta oscura, cifras en monoespaciada,
// un duotono controlado teal/coral para ingreso vs. gasto, ámbar para lo que
// todavía necesita revisión humana (movimientos sin conciliar).
export const TOKENS = {
  bg: "#0E141B",
  surface: "#161E27",
  surfaceAlt: "#1D2733",
  border: "#28323F",
  text: "#E7EDF3",
  textMuted: "#8494A3",
  textFaint: "#57646F",
  income: "#3FBF8F",
  expense: "#E8654F",
  pending: "#F0B94A",
  accent: "#5B9BD5",
};

export const DEFAULT_CATEGORIES = [
  { id: "ingreso", label: "Ingresos", color: "#3FBF8F", icon: "TrendingUp" },
  { id: "comida", label: "Comida y delivery", color: "#E8654F", icon: "Utensils" },
  { id: "transporte", label: "Transporte", color: "#F0B94A", icon: "Car" },
  { id: "suscripciones", label: "Suscripciones y juegos", color: "#9B87C4", icon: "Gamepad2" },
  { id: "compras", label: "Compras", color: "#5B9BD5", icon: "ShoppingBag" },
  { id: "servicios", label: "Servicios y cuentas", color: "#D98E52", icon: "Receipt" },
  { id: "salud", label: "Salud y cuidado personal", color: "#6FCF97", icon: "HeartPulse" },
  { id: "transferencias", label: "Transferencias personales", color: "#7C8B9C", icon: "ArrowLeftRight" },
  { id: "efectivo", label: "Retiro de efectivo", color: "#A0A8B4", icon: "Banknote" },
  { id: "otros", label: "Otros", color: "#57646F", icon: "Shapes" },
];

export const DEFAULT_CATEGORY_ICON = Shapes;

// icono por id de categoría — respaldo para categorías guardadas en
// localStorage antes de que existiera el campo `icon` en cada categoría
export const CATEGORY_ICONS = {
  ingreso: TrendingUp,
  comida: Utensils,
  transporte: Car,
  suscripciones: Gamepad2,
  compras: ShoppingBag,
  servicios: Receipt,
  salud: HeartPulse,
  transferencias: ArrowLeftRight,
  efectivo: Banknote,
  otros: DEFAULT_CATEGORY_ICON,
};

// catálogo de íconos que el usuario puede elegir para una categoría
export const ICONS = {
  Utensils, Coffee, ShoppingBag, Car, Bus, Fuel, Home, Wifi, Smartphone,
  Receipt, CreditCard, Banknote, PiggyBank, TrendingUp, ArrowLeftRight,
  Gamepad2, Film, Music, Plane, Gift, HeartPulse, Dumbbell, Book,
  GraduationCap, Briefcase, Wrench, Shirt, PawPrint, Users, Shapes,
  MoreHorizontal,
};

export const ICON_NAMES = Object.keys(ICONS);

export function resolveCategoryIcon(cat) {
  return (cat.icon && ICONS[cat.icon]) || CATEGORY_ICONS[cat.id] || DEFAULT_CATEGORY_ICON;
}

export const PALETTE = [
  "#E8654F", "#F0B94A", "#3FBF8F", "#5B9BD5", "#9B87C4",
  "#D98E52", "#6FCF97", "#7C8B9C", "#4FC3D9", "#C9755B",
];

export const MERCHANT_RULES_DEFAULT = [
  [["UBER EATS", "RAPPI", "MCDONALD", "SANTA ISABEL", "STA ISABEL", "SUBWAY", "RYOMA",
    "ASUSHI", "TITO MONJE", "MERCADOPAGO MYM", "DUNKIN", "MONARCH", "MP  NATURA", "MP NATURA",
    "MINIMARKET", "COMERCIAL MANGOS", "SUMUP", "DON JULIO", "VENTI TC", "CCU", "BK SUECIA"], "comida"],
  [["UBER TRIP", "PAYU *UBER", "RED MOVILIDAD"], "transporte"],
  [["NETFLIX", "SPOTIFY", "YOUTUBE", "STEAM", "GOG", "FORTNITE", "EPC ", "GOOGLE PLAY"], "suscripciones"],
  [["WEBPAY", "FALABELLA", "MALL PLAZA", "COMERCIAL LIDA", "UNICASA"], "compras"],
  [["ENTEL", "BANCO DEL ESTADO", "COMISION", "MONTO POR COMISIONES"], "servicios"],
  [["GIMNASIO", "BARBER", "PELUQUERIA"], "salud"],
  [["GIRO CAJERO", "REDBANC"], "efectivo"],
];

export const NOISE_TOKENS = new Set([
  "CHL", "CHE", "DEU", "USA", "POL", "ARG", "SANTIAGO", "LAS", "CONDES", "PROVIDENCIA",
  "PROVIDENC", "VIRTUAL", "0",
]);
