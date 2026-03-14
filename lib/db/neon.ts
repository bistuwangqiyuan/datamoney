import { neon } from '@netlify/neon';

const connectionString =
  process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;

export function getNeon() {
  const url = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      'Missing database URL. Set NETLIFY_DATABASE_URL (Netlify) or DATABASE_URL (local). Run `npx netlify db init` for Netlify DB.'
    );
  }
  return neon(url);
}
