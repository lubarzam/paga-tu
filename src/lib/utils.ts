import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCLP(value: number | null | undefined): string {
  return Number(value || 0).toLocaleString('es-CL', { maximumFractionDigits: 0 });
}
