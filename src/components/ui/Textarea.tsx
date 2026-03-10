import * as React from "react";

type Props = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  hint?: string;
  error?: string;
};

export function Textarea({ label, hint, error, className = "", ...props }: Props) {
  return (
    <label className="block">
      {label ? <div className="mb-2 text-sm font-semibold text-iaa-blue">{label}</div> : null}
      <textarea
        className={[
          "min-h-28 w-full resize-y rounded-xl border bg-white px-4 py-3 text-base shadow-sm outline-none transition text-right placeholder:text-iaa-blue/40",
          "border-iaa-blue/15 focus:border-iaa-gold focus:ring-4 focus:ring-iaa-gold/15",
          "md:min-h-32 md:text-lg",
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
}

