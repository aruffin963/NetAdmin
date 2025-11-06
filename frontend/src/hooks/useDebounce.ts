import { useState, useEffect } from 'react';

/**
 * Hook pour debouncer une valeur
 * @param value - La valeur à debouncer
 * @param delay - Le délai en millisecondes
 * @returns La valeur debouncée
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook pour debouncer une fonction de recherche
 * @param searchFn - La fonction de recherche à appeler
 * @param delay - Le délai en millisecondes
 * @returns Une fonction de recherche debouncée
 */
export function useDebouncedSearch(
  searchFn: (query: string) => void,
  delay: number = 300
) {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounce(searchQuery, delay);

  useEffect(() => {
    if (debouncedQuery !== undefined) {
      searchFn(debouncedQuery);
    }
  }, [debouncedQuery, searchFn]);

  return [searchQuery, setSearchQuery] as const;
}

/**
 * Hook pour debouncer un callback
 * @param callback - La fonction callback à debouncer
 * @param delay - Le délai en millisecondes
 * @param deps - Les dépendances du callback
 * @returns Le callback debouncé
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: React.DependencyList = []
): T {
  const [debouncedCallback, setDebouncedCallback] = useState<T>();

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedCallback(() => callback);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [callback, delay, ...deps]);

  return debouncedCallback || callback;
}