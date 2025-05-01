// src/components/SlotMachine.tsx

'use client';

import React, { useState, useEffect, useRef } from 'react';
import Confetti from 'react-confetti';
import { SYMBOLS, PAYLINES } from '../lib/slotConfig';

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
  const [highlightCells, setHighlightCells] = useState<[number,number][]>([]);
  const [winningLines, setWinningLines]     = useState<[number,number][][]>([]);
  const [showModal, setShowModal]           = useState(false);

  const intervals = useRef<number[]>([]);
  const [windowSize, setWindowSize] = useState({ width:0, height:0 });

  useEffect(() => {
    const onResize = () =>
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    fetch('/api/coins')
      .then(res => res.json() as Promise<{ balance:number }>)
      .then(d => setBalance(d.balance))
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
          rows.map((r,rowIdx) =>
            r.map((_, colIdx) =>
              colIdx === i
                ? SYMBOLS[Math.floor(Math.random()*SYMBOLS.length)]
                : rows[rowIdx][colIdx]
            )
          )
        );
      }, 80 + i*20)
    );

    const res = await fetch(`/api/coins?bet=${stake}`, { method:'POST' });
    const data = await res.json() as SpinResult|ErrorResult;

    await new Promise(r=>setTimeout(r,600));
    clearAll();

    if (!res.ok) {
      alert((data as ErrorResult).error);
      setSpinning(false);
      return;
    }

    const { grid:newGrid, balance:newBal, win } = data as SpinResult;
    setBalance(newBal);
    setGrid(newGrid);
    setWinAmount(win);

    // Figure out winning lines and highlight cells
    const highlights: [number,number][] = [];
    const winLines: [number,number][][] = [];
    PAYLINES.forEach(line => {
      const symbolsOnLine = line.map(([r,c]) => newGrid[r][c]);
      const first = symbolsOnLine[0];
      let count = 1;
      for (let i = 1; i < symbolsOnLine.length; i++) {
        if (symbolsOnLine[i] === first) count++;
        else break;
      }
      if (count >= 3) {
        // record this line
        winLines.push(line.slice(0, count));
        // highlight cells
        line.slice(0, count).forEach(coord => highlights.push(coord));
      }
    });
    setHighlightCells(highlights);
    setWinningLines(winLines);

    if (win > 0) {
      setShowConfetti(true);
      setTimeout(()=>setShowConfetti(false), Math.min(win*200,5000));
    }
    setSpinning(false);
  };

  const resetBet     = () => setBet(1);
  const incrementBet = () => setBet(b=>Math.min(balance,b+1,MAX_BET));

  // Generate SVG <polyline> points from a line of coords
  const linePoints = (line: [number,number][]) =>
    line
      .map(([r,c]) => {
        // center of cell in % of SVG viewBox
        const x = ((c + 0.5) / NUM_REELS) * 100;
        const y = ((r + 0.5) / NUM_ROWS) * 100;
        return `${x},${y}`;
      })
      .join(' ');

  return (
    <div className="w-full max-w-md md:max-w-lg mx-auto p-4 bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl relative">
      {showConfetti && (
        <Confetti
          width={windowSize.width} height={windowSize.height}
          numberOfPieces={Math.min(1000, winAmount*50)}
          gravity={0.2} initialVelocityY={winAmount>5?30:15}
          recycle={false}
          style={{ position:'fixed',top:0,left:0,pointerEvents:'none',zIndex:999 }}
        />
      )}

      {winAmount>0 && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-2 bg-white/90 backdrop-blur px-4 py-2 rounded-xl shadow-lg z-20">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
              d="M9 12l2 2 4-4m0 0l2 2-4 4m4-4l-2-2-4 4" />
          </svg>
          <span className="font-bold text-green-700 text-lg">You won {winAmount} coins!</span>
        </div>
      )}

      <div className="flex justify-between items-center mb-4 px-4 py-2 bg-gray-100/80 rounded-lg shadow-inner">
        <span className="font-medium text-lg md:text-xl">Balance: {balance} 💰</span>
        <span className="font-medium text-lg md:text-xl">Bet: {bet} 💵</span>
      </div>

      {/* reel grid + line-overlay */}
      <div className={`relative ${spinning?'spinning':''} grid grid-cols-5 gap-2 mb-6`}>
        {/* SVG overlay */}
        {winningLines.length > 0 && (
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {winningLines.map((line,i) => (
              <polyline
                key={i}
                points={linePoints(line)}
                fill="none"
                stroke="#FACC15"
                strokeWidth={2}
                strokeLinecap="round"
              />
            ))}
          </svg>
        )}

        {/* cells */}
        {grid.map((row, rIdx) =>
          row.map((sym, cIdx) => (
            <div
              key={`${rIdx}-${cIdx}`}
              className={`
                aspect-square flex items-center justify-center
                bg-gray-200/70 rounded-lg text-3xl md:text-4xl
                ${highlightCells.some(([r,c])=>r===rIdx&&c===cIdx)
                  ? 'ring-4 ring-yellow-400' : ''}
              `}
            >
              {sym}
            </div>
          ))
        )}
      </div>

      <button
        onClick={()=>spin()}
        disabled={spinning||balance<bet}
        className="w-full py-4 md:py-5 bg-green-500 hover:bg-green-600 disabled:bg-gray-400
                   text-white text-xl md:text-2xl font-bold rounded-full shadow-lg transition"
      >
        {spinning?'⏳ Spinning…':'🎰 SPIN 🎰'}
      </button>

      <div className="flex flex-wrap justify-center gap-3 mt-4">
        {/** Utility-only button styles **/}
        <button
          onClick={()=>spin(1)}
          disabled={spinning||balance<1}
          className="px-5 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300
                     text-white font-semibold rounded-full shadow transition"
        >
          Bet One
        </button>
        <button
          onClick={()=>spin(balance)}
          disabled={spinning||balance===0}
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
          disabled={spinning||bet>=balance}
          className="px-5 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-300
                     text-white font-semibold rounded-full shadow transition"
        >
          +1 Bet
        </button>
        <button
          onClick={()=>setShowModal(true)}
          className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white
                     font-semibold rounded-full shadow transition"
        >
          Buy Coins
        </button>
      </div>

      {showModal && (
        <div className="modal modal-open">
          <div className="modal-box w-11/12 max-w-sm">
            <h3 className="font-bold text-xl mb-2">Buy Coins</h3>
            <div className="flex justify-between gap-2">
              {[10,25,50].map(a=>(
                <button
                  key={a}
                  onClick={()=>{ setBalance(b=>b+a); setShowModal(false); }}
                  className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg
                             hover:bg-gray-100 transition text-center"
                >
                  +{a}
                </button>
              ))}
            </div>
            <div className="modal-action pt-4">
              <button
                onClick={()=>setShowModal(false)}
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
