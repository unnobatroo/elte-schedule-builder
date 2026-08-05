import express from "express";
import cors from "cors";
import axios from "axios";
import path from "path";
import { fileURLToPath } from "url";
import { mkdir } from "fs/promises";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import {
  buildTanrendUrl,
  createRateLimiter,
  QueueCapacityError,
  readPositiveInteger,
  SubjectRequestQueue,
  trimCache,
  validateSubjectCode,
} from "./server-utils.js";
import { createSecurityHeaders } from "./security-headers.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT) || 3000;

// Cache configuration
const CACHE_DURATION = 3 * 60 * 60 * 1000; // 3 hours in milliseconds
const MAX_CACHE_ENTRIES = readPositiveInteger(
  process.env.MAX_CACHE_ENTRIES,
  1000,
);

// Queue configuration
const REQUEST_DELAY = 500; // 500ms between requests
const MAX_QUEUE_LENGTH = readPositiveInteger(process.env.MAX_QUEUE_LENGTH, 100);
const UPSTREAM_TIMEOUT = readPositiveInteger(
  process.env.UPSTREAM_TIMEOUT_MS,
  10000,
);
const MAX_UPSTREAM_RESPONSE_SIZE = 2 * 1024 * 1024;

export async function setupDatabase(
  filename = path.join(__dirname, "data", "cache.db"),
) {
  if (filename !== ":memory:") {
    await mkdir(path.dirname(filename), { recursive: true });
  }
  const database = await open({
    filename,
    driver: sqlite3.Database,
  });

  // Create cache table if it doesn't exist
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

async function getCachedData(database, key, cacheDuration, now) {
  const entry = await database.get(
    "SELECT * FROM cache WHERE key = ? AND timestamp > ?",
    key,
    now() - cacheDuration,
  );
  return entry
    ? { data: JSON.parse(entry.data), timestamp: entry.timestamp }
    : null;
}

async function setCachedData(database, key, data, maxEntries, now) {
  await database.run(
    "INSERT OR REPLACE INTO cache (key, data, timestamp) VALUES (?, ?, ?)",
    key,
    JSON.stringify(data),
    now(),
  );
  await trimCache(database, maxEntries);
}

async function cleanupCache(database, cacheDuration, now, logger) {
  const expiredTime = now() - cacheDuration;
  const result = await database.run(
    "DELETE FROM cache WHERE timestamp < ?",
    expiredTime,
  );
  if (result.changes > 0) {
    logger.log(`Cleaned up ${result.changes} expired cache entries`);
  }
}

export async function fetchSubjectData(subjectCode, term) {
  const targetUrl = buildTanrendUrl(subjectCode, term);

  const response = await axios.get(targetUrl, {
    timeout: UPSTREAM_TIMEOUT,
    maxContentLength: MAX_UPSTREAM_RESPONSE_SIZE,
    maxBodyLength: MAX_UPSTREAM_RESPONSE_SIZE,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
      Accept: "*/*",
      "Accept-Language": "en-US,en;q=0.9",
      Referer: "https://tanrend.elte.hu/oktatoitanrend_en",
    },
  });

  return response.data;
}

function getCurrentTerm() {
  const date = new Date();
  const year = date.getFullYear();
  const month = date.getMonth();
  const semester = month >= 6 ? 1 : 2;
  return `${
    semester === 1 ? `${year}-${year + 1}` : `${year - 1}-${year}`
  }-${semester}`;
}

