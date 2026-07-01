import Fuse from "fuse.js";

// Deep module: all fuzzy-matching complexity lives behind `searchDishes`.
// Pure and framework-agnostic — no React or DOM dependencies — so the search
// behaviour can be reasoned about (and later tested) in isolation.

// Search only kicks in once the customer has typed enough to be meaningful.
// A shorter query is treated as no search at all (category browsing).
export const MIN_QUERY_LENGTH = 2;

const FUSE_OPTIONS = {
  // Fields searched, most important first. `name` dominates, `description`
  // contributes, and `category` carries just enough weight that a category
  // keyword (e.g. "dessert") surfaces that whole group.
  keys: [
    { name: "name", weight: 0.6 },
    { name: "description", weight: 0.3 },
    { name: "category", weight: 0.1 },
  ],
  // Forgiving of typos and partial words without returning irrelevant dishes.
  threshold: 0.3,
  ignoreLocation: true,
  minMatchCharLength: 2,
};

/**
 * Fuzzy-match a query against the menu.
 *
 * @param {Array} dishes - the full list of dishes.
 * @param {string} query - the customer's raw search text.
 * @returns {Array} matching dishes in relevance order. A query shorter than
 *   MIN_QUERY_LENGTH (after trimming) is a passthrough: the dishes are
 *   returned unchanged, in their original order.
 */
export function searchDishes(dishes, query) {
  const trimmed = (query ?? "").trim();
  if (trimmed.length < MIN_QUERY_LENGTH) return dishes;

  const fuse = new Fuse(dishes, FUSE_OPTIONS);
  return fuse.search(trimmed).map((result) => result.item);
}
