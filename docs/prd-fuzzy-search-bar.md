# PRD: Global fuzzy search bar for the menu (Fuse.js)

> Tracking issue: https://github.com/metko/demo-restaurant/issues/1

## Problem Statement

The roofood menu shows all 12 dishes and lets customers narrow down using the category filters (All / Starters / Mains / Desserts). But a customer who already knows what they're craving — "salmon", "chocolate", "something with garlic" — has no way to jump straight to it. They have to eyeball every card, and if they don't know which category a dish lives in, browsing is slow and frustrating. On a longer menu this only gets worse. There is also no forgiveness for typos or partial words: today the only "search" is exact category membership.

## Solution

Add a single **global search bar in the app header** that fuzzy-matches the customer's query against every dish in the menu. As the customer types, the menu updates live to show only matching dishes, ranked by relevance. Matching is forgiving (typo-tolerant, partial words) and spans a dish's name, description, and category, so typing "chick", "grrlic", or "dessert" all surface sensible results. Clearing the search returns the customer to the normal category-browsing experience. Because the bar is global and lives in the header, it works regardless of which view or category the customer is currently looking at.

## User Stories

1. As a hungry customer, I want a search bar in the header, so that I can find a dish without scrolling the whole menu.
2. As a customer, I want the menu to filter as I type, so that I get instant feedback and don't have to press a button.
3. As a customer who knows what I want, I want to type a dish name like "risotto", so that I can jump straight to it.
4. As a customer, I want fuzzy matching, so that a small typo like "risoto" or "grrlic" still finds the dish I meant.
5. As a customer, I want partial words to match, so that typing "choc" surfaces the Chocolate Lava Cake.
6. As a customer, I want search to look at dish descriptions, so that typing "garlic" finds Bruschetta and Garlic Prawns even though only one has "garlic" in its name.
7. As a customer, I want search to match categories, so that typing "dessert" shows me all desserts at once.
8. As a customer, I want the best matches shown first, so that the most relevant dish is at the top.
9. As a customer, I want a clear/reset control in the search bar, so that I can quickly get back to the full menu.
10. As a customer, I want the category filters to still work when the search box is empty, so that the existing browsing experience is unchanged.
11. As a customer, I want a helpful "no results" message when nothing matches, so that I know the search worked and my query simply had no matches.
12. As a customer searching, I want results from across every category, so that I'm not limited to the category I happened to have selected.
13. As a customer, I want search to be case-insensitive, so that "SALMON" and "salmon" behave the same.
14. As a customer, I want leading/trailing whitespace ignored, so that accidental spaces don't break my search.
15. As a mobile customer, I want the search bar to be reachable and usable on a small screen, so that I can search on my phone.
16. As a customer, I want to still add dishes to my cart directly from search results, so that searching doesn't interrupt ordering.
17. As a customer, I want my search query preserved while I browse results and add items, so that adding to cart doesn't reset my search.
18. As a keyboard user, I want to focus the search input and type immediately, so that search is accessible.
19. As a returning customer, I want the search to feel responsive with no visible lag as I type, so that the experience feels polished.
20. As a developer, I want the fuzzy-matching logic isolated behind a simple function, so that the search behaviour can be reasoned about and changed in one place.

## Implementation Decisions

