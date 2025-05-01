'use client';
import React, { useState } from 'react';

const symbols = ['🍒','🍋','🔔','🍊','⭐'];
const randomSym = () => symbols[Math.floor(Math.random()*symbols.length)];

export default function SlotMachine() {
  const [reels, setReels] = useState(['❓','❓','❓']);
  const [coins, setCoins] = useState(100);
  const spin = () => {
    if (coins < 1) return;
    setCoins(c=>c-1);
    const out = [randomSym(),randomSym(),randomSym()];
    setReels(out);
    if (out[0]===out[1] && out[1]===out[2]) setCoins(c=>c+10);
  };
  return (
    <div className="mt-6">
      <div className="text-5xl flex justify-center gap-4">{reels}</div>
      <button onClick={spin} className="mt-4 btn">Spin (1 coin)</button>
      <p className="mt-2">Coins: {coins}</p>
    </div>
  );
}