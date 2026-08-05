import { describe, expect, it, vi } from "vitest";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import {
  buildTanrendUrl,
  createRateLimiter,
  isValidSubjectCode,
  MAX_SUBJECT_CODE_LENGTH,
  QueueCapacityError,
  SubjectRequestQueue,
  trimCache,
  validateSubjectCode,
} from "../server-utils.js";

function createResponse() {
  return {
    set: vi.fn().mockReturnThis(),
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
}

describe("subject code validation", () => {
  it.each(["IP-18fWPEG", "MATH-201", "DEMO-6", "code_1.test"])(
    "accepts %s",
    (code) => expect(isValidSubjectCode(code)).toBe(true),
  );

  it.each(["", "IP 18", "IP&k=other", "IP?x=1", "../subject", "code%26x"])(
    "rejects %s",
    (code) => expect(isValidSubjectCode(code)).toBe(false),
  );

  it("rejects oversized codes before continuing", () => {
    const status = vi.fn().mockReturnThis();
    const json = vi.fn().mockReturnThis();
    const next = vi.fn();

    validateSubjectCode(
      { params: { code: "A".repeat(MAX_SUBJECT_CODE_LENGTH + 1) } },
      { status, json },
      next,
    );

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({ error: "Invalid subject code" });
    expect(next).not.toHaveBeenCalled();
  });
});

describe("cache bounds", () => {
  it("keeps only the newest configured entries", async () => {
    const db = await open({ filename: ":memory:", driver: sqlite3.Database });
    try {
      await db.exec(
        "CREATE TABLE cache (key TEXT PRIMARY KEY, data TEXT, timestamp INTEGER)",
      );
      await db.run("INSERT INTO cache VALUES (?, ?, ?)", "old", "data", 1);
      await db.run("INSERT INTO cache VALUES (?, ?, ?)", "middle", "data", 2);
      await db.run("INSERT INTO cache VALUES (?, ?, ?)", "new", "data", 3);

      await trimCache(db, 2);

      const rows = await db.all("SELECT key FROM cache ORDER BY timestamp");
      expect(rows).toEqual([{ key: "middle" }, { key: "new" }]);
    } finally {
      await db.close();
    }
  });
});

describe("Tanrend URL construction", () => {
  it("keeps subject input inside the k query parameter", () => {
    const url = new URL(buildTanrendUrl("IP&k=other", "2025-2026-1"));

    expect(url.origin).toBe("https://tanrend.elte.hu");
    expect(url.searchParams.get("f")).toBe("2025-2026-1");
    expect(url.searchParams.get("m")).toBe("keres_kod_azon");
    expect(url.searchParams.getAll("k")).toEqual(["IP&k=other"]);
  });
});

describe("subject API rate limiter", () => {
  it("returns 429 after the configured client limit", () => {
    const limiter = createRateLimiter({ limit: 1, now: () => 1000 });
    const request = { ip: "127.0.0.1" };
    const firstResponse = createResponse();
    const limitedResponse = createResponse();
    const next = vi.fn();

    limiter(request, firstResponse, next);
    limiter(request, limitedResponse, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(limitedResponse.status).toHaveBeenCalledWith(429);
    expect(limitedResponse.json).toHaveBeenCalledWith({
      error: "Too many subject requests",
    });
    expect(limitedResponse.set).toHaveBeenCalledWith("Retry-After", "60");
  });

  it("starts a fresh window after the reset time", () => {
    let currentTime = 1000;
    const limiter = createRateLimiter({
      limit: 1,
      windowMs: 1000,
      now: () => currentTime,
    });
    const request = { ip: "127.0.0.1" };
    const next = vi.fn();

    limiter(request, createResponse(), next);
    currentTime = 2000;
    limiter(request, createResponse(), next);

    expect(next).toHaveBeenCalledTimes(2);
  });
});

describe("SubjectRequestQueue", () => {
  it("coalesces matching requests", async () => {
    let release;
    const handler = vi.fn(
      () =>
        new Promise((resolve) => {
          release = resolve;
        }),
    );
    const queue = new SubjectRequestQueue({ handler, delay: 0, maxQueued: 2 });

    const first = queue.enqueue("IP-18fWPEG", "2025-2026-1");
    const duplicate = queue.enqueue("IP-18fWPEG", "2025-2026-1");
    release("result");

    await expect(first).resolves.toBe("result");
    await expect(duplicate).resolves.toBe("result");
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("rejects work beyond the queue capacity", async () => {
    let releaseActive;
    const handler = vi.fn((code) =>
      code === "ACTIVE"
        ? new Promise((resolve) => {
            releaseActive = resolve;
          })
        : Promise.resolve("done"),
    );
    const queue = new SubjectRequestQueue({ handler, delay: 0, maxQueued: 1 });

    const active = queue.enqueue("ACTIVE", "term");
    const queued = queue.enqueue("QUEUED", "term");
    await expect(queue.enqueue("REJECTED", "term")).rejects.toBeInstanceOf(
      QueueCapacityError,
    );

    releaseActive("done");
    await active;
    await queued;
  });
});
