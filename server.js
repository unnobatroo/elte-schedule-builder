import express from "express";
import cors from "cors";
import axios from "axios";
import path from "path";
import { fileURLToPath } from "url";
import { mkdir } from "fs/promises";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT) || 3000;

// Cache configuration
const CACHE_DURATION = 3 * 60 * 60 * 1000; // 3 hours in milliseconds

// Queue configuration
const REQUEST_DELAY = 500; // 500ms between requests
let requestQueue = [];
let isProcessingQueue = false;

// Database setup
let db;
async function setupDatabase() {
  await mkdir(path.join(__dirname, "data"), { recursive: true });
  db = await open({
    filename: path.join(__dirname, "data", "cache.db"),
    driver: sqlite3.Database,
  });

  // Create cache table if it doesn't exist
  await db.exec(`
    CREATE TABLE IF NOT EXISTS cache (
      key TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      timestamp INTEGER NOT NULL
    )
  `);

  // Create index on timestamp for faster cleanup queries
  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_timestamp ON cache(timestamp)
  `);
}

async function getCachedData(key) {
  const entry = await db.get(
    "SELECT * FROM cache WHERE key = ? AND timestamp > ?",
    key,
    Date.now() - CACHE_DURATION
  );
  return entry
    ? { data: JSON.parse(entry.data), timestamp: entry.timestamp }
    : null;
}

async function setCachedData(key, data) {
  await db.run(
    "INSERT OR REPLACE INTO cache (key, data, timestamp) VALUES (?, ?, ?)",
    key,
    JSON.stringify(data),
    Date.now()
  );
}

async function cleanupCache() {
  const expiredTime = Date.now() - CACHE_DURATION;
  const result = await db.run(
    "DELETE FROM cache WHERE timestamp < ?",
    expiredTime
  );
  if (result.changes > 0) {
    console.log(`Cleaned up ${result.changes} expired cache entries`);
  }
}

async function fetchSubjectData(subjectCode, term) {
  const targetUrl = `https://tanrend.elte.hu/tanrendnavigation_en.php?f=${term}&m=keres_kod_azon&k=${subjectCode}`;

  const response = await axios.get(targetUrl, {
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

async function processQueue() {
  if (isProcessingQueue || requestQueue.length === 0) return;

  isProcessingQueue = true;

  while (requestQueue.length > 0) {
    const { subjectCode, term, resolve, reject } = requestQueue.shift();
    try {
      console.log(`Processing queued request for ${subjectCode}`);
      const data = await fetchSubjectData(subjectCode, term);
      await setCachedData(`${term}-${subjectCode}`, data);
      resolve(data);
    } catch (error) {
      console.error(
        `Error processing queued request for ${subjectCode}:`,
        error
      );
      reject(error);
    }

    // Wait before processing next request
    if (requestQueue.length > 0) {
      await new Promise((resolve) => setTimeout(resolve, REQUEST_DELAY));
    }
  }

  isProcessingQueue = false;
}

function queueRequest(subjectCode, term) {
  return new Promise((resolve, reject) => {
    requestQueue.push({ subjectCode, term, resolve, reject });
    processQueue(); // Start processing if not already running
  });
}

app.use(cors());
// Serve the built files from the dist directory
app.use(express.static(path.join(__dirname, "dist")));

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

app.get("/api/subject/:code", async (req, res) => {
  try {
    const term = getCurrentTerm();
    const subjectCode = req.params.code;
    const cacheKey = `${term}-${subjectCode}`;

    // Check if this is a demo subject
    const demoData = generateDemoData(subjectCode);
    if (demoData) {
      console.log(`Returning demo data for ${subjectCode}`);
      return res.send(demoData);
    }

    // Check cache first
    const cachedData = await getCachedData(cacheKey);
    if (cachedData) {
      console.log(`Cache hit for ${subjectCode}`);
      return res.send(cachedData.data);
    }

    // If not in cache, queue the request
    console.log(`Cache miss for ${subjectCode}, adding to queue`);
    const data = await queueRequest(subjectCode, term);
    res.send(data);
  } catch (error) {
    console.error(`Error fetching data for subject ${req.params.code}:`, error);
    res.status(error.response?.status || 500).send(error.message);
  }
});

await setupDatabase();

setInterval(cleanupCache, 60 * 60 * 1000);

// Handle SPA routing
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
