import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { UserAccessRole } from "@/lib/user-access";
import { normalizeUserAccessEmail } from "@/lib/user-access";

export async function getSessionAccessRole(): Promise<{
  role: UserAccessRole;
  email: string;
} | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    return null;
  }
  const email = normalizeUserAccessEmail(user.email);
  const { data } = await supabase
    .from("user_access")
    .select("access_role")
    .eq("email", email)
    .maybeSingle();

  if (!data?.access_role) {
    return null;
  }
  return { role: data.access_role as UserAccessRole, email };
}

export async function requireWriteDirectory() {
  const access = await getSessionAccessRole();
  if (!access || (access.role !== "admin" && access.role !== "manager")) {
    redirect("/employees");
  }
}

export async function requireAdmin() {
  const access = await getSessionAccessRole();
  if (!access || access.role !== "admin") {
    redirect("/dashboard");
  }
}
