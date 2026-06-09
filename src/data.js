// =====================================================================
// data.js — Partidos, equipos y helpers puros (sin Supabase)
// =====================================================================

// 72 partidos de la fase de grupos
// Formato: [Grupo, Local, Visitante, "YYYY-MM-DDTHH:MM"] (hora del Este, ET)
const RAW = [
  ["A","México","Sudáfrica","2026-06-11T15:00"],
  ["A","Corea del Sur","Chequia","2026-06-11T22:00"],
  ["A","Chequia","Sudáfrica","2026-06-18T12:00"],
  ["A","México","Corea del Sur","2026-06-18T21:00"],
  ["A","México","Chequia","2026-06-24T21:00"],
  ["A","Corea del Sur","Sudáfrica","2026-06-24T21:00"],

  ["B","Canadá","Bosnia y Herzegovina","2026-06-12T15:00"],
  ["B","Catar","Suiza","2026-06-14T00:00"],
  ["B","Suiza","Bosnia y Herzegovina","2026-06-18T15:00"],
  ["B","Canadá","Catar","2026-06-18T18:00"],
  ["B","Canadá","Suiza","2026-06-24T15:00"],
  ["B","Bosnia y Herzegovina","Catar","2026-06-24T15:00"],

  ["C","Brasil","Marruecos","2026-06-13T15:00"],
  ["C","Haití","Escocia","2026-06-13T21:00"],
  ["C","Escocia","Marruecos","2026-06-19T18:00"],
  ["C","Brasil","Haití","2026-06-19T21:00"],
  ["C","Escocia","Brasil","2026-06-24T18:00"],
  ["C","Marruecos","Haití","2026-06-24T18:00"],

  ["D","Estados Unidos","Paraguay","2026-06-12T21:00"],
  ["D","Australia","Turquía","2026-06-13T18:00"],
  ["D","Estados Unidos","Australia","2026-06-19T15:00"],
  ["D","Turquía","Paraguay","2026-06-20T00:00"],
  ["D","Estados Unidos","Turquía","2026-06-25T22:00"],
  ["D","Paraguay","Australia","2026-06-25T22:00"],

  ["E","Alemania","Curazao","2026-06-14T13:00"],
  ["E","Costa de Marfil","Ecuador","2026-06-14T16:00"],
  ["E","Alemania","Costa de Marfil","2026-06-20T16:00"],
  ["E","Ecuador","Curazao","2026-06-20T20:00"],
  ["E","Ecuador","Alemania","2026-06-25T16:00"],
  ["E","Curazao","Costa de Marfil","2026-06-25T16:00"],

  ["F","Países Bajos","Japón","2026-06-14T19:00"],
  ["F","Suecia","Túnez","2026-06-14T22:00"],
  ["F","Países Bajos","Suecia","2026-06-20T13:00"],
  ["F","Túnez","Japón","2026-06-21T00:00"],
  ["F","Túnez","Países Bajos","2026-06-25T19:00"],
  ["F","Japón","Suecia","2026-06-25T19:00"],

  ["G","Bélgica","Egipto","2026-06-15T15:00"],
  ["G","Irán","Nueva Zelanda","2026-06-15T21:00"],
  ["G","Bélgica","Irán","2026-06-21T15:00"],
  ["G","Nueva Zelanda","Egipto","2026-06-21T21:00"],
  ["G","Nueva Zelanda","Bélgica","2026-06-26T20:00"],
  ["G","Egipto","Irán","2026-06-26T20:00"],

  ["H","España","Cabo Verde","2026-06-15T12:00"],
  ["H","Arabia Saudita","Uruguay","2026-06-15T18:00"],
  ["H","España","Arabia Saudita","2026-06-21T12:00"],
  ["H","Uruguay","Cabo Verde","2026-06-21T18:00"],
  ["H","Uruguay","España","2026-06-26T23:00"],
  ["H","Cabo Verde","Arabia Saudita","2026-06-26T13:00"],

  ["I","Francia","Senegal","2026-06-16T15:00"],
  ["I","Irak","Noruega","2026-06-16T18:00"],
  ["I","Francia","Irak","2026-06-22T17:00"],
  ["I","Noruega","Senegal","2026-06-22T20:00"],
  ["I","Noruega","Francia","2026-06-26T15:00"],
  ["I","Senegal","Irak","2026-06-26T15:00"],

  ["J","Argentina","Argelia","2026-06-16T21:00"],
  ["J","Austria","Jordania","2026-06-17T00:00"],
  ["J","Argentina","Austria","2026-06-22T13:00"],
  ["J","Jordania","Argelia","2026-06-22T23:00"],
  ["J","Jordania","Argentina","2026-06-27T22:00"],
  ["J","Argelia","Austria","2026-06-27T22:00"],

  ["K","Portugal","RD Congo","2026-06-17T13:00"],
  ["K","Uzbekistán","Colombia","2026-06-17T22:00"],
  ["K","Portugal","Uzbekistán","2026-06-23T13:00"],
  ["K","Colombia","RD Congo","2026-06-23T22:00"],
  ["K","Colombia","Portugal","2026-06-27T19:30"],
  ["K","RD Congo","Uzbekistán","2026-06-27T19:30"],

  ["L","Inglaterra","Croacia","2026-06-17T16:00"],
  ["L","Ghana","Panamá","2026-06-17T19:00"],
  ["L","Inglaterra","Ghana","2026-06-23T16:00"],
  ["L","Panamá","Croacia","2026-06-23T19:00"],
  ["L","Panamá","Inglaterra","2026-06-27T17:00"],
  ["L","Croacia","Ghana","2026-06-27T17:00"],
];

