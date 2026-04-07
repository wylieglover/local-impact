import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';
import 'dotenv/config';

// Use the "Transaction" connection string from Supabase
const connectionString = process.env.DATABASE_URL!;

// Disable prefetch as Supabase uses a connection pooler (PgBouncer/Supavisor)
const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client, { schema });