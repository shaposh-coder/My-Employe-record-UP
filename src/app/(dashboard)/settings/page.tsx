import { UsersAccessSettings } from "@/components/settings/users-access-settings";
import { createClient } from "@/lib/supabase/server";
import { fetchUserAccessRows } from "@/lib/user-access";

export default async function SettingsPage() {
  const supabase = await createClient();
  const directoryPrefetch = await fetchUserAccessRows(supabase);

  return (
    <div className="mx-auto w-full min-w-0 max-w-5xl">
      <UsersAccessSettings directoryPrefetch={directoryPrefetch} />
    </div>
  );
}
