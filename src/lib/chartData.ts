export function dailySeries(total: number, days = 14) {
  const weights = Array.from({ length: days }, (_, i) => 1 + Math.sin((i / days) * Math.PI * 1.6) * 0.6 + (i / days) * 0.4);
  const sum = weights.reduce((a, b) => a + b, 0);
  const today = new Date();
  return weights.map((w, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (days - 1 - i));
    return {
      date: d.toLocaleDateString("nl-NL", { day: "numeric", month: "short" }),
      value: Math.round((w / sum) * total),
    };
  });
}
