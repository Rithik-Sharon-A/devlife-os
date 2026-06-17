import type { HeightUnit, WeightUnit } from "../types";

export function kgToLbs(kg: number): number {
  return Math.round(kg * 2.20462 * 10) / 10;
}

export function lbsToKg(lbs: number): number {
  return Math.round((lbs / 2.20462) * 10) / 10;
}

export function cmToFtDisplay(cm: number): string {
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return `${feet}'${inches}"`;
}

export function formatWeight(kg: number, unit: WeightUnit): string {
  if (unit === "lbs") return `${kgToLbs(kg)} lbs`;
  return `${Math.round(kg * 10) / 10} kg`;
}

export function formatHeight(cm: number, unit: HeightUnit): string {
  if (unit === "ft") return cmToFtDisplay(cm);
  return `${Math.round(cm)} cm`;
}

export function parseWeightInput(value: string, unit: WeightUnit): number | null {
  const n = Number(value);
  if (Number.isNaN(n) || n <= 0) return null;
  return unit === "kg" ? n : lbsToKg(n);
}

export function parseHeightInputCm(value: string, unit: HeightUnit): number | null {
  if (unit === "cm") {
    const n = Number(value);
    return Number.isNaN(n) || n <= 0 ? null : n;
  }
  const match = value.match(/^(\d+)[''](\d{1,2})"?$/);
  if (!match) return null;
  const feet = Number(match[1]);
  const inches = Number(match[2]);
  return Math.round((feet * 12 + inches) * 2.54);
}
