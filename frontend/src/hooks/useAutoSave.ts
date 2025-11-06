import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from './useAuth';

const API_URL = 'http://localhost:5000/api';

interface UseAutoSaveOptions {
  pagePath: string;
  formData: any;
  enabled?: boolean;
  debounceMs?: number;
}

export const useAutoSave = ({
  pagePath,
  formData,
  enabled = true,
  debounceMs = 3000, // 3 seconds default
}: UseAutoSaveOptions) => {
  const { isAuthenticated } = useAuth();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousDataRef = useRef<string>('');

  const saveData = useCallback(async (data: any) => {
    if (!isAuthenticated) return;

    try {
      await fetch(`${API_URL}/autosave/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          pagePath,
          formData: data,
        }),
      });
    } catch (error) {
      console.error('Auto-save error:', error);
    }
  }, [isAuthenticated, pagePath]);

  // Auto-save on form data change (debounced)
  useEffect(() => {
    if (!enabled || !isAuthenticated) return;

    const currentData = JSON.stringify(formData);
    
    // Skip if data hasn't changed
    if (currentData === previousDataRef.current) return;
    
    previousDataRef.current = currentData;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for debounced save
    timeoutRef.current = setTimeout(() => {
      saveData(formData);
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [formData, enabled, isAuthenticated, saveData, debounceMs]);

  // Load saved data on mount
  const loadSavedData = useCallback(async (): Promise<any | null> => {
    if (!isAuthenticated) return null;

    try {
      const response = await fetch(`${API_URL}/autosave/load/${encodeURIComponent(pagePath)}`, {
        credentials: 'include',
      });

      const result = await response.json();
      
      if (result.success && result.data) {
        return result.data.formData;
      }

      return null;
    } catch (error) {
      console.error('Auto-load error:', error);
      return null;
    }
  }, [isAuthenticated, pagePath]);

  // Delete saved data
  const clearSavedData = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      await fetch(`${API_URL}/autosave/delete/${encodeURIComponent(pagePath)}`, {
        method: 'DELETE',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Clear saved data error:', error);
    }
  }, [isAuthenticated, pagePath]);

  // Force immediate save (bypass debounce)
  const forceSave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    saveData(formData);
  }, [formData, saveData]);

  return {
    loadSavedData,
    clearSavedData,
    forceSave,
  };
};
