import { useRef } from "react";

// Presentational, controlled search input for the app header. The query state
// is owned by App; this component only renders it and reports changes.
export default function SearchBar({ query, onQueryChange }) {
  const inputRef = useRef(null);

  function handleClear() {
    onQueryChange("");
    inputRef.current?.focus();
  }

  return (
    <div className="search-bar">
      <span className="search-icon" aria-hidden="true">🔍</span>
      <input
        ref={inputRef}
        type="search"
        className="search-input"
        placeholder="Search dishes…"
        aria-label="Search dishes"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
      />
      {query !== "" && (
        <button
          type="button"
          className="search-clear"
          aria-label="Clear search"
          onClick={handleClear}
        >
          ✕
        </button>
      )}
    </div>
  );
}
