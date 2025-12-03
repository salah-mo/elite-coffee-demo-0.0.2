"use client";
import React from "react";
import { OrderStatus, type Order, type OrderType } from "@/types";
import { useToast } from "@/components/ToastProvider";
import { Skeleton } from "@/components/Skeleton";
import { useCart } from "@/hooks/useCart";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import Link from "next/link";
import {
  ORDER_STATUS_FLOW,
  FINAL_ORDER_STATUSES,
  formatStatusLabel,
} from "@/lib/orderStatusMeta";
import {
  ShoppingBag,
  ChevronRight,
  Minus,
  Plus,
  Trash2,
  MapPin,
  Store,
  Truck,
  Check,
  Receipt,
  StickyNote,
  CreditCard,
  Wifi,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";

export default function OrderPage() {
  const {
    cart,
    loading,
    error,
    removeFromCart,
    updateQuantity,
    clearCart,
    refreshCart,
    total,
  } = useCart();

  const [orderType, setOrderType] = React.useState<OrderType>(
    "PICKUP" as OrderType,
  );
  const [notes, setNotes] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [lastOrder, setLastOrder] = React.useState<Order | null>(null);
  const [statusRefreshing, setStatusRefreshing] = React.useState(false);
  const [internetCardQty, setInternetCardQty] = React.useState(0);
  const INTERNET_CARD_UNIT_PRICE = 10;
  const INTERNET_CARD_UNIT_SIZE_GB = 1.5;
  const { push } = useToast();

  const refreshLastOrderStatus = React.useCallback(
    async (options?: { silent?: boolean }) => {
      if (!lastOrder || statusRefreshing) return;
      setStatusRefreshing(true);
      try {
        const res = await fetch(`/api/orders/${lastOrder.id}`, {
          headers: {
            "x-user-id": "demo-user",
          },
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Failed to refresh order status");
        const json = await res.json();
        const updated = json.data as Order;
        setLastOrder(updated);
        const changed = updated.status !== lastOrder.status;
        if (changed) {
          push({
            type: "success",
            message: `Order status updated to ${formatStatusLabel(updated.status)}`,
          });
        } else if (!options?.silent) {
          push({ type: "success", message: "Order status is up to date" });
        }
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Unable to refresh order status";
        if (!options?.silent) {
          push({ type: "error", message });
        } else {
          console.warn(message);
        }
      } finally {
        setStatusRefreshing(false);
      }
    },
    [lastOrder, push, statusRefreshing],
  );

  const placeOrder = async () => {
    setSubmitting(true);
    setSubmitError(null);
    setLastOrder(null);
    if (!cart || cart.items.length === 0) {
      const message = "Add at least one drink before placing an order";
      setSubmitError(message);
      push({ type: "error", message });
      setSubmitting(false);
      return;
    }
    try {
      const sanitizedNotes = notes.trim();
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": "demo-user",
        },
        body: JSON.stringify({
          paymentMethod: "ONLINE",
          orderType,
          notes: sanitizedNotes ? sanitizedNotes : undefined,
          internetCard:
            internetCardQty > 0 ? { quantity: internetCardQty } : undefined,
          odoo: {
            partner: { name: "Website Customer" },
            sale: { enable: true, autoConfirm: false },
            pos: {
              enable: false,
            },
          },
        }),
      });
      if (!res.ok) throw new Error("Failed to place order");
      const json = await res.json();
      setLastOrder(json.data);
      push({ type: "success", message: "Order placed successfully" });
      setInternetCardQty(0);
      await refreshCart();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setSubmitError(msg);
      push({ type: "error", message: msg });
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate totals
  const drinksSubtotal = cart?.items.reduce((s, i) => s + i.price, 0) ?? 0;
  const deliveryFee = orderType === "DELIVERY" ? 15 : 0;
  const internetCardTotal = internetCardQty * INTERNET_CARD_UNIT_PRICE;
  const totalAmount = drinksSubtotal + deliveryFee + internetCardTotal;
  const itemCount = cart?.items.reduce((s, i) => s + i.quantity, 0) ?? 0;
  const currentStatusIndex = lastOrder
    ? ORDER_STATUS_FLOW.findIndex((step) => step.value === lastOrder.status)
    : -1;
  const isLastOrderCancelled = lastOrder?.status === OrderStatus.CANCELLED;
  const odooLastStatus = lastOrder?.integrations?.odoo?.lastStatus;
  const odooLastStatusSync = lastOrder?.integrations?.odoo?.lastStatusSync;

  React.useEffect(() => {
    if (itemCount === 0 && internetCardQty !== 0) {
      setInternetCardQty(0);
    }
  }, [itemCount, internetCardQty]);

  React.useEffect(() => {
    if (!lastOrder) return;
    if (FINAL_ORDER_STATUSES.has(lastOrder.status)) return;
    const intervalId = window.setInterval(() => {
      refreshLastOrderStatus({ silent: true });
    }, 15000);
    return () => window.clearInterval(intervalId);
  }, [lastOrder, refreshLastOrderStatus]);

  if (loading)
    return (
      <main className="page-transition loaded">
        <Navigation />
        <div className="min-h-screen bg-elite-cream">
          <div className="bg-elite-burgundy text-elite-cream py-12">
            <div className="max-w-4xl mx-auto px-6">
              <Skeleton className="h-8 w-48 bg-elite-cream/20 rounded-xl" />
            </div>
          </div>
          <div className="max-w-4xl mx-auto px-6 py-12 space-y-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-2xl" />
            ))}
          </div>
        </div>
        <Footer />
      </main>
    );

  if (error)
    return (
      <main className="page-transition loaded">
        <Navigation />
        <div className="min-h-screen bg-elite-cream flex items-center justify-center">
          <div className="p-8 bg-red-50 border border-red-200 rounded-2xl text-red-700 font-cabin">
            {String(error)}
          </div>
        </div>
        <Footer />
      </main>
    );

  return (
    <main className="page-transition loaded">
      <Navigation />
      <div className="min-h-screen bg-elite-cream">
        {/* Header */}
        <div className="bg-elite-burgundy text-elite-cream py-12">
          <div className="max-w-4xl mx-auto px-6">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm mb-4">
              <Link
                href="/menu"
                className="hover:text-elite-light-cream transition-colors duration-200"
              >
                Menu
              </Link>
              <ChevronRight className="w-4 h-4" />
              <span className="font-semibold">Your Order</span>
            </div>

            {/* Page Header */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-elite-cream/20 rounded-2xl flex items-center justify-center">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <div>
                <h1 className="font-calistoga text-4xl md:text-5xl mb-2">
                  Your Order
                </h1>
                <p className="font-cabin text-elite-cream/90 text-lg">
                  Review your items and complete checkout
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-6 py-12 space-y-8">
          {/* Success Message */}
          {lastOrder && (
            <>
              <div
                className="bg-gradient-to-r from-emerald-50 to-emerald-100 border-2 border-emerald-200 rounded-2xl p-6 space-y-3"
                role="status"
                aria-live="polite"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center">
                    <Check className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-calistoga text-emerald-800 text-xl">
                      Order Placed Successfully!
                    </h3>
                    <p className="font-cabin text-emerald-700">
                      Order #: {lastOrder.orderNumber}
                    </p>
                  </div>
                </div>
                {lastOrder.integrations?.odoo?.saleOrderId && (
                  <div className="font-cabin text-sm text-emerald-700 flex items-center gap-2">
                    <Receipt className="w-4 h-4" />
                    Odoo Sale ID: {lastOrder.integrations.odoo.saleOrderId}
                    {lastOrder.integrations.odoo.url && (
                      <a
                        className="text-emerald-600 underline hover:text-emerald-800 ml-2"
                        href={lastOrder.integrations.odoo.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open in Odoo →
                      </a>
                    )}
                  </div>
                )}
                {lastOrder.integrations?.odoo?.posOrderId && (
                  <div className="font-cabin text-sm text-emerald-700 flex items-center gap-2">
                    <Store className="w-4 h-4" />
                    Odoo POS ID: {lastOrder.integrations.odoo.posOrderId}
                  </div>
                )}
              </div>
              <div className="bg-white rounded-3xl shadow-xl border border-emerald-200/60 p-6 space-y-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="font-calistoga text-elite-burgundy text-xl">
                      Track Order Status
                    </h3>
                    <p className="font-cabin text-elite-black/70">
                      Current status: {" "}
                      <span className="font-semibold text-elite-burgundy">
                        {formatStatusLabel(lastOrder.status)}
                      </span>
                    </p>
                  </div>
                  <button
                    className="inline-flex items-center gap-2 self-start rounded-full border border-elite-burgundy/20 px-4 py-2 font-cabin text-sm text-elite-burgundy transition-all hover:bg-elite-burgundy hover:text-elite-cream disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={() => refreshLastOrderStatus()}
                    disabled={statusRefreshing}
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${statusRefreshing ? "animate-spin" : ""}`}
                    />
                    {statusRefreshing ? "Refreshing..." : "Refresh status"}
                  </button>
                </div>
                {isLastOrderCancelled ? (
                  <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 mt-1" />
                    <div>
                      <div className="font-calistoga text-red-700 text-lg">
                        Order Cancelled
                      </div>
                      <p className="font-cabin text-sm text-red-600">
                        This order was marked as cancelled. Contact our team if you need help.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {ORDER_STATUS_FLOW.map((step, index) => {
                      if (
                        step.value === OrderStatus.CANCELLED &&
                        lastOrder.status !== OrderStatus.CANCELLED
                      ) {
                        return null;
                      }
                      const isActive = currentStatusIndex !== -1 && index <= currentStatusIndex;
                      const isCurrent = currentStatusIndex === index;
                      const isCancelledStep = step.value === OrderStatus.CANCELLED;
                      const Icon = step.Icon;
                      const containerClass = isCancelledStep
                        ? isCurrent
                          ? "border-red-200 bg-red-50"
                          : "border-elite-burgundy/10 bg-white"
                        : isActive
                          ? "border-emerald-200 bg-emerald-50"
                          : "border-elite-burgundy/10 bg-white";
                      const indicatorClass = isCancelledStep
                        ? isCurrent
                          ? "bg-red-500 text-white"
                          : "bg-elite-cream text-elite-burgundy"
                        : isActive
                          ? "bg-emerald-500 text-white"
                          : "bg-elite-cream text-elite-burgundy";
                      const titleClass = isCancelledStep
                        ? "text-red-700"
                        : isCurrent
                          ? "text-emerald-700"
                          : "text-elite-black";
                      return (
                        <div
                          key={step.value}
                          className={`flex items-start gap-3 rounded-2xl border px-4 py-3 ${containerClass}`}
                        >
                          <div
                            className={`mt-1 flex h-8 w-8 items-center justify-center rounded-full ${indicatorClass}`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className={`font-calistoga text-lg ${titleClass}`}>
                              {step.label}
                            </div>
                            <p className="font-cabin text-sm text-elite-black/60">
                              {step.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {(odooLastStatus || odooLastStatusSync) && (
                  <div className="font-cabin text-xs text-elite-black/50">
                    {odooLastStatus
                      ? `Last synced with Odoo as ${formatStatusLabel(odooLastStatus)}`
                      : "Synced with Odoo"}
                    {odooLastStatusSync
                      ? ` on ${new Date(odooLastStatusSync).toLocaleString()}`
                      : ""}
                  </div>
                )}
                <div className="pt-2">
                  <Link
                    href="/orders"
                    className="inline-flex items-center gap-2 font-cabin text-sm text-elite-burgundy underline-offset-4 hover:text-elite-dark-burgundy hover:underline"
                  >
                    <span>View all your orders</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </>
          )}

          {/* Empty Cart */}
          {!cart || cart.items.length === 0 ? (
            <div className="bg-white rounded-3xl shadow-xl border border-elite-burgundy/10 p-12 text-center">
              <div className="w-20 h-20 bg-elite-cream rounded-full flex items-center justify-center mx-auto mb-6">
                <ShoppingBag className="w-10 h-10 text-elite-burgundy/50" />
              </div>
              <h2 className="font-calistoga text-elite-black text-2xl mb-3">
                Your cart is empty
              </h2>
              <p className="font-cabin text-elite-black/70 mb-8">
                Explore our menu and add some delicious drinks!
              </p>
              <Link
                href="/menu"
                className="inline-flex items-center gap-2 px-8 py-4 bg-elite-burgundy text-elite-cream rounded-full font-calistoga text-lg transition-all duration-300 hover:bg-elite-dark-burgundy hover:scale-105 hover:shadow-lg"
              >
                Browse Menu
                <ChevronRight className="w-5 h-5" />
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Cart Items */}
              <div className="bg-white rounded-3xl shadow-xl border border-elite-burgundy/10 overflow-hidden">
                <div className="px-6 py-4 border-b border-elite-burgundy/10 bg-elite-cream/30">
                  <h2 className="font-calistoga text-elite-burgundy text-xl flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5" />
                    Cart Items ({itemCount})
                  </h2>
                </div>
                <ul className="divide-y divide-elite-burgundy/10">
                  {cart.items.map((item) => {
                    const itemName = item.menuItem?.name || item.menuItemId;
                    return (
                      <li key={item.id} className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center gap-4">
                          {/* Item Info */}
                          <div className="flex-1">
                            <h3 className="font-calistoga text-elite-black text-lg">
                              {itemName}
                            </h3>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <span className="inline-flex items-center px-3 py-1 bg-elite-burgundy/10 text-elite-burgundy rounded-full text-xs font-cabin font-medium">
                              {item.size}
                            </span>
                            {item.flavor && (
                              <span className="inline-flex items-center px-3 py-1 bg-elite-burgundy/10 text-elite-burgundy rounded-full text-xs font-cabin font-medium">
                                {item.flavor}
                              </span>
                            )}
                            {item.toppings?.map((t) => (
                              <span
                                key={t}
                                className="inline-flex items-center px-3 py-1 bg-elite-cream text-elite-black/70 rounded-full text-xs font-cabin"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                          </div>

                          {/* Quantity Controls */}
                          <div className="flex items-center gap-3">
                            <button
                              className="w-10 h-10 rounded-full border-2 border-elite-burgundy/20 flex items-center justify-center text-elite-burgundy hover:bg-elite-burgundy hover:text-elite-cream transition-all"
                              onClick={() =>
                                updateQuantity(
                                  item.id,
                                  Math.max(1, item.quantity - 1),
                                )
                              }
                              aria-label={`Decrease quantity of ${itemName}`}
                              title={`Decrease quantity of ${itemName}`}
                            >
                              <Minus className="w-4 h-4" aria-hidden="true" />
                            </button>
                            <span className="font-calistoga text-elite-black text-lg w-8 text-center">
                              {item.quantity}
                            </span>
                            <button
                              className="w-10 h-10 rounded-full border-2 border-elite-burgundy/20 flex items-center justify-center text-elite-burgundy hover:bg-elite-burgundy hover:text-elite-cream transition-all"
                              onClick={() =>
                                updateQuantity(item.id, item.quantity + 1)
                              }
                              aria-label={`Increase quantity of ${itemName}`}
                              title={`Increase quantity of ${itemName}`}
                            >
                              <Plus className="w-4 h-4" aria-hidden="true" />
                            </button>
                          </div>

                          {/* Price & Remove */}
                          <div className="flex items-center gap-4 md:ml-4">
                            <span className="font-calistoga text-elite-burgundy text-xl">
                              {item.price.toFixed(2)} EGP
                            </span>
                            <button
                              className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-500 hover:bg-red-100 transition-all"
                              onClick={() => removeFromCart(item.id)}
                              aria-label={`Remove ${itemName} from cart`}
                              title={`Remove ${itemName} from cart`}
                            >
                              <Trash2 className="w-4 h-4" aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Order Type Selection */}
              <div className="bg-white rounded-3xl shadow-xl border border-elite-burgundy/10 p-6">
                <h2 className="font-calistoga text-elite-burgundy text-xl mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Order Type
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label
                    className={`flex items-center gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                      orderType === "PICKUP"
                        ? "border-elite-burgundy bg-elite-burgundy/5"
                        : "border-elite-burgundy/20 hover:border-elite-burgundy/40"
                    }`}
                  >
                    <input
                      type="radio"
                      value="PICKUP"
                      checked={orderType === "PICKUP"}
                      onChange={() => setOrderType("PICKUP" as OrderType)}
                      className="sr-only"
                    />
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        orderType === "PICKUP"
                          ? "bg-elite-burgundy text-elite-cream"
                          : "bg-elite-cream text-elite-burgundy"
                      }`}
                    >
                      <Store className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="font-calistoga text-elite-black text-lg">
                        Pickup
                      </div>
                      <div className="font-cabin text-elite-black/60 text-sm">
                        Pick up at our store • Free
                      </div>
                    </div>
                    {orderType === "PICKUP" && (
                      <Check className="w-6 h-6 text-elite-burgundy ml-auto" />
                    )}
                  </label>

                  <label
                    className={`flex items-center gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                      orderType === "DELIVERY"
                        ? "border-elite-burgundy bg-elite-burgundy/5"
                        : "border-elite-burgundy/20 hover:border-elite-burgundy/40"
                    }`}
                  >
                    <input
                      type="radio"
                      value="DELIVERY"
                      checked={orderType === "DELIVERY"}
                      onChange={() => setOrderType("DELIVERY" as OrderType)}
                      className="sr-only"
                    />
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        orderType === "DELIVERY"
                          ? "bg-elite-burgundy text-elite-cream"
                          : "bg-elite-cream text-elite-burgundy"
                      }`}
                    >
                      <Truck className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="font-calistoga text-elite-black text-lg">
                        Delivery
                      </div>
                      <div className="font-cabin text-elite-black/60 text-sm">
                        Delivered to your door • 15 EGP
                      </div>
                    </div>
                    {orderType === "DELIVERY" && (
                      <Check className="w-6 h-6 text-elite-burgundy ml-auto" />
                    )}
                  </label>
                </div>
              </div>

              {/* Internet Card Add-on */}
              <div className="bg-white rounded-3xl shadow-xl border border-elite-burgundy/10 p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-elite-burgundy/10 text-elite-burgundy flex items-center justify-center">
                      <Wifi className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="font-calistoga text-elite-burgundy text-xl">
                        Internet Card Add-on
                      </h2>
                      <p className="font-cabin text-elite-black/60 text-sm">
                        Each card adds {INTERNET_CARD_UNIT_SIZE_GB} GB of internet for 10 EGP. Cards must be paired with a drink.
                      </p>
                    </div>
                  </div>
                  <div className="font-cabin text-elite-burgundy font-medium">
                    +{internetCardTotal.toFixed(2)} EGP
                  </div>
                </div>
                <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="font-cabin text-elite-black/70">
                    <div>Selected Cards: {internetCardQty}</div>
                    <div className="text-sm">
                      Total: {internetCardTotal.toFixed(2)} EGP
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      className="w-10 h-10 rounded-full border-2 border-elite-burgundy/20 flex items-center justify-center text-elite-burgundy hover:bg-elite-burgundy hover:text-elite-cream transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => setInternetCardQty(Math.max(0, internetCardQty - 1))}
                      disabled={internetCardQty === 0}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="font-calistoga text-elite-black text-lg w-8 text-center">
                      {internetCardQty}
                    </span>
                    <button
                      className="w-10 h-10 rounded-full border-2 border-elite-burgundy/20 flex items-center justify-center text-elite-burgundy hover:bg-elite-burgundy hover:text-elite-cream transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => setInternetCardQty(internetCardQty + 1)}
                      disabled={itemCount === 0}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Order Notes */}
              <div className="bg-white rounded-3xl shadow-xl border border-elite-burgundy/10 p-6">
                <h2 className="font-calistoga text-elite-burgundy text-xl mb-3 flex items-center gap-2">
                  <StickyNote className="w-5 h-5" />
                  Order Notes
                </h2>
                <textarea
                  className="w-full h-24 rounded-2xl border border-elite-burgundy/20 bg-elite-cream/20 px-4 py-3 font-cabin text-elite-black placeholder:text-elite-black/40 focus:border-elite-burgundy focus:outline-none focus:ring-2 focus:ring-elite-burgundy/30"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Any instructions for the barista"
                  disabled={submitting}
                />
                <p className="mt-2 text-sm font-cabin text-elite-black/50">
                  Notes travel with the order and are included in the Odoo sale record.
                </p>
              </div>

              {/* Order Summary */}
              <div className="bg-white rounded-3xl shadow-xl border border-elite-burgundy/10 p-6">
                <h2 className="font-calistoga text-elite-burgundy text-xl mb-4 flex items-center gap-2">
                  <Receipt className="w-5 h-5" />
                  Order Summary
                </h2>
                  <div className="space-y-3 font-cabin">
                    <div className="flex justify-between text-elite-black/70">
                      <span>Drinks Subtotal</span>
                      <span>{drinksSubtotal.toFixed(2)} EGP</span>
                    </div>
                  <div className="flex justify-between text-elite-black/70">
                    <span>Delivery Fee</span>
                    <span>{deliveryFee.toFixed(2)} EGP</span>
                  </div>
                  {internetCardQty > 0 && (
                    <div className="flex justify-between text-elite-black/70">
                      <span>
                        Internet Cards ({internetCardQty} × {INTERNET_CARD_UNIT_PRICE} EGP)
                      </span>
                      <span>{internetCardTotal.toFixed(2)} EGP</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-4 border-t border-elite-burgundy/20">
                    <span className="font-calistoga text-elite-black text-xl">
                      Total
                    </span>
                    <span className="font-calistoga text-elite-burgundy text-2xl">
                      {totalAmount.toFixed(2)} EGP
                    </span>
                  </div>
                  <div className="flex justify-between text-elite-black/50 text-sm">
                    <span>Items</span>
                    <span>{itemCount}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <button
                  className="w-full sm:w-auto px-6 py-3 rounded-full border-2 border-elite-burgundy/20 text-elite-burgundy font-cabin font-medium hover:bg-elite-burgundy/5 transition-all"
                  onClick={async () => {
                    await clearCart();
                    setInternetCardQty(0);
                  }}
                >
                  Clear Cart
                </button>
                <div className="w-full sm:w-auto flex flex-col items-end gap-2">
                  {submitError && (
                    <div className="w-full text-right font-cabin text-sm text-red-600">
                      {submitError}
                    </div>
                  )}
                  <div className="font-cabin text-elite-black/70">
                    Total:{" "}
                    <span className="font-calistoga text-elite-burgundy text-xl">
                      {totalAmount.toFixed(2)} EGP
                    </span>
                  </div>
                  <button
                    className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-elite-burgundy text-elite-cream rounded-full font-calistoga text-lg tracking-wide shadow-lg transition-all duration-300 hover:bg-elite-dark-burgundy hover:scale-[1.02] hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    onClick={placeOrder}
                    disabled={submitting}
                  >
                    <CreditCard className="w-5 h-5" />
                    {submitting ? "Placing Order…" : "Place Order"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Continue Shopping */}
          <div className="text-center pt-4">
            <Link
              href="/menu"
              className="inline-flex items-center gap-2 font-cabin text-elite-burgundy hover:text-elite-dark-burgundy transition-colors"
            >
              <span>Continue shopping</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
