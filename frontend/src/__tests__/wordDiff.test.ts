import { describe, expect, it } from "vitest";
import { computeWordDiff } from "@/components/diff/wordDiff";

describe("computeWordDiff (Word-Level LCS Diff Engine)", () => {
  it("detects surgical deletions and insertions in a Limitation of Liability clause", () => {
    const original =
      "1.1 Vendor aggregate liability shall not exceed $500 under this Agreement.";
    const proposed =
      "1.1 Vendor aggregate liability shall not exceed twelve (12) months of fees under this Agreement.";

    const tokens = computeWordDiff(original, proposed);

    const deletedSpans = tokens
      .filter((t) => t.type === "delete")
      .map((t) => t.text);
    const insertedSpans = tokens
      .filter((t) => t.type === "insert")
      .map((t) => t.text);
    const equalSpans = tokens
      .filter((t) => t.type === "equal")
      .map((t) => t.text);

    expect(deletedSpans).toEqual(["$500"]);
    expect(insertedSpans).toEqual(["twelve (12) months of fees"]);
    expect(equalSpans).toContain("1.1 Vendor aggregate liability shall not exceed");
    expect(equalSpans).toContain("under this Agreement.");
  });

  it("returns a single equal token when original and proposed texts are identical", () => {
    const clause = "6.1 This Agreement shall be governed by Delaware law.";
    const tokens = computeWordDiff(clause, clause);

    expect(tokens).toEqual([{ type: "equal", text: clause }]);
  });

  it("handles empty original or empty proposed strings gracefully", () => {
    expect(computeWordDiff("", "")).toEqual([]);
    expect(computeWordDiff("", "New clause text")).toEqual([
      { type: "insert", text: "New clause text" },
    ]);
    expect(computeWordDiff("Removed clause text", "")).toEqual([
      { type: "delete", text: "Removed clause text" },
    ]);
  });
});

