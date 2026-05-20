export const relativeTime = (iso: string): string => {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffSec = Math.floor((now - then) / 1000);

  if (diffSec < 60) return "przed chwilą";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min temu`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} h temu`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay === 1) return "wczoraj";
  if (diffDay < 7) return `${diffDay} dni temu`;

  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}·${pad(d.getMonth() + 1)}·${pad(d.getDate())}`;
};
