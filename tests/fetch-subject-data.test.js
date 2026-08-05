import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchSubjectData } from "../src/utils/schedule.js";

describe("fetchSubjectData", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("encodes the subject code as one path segment", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => '<table id="resulttable"><tbody></tbody></table>',
    });
    vi.stubGlobal("fetch", fetchMock);

    await fetchSubjectData("IP&k=other");

    expect(fetchMock).toHaveBeenCalledWith("/api/subject/IP%26k%3Dother");
  });

  it("rejects HTTP failures so the UI can show an error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
    }));

    await expect(fetchSubjectData("IK-FAIL")).rejects.toThrow(
      "HTTP error! status: 503"
    );
  });

  it("rejects network failures so the UI can show an error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    await expect(fetchSubjectData("IK-OFFLINE")).rejects.toThrow("offline");
  });
});
