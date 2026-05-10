import { neon } from '@netlify/neon';
import { ensureSchema } from './schema';

/**
 * Returns a Neon HTTP SQL client bound to the Netlify-provisioned database.
 *
 * On Netlify production builds the platform injects `NETLIFY_DATABASE_URL`
 * automatically (the built-in Netlify DB / Neon integration). For local
 * development without `netlify dev`, set `DATABASE_URL` in `.env.local` to a
 * Neon connection string.
 */
export function getNeon() {
  const url = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      'Missing database URL. Netlify automatically sets NETLIFY_DATABASE_URL ' +
        'for production builds when the Netlify DB extension is enabled. For ' +
        'local development, set DATABASE_URL in .env.local or run via ' +
        '`netlify dev`.'
    );
  }
  return neon(url);
}

/**
 * Returns a Neon SQL client and guarantees the application schema has been
 * provisioned. The schema bootstrap runs at most once per process — every API
 * route can call this freely.
 */
export async function getReadyNeon() {
  const sql = getNeon();
  await ensureSchema(sql);
  return sql;
}
