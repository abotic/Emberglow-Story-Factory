import { CRYPTID_SUBJECTS } from "./constants";

export function formatNumber(n?: number): string {
  return typeof n === "number" ? n.toLocaleString() : "";
}

export function capitalize(s: string): string {
  return s.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

export function labelForCryptid(value: string): string {
  return CRYPTID_SUBJECTS.find((s) => s.value === value)?.label ?? "Cryptid";
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}