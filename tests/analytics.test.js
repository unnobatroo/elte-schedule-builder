import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const websiteId = "43f76008-27af-452a-9471-53ea959066a6";
const analyticsOrigin = "https://yep-im-trackinnnn.w04m1.dev";

describe("production analytics", () => {
  it("loads tracking and session-recording scripts with the production website ID", async () => {
    const html = await readFile(resolve(process.cwd(), "index.html"), "utf8");
    const document = new DOMParser().parseFromString(html, "text/html");
    const analyticsScripts = [
      ...document.querySelectorAll(`script[data-website-id="${websiteId}"]`),
    ];

    expect(
      analyticsScripts.map((script) => ({
        defer: script.defer,
        src: script.src,
      })),
    ).toEqual([
      { defer: true, src: `${analyticsOrigin}/script.js` },
      { defer: true, src: `${analyticsOrigin}/recorder.js` },
    ]);
  });
});
