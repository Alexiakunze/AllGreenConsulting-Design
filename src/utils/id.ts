export const uid = (prefix = 'id') =>
  `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

export const pad2 = (n: number) => String(n).padStart(2, '0');

export const deepClone = <T,>(v: T): T => structuredClone(v);
