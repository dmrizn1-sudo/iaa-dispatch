import * as React from "react";

type Option = { value: string; label: string };

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  allowCustom?: boolean;
  name?: string;
  required?: boolean;
};

export function Combobox({
  label,
  value,
  onChange,
  options,
  placeholder,
  allowCustom = true,
  name,
  required
}: Props) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState(value);
  const rootRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => setQuery(value), [value]);

  React.useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const t = e.target as Node | null;
      if (t && rootRef.current && !rootRef.current.contains(t)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const filtered = React.useMemo(() => {
    const q = query.trim();
    if (!q) return options;
    return options.filter((o) => o.label.includes(q) || o.value.includes(q));
  }, [options, query]);

  return (
    <div ref={rootRef} className="relative">
      <div className="mb-2 text-sm font-semibold text-iaa-blue">{label}</div>
      <input
        name={name}
        required={required}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          if (allowCustom) onChange(e.target.value);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className={[
          "h-12 w-full rounded-xl border bg-white px-4 text-base shadow-sm outline-none transition text-right placeholder:text-iaa-blue/40",
          "border-iaa-blue/15 focus:border-iaa-gold focus:ring-4 focus:ring-iaa-gold/15",
          "md:h-14 md:text-lg"
        ].join(" ")}
        inputMode="search"
        enterKeyHint="done"
        autoComplete="off"
      />

      {open ? (
        <div className="absolute z-30 mt-2 max-h-72 w-full overflow-auto rounded-xl border border-iaa-blue/15 bg-white shadow-soft">
          {filtered.length ? (
            filtered.map((o) => (
              <button
                key={o.value}
                type="button"
                className="flex w-full items-center justify-between gap-4 px-4 py-3 text-right text-base hover:bg-iaa-blue/5 md:text-lg"
                onClick={() => {
                  onChange(o.value);
                  setQuery(o.label);
                  setOpen(false);
                }}
              >
                <span className="font-semibold text-iaa-blue">{o.label}</span>
                <span className="text-sm text-iaa-blue/60">{o.value}</span>
              </button>
            ))
          ) : (
            <div className="px-4 py-4 text-base text-iaa-blue/70 md:text-lg">לא נמצאו תוצאות</div>
          )}
        </div>
      ) : null}
    </div>
  );
}

