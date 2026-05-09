import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

export function getOutcomeLabel(outcome: 'home' | 'draw' | 'away', home: string, away: string) {
  if (outcome === 'home') return home;
  if (outcome === 'away') return away;
  return 'Draw';
}