// Mock data for demo subjects
function generateDemoData(subjectCode) {
  const demoData = {
    "DEMO-1": `
      <table id="resulttable">
        <tbody>
          <tr>
            <td>Monday 10:00-11:30</td>
            <td>DEMO-1-1 (lecture)</td>
            <td>Introduction to Web Development</td>
            <td>North Building 2.42</td>
            <td></td>
            <td>Dr. Jane Smith</td>
          </tr>
          <tr>
            <td>Wednesday 14:00-15:30</td>
            <td>DEMO-1-1 (practice)</td>
            <td>Introduction to Web Development</td>
            <td>South Building 1.12</td>
            <td></td>
            <td>John Doe</td>
          </tr>
          <tr>
            <td>Friday 10:00-11:30</td>
            <td>DEMO-1-2 (lecture)</td>
            <td>Introduction to Web Development</td>
            <td>North Building 2.42</td>
            <td></td>
            <td>Dr. Jane Smith</td>
          </tr>
          <tr>
            <td>Thursday 16:00-17:30</td>
            <td>DEMO-1-2 (practice)</td>
            <td>Introduction to Web Development</td>
            <td>Lágymányos Campus D.0.16</td>
            <td></td>
            <td>Jane Doe</td>
          </tr>
        </tbody>
      </table>
    `,
    "DEMO-2": `
      <table id="resulttable">
        <tbody>
          <tr>
            <td>Tuesday 08:00-09:30</td>
            <td>DEMO-2-1 (lecture)</td>
            <td>Advanced Database Systems</td>
            <td>North Building 4.56</td>
            <td></td>
            <td>Prof. Robert Johnson</td>
          </tr>
          <tr>
            <td>Tuesday 12:00-13:30</td>
            <td>DEMO-2-1 (practice)</td>
            <td>Advanced Database Systems</td>
            <td>South Building 3.21</td>
            <td></td>
            <td>Michael Brown</td>
          </tr>
          <tr>
            <td>Thursday 08:00-09:30</td>
            <td>DEMO-2-2 (lecture)</td>
            <td>Advanced Database Systems</td>
            <td>North Building 4.56</td>
            <td></td>
            <td>Prof. Robert Johnson</td>
          </tr>
          <tr>
            <td>Friday 14:00-15:30</td>
            <td>DEMO-2-2 (practice)</td>
            <td>Advanced Database Systems</td>
            <td>Lágymányos Campus D.1.28</td>
            <td></td>
            <td>Sarah Wilson</td>
          </tr>
        </tbody>
      </table>
    `,
    "DEMO-3": `
      <table id="resulttable">
        <tbody>
          <tr>
            <td>Monday 12:00-13:30</td>
            <td>DEMO-3-1 (lecture)</td>
            <td>Algorithms and Data Structures</td>
            <td>North Building 3.14</td>
            <td></td>
            <td>Dr. Alice Chen</td>
          </tr>
          <tr>
            <td>Monday 14:00-15:30</td>
            <td>DEMO-3-1 (practice)</td>
            <td>Algorithms and Data Structures</td>
            <td>South Building 2.08</td>
            <td></td>
            <td>Tom Anderson</td>
          </tr>
          <tr>
            <td>Wednesday 08:00-09:30</td>
            <td>DEMO-3-2 (lecture)</td>
            <td>Algorithms and Data Structures</td>
            <td>North Building 3.14</td>
            <td></td>
            <td>Dr. Alice Chen</td>
          </tr>
          <tr>
            <td>Wednesday 16:00-17:30</td>
            <td>DEMO-3-2 (practice)</td>
            <td>Algorithms and Data Structures</td>
            <td>Lágymányos Campus D.2.12</td>
            <td></td>
            <td>Emma Davis</td>
          </tr>
          <tr>
            <td>Thursday 12:00-13:30</td>
            <td>DEMO-3-3 (lecture)</td>
            <td>Algorithms and Data Structures</td>
            <td>North Building 3.14</td>
            <td></td>
            <td>Dr. Alice Chen</td>
          </tr>
          <tr>
            <td>Friday 18:00-19:30</td>
            <td>DEMO-3-3 (practice)</td>
            <td>Algorithms and Data Structures</td>
            <td>South Building 1.05</td>
            <td></td>
            <td>Oliver White</td>
          </tr>
        </tbody>
      </table>
    `,
    "DEMO-4": `
      <table id="resulttable">
        <tbody>
          <tr>
            <td>Monday 10:00-11:30</td>
            <td>DEMO-4-1 (lecture)</td>
            <td>Machine Learning Fundamentals</td>
            <td>North Building 5.10</td>
            <td></td>
            <td>Prof. David Martinez</td>
          </tr>
          <tr>
            <td>Tuesday 10:00-11:30</td>
            <td>DEMO-4-1 (practice)</td>
            <td>Machine Learning Fundamentals</td>
            <td>Computer Lab A</td>
            <td></td>
            <td>Lisa Thompson</td>
          </tr>
          <tr>
            <td>Wednesday 12:00-13:30</td>
            <td>DEMO-4-2 (lecture)</td>
            <td>Machine Learning Fundamentals</td>
            <td>North Building 5.10</td>
            <td></td>
            <td>Prof. David Martinez</td>
          </tr>
          <tr>
            <td>Thursday 14:00-15:30</td>
            <td>DEMO-4-2 (practice)</td>
            <td>Machine Learning Fundamentals</td>
            <td>Computer Lab B</td>
            <td></td>
            <td>Kevin Lee</td>
          </tr>
          <tr>
            <td>Friday 12:00-13:30</td>
            <td>DEMO-4-3 (lecture)</td>
            <td>Machine Learning Fundamentals</td>
            <td>North Building 5.10</td>
            <td></td>
            <td>Prof. David Martinez</td>
          </tr>
          <tr>
            <td>Friday 18:00-19:30</td>
            <td>DEMO-4-3 (practice)</td>
            <td>Machine Learning Fundamentals</td>
            <td>Computer Lab C</td>
            <td></td>
            <td>Maria Garcia</td>
          </tr>
        </tbody>
      </table>
    `,
    "DEMO-5": `
      <table id="resulttable">
        <tbody>
          <tr>
            <td>Tuesday 08:00-09:30</td>
            <td>DEMO-5-1 (lecture)</td>
            <td>Operating Systems</td>
            <td>North Building 1.22</td>
            <td></td>
            <td>Dr. Helen Brown</td>
          </tr>
          <tr>
            <td>Tuesday 18:00-19:30</td>
            <td>DEMO-5-1 (practice)</td>
            <td>Operating Systems</td>
            <td>South Building 4.15</td>
            <td></td>
            <td>Paul Miller</td>
          </tr>
          <tr>
            <td>Thursday 08:00-09:30</td>
            <td>DEMO-5-2 (lecture)</td>
            <td>Operating Systems</td>
            <td>North Building 1.22</td>
            <td></td>
            <td>Dr. Helen Brown</td>
          </tr>
          <tr>
            <td>Thursday 18:00-19:30</td>
            <td>DEMO-5-2 (practice)</td>
            <td>Operating Systems</td>
            <td>Lágymányos Campus D.3.45</td>
            <td></td>
            <td>Sophie Turner</td>
          </tr>
          <tr>
            <td>Friday 08:00-09:30</td>
            <td>DEMO-5-3 (lecture)</td>
            <td>Operating Systems</td>
            <td>North Building 1.22</td>
            <td></td>
            <td>Dr. Helen Brown</td>
          </tr>
          <tr>
            <td>Friday 16:00-17:30</td>
            <td>DEMO-5-3 (practice)</td>
            <td>Operating Systems</td>
            <td>South Building 3.07</td>
            <td></td>
            <td>James Wilson</td>
          </tr>
        </tbody>
      </table>
    `,
    "DEMO-6": `
      <table id="resulttable">
        <tbody>
          <tr>
            <td>Monday 16:00-17:30</td>
            <td>DEMO-6-1 (lecture)</td>
            <td>Computer Networks</td>
            <td>North Building 4.18</td>
            <td></td>
            <td>Prof. Richard Taylor</td>
          </tr>
          <tr>
            <td>Wednesday 10:00-11:30</td>
            <td>DEMO-6-1 (practice)</td>
            <td>Computer Networks</td>
            <td>Network Lab 1</td>
            <td></td>
            <td>Anna Rodriguez</td>
          </tr>
          <tr>
            <td>Tuesday 14:00-15:30</td>
            <td>DEMO-6-2 (lecture)</td>
            <td>Computer Networks</td>
            <td>North Building 4.18</td>
            <td></td>
            <td>Prof. Richard Taylor</td>
          </tr>
          <tr>
            <td>Thursday 16:00-17:30</td>
            <td>DEMO-6-2 (practice)</td>
            <td>Computer Networks</td>
            <td>Network Lab 2</td>
            <td></td>
            <td>Chris Martin</td>
          </tr>
          <tr>
            <td>Wednesday 18:00-19:30</td>
            <td>DEMO-6-3 (lecture)</td>
            <td>Computer Networks</td>
            <td>North Building 4.18</td>
            <td></td>
            <td>Prof. Richard Taylor</td>
          </tr>
          <tr>
            <td>Friday 10:00-11:30</td>
            <td>DEMO-6-3 (practice)</td>
            <td>Computer Networks</td>
            <td>Network Lab 3</td>
            <td></td>
            <td>Diana Clark</td>
          </tr>
        </tbody>
      </table>
    `,
  };

  return demoData[subjectCode] || null;
}

