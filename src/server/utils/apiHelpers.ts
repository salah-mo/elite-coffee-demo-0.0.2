import type { NextRequest } from 'next/server';
import type { ApiResponse } from '@/types';
import { ApiError } from './errors';

/**
 * Create a success response
 */
export function successResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    data,
    message,
  };
}

/**
 * Create an error response
 */
export function errorResponse(error: string, message?: string): ApiResponse {
  return {
    success: false,
    error,
    message,
  };
}

/**
 * Create a JSON response with proper headers
 */
export function jsonResponse<T>(data: ApiResponse<T>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Handle API errors
 */
export function handleApiError(error: unknown) {
  console.error('API Error:', error);
  if (error instanceof ApiError) {
    return jsonResponse(errorResponse(error.message), error.status);
  }

  if (error instanceof Error) {
    return jsonResponse(errorResponse(error.message), 500);
  }

  return jsonResponse(errorResponse('An unexpected error occurred'), 500);
}

/**
 * Parse request body
 */
export async function parseRequestBody<T>(request: NextRequest): Promise<T> {
  try {
    return await request.json();
  } catch (error) {
    throw new Error('Invalid request body');
  }
}

/**
 * Get query parameters from URL
 */
export function getQueryParams(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  return Object.fromEntries(searchParams.entries());
}

/**
 * Validate required fields
 */
export function validateRequiredFields<T extends Record<string, unknown>>(
  data: T,
  requiredFields: (keyof T)[]
): string | null {
  for (const field of requiredFields) {
    if (!data[field]) {
      return `Missing required field: ${String(field)}`;
    }
  }
  return null;
}
