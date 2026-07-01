const CATEGORIES = ["All", "Starters", "Mains", "Desserts"];

export default function Menu({
  dishes,
  selectedCategory,
  onCategoryChange,
  onAddToCart,
  isSearching,
  query,
}) {
  return (
    <section className="menu">
      <h2>Menu</h2>

      <div className="category-filters">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`filter-btn ${selectedCategory === cat ? "active" : ""}`}
            onClick={() => onCategoryChange(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {isSearching && dishes.length === 0 ? (
        <p className="menu-no-results">No dishes match “{query.trim()}”</p>
      ) : (
        <div className="dish-grid">
          {dishes.map((dish) => (
            <div key={dish.id} className="dish-card">
              <span className="dish-emoji">{dish.emoji}</span>
              <div className="dish-info">
                <h3>{dish.name}</h3>
                <p>{dish.description}</p>
                <div className="dish-footer">
                  <span className="dish-price">€{dish.price.toFixed(2)}</span>
                  <button className="add-btn" onClick={() => onAddToCart(dish)}>
                    Add to cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
