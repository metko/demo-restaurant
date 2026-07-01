// Shared receipt line-items, used by both the PaymentModal success step and
// the OrderTracking order summary so the two stay visually consistent.
export default function OrderItemList({ items, className = "" }) {
  return (
    <ul className={`modal-item-list ${className}`.trim()}>
      {items.map((item, i) => (
        <li key={i} className="modal-item-row">
          <span className="modal-item-emoji">{item.emoji}</span>
          <span className="modal-item-name">{item.name}</span>
          <span className="modal-item-qty">x{item.quantity}</span>
          <span className="modal-item-price">€{(item.price * item.quantity).toFixed(2)}</span>
        </li>
      ))}
    </ul>
  );
}
