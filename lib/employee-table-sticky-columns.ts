import type { EmployeeColumnId } from "@/lib/employee-table-columns";

/**
 * Frozen column pair (Image + Name) for horizontal scroll.
 * Image uses fixed width; Name uses `left-[4.5rem]` — keep both in sync.
 */
export function employeesTableStickyPairClasses(
  colId: EmployeeColumnId,
  colIndex: number,
  visibleIds: readonly EmployeeColumnId[],
  variant: "th" | "td",
): string {
  const imageFirst =
    visibleIds[0] === "image" && colIndex === 0 && colId === "image";
  const nameSecond =
    visibleIds[0] === "image" &&
    visibleIds[1] === "name" &&
    colIndex === 1 &&
    colId === "name";

  if (!imageFirst && !nameSecond) return "";

  const bg =
    variant === "th"
      ? "bg-slate-50/90 dark:bg-slate-950/80"
      : "bg-white dark:bg-slate-900";
  const z = variant === "th" ? "z-[20]" : "z-[2]";
  const edgeShadow =
    "shadow-[4px_0_14px_-6px_rgba(15,23,42,0.18)] dark:shadow-[4px_0_14px_-6px_rgba(0,0,0,0.5)]";

  if (imageFirst) {
    return [
      "sticky left-0 box-border",
      z,
      bg,
      edgeShadow,
      "w-[4.5rem] min-w-[4.5rem] max-w-[4.5rem]",
    ].join(" ");
  }

  return ["sticky left-[4.5rem]", z, bg, edgeShadow].join(" ");
}

/**
 * Frozen Action column on the right (last visible column when present).
 */
export function employeesTableStickyActionClasses(
  colId: EmployeeColumnId,
  colIndex: number,
  visibleIds: readonly EmployeeColumnId[],
  variant: "th" | "td",
): string {
  const last = visibleIds.length - 1;
  if (last < 0 || colId !== "action" || colIndex !== last) return "";

  const bg =
    variant === "th"
      ? "bg-slate-50/90 dark:bg-slate-950/80"
      : "bg-white dark:bg-slate-900";
  const z = variant === "th" ? "z-[30]" : "z-[3]";
  const edgeShadow =
    "shadow-[-4px_0_14px_-6px_rgba(15,23,42,0.18)] dark:shadow-[-4px_0_14px_-6px_rgba(0,0,0,0.5)]";

  return ["sticky right-0 box-border", z, bg, edgeShadow].join(" ");
}
