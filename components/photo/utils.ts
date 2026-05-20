const POLISH_WEEKDAYS = [
  "NIEDZIELA",
  "PONIEDZIAŁEK",
  "WTOREK",
  "ŚRODA",
  "CZWARTEK",
  "PIĄTEK",
  "SOBOTA",
];

const pad = (n: number) => String(n).padStart(2, "0");

export const formatTicketDate = (d: Date) => ({
  weekday: POLISH_WEEKDAYS[d.getDay()],
  date: `${d.getFullYear()}·${pad(d.getMonth() + 1)}·${pad(d.getDate())}`,
  time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
});

export const confidenceBar = (conf: number, slots = 12) => {
  const filled = Math.round(conf * slots);
  return "▰".repeat(filled) + "▱".repeat(slots - filled);
};
