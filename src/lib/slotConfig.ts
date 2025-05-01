export const SYMBOLS = ['🍒','🍋','🔔','⭐','🍊','7️⃣','💎','🍇','🍓','🍉'];

export const PAYLINES: [number, number][][] = [
  // top, middle, bottom
  Array.from({ length: 5 }, (_, i) => [0, i] as [number,number]),
  Array.from({ length: 5 }, (_, i) => [1, i] as [number,number]),
  Array.from({ length: 5 }, (_, i) => [2, i] as [number,number]),
  // zig-zag down
  [[0,0],[1,1],[2,2],[1,3],[0,4]],
  // zig-zag up
  [[2,0],[1,1],[0,2],[1,3],[2,4]],
];

export const PAYOUTS = {
  3: 2,   // 3-in-row → 2×
  4: 5,   // 4-in-row → 5×
  5: 10   // full row → 10×
};
