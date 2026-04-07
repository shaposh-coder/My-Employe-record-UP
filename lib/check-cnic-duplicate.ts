import type { SupabaseClient } from "@supabase/supabase-js";

const DUPLICATE_MSG = "This CNIC number is already registered.";

/**
 * Returns true if another employee already uses the same CNIC (13 digits, ignoring formatting).
 * Prefer RPC `employee_cnic_is_taken` when migration is applied; falls back to exact / digits-only match.
 */
export async function isEmployeeCnicTaken(
  supabase: SupabaseClient,
  cnic: string,
  excludeEmployeeId?: string | null,
): Promise<boolean> {
  const trimmed = cnic.trim();
  const digitsOnly = trimmed.replace(/\D/g, "");

  const { data: rpcResult, error: rpcError } = await supabase.rpc(
    "employee_cnic_is_taken",
    {
      p_cnic: trimmed,
      p_exclude_id: excludeEmployeeId ?? null,
    },
  );

  if (!rpcError && typeof rpcResult === "boolean") {
    return rpcResult;
  }

  let q1 = supabase.from("employees").select("id").eq("cnic_no", trimmed).limit(1);
  if (excludeEmployeeId) q1 = q1.neq("id", excludeEmployeeId);
  const { data: rows1 } = await q1;
  if (rows1 && rows1.length > 0) return true;

  if (digitsOnly.length === 13) {
    let q2 = supabase
      .from("employees")
      .select("id")
      .eq("cnic_no", digitsOnly)
      .limit(1);
    if (excludeEmployeeId) q2 = q2.neq("id", excludeEmployeeId);
    const { data: rows2 } = await q2;
    if (rows2 && rows2.length > 0) return true;
  }

  return false;
}

export { DUPLICATE_MSG };
