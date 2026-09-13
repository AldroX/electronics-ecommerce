/// Unit tests for category helpers
/// Run: pnpm test tests/unit/categories.test.ts

import { describe, it, expect } from "vitest";
import {
  getAllCategories,
  getCategoryBySlug,
} from "@/data/helpers/categories";

describe("getAllCategories", () => {
  it("returns all categories", () => {
    const categories = getAllCategories();
    expect(categories.length).toBeGreaterThan(0);
  });

  it("each category has required fields", () => {
    const categories = getAllCategories();
    for (const cat of categories) {
      expect(cat.id).toBeDefined();
      expect(cat.name).toBeDefined();
      expect(cat.slug).toBeDefined();
      expect(cat.description).toBeDefined();
      expect(cat.image).toBeDefined();
      expect(Array.isArray(cat.products)).toBe(true);
    }
  });
});

describe("getCategoryBySlug", () => {
  it("finds category by slug", () => {
    const cat = getCategoryBySlug("energia-solar");
    expect(cat).toBeDefined();
    expect(cat?.slug).toBe("energia-solar");
  });

  it("returns undefined for non-existent slug", () => {
    const cat = getCategoryBySlug("non-existent");
    expect(cat).toBeUndefined();
  });
});