- **Add Fuse.js as a dependency.** Use Fuse.js for fuzzy matching rather than hand-rolling string matching. (Note: the repo currently uses npm per `package.json`, but a `pnpm-lock.yaml` is present in the working tree — install with the package manager the maintainer settles on.)
- **Deep search module.** Introduce a pure, framework-agnostic search module — an interface roughly `searchDishes(dishes, query) -> rankedDishes`. It owns the Fuse.js configuration and returns the matching dishes in relevance order. It has no React or DOM dependencies so it can be reasoned about and (later) tested in isolation. This is the "deep module": all the matching complexity lives behind a one-line signature that rarely changes.
- **Search fields and weighting.** Fuse.js is configured to match against `name`, `description`, and `category`. `name` carries the highest weight, `description` a lower weight, and `category` enough to let a category keyword (e.g. "dessert") surface that whole group. Threshold tuned to be forgiving of typos without returning obviously irrelevant dishes.
- **Empty query is a passthrough.** When the query is empty or whitespace-only, `searchDishes` returns the dishes unchanged (original order), so no-search behaviour is identical to today.
- **Global search bar in the header.** The `SearchBar` is a presentational component rendered in the app header (`App.jsx` header region), not inside `Menu`. It is a controlled input driven by search-query state owned by `App`.
- **Query state lives in `App`.** `App` owns `searchQuery` state and passes both the query and the setter down. This keeps the search bar (header) and the results (menu) in sync from a single source of truth, and preserves the query as the customer adds items to the cart.
- **Search takes precedence over category when active.** When there is a non-empty query, the menu shows the ranked search results across **all** categories (the selected category filter is not applied to search results). When the query is cleared, the menu reverts to the existing category-filter behaviour. The category filter buttons remain visible; behaviour when both are active is: search wins.
- **Menu rendering.** `Menu` receives the already-resolved list of dishes to display (search results when searching, category-filtered dishes otherwise) plus enough context to render the correct empty/"no results" state. The dish card, price, emoji, and "Add to cart" affordances are unchanged.
- **No-results state.** When a non-empty query yields zero matches, the menu shows a friendly "No dishes match ‘<query>’" message instead of an empty grid.
- **Reset control.** The search bar exposes a clear affordance (e.g. an ✕ button shown when the field is non-empty) that empties the query and returns focus to the input.
- **No new data shape required.** The existing `dishes` shape (`id`, `name`, `description`, `price`, `category`, `emoji`) is sufficient; no schema changes.

## Testing Decisions

- **No test framework is added in this PRD.** The repo currently has no test runner (no Vitest, no test script), and the maintainer has chosen not to introduce one as part of this feature. Automated tests for the search module are therefore **out of scope here** and should be tracked as a follow-up.
- When tests are added later, the natural first target is the deep `searchDishes` module, because it is pure and has a tiny external interface. Good tests would assert only **external behaviour** — given a set of dishes and a query, the right dishes come back in the right order — and would cover: exact name match, partial word ("choc" → Chocolate Lava Cake), typo tolerance ("risoto" → Mushroom Risotto), description match ("garlic" → Bruschetta + Garlic Prawns), category match ("dessert" → all desserts), case-insensitivity, whitespace trimming, empty-query passthrough, and the no-match (empty result) case. Tests should not assert on Fuse.js internals or score numbers, which are implementation details.
- There is no prior art for tests in this repo; a follow-up that introduces Vitest would establish the pattern.

## Out of Scope

- Setting up a test framework / writing automated tests (deferred to a follow-up).
- Search across anything beyond the menu (e.g. searching past orders or the tracking view).
- Highlighting matched substrings within dish cards.
- Search history, recent searches, autosuggest/typeahead dropdown, or voice search.
- Debounce/throttling infrastructure unless a perceptible lag appears with the current 12-item dataset (dataset is tiny; live filtering is expected to be instant).
- Persisting the query across full page reloads (URL query param / storage).
- Filtering by price, dietary tags, or other structured facets.
- Analytics/telemetry on search usage.

## Further Notes

- This is a React 19 + Vite app; the app currently uses component-local `useState` for all state (see `App.jsx`), so the query state follows the same pattern rather than introducing a store.
- The dataset is 12 dishes, so performance is a non-issue at this size; the Fuse.js instance can be constructed cheaply. If the menu grows, memoising the Fuse index becomes worthwhile — noted for later, not required now.
- Keep the search bar visually consistent with the existing header styling (logo, delivery ETA pill, cart badge) so it reads as part of the same toolbar.
