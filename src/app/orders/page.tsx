"use client";

import React from "react";
import Link from "next/link";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Skeleton } from "@/components/Skeleton";
import { useToast } from "@/components/ToastProvider";
import {
  ORDER_STATUS_FLOW,
  FINAL_ORDER_STATUSES,
  formatStatusLabel,
} from "@/lib/orderStatusMeta";
import type { Order } from "@/types";
import { OrderStatus } from "@/types";
import {
  RefreshCw,
  CalendarDays,
  Receipt,
  Truck,
  MapPin,
  Check,
  XCircle,
  Ban,
} from "lucide-react";

const REFRESH_MS = 30000;

function formatDate(input: Date | string): string {
  const value = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(value.getTime())) return "Unknown";
  return value.toLocaleString();
}

export default function OrdersPage() {
  const { push } = useToast();
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = React.useState<Date | null>(null);

  const fetchOrders = React.useCallback(
    async (options?: { silent?: boolean; showToast?: boolean }) => {
      const shouldShowSkeleton = !options?.silent && orders.length === 0;
      if (shouldShowSkeleton) {
        setLoading(true);
        setError(null);
      } else if (!options?.silent) {
        setRefreshing(true);
      }

      try {
        const res = await fetch("/api/orders?limit=50", {
          headers: {
            "x-user-id": "demo-user",
          },
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Failed to load orders");
        const json = await res.json();
        const data = (json.data?.orders as Order[]) || [];
        const sorted = [...data].sort((a, b) => {
          const left = new Date(a.createdAt).getTime();
          const right = new Date(b.createdAt).getTime();
          return right - left;
        });
        setOrders(sorted);
        setError(null);
        setLastUpdatedAt(new Date());
        if (options?.showToast) {
          push({ type: "success", message: "Orders refreshed" });
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unable to load orders";
        if (!options?.silent) {
          push({ type: "error", message });
          setError(message);
        } else {
          console.warn(message);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [orders.length, push]
  );

  React.useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  React.useEffect(() => {
    const intervalId = window.setInterval(() => {
      fetchOrders({ silent: true });
    }, REFRESH_MS);
    return () => window.clearInterval(intervalId);
  }, [fetchOrders]);

  const activeOrders = React.useMemo(
    () => orders.filter((order) => !FINAL_ORDER_STATUSES.has(order.status)),
    [orders]
  );

  return (
    <main className="page-transition loaded">
      <Navigation />
      <div className="min-h-screen bg-elite-cream">
        <div className="bg-elite-burgundy text-elite-cream py-12">
          <div className="max-w-5xl mx-auto px-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="font-calistoga text-4xl md:text-5xl mb-3">
                  Order History
                </h1>
                <p className="font-cabin text-elite-cream/90 text-lg">
                  Track every order you have placed and follow live updates.
                </p>
              </div>
              <button
                className="inline-flex items-center gap-2 rounded-full border border-elite-cream/40 px-4 py-2 font-cabin text-sm text-elite-cream transition-all hover:bg-elite-cream hover:text-elite-burgundy disabled:opacity-60"
                onClick={() => fetchOrders({ showToast: true })}
                disabled={refreshing}
                aria-busy={refreshing}
              >
                <RefreshCw
                  className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
                  aria-hidden="true"
                />
                {refreshing ? "Refreshing" : "Refresh"}
              </button>
            </div>
            <div
              className="mt-4 font-cabin text-sm text-elite-cream/80"
              role="status"
              aria-live="polite"
            >
              Active orders: {activeOrders.length} • Last updated:{" "}
              {lastUpdatedAt ? lastUpdatedAt.toLocaleTimeString() : "just now"}
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-12 space-y-6">
          {loading && orders.length === 0 ? (
            <div className="grid gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-36 rounded-3xl" />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-3xl border border-red-200 bg-red-50 p-6 font-cabin text-red-700">
              {error}
            </div>
          ) : orders.length === 0 ? (
            <div className="rounded-3xl border border-elite-burgundy/20 bg-white p-10 text-center space-y-4">
              <div className="mx-auto h-20 w-20 rounded-full bg-elite-cream flex items-center justify-center">
                <Receipt className="h-10 w-10 text-elite-burgundy/60" />
              </div>
              <h2 className="font-calistoga text-elite-black text-2xl">
                No orders yet
              </h2>
              <p className="font-cabin text-elite-black/70">
                When you place an order, it will appear here with live status
                tracking.
              </p>
              <Link
                href="/menu"
                className="inline-flex items-center gap-2 rounded-full bg-elite-burgundy px-6 py-3 font-calistoga text-lg text-elite-cream transition-all hover:bg-elite-dark-burgundy hover:scale-105"
              >
                Browse Menu
                <Truck className="w-5 h-5" />
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => {
                const isCancelled = order.status === OrderStatus.CANCELLED;
                const showCancelledBanner = isCancelled;
                const statusIndex = ORDER_STATUS_FLOW.findIndex(
                  (step) => step.value === order.status
                );
                const created = formatDate(order.createdAt);
                const updated = formatDate(order.updatedAt);
                const subtotal = order.total.toFixed(2);
                const odooLastStatusSync = order.integrations?.odoo?.lastStatusSync;

                return (
                  <div
                    key={order.id}
                    className="rounded-3xl border border-elite-burgundy/15 bg-white p-6 shadow-sm"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="font-cabin text-sm text-elite-black/60">
                          Order #{order.orderNumber}
                        </div>
                        <h3 className="font-calistoga text-elite-burgundy text-2xl">
                          {formatStatusLabel(order.status)}
                        </h3>
                        <div className="font-cabin text-xs text-elite-black/50">
                          Created {created} • Updated {updated}
                        </div>
                      </div>
                      <div className="flex flex-col items-start gap-2 sm:items-end">
                        <span className="rounded-full bg-elite-burgundy/10 px-4 py-1 font-cabin text-sm text-elite-burgundy">
                          {order.orderType}
                        </span>
                        <span className="font-calistoga text-xl text-elite-black">
                          {subtotal} EGP
                        </span>
                        <div className="flex items-center gap-2 text-xs font-cabin text-elite-black/50">
                          <CalendarDays className="h-4 w-4" aria-hidden="true" />
                          Items: {order.items.length}
                        </div>
                        <button
                          className="inline-flex items-center gap-2 rounded-full border border-elite-burgundy/20 px-3 py-1 text-xs font-cabin text-elite-burgundy transition-all hover:bg-elite-burgundy hover:text-elite-cream"
                          onClick={() => fetchOrders({ showToast: true })}
                          disabled={refreshing}
                        >
                          <RefreshCw
                            className={`h-3.5 w-3.5 ${
                              refreshing ? "animate-spin" : ""
                            }`}
                            aria-hidden="true"
                          />
                          Refresh list
                        </button>
                      </div>
                    </div>

                    {showCancelledBanner ? (
                      <div className="mt-4 flex flex-col gap-4">
                        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
                          <XCircle className="h-5 w-5 text-red-600" aria-hidden="true" />
                          <div>
                            <div className="font-calistoga text-red-700 text-lg">
                              Order cancelled
                            </div>
                            <p className="font-cabin text-sm text-red-600">
                              Reach out to our support team if you believe this is a mistake.
                            </p>
                          </div>
                        </div>
                        {order.integrations?.odoo?.lastStatus === OrderStatus.CANCELLED && (
                          <div className="flex items-center gap-2 text-sm font-cabin text-elite-black/60">
                            <Ban className="h-4 w-4 text-red-600" aria-hidden="true" />
                            {`Cancelled in Odoo${
                              odooLastStatusSync
                                ? ` at ${formatDate(odooLastStatusSync)}`
                                : ""
                            }`}
                          </div>
                        )}
                      </div>
                    ) : (
                      <ul
                        className="mt-4 space-y-3"
                        role="list"
                        aria-label={
                          `Progress for order ${order.orderNumber}`
                        }
                      >
                        {ORDER_STATUS_FLOW.map((step, index) => {
                          if (
                            step.value === OrderStatus.CANCELLED &&
                            order.status !== OrderStatus.CANCELLED
                          ) {
                            return null;
                          }
                          const Icon = step.Icon;
                          const isActive =
                            statusIndex !== -1 && index <= statusIndex;
                          const isCurrent = statusIndex === index;
                          const isCancelledStep = step.value === OrderStatus.CANCELLED;
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
                            <li
                              key={step.value}
                              className={`flex items-start gap-3 rounded-2xl border px-4 py-3 ${containerClass}`}
                            >
                              <div
                                className={`mt-1 flex h-8 w-8 items-center justify-center rounded-full ${indicatorClass}`}
                              >
                                <Icon className="h-4 w-4" aria-hidden="true" />
                              </div>
                              <div>
                                <div className={`font-calistoga text-lg ${titleClass}`}>
                                  {step.label}
                                </div>
                                <p className="font-cabin text-sm text-elite-black/60">
                                  {step.description}
                                </p>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}

                    {order.integrations?.odoo && (
                      <div className="mt-4 grid gap-2 rounded-2xl border border-elite-burgundy/10 bg-elite-cream/40 p-4 font-cabin text-xs text-elite-black/70 sm:grid-cols-2">
                        {order.integrations.odoo.saleOrderId && (
                          <div className="flex items-center gap-2">
                            <Receipt className="h-4 w-4" aria-hidden="true" />
                            Odoo Sale ID: {order.integrations.odoo.saleOrderId}
                          </div>
                        )}
                        {order.integrations.odoo.posOrderId && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" aria-hidden="true" />
                            POS Order ID: {order.integrations.odoo.posOrderId}
                          </div>
                        )}
                        {order.integrations.odoo.lastStatus && (
                          <div className="flex items-center gap-2">
                            <Check className="h-4 w-4" aria-hidden="true" />
                            Synced as{" "}
                            {formatStatusLabel(
                              order.integrations.odoo.lastStatus
                            )}
                          </div>
                        )}
                        {order.integrations.odoo.lastStatusSync && (
                          <div className="flex items-center gap-2">
                            <CalendarDays className="h-4 w-4" aria-hidden="true" />
                            Synced on{" "}
                            {formatDate(order.integrations.odoo.lastStatusSync)}
                          </div>
                        )}
                        {order.integrations.odoo.url && (
                          <Link
                            href={order.integrations.odoo.url}
                            target="_blank"
                            rel="noreferrer"
                            className="col-span-full inline-flex items-center gap-2 text-elite-burgundy underline-offset-4 hover:text-elite-dark-burgundy hover:underline"
                            aria-label={`Open order ${order.orderNumber} in Odoo`}
                          >
                            Open in Odoo
                            <Truck className="h-4 w-4" aria-hidden="true" />
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </main>
  );
}
