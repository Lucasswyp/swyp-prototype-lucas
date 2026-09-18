import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatEuro(amount: number): string {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("nl-NL").format(n);
}

export function formatTokens(n: number): string {
  return new Intl.NumberFormat("nl-NL").format(Math.round(n));
}

export function formatPercent(n: number, digits = 1): string {
  return `${n.toFixed(digits)}%`;
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "short", year: "numeric" }).format(
    new Date(iso)
  );
}

export function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "zojuist";
  if (minutes < 60) return `${minutes}m geleden`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}u geleden`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d geleden`;
  return formatDate(iso);
}
