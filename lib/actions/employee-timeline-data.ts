"use server";

import { createClient } from "@/lib/supabase/server";

export type SaveTimelinePayload = {
  entryDate: string;
  punctuality: "" | "yes" | "no";
  punctualityComment: string;
  behaviour: "" | "professional" | "non-professional";
  behaviourComment: string;
  honesty: "" | "yes" | "no";
  honestyComment: string;
  criminalRecord: "" | "yes" | "no";
  criminalRecordComment: string;
  dressingComment: string;
  effort: "" | "hard-work" | "inactive";
  effortComment: string;
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
  honesty_comment: string | null;
  criminal_misconduct: string | null;
  criminal_misconduct_comment: string | null;
  dressing_appearance_comment: string | null;
  effort: string | null;
  effort_comment: string | null;
  others: string | null;
  /** Session email when the row was created (legacy rows may be null). */
  added_by_email: string | null;
  /** user_access.full_name at insert time; UI prefers this over email. */
  added_by_name: string | null;
  /** Set when the entry is edited; null if never updated after insert. */
  updated_by_email: string | null;
  /** user_access.full_name at last update time. */
  updated_by_name: string | null;
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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const addedBy =
    typeof user?.email === "string" && user.email.trim() !== ""
      ? user.email.trim().toLowerCase()
      : null;

  let addedByName: string | null = null;
  if (addedBy) {
    const { data: uaRow } = await supabase
      .from("user_access")
      .select("full_name")
      .ilike("email", addedBy)
      .maybeSingle();
    const raw = uaRow?.full_name;
    addedByName =
      typeof raw === "string" && raw.trim() !== "" ? raw.trim() : null;
  }

  const { error } = await supabase.from("employee_timeline_entries").insert({
    employee_id: employeeId,
    entry_date: d,
    added_by_email: addedBy,
    added_by_name: addedByName,
    punctuality: mapYesNo(payload.punctuality),
    punctuality_comment: payload.punctualityComment.trim(),
    behaviour: mapBehaviour(payload.behaviour),
    behaviour_comment: payload.behaviourComment.trim(),
    honesty: mapYesNo(payload.honesty),
    honesty_comment: payload.honestyComment.trim(),
    criminal_misconduct: mapYesNo(payload.criminalRecord),
    criminal_misconduct_comment: payload.criminalRecordComment.trim(),
    dressing_appearance_comment: payload.dressingComment.trim(),
    effort: mapEffort(payload.effort),
    effort_comment: payload.effortComment.trim(),
    others: payload.others.trim(),
  });

  return { error: error?.message ?? null };
}

export async function updateEmployeeTimelineEntry(
  employeeId: string,
  entryId: string,
  payload: SaveTimelinePayload,
): Promise<{ error: string | null }> {
  const d = payload.entryDate.trim();
  if (!DATE_RE.test(d)) {
    return { error: "Invalid timeline date." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const updatedBy =
    typeof user?.email === "string" && user.email.trim() !== ""
      ? user.email.trim().toLowerCase()
      : null;

  let updatedByName: string | null = null;
  if (updatedBy) {
    const { data: uaRow } = await supabase
      .from("user_access")
      .select("full_name")
      .ilike("email", updatedBy)
      .maybeSingle();
    const raw = uaRow?.full_name;
    updatedByName =
      typeof raw === "string" && raw.trim() !== "" ? raw.trim() : null;
  }

  const { error } = await supabase
    .from("employee_timeline_entries")
    .update({
      entry_date: d,
      punctuality: mapYesNo(payload.punctuality),
      punctuality_comment: payload.punctualityComment.trim(),
      behaviour: mapBehaviour(payload.behaviour),
      behaviour_comment: payload.behaviourComment.trim(),
      honesty: mapYesNo(payload.honesty),
      honesty_comment: payload.honestyComment.trim(),
      criminal_misconduct: mapYesNo(payload.criminalRecord),
      criminal_misconduct_comment: payload.criminalRecordComment.trim(),
      dressing_appearance_comment: payload.dressingComment.trim(),
      effort: mapEffort(payload.effort),
      effort_comment: payload.effortComment.trim(),
      others: payload.others.trim(),
      updated_by_email: updatedBy,
      updated_by_name: updatedByName,
    })
    .eq("id", entryId)
    .eq("employee_id", employeeId);

  return { error: error?.message ?? null };
}

export async function deleteEmployeeTimelineEntry(
  employeeId: string,
  entryId: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("employee_timeline_entries")
    .delete()
    .eq("id", entryId)
    .eq("employee_id", employeeId);

  return { error: error?.message ?? null };
}

export async function loadEmployeeTimelineEntries(employeeId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("employee_timeline_entries")
    .select(
      "id, employee_id, entry_date, created_at, added_by_email, added_by_name, updated_by_email, updated_by_name, punctuality, punctuality_comment, behaviour, behaviour_comment, honesty, honesty_comment, criminal_misconduct, criminal_misconduct_comment, dressing_appearance_comment, effort, effort_comment, others",
    )
    .eq("employee_id", employeeId)
    .order("entry_date", { ascending: false })
    .order("created_at", { ascending: false });

  return {
    data: (data as EmployeeTimelineEntryRow[] | null) ?? null,
    error: error?.message ?? null,
  };
}
