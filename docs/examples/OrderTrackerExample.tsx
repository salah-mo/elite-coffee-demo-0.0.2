/**
 * Example: Order Tracking Component with Caching
 * 
 * This example demonstrates how to use the order caching system
 * for a real-time order tracking interface.
 */
"use client";

import React from "react";
import { useOrder } from "@/hooks/useOrders";
import { OrderStatus } from "@/types";
import { RefreshCw, CheckCircle, Clock, Truck } from "lucide-react";

interface OrderTrackerProps {
  orderId: string;
}

/**
 * Real-time order tracker with caching and auto-refresh
 * 
 * Features:
 * - Automatic background refresh every 10 seconds
 * - Cached data for instant loading
 * - Offline support via localStorage
 * - Manual refresh option
 * - Optimistic updates
 * 
 * @example
 * ```tsx
 * <OrderTracker orderId="order-123" />
 * ```
 */
export function OrderTracker({ orderId }: OrderTrackerProps) {
  const {
    order,
    loading,
    error,
    refetch,
    updateStatus,
  } = useOrder(orderId, {
    autoRefresh: true,      // Enable automatic refresh
    refreshInterval: 10000, // Refresh every 10 seconds
  });

  const [updating, setUpdating] = React.useState(false);

  // Handle manual refresh
  const handleRefresh = async () => {
    setUpdating(true);
    await refetch();
    setUpdating(false);
  };

  // Handle status update (e.g., confirm order)
  const handleConfirm = async () => {
    if (!order) return;
    
    setUpdating(true);
    const success = await updateStatus(
      OrderStatus.CONFIRMED,
      "Order confirmed by customer"
    );
    setUpdating(false);

    if (success) {
      console.log("Order confirmed successfully!");
    }
  };

  // Loading state
  if (loading && !order) {
    return (
      <div className="animate-pulse bg-gray-100 rounded-lg p-6">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      </div>
    );
  }

  // Error state (with cached data fallback)
  if (error && !order) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-700">{error}</p>
        <button
          onClick={handleRefresh}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  // Not found state
  if (!order) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <p className="text-yellow-700">Order not found</p>
      </div>
    );
  }

  // Success state with order data
  const isOfflineData = error && order;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      {/* Offline warning banner */}
      {isOfflineData && (
        <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded p-3">
          <p className="text-sm text-yellow-700">
            ⚠️ Showing cached data - {error}
          </p>
        </div>
      )}

      {/* Order header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Order #{order.orderNumber}
          </h2>
          <p className="text-sm text-gray-500">
            Placed {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={updating}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw
            className={`w-4 h-4 ${updating ? "animate-spin" : ""}`}
          />
          {updating ? "Updating..." : "Refresh"}
        </button>
      </div>

      {/* Order status */}
      <div className="mb-6">
        <StatusBadge status={order.status} />
      </div>

      {/* Order items */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-900 mb-3">Items</h3>
        <div className="space-y-2">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-gray-700">
                {item.quantity}x {item.menuItem?.name || "Item"}
                {item.size && ` (${item.size})`}
              </span>
              <span className="font-medium text-gray-900">
                {item.totalPrice.toFixed(2)} EGP
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Order total */}
      <div className="border-t border-gray-200 pt-4 mb-6">
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold text-gray-900">Total</span>
          <span className="text-2xl font-bold text-gray-900">
            {order.total.toFixed(2)} EGP
          </span>
        </div>
      </div>

      {/* Actions */}
      {order.status === OrderStatus.PENDING && (
        <button
          onClick={handleConfirm}
          disabled={updating}
          className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
        >
          {updating ? "Confirming..." : "Confirm Order"}
        </button>
      )}

      {/* Odoo integration info */}
      {order.integrations?.odoo && (
        <div className="mt-4 p-3 bg-gray-50 rounded text-xs text-gray-600">
          {order.integrations.odoo.saleOrderId && (
            <p>Odoo Sale ID: {order.integrations.odoo.saleOrderId}</p>
          )}
          {order.integrations.odoo.lastStatusSync && (
            <p>
              Last synced:{" "}
              {new Date(order.integrations.odoo.lastStatusSync).toLocaleString()}
            </p>
          )}
        </div>
      )}

      {/* Auto-refresh indicator */}
      <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
        <Clock className="w-3 h-3" />
        Auto-refreshing every 10 seconds
      </div>
    </div>
  );
}

/**
 * Status badge component
 */
function StatusBadge({ status }: { status: OrderStatus }) {
  const config = getStatusConfig(status);

  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${config.className}`}>
      <config.Icon className="w-5 h-5" />
      <span className="font-medium">{config.label}</span>
    </div>
  );
}

/**
 * Get status configuration
 */
function getStatusConfig(status: OrderStatus) {
  switch (status) {
    case OrderStatus.PENDING:
      return {
        Icon: Clock,
        label: "Pending",
        className: "bg-yellow-100 text-yellow-800",
      };
    case OrderStatus.CONFIRMED:
      return {
        Icon: CheckCircle,
        label: "Confirmed",
        className: "bg-blue-100 text-blue-800",
      };
    case OrderStatus.PREPARING:
      return {
        Icon: Clock,
        label: "Preparing",
        className: "bg-orange-100 text-orange-800",
      };
    case OrderStatus.READY:
      return {
        Icon: CheckCircle,
        label: "Ready",
        className: "bg-green-100 text-green-800",
      };
    case OrderStatus.OUT_FOR_DELIVERY:
      return {
        Icon: Truck,
        label: "Out for Delivery",
        className: "bg-purple-100 text-purple-800",
      };
    case OrderStatus.DELIVERED:
      return {
        Icon: CheckCircle,
        label: "Delivered",
        className: "bg-green-100 text-green-800",
      };
    default:
      return {
        Icon: Clock,
        label: status,
        className: "bg-gray-100 text-gray-800",
      };
  }
}

// Example usage in a page
export default function OrderTrackingPage({
  params,
}: {
  params: { orderId: string };
}) {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <OrderTracker orderId={params.orderId} />
      </div>
    </div>
  );
}
