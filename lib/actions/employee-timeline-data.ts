"use server";

import { createClient } from "@/lib/supabase/server";

export type SaveTimelinePayload = {
  entryDate: string;
  punctuality: "" | "yes" | "no";
  punctualityComment: string;
  behaviour: "" | "professional" | "non-professional";
  behaviourComment: string;
  honesty: "" | "yes" | "no";
  criminalRecord: "" | "yes" | "no";
  dressingComment: string;
  effort: "" | "hard-work" | "inactive";
  others: string;
};

export type EmployeeTimelineEntryRow = {
  id: string;
  employee_id: string;
  entry_date: string;
  created_at: string;
  punctuality: string | null;
  punctuality_comment: string | null;
  behaviour: string | null;
  behaviour_comment: string | null;
  honesty: string | null;
  criminal_misconduct: string | null;
  dressing_appearance_comment: string | null;
  effort: string | null;
  others: string | null;
};

function mapYesNo(v: "" | "yes" | "no"): string | null {
  return v === "" ? null : v;
}

function mapBehaviour(
  b: SaveTimelinePayload["behaviour"],
): string | null {
  if (b === "professional") return "professional";
  if (b === "non-professional") return "non_professional";
  return null;
}

function mapEffort(e: SaveTimelinePayload["effort"]): string | null {
  if (e === "hard-work") return "hard_work";
  if (e === "inactive") return "inactive";
  return null;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function saveEmployeeTimelineEntry(
  employeeId: string,
  payload: SaveTimelinePayload,
): Promise<{ error: string | null }> {
  const d = payload.entryDate.trim();
  if (!DATE_RE.test(d)) {
    return { error: "Invalid timeline date." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("employee_timeline_entries").insert({
    employee_id: employeeId,
    entry_date: d,
    punctuality: mapYesNo(payload.punctuality),
    punctuality_comment: payload.punctualityComment.trim(),
    behaviour: mapBehaviour(payload.behaviour),
    behaviour_comment: payload.behaviourComment.trim(),
    honesty: mapYesNo(payload.honesty),
    criminal_misconduct: mapYesNo(payload.criminalRecord),
    dressing_appearance_comment: payload.dressingComment.trim(),
    effort: mapEffort(payload.effort),
    others: payload.others.trim(),
  });

  return { error: error?.message ?? null };
}

export async function loadEmployeeTimelineEntries(employeeId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("employee_timeline_entries")
    .select(
      "id, employee_id, entry_date, created_at, punctuality, punctuality_comment, behaviour, behaviour_comment, honesty, criminal_misconduct, dressing_appearance_comment, effort, others",
    )
    .eq("employee_id", employeeId)
    .order("entry_date", { ascending: false })
    .order("created_at", { ascending: false });

  return {
    data: (data as EmployeeTimelineEntryRow[] | null) ?? null,
    error: error?.message ?? null,
  };
}
