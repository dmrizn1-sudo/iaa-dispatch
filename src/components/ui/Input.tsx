import * as React from "react";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
};

export const Input = React.forwardRef<HTMLInputElement, Props>(function Input(
  { label, hint, error, className = "", ...props },
  ref
) {
  return (
    <label className="block">
      {label ? <div className="mb-2 text-sm font-semibold text-iaa-blue">{label}</div> : null}
      <input
        ref={ref}
        className={[
          "h-12 w-full rounded-xl border bg-white px-4 text-base shadow-sm outline-none transition text-right placeholder:text-iaa-blue/40",
          "border-iaa-blue/15 focus:border-iaa-gold focus:ring-4 focus:ring-iaa-gold/15",
          "md:h-14 md:text-lg",
          error ? "border-red-400 focus:border-red-500 focus:ring-red-200/60" : "",
          className
        ].join(" ")}
        {...props}
      />
      {error ? (
        <div className="mt-2 text-sm font-semibold text-red-600">{error}</div>
      ) : hint ? (
        <div className="mt-2 text-sm text-iaa-blue/70">{hint}</div>
      ) : null}
    </label>
  );
});

