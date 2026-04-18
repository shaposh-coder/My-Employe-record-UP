"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarClock,
  ExternalLink,
  FileImage,
  Loader2,
  Pencil,
  Trash2,
  User,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  SOCIAL_LINK_KEYS,
  SOCIAL_PLATFORM_LABELS,
  type SocialLinkKey,
  type SocialLinksRecord,
} from "@/lib/social-links";
import { loadEmployeeFullForModal } from "@/lib/actions/employees-data";
import {
  deleteEmployeeTimelineEntry,
  loadEmployeeTimelineEntries,
  type EmployeeTimelineEntryRow,
} from "@/lib/actions/employee-timeline-data";
import { EmployeeAddTimelineModal } from "./employee-add-timeline-modal";
import type { EmployeeListRow } from "./employee-list-row";
import { SocialPlatformIcon } from "./social-platform-icons";

const TABS = [
  { id: "personal", label: "Personal" },
  { id: "work", label: "Work & education" },
  { id: "social", label: "Social & reference" },
  { id: "family", label: "Family" },
  { id: "documents", label: "Documents" },
  { id: "timeline", label: "Timeline" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function txt(v: unknown): string {
  if (v == null) return "";
  const s = String(v).trim();
  return s;
}

function dash(v: unknown): string {
  const s = txt(v);
  return s || "—";
}

function Field({
  label,
  value,
  mono,
}: {
  label: string;
  value: unknown;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </dt>
      <dd
        className={`mt-1 text-sm text-slate-900 dark:text-slate-100 ${mono ? "font-mono text-xs" : ""}`}
      >
        {dash(value)}
      </dd>
    </div>
  );
}

function DocumentCard({
  label,
  url,
  accent,
}: {
  label: string;
  url: unknown;
  accent: "indigo" | "amber";
}) {
  const u = txt(url);
  const ring =
    accent === "indigo"
      ? "ring-indigo-200/80 dark:ring-indigo-500/30"
      : "ring-amber-200/90 dark:ring-amber-500/25";
  const emptyBg =
    accent === "indigo"
      ? "bg-indigo-50/50 dark:bg-indigo-950/20"
      : "bg-amber-50/50 dark:bg-amber-950/20";

  return (
    <div
      className={`group flex flex-col overflow-hidden rounded-xl border border-slate-200/90 bg-white/90 shadow-sm transition hover:shadow-md dark:border-slate-700/90 dark:bg-slate-800/40 ${ring} ring-1`}
    >
      <p className="border-b border-slate-100 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:border-slate-700 dark:text-slate-300">
        {label}
      </p>
      <div className="flex min-h-[11rem] flex-1 items-center justify-center p-3">
        {u ? (
          <a
            href={u}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={u}
              alt=""
              className="mx-auto max-h-48 w-full rounded-lg object-contain transition group-hover:opacity-95"
            />
          </a>
        ) : (
          <div
            className={`flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-200 py-10 text-slate-400 dark:border-slate-600 ${emptyBg}`}
          >
            <FileImage className="h-8 w-8 opacity-50" strokeWidth={1.5} />
            <span className="text-xs font-medium">No file</span>
          </div>
        )}
      </div>
    </div>
  );
}

function fmtTimelineYesNo(v: string | null): string {
  if (v === "yes") return "Yes";
  if (v === "no") return "No";
  return "—";
}

function fmtTimelineBehaviour(v: string | null): string {
  if (v === "professional") return "Professional";
  if (v === "non_professional") return "Non-Professional";
  return "—";
}

function fmtTimelineEffort(v: string | null): string {
  if (v === "hard_work") return "Hard work";
  if (v === "inactive") return "Inactive";
  return "—";
}

function formatEntryDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-");
  if (!y || !m || !d) return isoDate;
  try {
    return new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString();
  } catch {
    return isoDate;
  }
}

/** Prefer saved full name; otherwise email (legacy rows). */
function timelineAddedByLabel(e: EmployeeTimelineEntryRow): string {
  const name = txt(e.added_by_name);
  if (name) return name;
  return txt(e.added_by_email);
}

/** Last editor after an update; empty if the entry was never edited. */
function timelineUpdatedByLabel(e: EmployeeTimelineEntryRow): string {
  const name = txt(e.updated_by_name);
  if (name) return name;
  return txt(e.updated_by_email);
}

/** Label left, main value (e.g. Yes/No / radio) right — same row (compact). */
function TimelineRowLabelValue({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5">
      <span className="min-w-0 text-xs font-medium text-slate-800 dark:text-slate-200">
        {label}
      </span>
      <span className="shrink-0 text-right text-xs font-semibold text-slate-900 dark:text-slate-100">
        {value}
      </span>
    </div>
  );
}

/** Shown only when `text` is non-empty (no separate “Comment” label). */
function TimelineCommentBlock({ text }: { text: string }) {
  return (
    <div className="mt-1 rounded-md border border-slate-100 bg-slate-50/90 px-2 py-1.5 dark:border-slate-600/60 dark:bg-slate-800/50">
      <p className="whitespace-pre-wrap text-xs leading-snug text-slate-800 dark:text-slate-100">
        {text}
      </p>
    </div>
  );
}

function timelineEntryHasContent(e: EmployeeTimelineEntryRow): boolean {
  if (e.punctuality != null) return true;
  if (txt(e.punctuality_comment)) return true;
  if (e.behaviour != null) return true;
  if (txt(e.behaviour_comment)) return true;
  if (e.honesty != null) return true;
  if (txt(e.honesty_comment)) return true;
  if (e.criminal_misconduct != null) return true;
  if (txt(e.criminal_misconduct_comment)) return true;
  if (txt(e.dressing_appearance_comment)) return true;
  if (e.effort != null) return true;
  if (txt(e.effort_comment)) return true;
  if (txt(e.others)) return true;
  return false;
}

function TimelineEntryCard({ e }: { e: EmployeeTimelineEntryRow }) {
  const pc = txt(e.punctuality_comment);
  const bc = txt(e.behaviour_comment);
  const hc = txt(e.honesty_comment);
  const crmc = txt(e.criminal_misconduct_comment);
  const dress = txt(e.dressing_appearance_comment);
  const effc = txt(e.effort_comment);
  const oth = txt(e.others);

  const hasMainPunctuality = e.punctuality != null;
  const hasMainBehaviour = e.behaviour != null;
  const hasMainHonesty = e.honesty != null;
  const hasMainCriminal = e.criminal_misconduct != null;
  const hasMainEffort = e.effort != null;

  const created = e.created_at
    ? new Date(e.created_at).toLocaleString()
    : "";
  const addedByWho = timelineAddedByLabel(e);

  const punctualitySection = hasMainPunctuality || pc;
  const behaviourSection = hasMainBehaviour || bc;
  const honestySection = hasMainHonesty || hc;
  const criminalSection = hasMainCriminal || crmc;
  const effortSection = hasMainEffort || effc;

  return (
    <article className="overflow-hidden rounded-xl border border-violet-200/80 bg-white/90 shadow-sm dark:border-violet-900/35 dark:bg-slate-900/50">
      <div className="border-b border-violet-100/90 bg-gradient-to-r from-violet-50/80 to-fuchsia-50/50 px-3 py-2 dark:border-violet-900/40 dark:from-violet-950/40 dark:to-slate-900/80">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {formatEntryDate(e.entry_date)}
            </h4>
            {created ? (
              <p className="shrink-0 text-right text-[10px] leading-snug text-slate-500 dark:text-slate-400">
                Saved {created}
              </p>
            ) : null}
          </div>
          {addedByWho ? (
            <p className="flex justify-end text-[11px] text-slate-500 dark:text-slate-400">
              Timeline added by{" "}
              <span className="ml-1 font-medium text-slate-700 dark:text-slate-300">
                {addedByWho}
              </span>
            </p>
          ) : null}
        </div>
      </div>
      {!timelineEntryHasContent(e) ? (
        <p className="px-3 py-2 text-xs text-slate-500 dark:text-slate-400">
          No fields filled for this entry.
        </p>
      ) : (
        <div className="flex flex-col gap-0 px-3 py-2">
          {punctualitySection ? (
            <div className="border-b border-slate-100 pb-2 dark:border-slate-700/80">
              <TimelineRowLabelValue
                label="Punctuality"
                value={
                  hasMainPunctuality
                    ? fmtTimelineYesNo(e.punctuality)
                    : "—"
                }
              />
              {pc ? <TimelineCommentBlock text={pc} /> : null}
            </div>
          ) : null}

          {behaviourSection ? (
            <div className="border-b border-slate-100 py-2 dark:border-slate-700/80">
              <TimelineRowLabelValue
                label="Behaviour"
                value={
                  hasMainBehaviour
                    ? fmtTimelineBehaviour(e.behaviour)
                    : "—"
                }
              />
              {bc ? <TimelineCommentBlock text={bc} /> : null}
            </div>
          ) : null}

          {honestySection ? (
            <div className="border-b border-slate-100 py-2 dark:border-slate-700/80">
              <TimelineRowLabelValue
                label="Honesty"
                value={
                  hasMainHonesty
                    ? fmtTimelineYesNo(e.honesty)
                    : "—"
                }
              />
              {hc ? <TimelineCommentBlock text={hc} /> : null}
            </div>
          ) : null}

          {criminalSection ? (
            <div className="border-b border-slate-100 py-2 dark:border-slate-700/80">
              <TimelineRowLabelValue
                label="Criminal / Misconduct"
                value={
                  hasMainCriminal
                    ? fmtTimelineYesNo(e.criminal_misconduct)
                    : "—"
                }
              />
              {crmc ? <TimelineCommentBlock text={crmc} /> : null}
            </div>
          ) : null}

          {dress ? (
            <div className="border-b border-slate-100 py-2 dark:border-slate-700/80">
              <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-0.5">
                <span className="min-w-0 shrink-0 text-xs font-medium text-slate-800 dark:text-slate-200">
                  Dressing / Appearance
                </span>
                <span className="min-w-0 max-w-[min(100%,28rem)] text-right text-xs font-medium text-slate-900 dark:text-slate-100">
                  <span className="whitespace-pre-wrap">{dress}</span>
                </span>
              </div>
            </div>
          ) : null}

          {effortSection ? (
            <div className="border-b border-slate-100 py-2 dark:border-slate-700/80">
              <TimelineRowLabelValue
                label="Effort / Work ethic"
                value={
                  hasMainEffort
                    ? fmtTimelineEffort(e.effort)
                    : "—"
                }
              />
              {effc ? <TimelineCommentBlock text={effc} /> : null}
            </div>
          ) : null}

          {oth ? (
            <div className="pt-0.5">
              <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                <span className="min-w-0 shrink-0 text-xs font-medium text-slate-800 dark:text-slate-200">
                  Others
                </span>
                <span className="min-w-0 max-w-[min(100%,28rem)] text-right text-xs font-medium text-slate-900 dark:text-slate-100">
                  <span className="whitespace-pre-wrap">{oth}</span>
                </span>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </article>
  );
}

function TimelineEntryListRow({
  e,
  onOpen,
  canEditTimeline,
  onEdit,
  onDelete,
}: {
  e: EmployeeTimelineEntryRow;
  onOpen: () => void;
  canEditTimeline: boolean;
  onEdit: (row: EmployeeTimelineEntryRow) => void;
  onDelete: (row: EmployeeTimelineEntryRow) => void;
}) {
  const who = timelineAddedByLabel(e);
  const updatedWho = timelineUpdatedByLabel(e);
  return (
    <div className="rounded-xl border border-violet-200/80 bg-white/90 shadow-sm dark:border-violet-900/35 dark:bg-slate-900/50">
      <div className="flex items-center justify-between gap-2 px-3 pt-2.5">
        <button
          type="button"
          onClick={onOpen}
          className="min-w-0 flex-1 text-left text-sm font-semibold text-slate-900 transition hover:text-violet-700 dark:text-slate-100 dark:hover:text-violet-300"
        >
          {formatEntryDate(e.entry_date)}
        </button>
        {canEditTimeline ? (
          <div className="flex shrink-0 items-center gap-0.5">
            <button
              type="button"
              className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              aria-label="Edit timeline"
              onClick={() => onEdit(e)}
            >
              <Pencil className="h-4 w-4" strokeWidth={2} aria-hidden />
            </button>
            <button
              type="button"
              className="rounded-lg p-1.5 text-slate-500 transition hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-950/40 dark:hover:text-red-400"
              aria-label="Delete timeline"
              onClick={() => onDelete(e)}
            >
              <Trash2 className="h-4 w-4" strokeWidth={2} aria-hidden />
            </button>
          </div>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onOpen}
        className="w-full px-3 pb-2.5 text-right text-[11px] text-slate-500 transition hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
      >
        <span className="block">
          Timeline added by{" "}
          <span className="font-medium text-slate-700 dark:text-slate-300">
            {who || "—"}
          </span>
        </span>
        {updatedWho ? (
          <span className="mt-1 block">
            Timeline updated by{" "}
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {updatedWho}
            </span>
          </span>
        ) : null}
      </button>
    </div>
  );
}

function parseOtherDocs(raw: unknown): { url: string; label: string }[] {
  if (!Array.isArray(raw)) return [];
  const out: { url: string; label: string }[] = [];
  for (const item of raw) {
    if (item && typeof item === "object" && "url" in item) {
      const url = String((item as { url: string }).url).trim();
      if (!url) continue;
      const label =
        typeof (item as { label?: string }).label === "string" &&
        (item as { label?: string }).label!.trim()
          ? (item as { label: string }).label!.trim()
          : "Document";
      out.push({ url, label });
    }
  }
  return out;
}

export function EmployeeDetailModal({
  employeeId,
  /** From directory table — shows immediately while full row (e.g. documents) loads. */
  initialListRow = null,
  onClose,
  /** When false, hide Edit (viewer / read-only). Default true for backward compatibility. */
  canEdit = true,
  /** When false, hide Timeline tab (no permission). Default true. */
  showTimelineTab = true,
  /** Edit/delete timeline entries (manager with timeline + admin). */
  canEditTimeline = false,
}: {
  employeeId: string | null;
  initialListRow?: EmployeeListRow | null;
  onClose: () => void;
  canEdit?: boolean;
  showTimelineTab?: boolean;
  canEditTimeline?: boolean;
}) {
  const detailTabs = useMemo(
    () =>
      showTimelineTab
        ? TABS
        : TABS.filter((t) => t.id !== "timeline"),
    [showTimelineTab],
  );
  const [activeTab, setActiveTab] = useState<TabId>("personal");
  const tabScrollRef = useRef<HTMLDivElement>(null);
  const [row, setRow] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timelineRows, setTimelineRows] = useState<EmployeeTimelineEntryRow[] | null>(
    null,
  );
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [timelineError, setTimelineError] = useState<string | null>(null);
  const [timelineRefresh, setTimelineRefresh] = useState(0);
  const [timelineDetailEntry, setTimelineDetailEntry] =
    useState<EmployeeTimelineEntryRow | null>(null);
  const [timelineEditEntry, setTimelineEditEntry] =
    useState<EmployeeTimelineEntryRow | null>(null);
  const timelineEditOpenRef = useRef(false);
  timelineEditOpenRef.current = timelineEditEntry !== null;
  const timelineDetailOpenRef = useRef(false);
  timelineDetailOpenRef.current = timelineDetailEntry !== null;
  /** Set in effect before fetch — if full load fails, keep table preview visible. */
  const hadListPreviewRef = useRef(false);

  const load = useCallback(async () => {
    if (!employeeId) return;
    const { data, error: err } = await loadEmployeeFullForModal(employeeId);
    setLoading(false);
    if (err || !data) {
      if (hadListPreviewRef.current) {
        setError(null);
        return;
      }
      setRow(null);
      setError(err ?? "Not found");
      return;
    }
    setError(null);
    setRow(data);
  }, [employeeId]);

  useEffect(() => {
    if (!employeeId) {
      setRow(null);
      setError(null);
      setLoading(false);
      setActiveTab("personal");
      hadListPreviewRef.current = false;
      setTimelineRows(null);
      setTimelineError(null);
      setTimelineDetailEntry(null);
      setTimelineEditEntry(null);
      return;
    }
    setTimelineRows(null);
    setTimelineError(null);
    setTimelineDetailEntry(null);
    setTimelineEditEntry(null);
    setActiveTab("personal");
    setError(null);
    const withPreview = initialListRow?.id === employeeId;
    hadListPreviewRef.current = withPreview;
    if (withPreview) {
      setRow(initialListRow as unknown as Record<string, unknown>);
      setLoading(false);
    } else {
      setRow(null);
      setLoading(true);
    }
    void load();
  }, [employeeId, initialListRow, load]);

  useEffect(() => {
    const el = tabScrollRef.current;
    if (el) el.scrollTop = 0;
  }, [activeTab]);

  useEffect(() => {
    if (!showTimelineTab && activeTab === "timeline") {
      setActiveTab("personal");
    }
  }, [showTimelineTab, activeTab]);

  useEffect(() => {
    if (activeTab !== "timeline" || !employeeId || !showTimelineTab) return;
    let cancelled = false;
    setTimelineLoading(true);
    setTimelineError(null);
    void loadEmployeeTimelineEntries(employeeId).then(({ data, error: err }) => {
      if (cancelled) return;
      setTimelineLoading(false);
      if (err) {
        setTimelineError(err);
        setTimelineRows(null);
        return;
      }
      setTimelineRows(data ?? []);
    });
    return () => {
      cancelled = true;
    };
  }, [activeTab, employeeId, timelineRefresh, showTimelineTab]);

  useEffect(() => {
    function onTimelineSaved(ev: Event) {
      const detail = (ev as CustomEvent<{ employeeId?: string }>).detail;
      if (detail?.employeeId === employeeId) {
        setTimelineRefresh((n) => n + 1);
      }
    }
    window.addEventListener("employee-timeline-saved", onTimelineSaved);
    return () =>
      window.removeEventListener("employee-timeline-saved", onTimelineSaved);
  }, [employeeId]);

  const handleDeleteTimelineEntry = useCallback(
    async (entry: EmployeeTimelineEntryRow) => {
      if (!employeeId) return;
      if (!window.confirm("Delete this timeline entry?")) return;
      const { error } = await deleteEmployeeTimelineEntry(
        employeeId,
        entry.id,
      );
      if (error) {
        toast.error(error);
        return;
      }
      toast.success("Timeline entry deleted");
      setTimelineRefresh((n) => n + 1);
      setTimelineDetailEntry((cur) =>
        cur?.id === entry.id ? null : cur,
      );
    },
    [employeeId],
  );

  useEffect(() => {
    if (!employeeId) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      if (timelineEditOpenRef.current) {
        setTimelineEditEntry(null);
        return;
      }
      if (timelineDetailOpenRef.current) {
        setTimelineDetailEntry(null);
        return;
      }
      onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [employeeId, onClose]);

  if (!employeeId) return null;

  const slRaw = row?.social_links as SocialLinksRecord | null | undefined;
  const sl =
    slRaw && typeof slRaw === "object" ? slRaw : ({} as SocialLinksRecord);
  const hasAnySocial = SOCIAL_LINK_KEYS.some((k) =>
    txt(sl[k]).length > 0,
  );
  const legacySocial = txt(row?.social_media_link);
  const fullName = txt(row?.full_name) || "Employee";
  const headerAvatarUrl = txt(row?.profile_image);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center px-4 py-8 sm:px-6 sm:py-12">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="employee-detail-title"
        className="relative z-10 flex h-[calc(100dvh-4rem)] min-h-0 w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl sm:h-[calc(100dvh-6rem)] dark:border-slate-700 dark:bg-slate-900"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
            <div
              className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-200/90 dark:bg-slate-800 dark:ring-slate-600"
              aria-hidden
            >
              {loading ? (
                <div className="h-full w-full animate-pulse bg-slate-200 dark:bg-slate-700" />
              ) : headerAvatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- Supabase public URL
                <img
                  src={headerAvatarUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-slate-400 dark:text-slate-500">
                  <User className="h-8 w-8" strokeWidth={1.5} />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <h2
                id="employee-detail-title"
                className="truncate text-lg font-semibold text-slate-900 dark:text-slate-100"
              >
                {loading ? "Loading…" : fullName}
              </h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Employee details
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {canEdit ? (
              <Link
                href={`/employees/${employeeId}/edit`}
                onClick={onClose}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <Pencil className="h-4 w-4" strokeWidth={2} aria-hidden />
                Edit
              </Link>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              aria-label="Close"
            >
              <X className="h-5 w-5" strokeWidth={2} />
            </button>
          </div>
        </div>

        <div
          role="tablist"
          aria-label="Detail sections"
          className="flex shrink-0 flex-wrap gap-1 border-b border-slate-100 bg-slate-50/90 px-2 py-2 dark:border-slate-800 dark:bg-slate-950/60"
        >
          {detailTabs.map((tab) => {
            const selected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setActiveTab(tab.id)}
                className={[
                  "rounded-lg px-3 py-2 text-sm font-medium transition sm:px-4",
                  selected
                    ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/80 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-600"
                    : "text-slate-600 hover:bg-white/80 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/80 dark:hover:text-slate-100",
                ].join(" ")}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div
          ref={tabScrollRef}
          className={
            activeTab === "timeline" && showTimelineTab
              ? "min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-3"
              : "min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-6"
          }
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
              <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
              <span className="text-sm">Loading details…</span>
            </div>
          ) : error ? (
            <p className="py-8 text-center text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          ) : !row ? (
            <p className="py-8 text-center text-sm text-slate-500">No data.</p>
          ) : (
            <>
              {activeTab === "personal" ? (
                <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
                  <Field label="Full name" value={row.full_name} />
                  <Field label="Status" value={row.status} />
                  <Field label="Father’s name" value={row.father_name} />
                  <Field label="Date of birth" value={row.dob} />
                  <Field label="CNIC / national ID" value={row.cnic_no} mono />
                  <Field label="SS / EOBI number" value={row.ss_eubi_no} />
                  <Field label="Basic salary" value={row.basic_salary} />
                  <Field label="Phone number" value={row.phone_no} />
                  <Field label="City" value={row.city} />
                  <Field label="Address" value={row.address} />
                </dl>
              ) : null}

              {activeTab === "work" ? (
                <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
                  <Field label="Department" value={row.department} />
                  <Field label="Section" value={row.section} />
                  <Field label="Date of joining" value={row.date_of_joining} />
                  <Field label="Date of resign" value={row.date_of_resign} />
                  <Field label="Designation" value={row.designation} />
                  <Field label="Education" value={row.education} />
                  <div className="sm:col-span-2">
                    <Field label="Experience" value={row.experience} />
                  </div>
                </dl>
              ) : null}

              {activeTab === "social" ? (
                <div className="space-y-6">
                  <Field label="Email address" value={row.email_address} />
                  <Field label="Reference" value={row.reference_info} />
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Social links
                    </dt>
                    <dd className="mt-3">
                      {hasAnySocial ? (
                        <ul className="flex flex-col gap-3">
                          {SOCIAL_LINK_KEYS.map((key) => {
                            const url = txt(sl[key]);
                            if (!url) return null;
                            return (
                              <li key={key}>
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 transition hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800"
                                >
                                  <SocialPlatformIcon platform={key as SocialLinkKey} />
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                      {SOCIAL_PLATFORM_LABELS[key]}
                                    </p>
                                    <p className="truncate text-sm text-slate-800 dark:text-slate-200">
                                      {url}
                                    </p>
                                  </div>
                                  <ExternalLink className="h-4 w-4 shrink-0 text-slate-400" />
                                </a>
                              </li>
                            );
                          })}
                        </ul>
                      ) : null}
                      {legacySocial ? (
                        <a
                          href={legacySocial}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex items-center gap-2 text-sm text-slate-800 underline dark:text-slate-200 ${hasAnySocial ? "mt-3" : ""}`}
                        >
                          Legacy social link
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      ) : null}
                      {!hasAnySocial && !legacySocial ? (
                        <p className="text-sm text-slate-400">—</p>
                      ) : null}
                    </dd>
                  </div>
                </div>
              ) : null}

              {activeTab === "family" ? (
                <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
                  <Field label="Family name" value={row.family_name} />
                  <Field label="Father name" value={row.family_father_name} />
                  <Field label="Father CNIC" value={row.family_cnic} mono />
                  <Field label="Father phone (main)" value={row.family_phone} />
                  <Field
                    label="Father phone (alternate)"
                    value={row.family_phone_alt}
                  />
                </dl>
              ) : null}

              {activeTab === "documents" ? (
                <div className="space-y-8">
                  <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-br from-indigo-50/90 via-white to-slate-50/80 shadow-sm dark:border-slate-700/80 dark:from-indigo-950/40 dark:via-slate-900 dark:to-slate-950/80">
                    <div className="flex items-center gap-3 border-b border-indigo-100/80 bg-white/60 px-4 py-3.5 dark:border-indigo-900/40 dark:bg-slate-900/40">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-500 text-white shadow-md shadow-indigo-500/25">
                        <User className="h-5 w-5" strokeWidth={2} />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                          Employee documents
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Profile photo, CNIC & extra uploads
                        </p>
                      </div>
                    </div>
                    <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
                      <DocumentCard
                        accent="indigo"
                        label="Profile photo"
                        url={row.profile_image}
                      />
                      <DocumentCard
                        accent="indigo"
                        label="CNIC — front"
                        url={row.cnic_front}
                      />
                      <DocumentCard
                        accent="indigo"
                        label="CNIC — back"
                        url={row.cnic_back}
                      />
                    </div>
                    <div className="border-t border-indigo-100/70 bg-white/40 px-4 py-4 dark:border-indigo-900/30 dark:bg-slate-900/30">
                      <h4 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-indigo-800 dark:text-indigo-200">
                        <FileImage className="h-3.5 w-3.5" />
                        Additional documents
                      </h4>
                      {parseOtherDocs(row.other_documents).length === 0 ? (
                        <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50/80 py-6 text-center text-sm text-slate-400 dark:border-slate-600 dark:bg-slate-800/40">
                          No additional files
                        </p>
                      ) : (
                        <ul className="grid gap-4 sm:grid-cols-2">
                          {parseOtherDocs(row.other_documents).map(
                            (doc, i) => (
                              <li
                                key={`${doc.url}-${i}`}
                                className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800/50"
                              >
                                <p className="border-b border-slate-100 px-3 py-2 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300">
                                  {doc.label}
                                </p>
                                <div className="p-3">
                                  <a
                                    href={doc.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block overflow-hidden rounded-lg ring-1 ring-indigo-200/60 dark:ring-indigo-500/20"
                                  >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={doc.url}
                                      alt=""
                                      className="mx-auto max-h-44 w-full object-contain"
                                    />
                                  </a>
                                </div>
                              </li>
                            ),
                          )}
                        </ul>
                      )}
                    </div>
                  </section>

                  <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-br from-amber-50/90 via-white to-orange-50/60 shadow-sm dark:border-slate-700/80 dark:from-amber-950/35 dark:via-slate-900 dark:to-slate-950/80">
                    <div className="flex items-center gap-3 border-b border-amber-100/80 bg-white/60 px-4 py-3.5 dark:border-amber-900/40 dark:bg-slate-900/40">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/30">
                        <Users className="h-5 w-5" strokeWidth={2} />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                          Family documents
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Father / guardian photos & CNIC
                        </p>
                      </div>
                    </div>
                    <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
                      <DocumentCard
                        accent="amber"
                        label="Father’s photo"
                        url={row.father_image}
                      />
                      <DocumentCard
                        accent="amber"
                        label="Father’s CNIC — front"
                        url={row.father_cnic_front}
                      />
                      <DocumentCard
                        accent="amber"
                        label="Father’s CNIC — back"
                        url={row.father_cnic_back}
                      />
                    </div>
                  </section>
                </div>
              ) : null}

              {activeTab === "timeline" && showTimelineTab ? (
                <div className="space-y-2">
                  {timelineLoading ? (
                    <div className="flex items-center justify-center gap-2 rounded-xl border border-violet-200/80 bg-violet-50/40 px-3 py-6 text-xs text-slate-600 dark:border-violet-900/40 dark:bg-violet-950/20 dark:text-slate-300">
                      <Loader2
                        className="h-4 w-4 shrink-0 animate-spin text-violet-600 dark:text-violet-400"
                        strokeWidth={2}
                        aria-hidden
                      />
                      Loading timeline…
                    </div>
                  ) : timelineError ? (
                    <div className="rounded-xl border border-amber-200/90 bg-amber-50/80 px-3 py-2.5 text-xs text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
                      {timelineError}
                    </div>
                  ) : !timelineRows || timelineRows.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-violet-200/90 bg-gradient-to-br from-violet-50/60 via-white to-slate-50/80 px-4 py-6 text-center dark:border-violet-900/40 dark:from-violet-950/25 dark:via-slate-900 dark:to-slate-950/80">
                      <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white shadow-md shadow-violet-500/20">
                        <CalendarClock
                          className="h-5 w-5"
                          strokeWidth={1.75}
                        />
                      </div>
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        No timeline entries yet
                      </h3>
                      <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">
                        Use <span className="font-medium">Add timeline</span>{" "}
                        from the directory row menu to record observations.
                        Newest entries appear here first.
                      </p>
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {timelineRows.map((entry) => (
                        <li key={entry.id}>
                          <TimelineEntryListRow
                            e={entry}
                            onOpen={() => setTimelineDetailEntry(entry)}
                            canEditTimeline={canEditTimeline}
                            onEdit={setTimelineEditEntry}
                            onDelete={handleDeleteTimelineEntry}
                          />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>

      {timelineDetailEntry ? (
        <div
          className="fixed inset-0 z-[125] flex items-center justify-center px-4 py-8 sm:px-6"
          role="presentation"
        >
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/55 backdrop-blur-[2px] dark:bg-black/65"
            aria-label="Close timeline details"
            onClick={() => setTimelineDetailEntry(null)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="timeline-detail-title"
            className="relative z-10 flex max-h-[min(88dvh,40rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900"
            onClick={(ev) => ev.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
              <h3
                id="timeline-detail-title"
                className="text-sm font-semibold text-slate-900 dark:text-slate-100"
              >
                Timeline details
              </h3>
              <button
                type="button"
                onClick={() => setTimelineDetailEntry(null)}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                aria-label="Close"
              >
                <X className="h-5 w-5" strokeWidth={2} />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">
              <TimelineEntryCard e={timelineDetailEntry} />
            </div>
          </div>
        </div>
      ) : null}

      {timelineEditEntry ? (
        <EmployeeAddTimelineModal
          open
          onClose={() => setTimelineEditEntry(null)}
          employeeId={employeeId}
          employeeName={fullName}
          editEntry={timelineEditEntry}
          onSaved={() => {
            setTimelineRefresh((n) => n + 1);
            setTimelineEditEntry(null);
          }}
        />
      ) : null}
    </div>
  );
}
