import { describe, it, expect } from "vitest";
import {
  extractBaseCodesFromFull,
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
        "IP-18fWPEG, IP-18fKVFPG\nMATH-201 CS-101"
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

  describe("extractBaseCodesFromFull", () => {
    it("should extract base codes from full codes with group numbers", () => {
      const fullCodes = ["IP-18fWPEG-90", "IP-18fKVFPG-91", "MATH-201-01"];
      const result = extractBaseCodesFromFull(fullCodes);
      expect(result).toEqual(["IP-18fWPEG", "IP-18fKVFPG", "MATH-201"]);
    });

    it("should remove duplicate base codes", () => {
      const fullCodes = ["IP-18fWPEG-90", "IP-18fWPEG-91", "IP-18fWPEG-92"];
      const result = extractBaseCodesFromFull(fullCodes);
      expect(result).toEqual(["IP-18fWPEG"]);
    });

    it("should handle mix of full and base codes", () => {
      const fullCodes = ["IP-18fWPEG-90", "STANDALONE", "MATH-201-01"];
      const result = extractBaseCodesFromFull(fullCodes);
      expect(result).toEqual(["IP-18fWPEG", "STANDALONE", "MATH-201"]);
    });

    it("should handle empty array", () => {
      const result = extractBaseCodesFromFull([]);
      expect(result).toEqual([]);
    });

    it("should handle codes without dashes", () => {
      const fullCodes = ["STANDALONE1", "STANDALONE2"];
      const result = extractBaseCodesFromFull(fullCodes);
      expect(result).toEqual(["STANDALONE1", "STANDALONE2"]);
    });

    it("should handle multiple groups of same subject", () => {
      const fullCodes = [
        "IP-18fWPEG-90",
        "IP-18fWPEG-91",
        "MATH-201-01",
        "MATH-201-02",
        "CS-101-A-01",
      ];
      const result = extractBaseCodesFromFull(fullCodes);
      expect(result).toEqual(["IP-18fWPEG", "MATH-201", "CS-101-A"]);
    });
  });
});
