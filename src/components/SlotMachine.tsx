'use client';

import React, { useState, useEffect, useRef } from 'react';
import Confetti from 'react-confetti';

type SpinResult  = { reels: string[]; balance: number };
type ErrorResult = { error: string };

export default function SlotMachine() {
  const NUM_REELS = 5;
  const NUM_ROWS  = 3;
  const SYMBOLS   = ['🍒','🍋','🔔','⭐','🍊','7️⃣'];

  // -- state declarations --
  const [balance, setBalance]             = useState<number>(0);
  const [bet, setBet]                     = useState<number>(1);
  const [grid, setGrid]                   = useState<string[][]>(
    Array.from({ length: NUM_ROWS }, () => Array(NUM_REELS).fill('?'))
  );
  const [spinning, setSpinning]           = useState<boolean>(false);
  const [winAmount, setWinAmount]         = useState<number>(0);
  const [showConfetti, setShowConfetti]   = useState<boolean>(false);
  const [highlightCells, setHighlightCells] = useState<[number,number][]>([]);
  const [showModal, setShowModal]         = useState<boolean>(false); // ← added
  const intervals = useRef<number[]>([]);

  interface BalanceResponse {
    balance: number;
  }

  // For full‐screen confetti sizing
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    function onResize() {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    }
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // load initial balance
  useEffect(() => {
    fetch('/api/coins')
      .then(res => res.json() as Promise<BalanceResponse>)
      .then(data => {
        setBalance(data.balance);
      })
      .catch(err => {
        console.error('Failed to fetch balance', err);
      });
  }, []);

  const clearAll = () => {
    intervals.current.forEach(id => clearInterval(id));
    intervals.current = [];
  };

  const spin = async (overrideBet?: number) => {
    const stake = overrideBet ?? bet;
    if (spinning || balance < stake) return;

    setSpinning(true);
    setWinAmount(0);
    setHighlightCells([]);
    setBet(stake);
    setBalance(b => b - stake);

    // CSS‐based “fake” spin animation
    intervals.current = Array.from({ length: NUM_REELS }).map((_, i) =>
      window.setInterval(() => {
        setGrid(rows =>
          rows.map((row, rIdx) =>
            row.map((_, cIdx) =>
              cIdx === i
                ? SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
                : rows[rIdx][cIdx]
            )
          )
        );
      }, 80 + i * 20)
    );

    // call API
    const res = await fetch(`/api/coins?bet=${stake}`, { method: 'POST' });
    const data: SpinResult|ErrorResult = await res.json();

    // ensure minimum spin
    await new Promise(r => setTimeout(r, 600));
    clearAll();

    if (!res.ok) {
      alert((data as ErrorResult).error);
      setSpinning(false);
      return;
    }

    const { reels, balance: newBal } = data as SpinResult;
    setBalance(newBal);
    setGrid(Array.from({ length: NUM_ROWS }, () => reels));

    // detect paylines
    const wins: [number,number][] = [];
    // horizontals
    for (let r = 0; r < NUM_ROWS; r++) {
      if (reels.every(s => s === reels[0])) {
        for (let c = 0; c < NUM_REELS; c++) wins.push([r, c]);
      }
    }
    // TL→BR diag on cols 0–2
    if (reels[0] === reels[1] && reels[1] === reels[2]) {
      for (let i = 0; i < 3; i++) wins.push([i, i]);
    }
    // BL→TR diag on cols 2–4
    if (reels[2] === reels[3] && reels[3] === reels[4]) {
      for (let i = 0; i < 3; i++) wins.push([2 - i, i + 2]);
    }
    setHighlightCells(wins);

    // compute win
    const threeMatch = reels.every(s => s === reels[0]);
    const twoMatch   = reels.some((s, idx) => reels.slice(idx + 1).includes(s));
    const win = threeMatch ? stake * 5 : twoMatch ? stake * 2 : 0;
    setWinAmount(win);

    // show confetti if won
    if (win > 0) {
      setShowConfetti(true);
      const duration = Math.min(win * 200, 5000);
      setTimeout(() => setShowConfetti(false), duration);
    }

    setSpinning(false);
  };

  const resetBet     = () => setBet(1);
  const incrementBet = () => setBet(b => Math.min(balance, b + 1));

  return (
    <div className="max-w-lg mx-auto p-6 bg-white rounded-xl shadow-xl relative text-gray-900">
      {/* Full‐screen confetti */}
      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          numberOfPieces={Math.min(1000, winAmount * 50)}
          gravity={0.2}
          initialVelocityY={winAmount > 5 ? 30 : 15}
          recycle={false}
          colors={
            winAmount > 20
              ? ['#FFD700','#FF8C00','#FF69B4','#8A2BE2']
              : ['#FF69B4','#FFB6C1','#FFC0CB','#DB7093']
          }
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            pointerEvents: 'none',
            zIndex: 999
          }}
        />
      )}

      {/* Win banner */}
      {winAmount > 0 && (
        <div className="alert alert-success shadow-lg absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
          <div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="stroke-current flex-shrink-0 h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M9 12l2 2 4-4m0 0l2 2-4 4m4-4l-2-2-4 4" />
            </svg>
            <span>🎉 You won {winAmount} coins! 🎉</span>
          </div>
        </div>
      )}

      {/* Balance & Bet */}
      <div className="flex justify-between items-center mb-4 px-4 py-2 bg-gray-100 rounded">
        <span className="text-lg font-medium">Balance: {balance} 💰</span>
        <span className="text-lg font-medium">Bet: {bet} 💵</span>
      </div>

      {/* 5×3 Grid */}
      <div className={`${spinning ? 'spinning' : ''} grid grid-cols-5 grid-rows-3 gap-2 mb-6`}>
        {grid.map((row, rIdx) =>
          row.map((sym, cIdx) => (
            <div
              key={`${rIdx}-${cIdx}`}
              className={`
                reel-cell h-16 flex items-center justify-center
                bg-gray-200 rounded-lg text-4xl
                ${highlightCells.some(([r,c])=>r===rIdx&&c===cIdx)
                  ? 'ring-4 ring-yellow-400'
                  : ''}
              `}
            >
              {sym}
            </div>
          ))
        )}
      </div>

      {/* Spin Button */}
      <button
        onClick={() => spin()}
        disabled={spinning || balance < bet}
        className="
          block w-full py-5
          bg-green-500 hover:bg-green-600
          text-white text-2xl font-extrabold
          rounded-full shadow-2xl
          transition disabled:opacity-50
        "
      >
        {spinning ? '⏳ Spinning…' : '🎰 SPIN 🎰'}
      </button>

      {/* Bottom Controls */}
      <div className="flex justify-center items-center space-x-3 mt-6">
        <button
          onClick={() => spin(1)}
          disabled={spinning || balance < 1}
          className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition disabled:opacity-50"
        >
          Bet One & Spin
        </button>
        <button
          onClick={() => spin(balance)}
          disabled={spinning || balance === 0}
          className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition disabled:opacity-50"
        >
          Max Bet & Spin
        </button>
        <button
          onClick={resetBet}
          disabled={spinning}
          className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition disabled:opacity-50"
        >
          Reset Bet
        </button>
        <button
          onClick={incrementBet}
          disabled={spinning || bet >= balance}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition disabled:opacity-50"
        >
          Increment Bet
        </button>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white rounded-lg transition"
        >
          Buy Coins
        </button>
      </div>

      {/* Buy-Coins Modal */}
      {showModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Buy More Coins</h3>
            <p className="py-4">Select amount:</p>
            <div className="flex space-x-2">
              {[10, 25, 50].map(amount => (
                <button
                  key={amount}
                  onClick={() => {
                    setBalance(b => b + amount);
                    setShowModal(false);
                  }}
                  className="btn btn-primary flex-1"
                >
                  +{amount} Coins
                </button>
              ))}
            </div>
            <div className="modal-action">
              <button onClick={() => setShowModal(false)} className="btn">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
