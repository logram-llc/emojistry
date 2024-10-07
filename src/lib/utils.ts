import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function toFixedNumber(
  num: number,
  digits: number,
  base: number,
): number {
  const pow = Math.pow(base ?? 10, digits);

  return Math.round(num * pow) / pow;
}

export function getEnvOptional(envVar: string): string | undefined {
  return (globalThis.process?.env ?? import.meta.env)[envVar];
}

export function getEnvRequired(envVar: string): string {
  const value = getEnvOptional(envVar);

  if (!value) {
    throw new Error(`The \`${envVar}\` env var is not set`);
  }

  return value;
}
