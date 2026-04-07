"use client";

import { Check, ChevronDown, X } from "lucide-react";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

const inputClass =
  "h-10 w-full rounded-lg border border-slate-200/90 bg-white pl-3 pr-16 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200/80 dark:border-slate-600 dark:bg-slate-800/90 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-slate-500 dark:focus:ring-slate-600/40";

export function SearchableSelect({
  label,
  value,
  onChange,
  options,
  emptyOptionLabel,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  /** First row: clear selection (e.g. “All departments”). */
  emptyOptionLabel: string;
  disabled?: boolean;
}) {
  const id = useId();
  const listId = `${id}-listbox`;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.toLowerCase().includes(q));
  }, [options, query]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setQuery(value);
      }
    }
    if (open) {
      document.addEventListener("mousedown", onDoc);
    }
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, value]);

  const showList = open && !disabled;

  return (
    <div ref={containerRef} className="relative">
      <label
        htmlFor={id}
        className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type="text"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          disabled={disabled}
          value={query}
          placeholder={emptyOptionLabel}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className={inputClass}
        />
        {value ? (
          <button
            type="button"
            tabIndex={-1}
            disabled={disabled}
            aria-label="Clear selection"
            className="absolute right-9 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onChange("");
              setQuery("");
              setOpen(false);
            }}
          >
            <X className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
        ) : null}
        <ChevronDown
          className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500"
          strokeWidth={2}
          aria-hidden
        />
      </div>

      {showList ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-[220] mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-slate-200/90 bg-white py-1 shadow-lg ring-1 ring-black/5 dark:border-slate-600 dark:bg-slate-900 dark:ring-white/10"
        >
          <li role="option" aria-selected={value === ""}>
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-500 transition hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
              onMouseDown={(e) => {
                e.preventDefault();
                onChange("");
                setQuery("");
                setOpen(false);
              }}
            >
              {value === "" ? (
                <Check className="h-3.5 w-3.5 shrink-0 text-slate-600 dark:text-slate-300" />
              ) : (
                <span className="w-3.5 shrink-0" />
              )}
              {emptyOptionLabel}
            </button>
          </li>
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-slate-400 dark:text-slate-500">
              No matches
            </li>
          ) : (
            filtered.map((opt) => (
              <li key={opt} role="option" aria-selected={value === opt}>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-800 transition hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-slate-800"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onChange(opt);
                    setQuery(opt);
                    setOpen(false);
                  }}
                >
                  {value === opt ? (
                    <Check className="h-3.5 w-3.5 shrink-0 text-slate-600 dark:text-slate-300" />
                  ) : (
                    <span className="w-3.5 shrink-0" />
                  )}
                  <span className="min-w-0 truncate">{opt}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
