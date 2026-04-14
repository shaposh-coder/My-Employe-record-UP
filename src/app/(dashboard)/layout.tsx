import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { createClient } from "@/lib/supabase/server";
import { normalizeUserAccessEmail } from "@/lib/user-access";
import type { UserAccessRole } from "@/lib/user-access";

/**
 * Dashboard routes share one shell: sidebar and topbar live in `DashboardShell`
 * and are not part of the page segment, so they persist while nested routes
 * (e.g. employees/new) stream or show loading.tsx.
 *
 * Requires a valid session and a row in `user_access` for the same email.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect("/login");
  }

  const email = normalizeUserAccessEmail(user.email);
  const { data: access } = await supabase
    .from("user_access")
    .select("id, access_role, full_name, email, avatar_url, allowed_department")
    .eq("email", email)
    .maybeSingle();

  if (!access) {
    redirect("/login?error=noaccess");
  }

  const accessRole = access.access_role as UserAccessRole;
  const avatarRaw = access.avatar_url as string | null | undefined;
  const allowedRaw = access.allowed_department as string | null | undefined;
  const profile = {
    role: accessRole,
    email: access.email as string,
    fullName:
      String(access.full_name ?? "").trim() ||
      (email.split("@")[0] ?? "User"),
    avatarUrl:
      typeof avatarRaw === "string" && avatarRaw.trim() !== ""
        ? avatarRaw.trim()
        : null,
    userAccessId: access.id as string,
    allowedDepartment:
      accessRole === "admin"
        ? null
        : typeof allowedRaw === "string" && allowedRaw.trim() !== ""
          ? allowedRaw.trim()
          : null,
  };

  return (
    <DashboardShell profile={profile}>
      <div className="flex min-h-0 w-full flex-1 flex-col">{children}</div>
    </DashboardShell>
  );
}
