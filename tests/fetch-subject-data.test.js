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
});
