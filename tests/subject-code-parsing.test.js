import { describe, it, expect } from "vitest";
import {
  getEventGroupNumber,
  getTanrendSubjectCode,
  parseSubjectCodes,
  processSubjectCode,
} from "../src/utils/schedule.js";

describe("Subject Code Processing", () => {
  describe("processSubjectCode", () => {
    it("should remove the last part (group number) from a standard code", () => {
      const result = processSubjectCode("IP-18fWPEG-90");
      expect(result).toBe("IP-18fWPEG");
    });

    it("should handle code with multiple dashes", () => {
      const result = processSubjectCode("CS-101-A-01");
      expect(result).toBe("CS-101-A");
    });

    it("should return the code as-is if no dash exists", () => {
      const result = processSubjectCode("STANDALONE");
      expect(result).toBe("STANDALONE");
    });

    it("should handle code with two parts", () => {
      const result = processSubjectCode("MATH-01");
      expect(result).toBe("MATH");
    });

    it("should handle practice code format", () => {
      const result = processSubjectCode("IP-18fKVFPG-91");
      expect(result).toBe("IP-18fKVFPG");
    });

    it("should handle empty string", () => {
      const result = processSubjectCode("");
      expect(result).toBe("");
    });

    it("should handle code with only dash at end", () => {
      const result = processSubjectCode("CODE-");
      expect(result).toBe("CODE");
    });
  });

  describe("parseSubjectCodes", () => {
    it("should parse space-separated codes", () => {
      const result = parseSubjectCodes("IP-18fWPEG IP-18fKVFPG MATH-201");
      expect(result).toEqual(["IP-18fWPEG", "IP-18fKVFPG", "MATH-201"]);
    });

    it("should parse comma-separated codes", () => {
      const result = parseSubjectCodes("IP-18fWPEG,IP-18fKVFPG,MATH-201");
      expect(result).toEqual(["IP-18fWPEG", "IP-18fKVFPG", "MATH-201"]);
    });

    it("should parse newline-separated codes", () => {
      const result = parseSubjectCodes("IP-18fWPEG\nIP-18fKVFPG\nMATH-201");
      expect(result).toEqual(["IP-18fWPEG", "IP-18fKVFPG", "MATH-201"]);
    });

    it("should parse mixed separators", () => {
      const result = parseSubjectCodes(
        "IP-18fWPEG, IP-18fKVFPG\nMATH-201 CS-101",
      );
      expect(result).toEqual([
        "IP-18fWPEG",
        "IP-18fKVFPG",
        "MATH-201",
        "CS-101",
      ]);
    });

    it("should handle extra whitespace", () => {
      const result = parseSubjectCodes("  IP-18fWPEG   IP-18fKVFPG  ");
      expect(result).toEqual(["IP-18fWPEG", "IP-18fKVFPG"]);
    });

    it("should filter out empty strings", () => {
      const result = parseSubjectCodes("IP-18fWPEG  ,  , IP-18fKVFPG");
      expect(result).toEqual(["IP-18fWPEG", "IP-18fKVFPG"]);
    });

    it("should handle empty input", () => {
      const result = parseSubjectCodes("");
      expect(result).toEqual([]);
    });

    it("should handle input with only whitespace", () => {
      const result = parseSubjectCodes("   \n  \t  ");
      expect(result).toEqual([]);
    });

    it("should handle single code", () => {
      const result = parseSubjectCodes("IP-18fWPEG-90");
      expect(result).toEqual(["IP-18fWPEG-90"]);
    });

    it("should preserve full code format with group numbers", () => {
      const result = parseSubjectCodes("IP-18fWPEG-90 IP-18fKVFPG-91");
      expect(result).toEqual(["IP-18fWPEG-90", "IP-18fKVFPG-91"]);
    });
  });

  describe("getTanrendSubjectCode", () => {
    it("preserves two-part base codes used by demo and Tanrend searches", () => {
      expect(getTanrendSubjectCode("DEMO-1")).toBe("DEMO-1");
    });

    it("removes a group suffix from longer Tanrend codes", () => {
      expect(getTanrendSubjectCode("IP-18fWPEG-90")).toBe("IP-18fWPEG");
      expect(getTanrendSubjectCode("CS-101-A-01")).toBe("CS-101-A");
    });
  });

  describe("getEventGroupNumber", () => {
    it("returns the group suffix from a standard event code", () => {
      expect(getEventGroupNumber({ code: "IP-18fWPEG-90" })).toBe("90");
    });

    it("uses the final segment of longer event codes", () => {
      expect(getEventGroupNumber({ code: "CS-101-A-01" })).toBe("01");
    });

    it("falls back to the description for older saved events", () => {
      expect(
        getEventGroupNumber({
          description: "IP-18fKVFPG-91\nInstructor: Teaching Assistant",
        }),
      ).toBe("91");
    });

    it("returns an empty value for missing or group-less codes", () => {
      expect(getEventGroupNumber({ code: "DEMO-1" })).toBe("");
      expect(getEventGroupNumber({ code: "" })).toBe("");
      expect(getEventGroupNumber()).toBe("");
    });
  });
});
