/**
 * UI Components barrel export
 * Centralized exports for all reusable UI components
 */

export { Button } from "./Button";
export { Input } from "./Input";
export { OptimizedImage } from "./OptimizedImage";
export {
  Skeleton,
  CardSkeleton,
  ListSkeleton,
  Spinner,
  PageLoader,
  LoadingOverlay,
} from "./Loading";
export {
  ErrorBoundary,
  useErrorHandler,
} from "./ErrorBoundary";

// Re-export component types
export type { ButtonProps } from "./Button";
export type { InputProps } from "./Input";
