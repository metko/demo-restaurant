import { useState } from "react";
import { dishes, deliveryInfo } from "./data";
import { searchDishes, MIN_QUERY_LENGTH } from "./searchDishes";
import Menu from "./components/Menu";
import SearchBar from "./components/SearchBar";
import Cart from "./components/Cart";
import PaymentModal from "./components/PaymentModal";
import OrderTracking from "./components/OrderTracking";
import "./App.css";

export default function App() {
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const [view, setView] = useState("shop"); // "shop" | "tracking"
  const [activeOrder, setActiveOrder] = useState(null);

  function handleOrderPlaced(order) {
    setActiveOrder(order);
    setView("tracking");
    setCart([]);
    setShowPayment(false);
  }

  function addToCart(dish) {
    const existing = cart.find((item) => item.id === dish.id);
    if (existing) {
      setCart(
        cart.map((item) =>
          item.id === dish.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
    } else {
      setCart([...cart, { ...dish, quantity: 1 }]);
    }
  }

  function removeFromCart(id) {
    setCart(cart.filter((item) => item.id !== id));
  }

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Search wins over the category filter: a non-empty query shows ranked
  // results across all categories; an empty query reverts to category browsing.
  const isSearching = searchQuery.trim().length >= MIN_QUERY_LENGTH;
  const visibleDishes = isSearching
    ? searchDishes(dishes, searchQuery)
    : selectedCategory === "All"
    ? dishes
    : dishes.filter((dish) => dish.category === selectedCategory);

  return (
    <div className="app">
      <header className="app-header">
        <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
          <img src="/restaurant-demo/deliveroo-logo.png" alt="Deliveroo" height="36" />
          <h1>roo<span style={{color:"#1a271f"}}>food</span></h1>
          {view === "shop" && (
            <span className="delivery-eta">
              <span className="eta-dot" />
              <span className="eta-icon">🛵</span>
              Delivery in {deliveryInfo.etaMin}–{deliveryInfo.etaMax} min
            </span>
          )}
        </div>
        {view === "shop" && (
          <SearchBar query={searchQuery} onQueryChange={setSearchQuery} />
        )}
        <div className="cart-badge-wrapper">
          <span className="cart-icon">🛒</span>
          {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
        </div>
      </header>

      {view === "shop" ? (
        <main className="app-main">
          <Menu
            dishes={visibleDishes}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            onAddToCart={addToCart}
            isSearching={isSearching}
            query={searchQuery}
          />
          <Cart cart={cart} onRemove={removeFromCart} onCheckout={() => setShowPayment(true)} />
        </main>
      ) : (
        <OrderTracking
          order={activeOrder}
          onNewOrder={() => { setActiveOrder(null); setView("shop"); }}
        />
      )}

      {showPayment && (
        <PaymentModal
          cart={cart}
          onClose={() => setShowPayment(false)}
          onSuccess={handleOrderPlaced}
        />
      )}
    </div>
  );
}
