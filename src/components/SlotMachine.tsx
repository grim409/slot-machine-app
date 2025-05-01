'use client';

import React, { useState, useEffect, useRef } from 'react';
import Confetti from 'react-confetti';
import {
  SYMBOLS,
  getActivePaylines,
} from '../lib/slotConfig';

type SpinResult  = { grid: string[][]; balance: number; win: number };
type ErrorResult = { error: string };

export default function SlotMachine() {
  const NUM_REELS = 5;
  const NUM_ROWS  = 3;
  const MAX_BET   = parseInt(process.env.NEXT_PUBLIC_MAX_BET ?? '5000', 10);

  const [balance, setBalance]               = useState(0);
  const [bet, setBet]                       = useState(1);
  const [grid, setGrid]                     = useState<string[][]>(
    Array.from({ length: NUM_ROWS }, () => Array(NUM_REELS).fill('?'))
  );
  const [spinning, setSpinning]             = useState(false);
  const [winAmount, setWinAmount]           = useState(0);
  const [showConfetti, setShowConfetti]     = useState(false);
  const [showWinBanner, setShowWinBanner]   = useState(false);
  const [fadeWinBanner, setFadeWinBanner]   = useState(false);
  const [highlightCells, setHighlightCells] = useState<[number,number][]>([]);
  const [winningLines, setWinningLines]     = useState<[number,number][][]>([]);
  const [showModal, setShowModal]           = useState(false);

  const intervals = useRef<number[]>([]);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  // Handle resize for confetti
  useEffect(() => {
    const onResize = () =>
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Load initial balance
  useEffect(() => {
    fetch('/api/coins')
      .then(res => res.json() as Promise<{ balance: number }>)
      .then(data => setBalance(data.balance))
      .catch(console.error);
  }, []);

  const clearAll = () => {
    intervals.current.forEach(clearInterval);
    intervals.current = [];
  };

  const spin = async (overrideBet?: number) => {
    let stake = overrideBet ?? bet;
    stake = Math.min(stake, MAX_BET);
    if (spinning || balance < stake) return;

    setSpinning(true);
    setWinAmount(0);
    setHighlightCells([]);
    setWinningLines([]);
    setBet(stake);
    setBalance(b => b - stake);

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

    // Real spin
    const res = await fetch(`/api/coins?bet=${stake}`, { method: 'POST' });
    const data = (await res.json()) as SpinResult|ErrorResult;

    await new Promise(r => setTimeout(r, 600));
    clearAll();

    if (!res.ok) {
      alert((data as ErrorResult).error);
      setSpinning(false);
      return;
    }

    const { grid: newGrid, balance: newBal, win } = data as SpinResult;
    setBalance(newBal);
    setGrid(newGrid);
    setWinAmount(win);

    // Determine active lines
    const activeLines = getActivePaylines(stake);

    // Highlight logic
    const highlights: [number,number][] = [];
    const winLines: [number,number][][] = [];
    activeLines.forEach(line => {
      const symbols = line.map(([r,c]) => newGrid[r][c]);
      const first = symbols[0];
      let count = 1;
      for (let i = 1; i < symbols.length; i++) {
        if (symbols[i] === first) count++;
        else break;
      }
      if (count >= 3) {
        line.slice(0, count).forEach(coord => highlights.push(coord));
        winLines.push(line.slice(0, count));
      } else if (count === 2) {
        line.slice(0, 2).forEach(coord => highlights.push(coord));
      }
    });
    setHighlightCells(highlights);
    setWinningLines(winLines);

    // Show win banner & confetti
    if (win > 0) {
      setShowConfetti(true);
      setShowWinBanner(true);
      setFadeWinBanner(false);
      setTimeout(() => setFadeWinBanner(true), 1500);
      setTimeout(() => {
        setShowWinBanner(false);
        setShowConfetti(false);
      }, 2000);
    }

    setSpinning(false);
  };

  const resetBet     = () => setBet(1);
  const incrementBet = () => setBet(b => Math.min(balance, b + 1, MAX_BET));

  // Convert line coords to SVG points (0–100)
  const linePoints = (line: [number,number][]) =>
    line.map(([r,c]) => {
      const x = ((c + 0.5) / NUM_REELS) * 100;
      const y = ((r + 0.5) / NUM_ROWS) * 100;
      return `${x},${y}`;
    }).join(' ');

  return (
    <div className="relative w-full max-w-md md:max-w-lg mx-auto p-4 bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden">
      {/* Centered Win Banner */}
      {showWinBanner && (
        <div
          className={`
            absolute inset-0 flex items-center justify-center
            pointer-events-none
            transition-opacity duration-500 ease-out
            ${fadeWinBanner ? 'opacity-0' : 'opacity-100'}
          `}
        >
          <div
            className="
              bg-green-100/90 backdrop-blur-lg
              border-4 border-green-500
              rounded-2xl
              px-8 py-4
              shadow-[0_0_20px_rgba(74,222,128,0.7)]
              text-3xl font-extrabold text-green-800
              animate-pulse
            "
          >
            +{winAmount} Coins!
          </div>
        </div>
      )}

      {/* Confetti */}
      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          numberOfPieces={Math.min(1000, winAmount * 50)}
          gravity={0.2}
          initialVelocityY={winAmount > 5 ? 30 : 15}
          recycle={false}
          style={{ position: 'fixed', top: 0, left: 0, pointerEvents: 'none', zIndex: 999 }}
        />
      )}

      {/* Balance & Bet */}
      <div className="flex justify-between items-center mb-4 px-4 py-2 bg-gray-100/80 rounded-lg shadow-inner">
        <span className="font-medium text-lg md:text-xl">Balance: {balance} 💰</span>
        <span className="font-medium text-lg md:text-xl">Bet: {bet} 💵</span>
      </div>

      {/* Grid + SVG overlays */}
      <div className={`relative ${spinning ? 'spinning' : ''} mb-6`}>
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {/* Always-active dashed lines */}
          {getActivePaylines(bet).map((line, i) => (
            <polyline
              key={`line-${i}`}
              points={linePoints(line)}
              fill="none"
              stroke="#888"
              strokeWidth={0.5}
              strokeDasharray="4 2"
            />
          ))}
          {/* Highlighted winning lines */}
          {winningLines.map((line, i) => (
            <polyline
              key={`win-${i}`}
              points={linePoints(line)}
              fill="none"
              stroke="#FACC15"
              strokeWidth={2}
              strokeLinecap="round"
            />
          ))}
        </svg>

        <div className="grid grid-cols-5 gap-2">
          {grid.map((row, rIdx) =>
            row.map((sym, cIdx) => (
              <div
                key={`${rIdx}-${cIdx}`}
                className={`
                  aspect-square flex items-center justify-center
                  bg-gray-200/70 rounded-lg text-3xl md:text-4xl
                  ${highlightCells.some(([r,c]) => r === rIdx && c === cIdx)
                    ? 'ring-4 ring-yellow-400'
                    : ''}
                `}
              >
                {sym}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Spin Button */}
      <button
        onClick={() => spin()}
        disabled={spinning || balance < bet}
        className="w-full py-4 md:py-5 bg-green-500 hover:bg-green-600 disabled:bg-gray-400
                   text-white text-xl md:text-2xl font-bold rounded-full shadow-lg transition"
      >
        {spinning ? '⏳ Spinning…' : '🎰 SPIN 🎰'}
      </button>

      {/* Bottom Controls */}
      <div className="flex flex-wrap justify-center gap-3 mt-4">
        <button
          onClick={() => spin(1)}
          disabled={spinning || balance < 1}
          className="px-5 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300
                     text-white font-semibold rounded-full shadow transition"
        >
          Bet One
        </button>
        <button
          onClick={() => spin(balance)}
          disabled={spinning || balance === 0}
          className="px-5 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300
                     text-white font-semibold rounded-full shadow transition"
        >
          Max Bet
        </button>
        <button
          onClick={resetBet}
          disabled={spinning}
          className="px-5 py-2 bg-yellow-400 hover:bg-yellow-500 disabled:bg-gray-300
                     text-white font-semibold rounded-full shadow transition"
        >
          Reset
        </button>
        <button
          onClick={incrementBet}
          disabled={spinning || bet >= balance}
          className="px-5 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-300
                     text-white font-semibold rounded-full shadow transition"
        >
          +1 Bet
        </button>
        <button
          onClick={() => setShowModal(true)}
          className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white
                     font-semibold rounded-full shadow transition"
        >
          Buy Coins
        </button>
      </div>

      {/* Buy Coins Modal */}
      {showModal && (
        <div className="modal modal-open">
          <div className="modal-box w-11/12 max-w-sm">
            <h3 className="font-bold text-xl mb-2">Buy Coins</h3>
            <div className="flex justify-between gap-2">
              {[10,25,50].map(a => (
                <button
                  key={a}
                  onClick={() => { setBalance(b => b + a); setShowModal(false); }}
                  className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg
                             hover:bg-gray-100 transition text-center"
                >
                  +{a}
                </button>
              ))}
            </div>
            <div className="modal-action pt-4">
              <button
                onClick={() => setShowModal(false)}
                className="w-full px-4 py-2 bg-red-500 hover:bg-red-600
                           text-white rounded-full shadow transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
