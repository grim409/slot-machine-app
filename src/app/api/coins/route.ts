import { NextRequest, NextResponse } from 'next/server';
import { getServerSession }        from 'next-auth/next';
import { authOptions }             from '../../lib/auth';
import { redis }                   from '../../lib/redis-client';
import { SYMBOLS, PAYLINES, PAYOUTS } from '../../../lib/slotConfig';

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
    const lastDate = new Date(rawLast);
    const days     = Math.floor((Date.now() - lastDate.getTime()) / MILLIS_IN_DAY);
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

  // build 3×5 grid
  const grid: string[][] = Array.from({ length: NUM_ROWS }, () =>
    Array.from({ length: NUM_REELS }, () =>
      SYMBOLS[Math.floor(Math.random()*SYMBOLS.length)]
    )
  );

  // unlock lines
  const unlockCount = Math.min(
    PAYLINES.length,
    Math.max(1, Math.ceil((bet / MAX_BET) * PAYLINES.length))
  );
  const activeLines = PAYLINES.slice(0, unlockCount);

  // evaluate wins
  let totalWin = 0;
  for (const line of activeLines) {
    const symbolsOnLine = line.map(([r,c]) => grid[r][c]);
    const first = symbolsOnLine[0];
    let count = 1;
    for (let i=1; i<symbolsOnLine.length; i++) {
      if (symbolsOnLine[i] === first) count++;
      else break;
    }
    if (count >= 3) {
      totalWin += bet * (PAYOUTS[count as 3|4|5] ?? 0);
    }
  }

  balance += totalWin;
  await redis.hset(key, { balance: balance.toString() });

  return NextResponse.json({ grid, balance, win: totalWin });
}
