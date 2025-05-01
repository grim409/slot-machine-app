require('dotenv').config({ path: '.env.local' });
const { Redis } = require('@upstash/redis');

async function main() {
  const redis = new Redis({
    url:   process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN,
  });

  // Get next ID (counter will initialize to 1 if missing)
  const id = (await redis.incr('user:id:counter')).toString();

  // Store the user record
  await redis.hset(`user:${id}`, {
    id,
    name: 'Dev User',
    email: 'dev@example.com',
    emailVerified: '',
    image: '',
  });

  // Index by email so NextAuth can find them
  await redis.set(`index:email:dev@example.com`, id);

  console.log(`✅ Created user dev@example.com with id ${id}`);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
