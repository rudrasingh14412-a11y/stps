import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPoints(points: number) {
  return points.toLocaleString();
}

export function getRoleLabel(role: string) {
  return role.replace('_', ' ');
}
