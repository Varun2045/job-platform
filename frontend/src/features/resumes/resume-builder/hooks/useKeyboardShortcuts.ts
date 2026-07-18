import { useEffect } from "react";

interface KeyboardShortcutsProps {
  onSave: () => void;
  onResetZoom: () => void; // Ctrl 0: Fit to width
  onZoomIn?: () => void; // Ctrl +
  onZoomOut?: () => void; // Ctrl -
  onFitHeight?: () => void; // Ctrl 9: Fit to height
  onUndo?: () => void; // Ctrl Z
  onRedo?: () => void; // Ctrl Y / Ctrl Shift Z
}

export function useKeyboardShortcuts({
  onSave,
  onResetZoom,
  onZoomIn,
  onZoomOut,
  onFitHeight,
  onUndo,
  onRedo,
}: KeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl+S or Cmd+S
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        onSave();
      }

      // Check for Ctrl+0 or Cmd+0 (Fit width)
      if ((e.ctrlKey || e.metaKey) && e.key === "0") {
        e.preventDefault();
        onResetZoom();
      }

      // Check for Ctrl+9 or Cmd+9 (Fit height)
      if ((e.ctrlKey || e.metaKey) && e.key === "9") {
        e.preventDefault();
        onFitHeight?.();
      }

      // Check for Ctrl++ or Ctrl+= (Zoom In)
      if ((e.ctrlKey || e.metaKey) && (e.key === "=" || e.key === "+")) {
        e.preventDefault();
        onZoomIn?.();
      }

      // Check for Ctrl+- (Zoom Out)
      if ((e.ctrlKey || e.metaKey) && e.key === "-") {
        e.preventDefault();
        onZoomOut?.();
      }

      // Check for Ctrl+Z (Undo)
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        onUndo?.();
      }

      // Check for Ctrl+Y or Ctrl+Shift+Z (Redo)
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === "y" || (e.shiftKey && e.key.toLowerCase() === "z"))) {
        e.preventDefault();
        onRedo?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onSave, onResetZoom, onZoomIn, onZoomOut, onFitHeight, onUndo, onRedo]);
}
