import 'dotenv/config'; 
import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';
import postgres from 'postgres';

// Load environment variables if they aren't loaded by your framework

if (!process.env.DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL environment variable is missing.');
  process.exit(1);
}

const queryClient = postgres(process.env.DATABASE_URL);
const db = drizzle(queryClient);

async function main() {
  console.log('🧼 Dropping all tables...');
  
  // Wipe the public schema to clear all tables, types, and Drizzle metadata
  await db.execute(sql`DROP SCHEMA public CASCADE;`);
  await db.execute(sql`CREATE SCHEMA public;`);
  
  console.log('✅ Database cleared!');
  
  await queryClient.end();
}

main().catch(async (error) => {
  console.error('❌ Script failed:', error);
  await queryClient.end();
  process.exit(1);
});
