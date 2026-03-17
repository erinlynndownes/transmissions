import { describe, it, expect } from "vitest";
import { combinations } from "../utils";

describe("combinations", () => {
  it("returns [[]] for size 0", () => {
    expect(combinations([1, 2, 3], 0)).toEqual([[]]);
  });

  it("returns [] when array is shorter than size", () => {
    expect(combinations([1], 3)).toEqual([]);
  });

  it("returns [] for empty array with size > 0", () => {
    expect(combinations([], 1)).toEqual([]);
  });

  it("returns each element as a single-item combo for size 1", () => {
    expect(combinations(["a", "b", "c"], 1)).toEqual([["a"], ["b"], ["c"]]);
  });

  it("returns all pairs for size 2", () => {
    const result = combinations(["a", "b", "c"], 2);
    expect(result).toEqual([["a", "b"], ["a", "c"], ["b", "c"]]);
  });

  it("returns the full array as the only combo when size equals length", () => {
    expect(combinations([1, 2, 3], 3)).toEqual([[1, 2, 3]]);
  });

  it("generates correct count (n choose k)", () => {
    // 5 choose 3 = 10
    const result = combinations([1, 2, 3, 4, 5], 3);
    expect(result).toHaveLength(10);
  });

  it("works with strings (used for demographic dimension combos)", () => {
    const dims = ["gender", "ageRange", "employmentStatus", "continent"];
    // 4 choose 2 = 6
    const pairs = combinations(dims, 2);
    expect(pairs).toHaveLength(6);
    expect(pairs).toContainEqual(["gender", "ageRange"]);
    expect(pairs).toContainEqual(["employmentStatus", "continent"]);
  });
});
