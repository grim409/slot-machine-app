export const SYMBOLS = [
  '🍒','🍋','🔔','⭐','🍊','7️⃣','💎','🍇','🍓','🍉'
] as const;
export type SymbolType = typeof SYMBOLS[number];

export const SYMBOL_WEIGHTS: Record<SymbolType, number> = {
  '🍒': 20,
  '🍋': 20,
  '🔔': 15,
  '⭐': 10,
  '🍊': 15,
  '7️⃣': 2,
  '💎': 1,
  '🍇': 8,
  '🍓': 6,
  '🍉': 5,
};
const _entries = Object.entries(SYMBOL_WEIGHTS) as [SymbolType, number][];
const _total   = _entries.reduce((sum, [,w]) => sum + w, 0);
export function pickSymbol(): SymbolType {
  let rnd = Math.random() * _total;
  for (const [sym, w] of _entries) {
    if (rnd < w) return sym;
    rnd -= w;
  }
  return _entries[_entries.length - 1][0];
}

export const PAYLINES: [number,number][][] = [
  Array.from({ length: 5 }, (_, i) => [0, i] as [number,number]),
  Array.from({ length: 5 }, (_, i) => [1, i] as [number,number]),
  Array.from({ length: 5 }, (_, i) => [2, i] as [number,number]),
  [[0,0],[1,1],[2,2],[1,3],[0,4]],
  [[2,0],[1,1],[0,2],[1,3],[2,4]],
];

export type PayoutTable = Record<3|4|5, number>;

export const DEFAULT_PAYOUT: PayoutTable = { 3:2, 4:5, 5:10 };

export const SYMBOL_PAYOUTS: Partial<Record<SymbolType, PayoutTable>> = {
  '7️⃣': { 3:5,  4:15,  5:50  },
  '💎': { 3:10, 4:30,  5:100 },
};

export function getPayoutTable(sym: SymbolType): PayoutTable {
  return SYMBOL_PAYOUTS[sym] ?? DEFAULT_PAYOUT;
}
