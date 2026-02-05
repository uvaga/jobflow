import { useState, useEffect } from 'react';

/**
 * Debounce hook - delays updating value until user stops typing
 * Follows: js-cache-function-results pattern for performance
 *
 * @param value - Value to debounce
 * @param delay - Delay in milliseconds (default: 500ms)
 * @returns Debounced value
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set up timer to update debounced value after delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up timer if value changes before delay expires
    // This prevents unnecessary API calls while user is typing
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // rerender-dependencies: primitive dependencies

  return debouncedValue;
}
