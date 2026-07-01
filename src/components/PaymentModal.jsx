import { useState, useEffect, useRef } from "react";
import { deliveryInfo } from "../data";
import OrderItemList from "./OrderItemList";

function generateOrderNumber() {
  return "DL-" + Math.floor(10000 + Math.random() * 90000);
}

// Seconds the "See my order" button waits before auto-advancing.
const AUTO_ADVANCE_SECONDS = 5;

export default function PaymentModal({ cart, onClose, onSuccess }) {
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  const [step, setStep] = useState("summary");
  const [orderNumber] = useState(generateOrderNumber);
  const [orderTime] = useState(() => new Date());
  const [etaSeed] = useState(
    () =>
      deliveryInfo.etaMin +
      Math.floor(Math.random() * (deliveryInfo.etaMax - deliveryInfo.etaMin + 1))
  );
  const [form, setForm] = useState({ name: "", number: "", expiry: "", cvv: "" });
  const [countdown, setCountdown] = useState(AUTO_ADVANCE_SECONDS);

  // Guard so click + auto-timer can never both fire onSuccess.
  const firedRef = useRef(false);

  function fireSuccess() {
    if (firedRef.current) return;
    firedRef.current = true;
    onSuccess({
      orderNumber,
      orderTime,
      items: cart,
      subtotal,
      tax,
      total,
      etaMinutes: etaSeed,
    });
  }

  useEffect(() => {
    if (step !== "processing") return;
    const timer = setTimeout(() => setStep("success"), 2000);
    return () => clearTimeout(timer);
  }, [step]);

  // Success step: visible draining countdown that auto-advances at 0.
  useEffect(() => {
    if (step !== "success") return;
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          fireSuccess();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  function handleOverlayClick() {
    if (step !== "processing") onClose();
  }

  function handleNumberChange(e) {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 16);
    const formatted = digits.replace(/(.{4})/g, "$1 ").trim();
    setForm((f) => ({ ...f, number: formatted }));
  }

  function handleExpiryChange(e) {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 4);
    const formatted = raw.length > 2 ? raw.slice(0, 2) + "/" + raw.slice(2) : raw;
    setForm((f) => ({ ...f, expiry: formatted }));
  }

  const canPay =
    form.name.trim() &&
    form.number.replace(/\s/g, "").length === 16 &&
    form.expiry.length === 5 &&
    form.cvv.length >= 3;

  const formattedTime = orderTime.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>

        {step === "summary" && (
          <div className="modal-step">
            <h2 className="modal-title">Order Summary</h2>
            <OrderItemList items={cart} />
            <div className="modal-totals">
              <div className="modal-totals-row">
                <span>Subtotal</span><span>€{subtotal.toFixed(2)}</span>
              </div>
              <div className="modal-totals-row">
                <span>Tax (10%)</span><span>€{tax.toFixed(2)}</span>
              </div>
              <div className="modal-totals-row modal-totals-total">
                <span>Total</span><span>€{total.toFixed(2)}</span>
              </div>
            </div>
            <div className="modal-actions">
              <button className="modal-btn-secondary" onClick={onClose}>Cancel</button>
              <button className="modal-btn-primary" onClick={() => setStep("card")}>
                Proceed to Payment
              </button>
            </div>
          </div>
        )}

        {step === "card" && (
          <div className="modal-step">
            <h2 className="modal-title">Payment Details</h2>
            <div className="card-form">
              <label className="card-label">
                Name on card
                <input
                  className="card-input"
                  type="text"
                  placeholder="Jane Smith"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </label>
              <label className="card-label">
                Card number
                <input
                  className="card-input"
                  type="text"
                  inputMode="numeric"
                  placeholder="1234 5678 9012 3456"
                  value={form.number}
                  onChange={handleNumberChange}
                />
              </label>
              <div className="card-row">
                <label className="card-label">
                  Expiry
                  <input
                    className="card-input"
                    type="text"
                    inputMode="numeric"
                    placeholder="MM/YY"
                    value={form.expiry}
                    onChange={handleExpiryChange}
                  />
                </label>
                <label className="card-label">
                  CVV
                  <input
                    className="card-input"
                    type="text"
                    inputMode="numeric"
                    placeholder="123"
                    maxLength={4}
                    value={form.cvv}
                    onChange={(e) => setForm((f) => ({ ...f, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) }))}
                  />
                </label>
              </div>
            </div>
            <div className="modal-actions">
              <button className="modal-btn-secondary" onClick={() => setStep("summary")}>Back</button>
              <button
                className="modal-btn-primary"
                disabled={!canPay}
                onClick={() => setStep("processing")}
              >
                Pay €{total.toFixed(2)}
              </button>
            </div>
          </div>
        )}

        {step === "processing" && (
          <div className="modal-step modal-step-centered">
            <div className="spinner" />
            <p className="processing-title">Processing your payment…</p>
            <p className="processing-subtitle">Please do not close this window.</p>
          </div>
        )}

        {step === "success" && (
          <div className="modal-step modal-step-centered">
            <div className="success-icon">✓</div>
            <h2 className="success-title">Payment Successful!</h2>
            <p className="success-meta">Order {orderNumber} · {formattedTime}</p>
            <OrderItemList items={cart} className="modal-item-list--receipt" />
            <div className="modal-totals">
              <div className="modal-totals-row modal-totals-total">
                <span>Total paid</span><span>€{total.toFixed(2)}</span>
              </div>
            </div>
            <button
              className="modal-btn-primary modal-btn-full see-order-btn"
              onClick={fireSuccess}
            >
              See my order ({countdown}s)
              <span
                className="see-order-progress"
                style={{ transform: `scaleX(${countdown / AUTO_ADVANCE_SECONDS})` }}
              />
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
