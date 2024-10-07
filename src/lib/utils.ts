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
