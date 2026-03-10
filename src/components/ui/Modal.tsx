import * as React from "react";

type Props = {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  footer?: React.ReactNode;
};

export function Modal({ open, title, children, onClose, footer }: Props) {
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="סגור"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div className="relative mx-auto mt-6 w-[min(920px,calc(100%-24px))] rounded-2xl bg-white shadow-soft">
        <div className="flex items-center justify-between gap-4 border-b border-iaa-blue/10 px-5 py-4 md:px-6">
          <div className="text-lg font-extrabold text-iaa-blue md:text-xl">{title}</div>
          <button
            type="button"
            className="rounded-xl px-3 py-2 text-base font-bold text-iaa-blue hover:bg-iaa-blue/5 md:text-lg"
            onClick={onClose}
          >
            סגור
          </button>
        </div>
        <div className="px-5 py-5 md:px-6">{children}</div>
        {footer ? (
          <div className="border-t border-iaa-blue/10 px-5 py-4 md:px-6">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}

