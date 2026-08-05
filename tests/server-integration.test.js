import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createApp, setupDatabase } from "../server.js";

const logger = { log: vi.fn(), error: vi.fn() };
const termProvider = () => "2026-2027-1";
let database;
let server;

async function startApp(options = {}) {
  const { app, cleanupCache } = createApp({
    database,
    requestDelay: 0,
    termProvider,
    logger,
    ...options,
  });
  server = await new Promise((resolve) => {
    const listeningServer = app.listen(0, "127.0.0.1", () =>
      resolve(listeningServer),
    );
  });
  const { port } = server.address();
  return {
    cleanupCache,
    get: (path) => fetch(`http://127.0.0.1:${port}${path}`),
  };
}

beforeEach(async () => {
  database = await setupDatabase(":memory:");
  logger.log.mockClear();
  logger.error.mockClear();
});

afterEach(async () => {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    server = undefined;
  }
  await database.close();
});

describe("subject API integration", () => {
  it("serves DEMO data without calling the upstream", async () => {
    const fetchSubject = vi.fn();
    const { get } = await startApp({ fetchSubject });

    const response = await get("/api/subject/DEMO-1");
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(body).toContain("Introduction to Web Development");
    expect(body).toContain("DEMO-1-1 (lecture)");
    expect(fetchSubject).not.toHaveBeenCalled();
  });

  it("rejects invalid decoded subject codes", async () => {
    const { get } = await startApp();

    const response = await get("/api/subject/IP%26other");

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid subject code",
    });
  });

  it("caches an upstream response and reuses it", async () => {
    const upstreamHtml =
      '<table id="resulttable"><tbody><tr><td>cached</td></tr></tbody></table>';
    const fetchSubject = vi.fn().mockResolvedValue(upstreamHtml);
    const { get } = await startApp({ fetchSubject });

    const first = await get("/api/subject/IK-TEST");
    const second = await get("/api/subject/IK-TEST");

    expect(await first.text()).toBe(upstreamHtml);
    expect(await second.text()).toBe(upstreamHtml);
    expect(fetchSubject).toHaveBeenCalledOnce();
    expect(fetchSubject).toHaveBeenCalledWith("IK-TEST", "2026-2027-1");
    await expect(
      database.get("SELECT COUNT(*) AS count FROM cache"),
    ).resolves.toEqual({ count: 1 });
  });

  it("coalesces concurrent cache misses for the same subject", async () => {
    let release;
    const fetchSubject = vi.fn(
      () =>
        new Promise((resolve) => {
          release = resolve;
        }),
    );
    const { get } = await startApp({ fetchSubject });

    const first = get("/api/subject/IK-SAME");
    const second = get("/api/subject/IK-SAME");
    await vi.waitFor(() => expect(fetchSubject).toHaveBeenCalledOnce());
    release("same response");

    expect(await (await first).text()).toBe("same response");
    expect(await (await second).text()).toBe("same response");
  });

  it("returns the upstream status without exposing upstream details", async () => {
    const upstreamError = Object.assign(new Error("private upstream detail"), {
      response: { status: 503 },
    });
    const { get } = await startApp({
      fetchSubject: vi.fn().mockRejectedValue(upstreamError),
    });

    const response = await get("/api/subject/IK-FAIL");

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "Failed to fetch subject data",
    });
    expect(logger.error).toHaveBeenCalledOnce();
  });

  it("cleans expired cache entries while retaining current entries", async () => {
    let currentTime = 10_000;
    await database.run("INSERT INTO cache VALUES (?, ?, ?)", "old", '"old"', 1);
    await database.run(
      "INSERT INTO cache VALUES (?, ?, ?)",
      "current",
      '"current"',
      currentTime,
    );
    const { cleanupCache } = await startApp({
      cacheDuration: 1_000,
      now: () => currentTime,
    });

    await cleanupCache();

    await expect(
      database.all("SELECT key FROM cache ORDER BY key"),
    ).resolves.toEqual([{ key: "current" }]);
  });
});
