import { useEffect, useRef, useState, useCallback } from "react";

export type SaveStatus = "saved" | "saving" | "unsaved";

interface UseAutosaveProps<T> {
  data: T;
  onSave: (data: T) => Promise<any>;
  debounceMs?: number;
}

export function useAutosave<T>({
  data,
  onSave,
  debounceMs = 2000,
}: UseAutosaveProps<T>) {
  const [status, setStatus] = useState<SaveStatus>("saved");
  const isFirstRender = useRef(true);
  const dataRef = useRef(data);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep a ref of current data so save function doesn't trigger effect on change
  dataRef.current = data;

  const triggerSave = useCallback(async (currentData: T) => {
    setStatus("saving");
    try {
      await onSave(currentData);
      setStatus("saved");
    } catch {
      setStatus("unsaved");
    }
  }, [onSave]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    setStatus("unsaved");

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      triggerSave(dataRef.current);
    }, debounceMs);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [data, debounceMs, triggerSave]);

  const forceSave = async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    await triggerSave(dataRef.current);
  };

  return {
    status,
    setStatus,
    forceSave,
  };
}
