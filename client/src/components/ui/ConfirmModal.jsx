import { useEffect } from "react";

/**
 * Styled confirmation modal — replaces window.confirm() / window.alert().
 *
 * Usage:
 *   const [modal, setModal] = useState(null);
 *   setModal({ title, message, confirmLabel, danger, onConfirm });
 *   {modal && <ConfirmModal {...modal} onCancel={() => setModal(null)} />}
 */
export default function ConfirmModal({
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  danger = false,
  /** When true, hides the Cancel button — acts as an "alert" */
  alertOnly = false,
}) {
  useEffect(() => {
    function handler(e) {
      if (e.key === "Escape") onCancel?.();
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Panel */}
      <div className="relative glass rounded-2xl p-6 max-w-sm w-full animate-slide-up shadow-2xl border border-white/10">
        <h3 className="font-bold text-white text-lg mb-2">{title}</h3>
        {message && <p className="text-sm text-muted mb-6">{message}</p>}

        <div className="flex gap-3">
          {!alertOnly && (
            <button className="btn-ghost flex-1" onClick={onCancel}>
              {cancelLabel}
            </button>
          )}
          <button
            className={`flex-1 py-3 rounded-full font-bold text-sm transition-all active:scale-95 ${
              danger
                ? "bg-pink-600 hover:bg-pink-500 text-white"
                : "bg-gradient-to-r from-purple to-pink text-white hover:opacity-90"
            }`}
            onClick={onConfirm ?? onCancel}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
