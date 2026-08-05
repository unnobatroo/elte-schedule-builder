export const MAX_SUBJECT_CODE_LENGTH = 64;
const SUBJECT_CODE_PATTERN = /^[A-Za-z0-9._-]+$/;

export function readPositiveInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function isValidSubjectCode(subjectCode) {
  return typeof subjectCode === "string" &&
    subjectCode.length <= MAX_SUBJECT_CODE_LENGTH &&
    SUBJECT_CODE_PATTERN.test(subjectCode);
}

export function validateSubjectCode(req, res, next) {
  if (!isValidSubjectCode(req.params.code)) {
    return res.status(400).json({ error: "Invalid subject code" });
  }

  next();
}

export function buildTanrendUrl(subjectCode, term) {
  const targetUrl = new URL("https://tanrend.elte.hu/tanrendnavigation_en.php");
  targetUrl.search = new URLSearchParams({
    f: term,
    m: "keres_kod_azon",
    k: subjectCode,
  });
  return targetUrl.toString();
}

export async function trimCache(db, maxEntries) {
  await db.run(
    `DELETE FROM cache
     WHERE key IN (
       SELECT key FROM cache
       ORDER BY timestamp DESC, key DESC
       LIMIT -1 OFFSET ?
     )`,
    maxEntries
  );
}

export function createRateLimiter({
  windowMs = 60 * 1000,
  limit = 60,
  maxClients = 10000,
  now = Date.now,
} = {}) {
  const clients = new Map();

  return function rateLimiter(req, res, next) {
    const currentTime = now();
    const clientId = req.ip || req.socket?.remoteAddress || "unknown";
    let client = clients.get(clientId);

    if (!client || client.resetAt <= currentTime) {
      if (!clients.has(clientId) && clients.size >= maxClients) {
        for (const [id, entry] of clients) {
          if (entry.resetAt <= currentTime) clients.delete(id);
        }
        if (clients.size >= maxClients) {
          clients.delete(clients.keys().next().value);
        }
      }

      client = { count: 0, resetAt: currentTime + windowMs };
      clients.set(clientId, client);
    }

    client.count += 1;
    const resetSeconds = Math.max(
      1,
      Math.ceil((client.resetAt - currentTime) / 1000)
    );
    res.set({
      "RateLimit-Limit": String(limit),
      "RateLimit-Remaining": String(Math.max(0, limit - client.count)),
      "RateLimit-Reset": String(resetSeconds),
    });

    if (client.count > limit) {
      res.set("Retry-After", String(resetSeconds));
      return res.status(429).json({ error: "Too many subject requests" });
    }

    next();
  };
}

export class QueueCapacityError extends Error {
  constructor() {
    super("Subject request queue is full");
    this.name = "QueueCapacityError";
    this.status = 503;
  }
}

export class SubjectRequestQueue {
  constructor({ handler, delay = 500, maxQueued = 100 }) {
    this.handler = handler;
    this.delay = delay;
    this.maxQueued = maxQueued;
    this.queue = [];
    this.pending = new Map();
    this.isProcessing = false;
  }

  enqueue(subjectCode, term) {
    const key = `${term}-${subjectCode}`;
    const pendingRequest = this.pending.get(key);
    if (pendingRequest) return pendingRequest;

    if (this.queue.length >= this.maxQueued) {
      return Promise.reject(new QueueCapacityError());
    }

    const request = new Promise((resolve, reject) => {
      this.queue.push({ subjectCode, term, resolve, reject });
    });
    const trackedRequest = request.finally(() => this.pending.delete(key));
    this.pending.set(key, trackedRequest);
    void this.process();
    return trackedRequest;
  }

  async process() {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const { subjectCode, term, resolve, reject } = this.queue.shift();
      try {
        resolve(await this.handler(subjectCode, term));
      } catch (error) {
        reject(error);
      }

      if (this.queue.length > 0 && this.delay > 0) {
        await new Promise((resolveDelay) => setTimeout(resolveDelay, this.delay));
      }
    }

    this.isProcessing = false;
  }
}
