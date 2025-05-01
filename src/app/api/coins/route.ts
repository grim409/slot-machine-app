import { NextRequest, NextResponse } from 'next/server';
import { getServerSession }        from 'next-auth/next';
import { authOptions }             from '../../lib/auth';
import { redis }                   from '../../lib/redis-client';
import {
  pickSymbol,
  PAYLINES,
  getPayoutTable,
  SymbolType
} from '../../../lib/slotConfig';

const DAILY_BONUS   = 10;
const MILLIS_IN_DAY = 1000 * 60 * 60 * 24;
const NUM_REELS     = 5;
const NUM_ROWS      = 3;
const MAX_BET       = parseInt(process.env.MAX_BET ?? '5000', 10);

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id as string;
  const key    = `coins:${userId}`;
  const today  = new Date().toDateString();

  const rawLast = await redis.hget(key, 'lastReset') as string | null;
  const rawBal  = await redis.hget(key, 'balance')   as string | null;
  let balance   = parseInt(rawBal ?? '0', 10);

  if (rawLast) {
    const days = Math.floor((Date.now() - new Date(rawLast).getTime()) / MILLIS_IN_DAY);
    if (days >= 1) {
      balance += DAILY_BONUS * days;
      await redis.hset(key, { balance: balance.toString(), lastReset: today });
    }
  } else {
    balance += DAILY_BONUS;
    await redis.hset(key, { balance: balance.toString(), lastReset: today });
  }

  return NextResponse.json({ balance });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id as string;
  const key    = `coins:${userId}`;

  const { searchParams } = new URL(request.url);
  let bet = Math.max(1, parseInt(searchParams.get('bet') ?? '1', 10));
  bet = Math.min(bet, MAX_BET);

  const rawBal = await redis.hget(key, 'balance') as string | null;
  let balance = parseInt(rawBal ?? '0', 10);
  if (balance < bet) {
    return NextResponse.json({ error: 'Insufficient coins' }, { status: 400 });
  }
  balance -= bet;

  // 1) Build weighted 3×5 grid
  const grid: string[][] = Array.from({ length: NUM_ROWS }, () =>
    Array.from({ length: NUM_REELS }, () => pickSymbol())
  );

  // 2) Unlock paylines by bet
  const unlockCount = Math.min(
    PAYLINES.length,
    Math.max(1, Math.ceil((bet / MAX_BET) * PAYLINES.length))
  );
  const activeLines = PAYLINES.slice(0, unlockCount);

  // 3) Evaluate wins using symbol‐specific tables
  let totalWin = 0;
  for (const line of activeLines) {
    const symbolsOnLine = line.map(([r, c]) => grid[r][c] as SymbolType);
    const first = symbolsOnLine[0];
    let count = 1;
    for (let i = 1; i < symbolsOnLine.length; i++) {
      if (symbolsOnLine[i] === first) count++;
      else break;
    }
    if (count >= 3) {
      const table = getPayoutTable(first);
      totalWin += bet * (table[count as 3|4|5] ?? 0);
    }
  }

  // 4) Persist and respond
  balance += totalWin;
  await redis.hset(key, { balance: balance.toString() });

  return NextResponse.json({ grid, balance, win: totalWin });
}
