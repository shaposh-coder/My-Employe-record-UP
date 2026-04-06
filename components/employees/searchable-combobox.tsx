"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

export type SearchableComboboxOption = { id: string; title: string };

type SearchableComboboxProps = {
  id: string;
  options: SearchableComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  disabled?: boolean;
  loading?: boolean;
  inputClassName: string;
  emptyMessage: string;
  searchPlaceholder: string;
  "aria-invalid"?: boolean;
};

export function SearchableCombobox({
  id,
  options,
  value,
  onChange,
  onBlur,
  disabled = false,
  loading = false,
  inputClassName,
  emptyMessage,
  searchPlaceholder,
  "aria-invalid": ariaInvalid,
}: SearchableComboboxProps) {
  const listId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const isDisabled = disabled || loading || options.length === 0;
  const q = query.trim().toLowerCase();
  const filtered =
    q === ""
      ? options
      : options.filter((o) => o.title.toLowerCase().includes(q));

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
  }, []);

  const selectOption = useCallback(
    (title: string) => {
      onChange(title);
      close();
      onBlur();
    },
    [onChange, onBlur, close],
  );

  useEffect(() => {
    if (!open) return;
    function onDocMouseDown(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        close();
      }
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [open, close]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  const displayValue = open ? query : value;

  const inputClassTrimmed = inputClassName
    .replace(/\s*mt-1\.5\s*/g, " ")
    .trim();

  return (
    <div ref={containerRef} className="relative">
      <div className="relative mt-1.5">
        <input
          id={id}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-invalid={ariaInvalid}
          autoComplete="off"
          disabled={isDisabled}
          placeholder={
            loading
              ? "Loading…"
              : options.length === 0
                ? emptyMessage
                : searchPlaceholder
          }
          className={`${inputClassTrimmed} pr-10`}
          value={displayValue}
          onChange={(e) => {
            setOpen(true);
            setQuery(e.target.value);
          }}
          onFocus={() => {
            if (isDisabled) return;
            setOpen(true);
            setQuery("");
          }}
          onBlur={() => {
            close();
            onBlur();
          }}
        />
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-500 dark:text-slate-400"
          aria-hidden
        />
      </div>
      {open && !isDisabled && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 text-sm shadow-lg dark:border-slate-600 dark:bg-slate-950"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-slate-500 dark:text-slate-400">
              No matches
            </li>
          ) : (
            filtered.map((o) => (
              <li
                key={o.id}
                role="option"
                aria-selected={value === o.title}
                className="cursor-pointer px-3 py-2 text-slate-900 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800"
                onMouseDown={(e) => {
                  e.preventDefault();
                  selectOption(o.title);
                }}
              >
                {o.title}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
