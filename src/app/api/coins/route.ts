import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../lib/auth';
import { redis } from '../../lib/redis-client';

const NUM_REELS = 5;
//const NUM_ROWS  = 3;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = session.user as { id: string };
  const key = `coins:${user.id}`;
  const today = new Date().toDateString();

  const last = await redis.hget(key, 'lastReset');
  if (last !== today) {
    await redis.hset(key, { balance: 10, lastReset: today });
  }

  const balance = parseInt((await redis.hget(key, 'balance')) || '0', 10);
  return NextResponse.json({ balance });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = session.user as { id: string };
  const key = `coins:${user.id}`;

  // Read bet from ?bet= query (default to 1)
  const { searchParams } = new URL(request.url);
  const bet = Math.max(1, parseInt(searchParams.get('bet') || '1', 10));

  // Fetch current balance
  let balance = parseInt((await redis.hget(key, 'balance')) || '0', 10);
  if (balance < bet) {
    return NextResponse.json({ error: 'Insufficient coins' }, { status: 400 });
  }

  // Deduct the stake
  balance -= bet;

  // Generate NUM_REELS random symbols
  const symbols = ['🍒','🍋','🔔','⭐','🍊','7️⃣'];
  const reels = Array.from({ length: NUM_REELS }, () =>
    symbols[Math.floor(Math.random() * symbols.length)]
  );

  // Payout logic: 3-of-a-kind = 5×bet, 2-of-a-kind = 2×bet
  const isThree = reels.every(s => s === reels[0]);
  const isTwo = reels.some((s, i) =>
    reels.slice(i + 1).includes(s)
  );
  const win = isThree ? bet * 5 : isTwo ? bet * 2 : 0;
  balance += win;

  // Persist new balance
  await redis.hset(key, { balance });

  return NextResponse.json({ reels, balance });
}
