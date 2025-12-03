import { OrderStatus } from "@/types";
import {
  Clock,
  Check,
  ChefHat,
  Package,
  Truck,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

export interface OrderStatusStep {
  value: OrderStatus;
  label: string;
  description: string;
  Icon: typeof Clock;
}

export const ORDER_STATUS_FLOW: OrderStatusStep[] = [
  {
    value: OrderStatus.PENDING,
    label: "Pending",
    description: "We received your order and are getting things ready",
    Icon: Clock,
  },
  {
    value: OrderStatus.CONFIRMED,
    label: "Confirmed",
    description: "Your order is confirmed and queued",
    Icon: Check,
  },
  {
    value: OrderStatus.PREPARING,
    label: "Preparing",
    description: "Our baristas are crafting your drinks",
    Icon: ChefHat,
  },
  {
    value: OrderStatus.READY,
    label: "Ready",
    description: "Pickup customers can collect now",
    Icon: Package,
  },
  {
    value: OrderStatus.OUT_FOR_DELIVERY,
    label: "On the Way",
    description: "Courier has your order in transit",
    Icon: Truck,
  },
  {
    value: OrderStatus.DELIVERED,
    label: "Delivered",
    description: "Enjoy your drinks!",
    Icon: CheckCircle,
  },
  {
    value: OrderStatus.CANCELLED,
    label: "Cancelled",
    description: "This order will not progress further.",
    Icon: AlertTriangle,
  },
];

export const FINAL_ORDER_STATUSES = new Set<OrderStatus>([
  OrderStatus.DELIVERED,
  OrderStatus.CANCELLED,
]);

export function formatStatusLabel(status: OrderStatus): string {
  return status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
