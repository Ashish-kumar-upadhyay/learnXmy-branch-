import { motion } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info";
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "danger"
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const getColors = () => {
    switch (type) {
      case "danger":
        return {
          bg: "bg-gradient-to-br from-destructive/20 via-card to-card",
          border: "border-destructive/45",
          icon: "bg-destructive/20 text-destructive",
          title: "text-destructive",
          button: "bg-destructive text-destructive-foreground hover:bg-destructive/90"
        };
      case "warning":
        return {
          bg: "bg-gradient-to-br from-amber-500/20 via-card to-card",
          border: "border-amber-500/45",
          icon: "bg-amber-500/20 text-amber-600",
          title: "text-amber-700",
          button: "bg-amber-500 text-white hover:bg-amber-600"
        };
      default:
        return {
          bg: "bg-gradient-to-br from-primary/20 via-card to-card",
          border: "border-primary/45",
          icon: "bg-primary/20 text-primary",
          title: "text-primary",
          button: "bg-primary text-primary-foreground hover:opacity-90"
        };
    }
  };

  const colors = getColors();

  return (
    <div className="fixed inset-0 z-[90] bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 12 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className={`w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden ${colors.bg} ${colors.border}`}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start gap-4 mb-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${colors.icon}`}>
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className={`text-lg font-bold tracking-tight mb-2 ${colors.title}`}>
                {title}
              </h3>
              <p className="text-sm text-foreground/90 leading-relaxed">
                {message}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Warning Info */}
          <div className="rounded-xl border border-border/40 bg-muted/30 px-3 py-2 text-xs text-muted-foreground mb-6">
            This action cannot be undone. Please be certain before proceeding.
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-muted/30 text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all transform hover:scale-105 ${colors.button}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