export function createApp({
  database,
  fetchSubject = fetchSubjectData,
  termProvider = getCurrentTerm,
  cacheDuration = CACHE_DURATION,
  maxCacheEntries = MAX_CACHE_ENTRIES,
  requestDelay = REQUEST_DELAY,
  maxQueueLength = MAX_QUEUE_LENGTH,
  subjectRateLimit = readPositiveInteger(process.env.SUBJECT_RATE_LIMIT, 60),
  now = Date.now,
  staticDirectory = path.join(__dirname, "dist"),
  trustProxyHops = Number.parseInt(process.env.TRUST_PROXY_HOPS, 10),
  logger = console,
} = {}) {
  if (!database) throw new TypeError("createApp requires a database");

  const app = express();
  const subjectRequestQueue = new SubjectRequestQueue({
    delay: requestDelay,
    maxQueued: maxQueueLength,
    handler: async (subjectCode, term) => {
      logger.log(`Processing queued request for ${subjectCode}`);
      const data = await fetchSubject(subjectCode, term);
      await setCachedData(
        database,
        `${term}-${subjectCode}`,
        data,
        maxCacheEntries,
        now,
      );
      return data;
    },
  });

  app.use(createSecurityHeaders());
  app.use(cors());
  if (Number.isInteger(trustProxyHops) && trustProxyHops > 0) {
    app.set("trust proxy", trustProxyHops);
  }
  app.use(
    "/api/subject",
    createRateLimiter({
      windowMs: 60 * 1000,
      limit: subjectRateLimit,
      now,
    }),
  );
  app.use(express.static(staticDirectory));

  app.get("/api/subject/:code", validateSubjectCode, async (req, res) => {
    try {
      const term = termProvider();
      const subjectCode = req.params.code;
      const cacheKey = `${term}-${subjectCode}`;
      const demoData = generateDemoData(subjectCode);

      if (demoData) {
        logger.log(`Returning demo data for ${subjectCode}`);
        return res.send(demoData);
      }

      const cachedData = await getCachedData(
        database,
        cacheKey,
        cacheDuration,
        now,
      );
      if (cachedData) {
        logger.log(`Cache hit for ${subjectCode}`);
        return res.send(cachedData.data);
      }

      logger.log(`Cache miss for ${subjectCode}, adding to queue`);
      const data = await subjectRequestQueue.enqueue(subjectCode, term);
      return res.send(data);
    } catch (error) {
      logger.error(
        `Error fetching data for subject ${req.params.code}:`,
        error,
      );
      if (error instanceof QueueCapacityError) {
        res.set("Retry-After", "1");
        return res.status(error.status).json({ error: error.message });
      }
      return res.status(error.response?.status || 500).json({
        error: "Failed to fetch subject data",
      });
    }
  });

  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticDirectory, "index.html"));
  });

  return {
    app,
    cleanupCache: () => cleanupCache(database, cacheDuration, now, logger),
  };
}

export async function startServer({
  listenPort = port,
  databaseFilename = process.env.CACHE_DB_PATH ||
    path.join(__dirname, "data", "cache.db"),
  logger = console,
} = {}) {
  const database = await setupDatabase(databaseFilename);
  const { app, cleanupCache: cleanup } = createApp({ database, logger });
  const cacheCleanupInterval = setInterval(cleanup, 60 * 60 * 1000);
  const server = app.listen(listenPort, () => {
    logger.log(`Server running at http://localhost:${listenPort}`);
  });

  return {
    app,
    database,
    server,
    async close() {
      clearInterval(cacheCleanupInterval);
      await new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      });
      await database.close();
    },
  };
}

let defaultRuntime;
const isMainModule =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMainModule) {
  defaultRuntime = await startServer();
}

export async function closeServer() {
  await defaultRuntime?.close();
  defaultRuntime = undefined;
}
