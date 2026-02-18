import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './db/schema';

const rawConnectionString = process.env.DATABASE_URL;

if (!rawConnectionString) {
  throw new Error('DATABASE_URL is not set');
}

const connectionString = (() => {
  try {
    new URL(rawConnectionString);
    return rawConnectionString;
  } catch {
    const match = rawConnectionString.match(/^(\w+:\/\/)([^:]+):([^@]+)@(.+)$/);
    if (!match || !match[3]) {
      return rawConnectionString;
    }
    const [, protocol, user, password, rest] = match;
    return `${protocol}${user}:${encodeURIComponent(password)}@${rest}`;
  }
})();

export const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, { schema });