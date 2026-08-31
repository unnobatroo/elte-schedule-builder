import path from "node:path";
import { fileURLToPath } from "node:url";
import { mkdir } from "node:fs/promises";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

export const DEFAULT_CACHE_DB_PATH = path.join(projectRoot, "data", "cache.db");

export async function setupDatabase(filename = DEFAULT_CACHE_DB_PATH) {
  if (filename !== ":memory:") {
    await mkdir(path.dirname(filename), { recursive: true });
  }
  const database = await open({
    filename,
    driver: sqlite3.Database,
  });

  await database.exec(`
    CREATE TABLE IF NOT EXISTS cache (
      key TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      timestamp INTEGER NOT NULL
    )
  `);

  // Create index on timestamp for faster cleanup queries
  await database.exec(`
    CREATE INDEX IF NOT EXISTS idx_timestamp ON cache(timestamp)
  `);
  return database;
}

export async function getCachedData(database, key, cacheDuration, now) {
  const entry = await database.get(
    "SELECT * FROM cache WHERE key = ? AND timestamp > ?",
    key,
    now() - cacheDuration,
  );
  return entry
    ? { data: JSON.parse(entry.data), timestamp: entry.timestamp }
    : null;
}

export async function setCachedData(database, key, data, maxEntries, now) {
  await database.run(
    "INSERT OR REPLACE INTO cache (key, data, timestamp) VALUES (?, ?, ?)",
    key,
    JSON.stringify(data),
    now(),
  );
  await trimCache(database, maxEntries);
}

export async function cleanupCache(database, cacheDuration, now, logger) {
  const expiredTime = now() - cacheDuration;
  const result = await database.run(
    "DELETE FROM cache WHERE timestamp < ?",
    expiredTime,
  );
  if (result.changes > 0) {
    logger.log(`Cleaned up ${result.changes} expired cache entries`);
  }
}

export async function trimCache(db, maxEntries) {
  await db.run(
    `DELETE FROM cache
     WHERE key IN (
       SELECT key FROM cache
       ORDER BY timestamp DESC, key DESC
       LIMIT -1 OFFSET ?
     )`,
    maxEntries,
  );
}