export const GROUP_MATCHES = RAW.map((r, i) => ({
  id: "g" + (i + 1),
  stage: "group",
  group: r[0],
  t1: r[1],
  t2: r[2],
  ko: r[3] + ":00-04:00",
}));

export const GROUPS = ["A","B","C","D","E","F","G","H","I","J","K","L"];

export const FLAGS = {
  "México":"🇲🇽","Sudáfrica":"🇿🇦","Corea del Sur":"🇰🇷","Chequia":"🇨🇿",
  "Canadá":"🇨🇦","Suiza":"🇨🇭","Catar":"🇶🇦","Bosnia y Herzegovina":"🇧🇦",
  "Brasil":"🇧🇷","Marruecos":"🇲🇦","Haití":"🇭🇹","Escocia":"🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  "Estados Unidos":"🇺🇸","Paraguay":"🇵🇾","Australia":"🇦🇺","Turquía":"🇹🇷",
  "Alemania":"🇩🇪","Curazao":"🇨🇼","Costa de Marfil":"🇨🇮","Ecuador":"🇪🇨",
  "Países Bajos":"🇳🇱","Japón":"🇯🇵","Suecia":"🇸🇪","Túnez":"🇹🇳",
  "Bélgica":"🇧🇪","Egipto":"🇪🇬","Irán":"🇮🇷","Nueva Zelanda":"🇳🇿",
  "España":"🇪🇸","Cabo Verde":"🇨🇻","Arabia Saudita":"🇸🇦","Uruguay":"🇺🇾",
  "Francia":"🇫🇷","Senegal":"🇸🇳","Irak":"🇮🇶","Noruega":"🇳🇴",
  "Argentina":"🇦🇷","Argelia":"🇩🇿","Austria":"🇦🇹","Jordania":"🇯🇴",
  "Portugal":"🇵🇹","RD Congo":"🇨🇩","Uzbekistán":"🇺🇿","Colombia":"🇨🇴",
  "Inglaterra":"🏴󠁧󠁢󠁥󠁮󠁧󠁿","Croacia":"🇭🇷","Ghana":"🇬🇭","Panamá":"🇵🇦",
};

export const flag = (t) => FLAGS[t] || "⚽";

// Puntaje:
//  5 = resultado exacto, o empate acertado (aunque no sea exacto)
//  3 = acertó solo el ganador
//  1 = no acertó el ganador pero le pegó a los goles de un equipo
//  0 = no acertó nada
export function computePoints(pred, res) {
  if (!pred || !res) return null;
  const { h: ph, a: pa } = pred;
  const { h: rh, a: ra } = res;
  if ([ph, pa, rh, ra].some(v => v === null || v === undefined || v === "" || Number.isNaN(+v))) return null;
  const [PHn, PAn, RHn, RAn] = [ph, pa, rh, ra].map(Number);
  if (PHn === RHn && PAn === RAn) return 5;
  const resDraw = RHn === RAn, predDraw = PHn === PAn;
  if (resDraw && predDraw) return 5;
  if (!resDraw && !predDraw && Math.sign(RHn - RAn) === Math.sign(PHn - PAn)) return 3;
  if (PHn === RHn || PAn === RAn) return 1;
  return 0;
}

// ---------- Helpers de fecha ----------------------------------------

export const DOW = ["dom","lun","mar","mié","jue","vie","sáb"];
export const MON = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];

// Extraer YYYY-MM-DD de un ko ISO
export const dateKeyOf = (ko) => (ko && ko.slice(0, 10)) || "";

// Lista de fechas únicas ordenadas; "elim" al final si hay ko sin fecha
export function buildDates(matches) {
  const set = new Set();
  let hasElim = false;
  matches.forEach(m => {
    const d = dateKeyOf(m.ko);
    if (d) set.add(d);
    else if (m.stage === "ko") hasElim = true;
  });
  const arr = [...set].sort();
  if (hasElim) arr.push("elim");
  return arr;
}

// Etiqueta legible para una fecha
export function dateLabel(d) {
  if (d === "elim") return "Eliminatorias";
  const [y, mo, da] = d.split("-").map(Number);
  return `${DOW[new Date(y, mo - 1, da).getDay()]} ${da} ${MON[mo - 1]}`;
}

// Formato corto para horario (sin conversión de zona horaria — muestra ET literal)
export function fmtKO(ko) {
  const m = ko && ko.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) return "";
  const [, y, mo, d, hh, mm] = m;
  const wd = DOW[new Date(+y, +mo - 1, +d).getDay()];
  return `${wd} ${+d} ${MON[+mo - 1]} · ${hh}:${mm} ET`;
}

// ¿El partido ya empezó?
export const isLocked = (ko) => {
  if (!ko) return false;
  const t = Date.parse(ko);
  return !Number.isNaN(t) && Date.now() >= t;
};

// Hoy en zona horaria del Este (ET)
export function etToday() {
  try { return new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(new Date()); }
  catch { return new Date().toISOString().slice(0, 10); }
}

// Fecha por defecto: la de hoy si hay partidos, si no la siguiente
export function defaultDate(dates) {
  const real = dates.filter(d => d !== "elim");
  if (!real.length) return dates[0] || "elim";
  const today = etToday();
  if (real.includes(today)) return today;
  return real.find(d => d >= today) || real[real.length - 1];
}
