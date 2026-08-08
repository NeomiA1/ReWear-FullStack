import { createContext, useCallback, useRef, useState } from "react";
import ToastContainer from "../components/ToastContainer";

export const ToastContext = createContext(null);

const DEFAULT_DURATIONS = {
  success: 4000,
  info:    4000,
  warning: 5000,
  error:   5000,
};

let nextId = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const activeSignatures = useRef(new Set());

  const dismiss = useCallback((id) => {
    setToasts((prev) => {
      const target = prev.find((t) => t.id === id);
      if (target) activeSignatures.current.delete(target.signature);
      return prev.filter((t) => t.id !== id);
    });
  }, []);

  const show = useCallback((type, message, options = {}) => {
    const { description = null, duration } = options;
    const signature = `${type}|${message}|${description || ""}`;

    if (activeSignatures.current.has(signature)) return null;
    activeSignatures.current.add(signature);

    const id = nextId++;
    const resolvedDuration = duration === undefined ? DEFAULT_DURATIONS[type] : duration;

    setToasts((prev) => [...prev, { id, type, message, description, signature }]);

    if (resolvedDuration) {
      setTimeout(() => dismiss(id), resolvedDuration);
    }
    return id;
  }, [dismiss]);

  const api = {
    toast:   show,
    success: (message, options) => show("success", message, options),
    error:   (message, options) => show("error", message, options),
    warning: (message, options) => show("warning", message, options),
    info:    (message, options) => show("info", message, options),
    dismiss,
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}
