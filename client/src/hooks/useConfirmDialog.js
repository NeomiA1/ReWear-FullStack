

import { useCallback, useState } from "react";

export function useConfirmDialog() {
  const [dialogState, setDialogState] = useState(null);

  const confirm = useCallback((options) => {
    setDialogState({ ...options, loading: false });
  }, []);

  const close = useCallback(() => setDialogState(null), []);

  const handleConfirm = useCallback(async () => {
    if (!dialogState || dialogState.loading) return; // חוסם לחיצה כפולה בזמן ריצה
    setDialogState((prev) => (prev ? { ...prev, loading: true } : prev));
    try {
      await dialogState.onConfirm?.();
    } finally {
      close();
    }
  }, [dialogState, close]);

  const handleCancel = useCallback(() => {
    if (dialogState?.loading) return;
    close();
  }, [dialogState, close]);

  return {
    confirm,
    confirmDialogProps: {
      open: !!dialogState,
      title: dialogState?.title,
      message: dialogState?.message,
      confirmText: dialogState?.confirmText,
      cancelText: dialogState?.cancelText,
      destructive: dialogState?.destructive || false,
      icon: dialogState?.icon || null,
      disabled: dialogState?.disabled || false,
      loading: dialogState?.loading || false,
      onConfirm: handleConfirm,
      onCancel: handleCancel,
    },
  };
}
