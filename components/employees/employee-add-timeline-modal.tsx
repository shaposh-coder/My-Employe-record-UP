"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarClock, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import {
  saveEmployeeTimelineEntry,
  type SaveTimelinePayload,
} from "@/lib/actions/employee-timeline-data";

function localDateInputValue(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const inputClass =
  "mt-1.5 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-slate-500 dark:focus:ring-slate-400/20";

const labelClass =
  "block text-sm font-medium text-slate-800 dark:text-slate-200";

const sectionClass = "rounded-xl border border-slate-200/90 bg-slate-50/50 p-4 dark:border-slate-700/80 dark:bg-slate-900/40";

type YesNo = "" | "yes" | "no";

export function EmployeeAddTimelineModal({
  open,
  onClose,
  employeeId,
  employeeName,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  employeeId: string;
  employeeName: string;
  /** Called after a successful save (e.g. refresh Timeline tab). */
  onSaved?: () => void;
}) {
  const titleId = useId();

  const [entryDate, setEntryDate] = useState(localDateInputValue);
  const [saving, setSaving] = useState(false);
  const [punctuality, setPunctuality] = useState<YesNo>("");
  const [punctualityComment, setPunctualityComment] = useState("");
  const [behaviour, setBehaviour] = useState<"" | "professional" | "non-professional">("");
  const [behaviourComment, setBehaviourComment] = useState("");
  const [honesty, setHonesty] = useState<YesNo>("");
  const [honestyComment, setHonestyComment] = useState("");
  const [criminalRecord, setCriminalRecord] = useState<YesNo>("");
  const [criminalRecordComment, setCriminalRecordComment] = useState("");
  const [dressingComment, setDressingComment] = useState("");
  const [effort, setEffort] = useState<"" | "hard-work" | "inactive">("");
  const [effortComment, setEffortComment] = useState("");
  const [others, setOthers] = useState("");

  useEffect(() => {
    if (!open) {
      setEntryDate(localDateInputValue());
      setSaving(false);
      setPunctuality("");
      setPunctualityComment("");
      setBehaviour("");
      setBehaviourComment("");
      setHonesty("");
      setHonestyComment("");
      setCriminalRecord("");
      setCriminalRecordComment("");
      setDressingComment("");
      setEffort("");
      setEffortComment("");
      setOthers("");
      return;
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const payload: SaveTimelinePayload = {
      entryDate,
      punctuality,
      punctualityComment,
      behaviour,
      behaviourComment,
      honesty,
      honestyComment,
      criminalRecord,
      criminalRecordComment,
      dressingComment,
      effort,
      effortComment,
      others,
    };
    setSaving(true);
    const { error } = await saveEmployeeTimelineEntry(employeeId, payload);
    setSaving(false);
    if (error) {
      toast.error("Could not save timeline", { description: error });
      return;
    }
    toast.success("Timeline entry saved");
    onSaved?.();
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent<{ employeeId: string }>("employee-timeline-saved", {
          detail: { employeeId },
        }),
      );
    }
    onClose();
  }

  if (!open) return null;

  const radioWrap =
    "inline-flex items-center gap-4 rounded-lg border border-slate-200/80 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-950";

  /** Portaled to `document.body` so sticky table cells / stacking contexts cannot paint above the overlay. */
  const modalUi = (
    <div className="fixed inset-0 z-[400] flex items-center justify-center px-4 py-8 sm:px-6">
      {/* Backdrop blocks clicks; dismiss via Cancel / X, or Save after a successful save. */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px] dark:bg-black/60"
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex max-h-[min(92vh,40rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white shadow-md">
              <CalendarClock className="h-5 w-5" strokeWidth={2} aria-hidden />
            </div>
            <div className="min-w-0">
              <h2
                id={titleId}
                className="text-lg font-semibold text-slate-900 dark:text-slate-100"
              >
                Add timeline
              </h2>
              <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                {employeeName || "Employee"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>

        <form
          onSubmit={handleSave}
          className="min-h-0 flex-1 overflow-y-auto px-5 py-4"
        >
          <div className="space-y-5">
            <div>
              <label htmlFor={`entry-date-${employeeId}`} className={labelClass}>
                Timeline date
              </label>
              <input
                id={`entry-date-${employeeId}`}
                type="date"
                required
                className={inputClass}
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
              />
              <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                Entry is stored for this date; newest entries appear first in the
                Timeline tab.
              </p>
            </div>

            <div className={sectionClass}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className={labelClass}>Punctuality</span>
                <div className={radioWrap} role="group" aria-label="Punctuality">
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <input
                      type="radio"
                      name={`punctuality-${employeeId}`}
                      className="h-4 w-4 border-slate-300 text-violet-600 focus:ring-violet-500"
                      checked={punctuality === "yes"}
                      onChange={() => setPunctuality("yes")}
                    />
                    Yes
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <input
                      type="radio"
                      name={`punctuality-${employeeId}`}
                      className="h-4 w-4 border-slate-300 text-violet-600 focus:ring-violet-500"
                      checked={punctuality === "no"}
                      onChange={() => setPunctuality("no")}
                    />
                    No
                  </label>
                </div>
              </div>
              <textarea
                id={`pc-${employeeId}`}
                rows={2}
                className={`${inputClass} mt-3 resize-y`}
                value={punctualityComment}
                onChange={(e) => setPunctualityComment(e.target.value)}
                placeholder="Add a comment…"
                aria-label="Punctuality comment"
              />
            </div>

            <div className={sectionClass}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className={labelClass}>Behaviour</span>
                <div className={radioWrap} role="group" aria-label="Behaviour">
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <input
                      type="radio"
                      name={`behaviour-${employeeId}`}
                      className="h-4 w-4 border-slate-300 text-violet-600 focus:ring-violet-500"
                      checked={behaviour === "professional"}
                      onChange={() => setBehaviour("professional")}
                    />
                    Professional
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <input
                      type="radio"
                      name={`behaviour-${employeeId}`}
                      className="h-4 w-4 border-slate-300 text-violet-600 focus:ring-violet-500"
                      checked={behaviour === "non-professional"}
                      onChange={() => setBehaviour("non-professional")}
                    />
                    Non-Professional
                  </label>
                </div>
              </div>
              <textarea
                id={`bc-${employeeId}`}
                rows={2}
                className={`${inputClass} mt-3 resize-y`}
                value={behaviourComment}
                onChange={(e) => setBehaviourComment(e.target.value)}
                placeholder="Add a comment…"
                aria-label="Behaviour comment"
              />
            </div>

            <div className={sectionClass}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className={labelClass}>Honesty</span>
                <div className={radioWrap} role="group" aria-label="Honesty">
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <input
                      type="radio"
                      name={`honesty-${employeeId}`}
                      className="h-4 w-4 border-slate-300 text-violet-600 focus:ring-violet-500"
                      checked={honesty === "yes"}
                      onChange={() => setHonesty("yes")}
                    />
                    Yes
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <input
                      type="radio"
                      name={`honesty-${employeeId}`}
                      className="h-4 w-4 border-slate-300 text-violet-600 focus:ring-violet-500"
                      checked={honesty === "no"}
                      onChange={() => setHonesty("no")}
                    />
                    No
                  </label>
                </div>
              </div>
              <textarea
                id={`honesty-c-${employeeId}`}
                rows={2}
                className={`${inputClass} mt-3 resize-y`}
                value={honestyComment}
                onChange={(e) => setHonestyComment(e.target.value)}
                placeholder="Add a comment…"
                aria-label="Honesty comment"
              />
            </div>

            <div className={sectionClass}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className={labelClass}>Criminal / Misconduct record</span>
                <div
                  className={radioWrap}
                  role="group"
                  aria-label="Criminal or misconduct record"
                >
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <input
                      type="radio"
                      name={`criminal-${employeeId}`}
                      className="h-4 w-4 border-slate-300 text-violet-600 focus:ring-violet-500"
                      checked={criminalRecord === "yes"}
                      onChange={() => setCriminalRecord("yes")}
                    />
                    Yes
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <input
                      type="radio"
                      name={`criminal-${employeeId}`}
                      className="h-4 w-4 border-slate-300 text-violet-600 focus:ring-violet-500"
                      checked={criminalRecord === "no"}
                      onChange={() => setCriminalRecord("no")}
                    />
                    No
                  </label>
                </div>
              </div>
              <textarea
                id={`criminal-c-${employeeId}`}
                rows={2}
                className={`${inputClass} mt-3 resize-y`}
                value={criminalRecordComment}
                onChange={(e) => setCriminalRecordComment(e.target.value)}
                placeholder="Add a comment…"
                aria-label="Criminal or misconduct comment"
              />
            </div>

            <div className={sectionClass}>
              <label htmlFor={`dress-${employeeId}`} className={labelClass}>
                Dressing / Appearance
              </label>
              <textarea
                id={`dress-${employeeId}`}
                rows={2}
                className={`${inputClass} resize-y`}
                value={dressingComment}
                onChange={(e) => setDressingComment(e.target.value)}
                placeholder="Comment on dressing / appearance…"
              />
            </div>

            <div className={sectionClass}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className={labelClass}>Effort / Work ethic</span>
                <div className={radioWrap} role="group" aria-label="Effort">
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <input
                      type="radio"
                      name={`effort-${employeeId}`}
                      className="h-4 w-4 border-slate-300 text-violet-600 focus:ring-violet-500"
                      checked={effort === "hard-work"}
                      onChange={() => setEffort("hard-work")}
                    />
                    Hard work
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <input
                      type="radio"
                      name={`effort-${employeeId}`}
                      className="h-4 w-4 border-slate-300 text-violet-600 focus:ring-violet-500"
                      checked={effort === "inactive"}
                      onChange={() => setEffort("inactive")}
                    />
                    Inactive
                  </label>
                </div>
              </div>
              <textarea
                id={`effort-c-${employeeId}`}
                rows={2}
                className={`${inputClass} mt-3 resize-y`}
                value={effortComment}
                onChange={(e) => setEffortComment(e.target.value)}
                placeholder="Add a comment…"
                aria-label="Effort or work ethic comment"
              />
            </div>

            <div className={sectionClass}>
              <label htmlFor={`others-${employeeId}`} className={labelClass}>
                Others
              </label>
              <textarea
                id={`others-${employeeId}`}
                rows={3}
                className={`${inputClass} resize-y`}
                value={others}
                onChange={(e) => setOthers(e.target.value)}
                placeholder="Anything else…"
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-w-[5rem] items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex min-w-[5rem] items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
            >
              {saving ? (
                <>
                  <Loader2
                    className="mr-2 h-4 w-4 shrink-0 animate-spin"
                    aria-hidden
                  />
                  Saving…
                </>
              ) : (
                "Save"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(modalUi, document.body);
}
