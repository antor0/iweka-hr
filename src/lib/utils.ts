import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getInitials(name: string) {
  const parts = name.split(' ');
  let initials = parts[0]?.charAt(0) || '';
  if (parts.length > 1) {
    initials += parts[parts.length - 1]?.charAt(0) || '';
  }
  return initials.toUpperCase();
}

export function formatIDR(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined) return "Rp 0";
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "Rp 0";

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}
