"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { uploadEmployeeDocToFolder } from "@/lib/storage/upload-employee-doc";
import {
  USER_ACCESS_ROLE_LABELS,
  type UserAccessRole,
} from "@/lib/user-access";
import { useUserAccess } from "@/components/dashboard/user-access-context";
import { FileUploadField } from "@/components/employees/file-upload-field";

const inputClass =
  "mt-1.5 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-slate-500 dark:focus:ring-slate-400/20";

const labelClass =
  "block text-sm font-medium text-slate-800 dark:text-slate-200";

export function ProfileSettingsForm() {
  const router = useRouter();
  const ctx = useUserAccess();
  const { email, fullName: initialName, avatarUrl: initialAvatar, role } = ctx;

  const [fullName, setFullName] = useState(initialName);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatar);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const saveProfile = useCallback(async () => {
    setSavingProfile(true);
    const supabase = createClient();
    const { error } = await supabase.rpc("update_my_profile", {
      p_full_name: fullName.trim(),
      p_avatar_url: avatarUrl ?? "",
    });
    setSavingProfile(false);
    if (error) {
      toast.error("Could not save profile", { description: error.message });
      return;
    }
    toast.success("Profile updated");
    router.refresh();
  }, [fullName, avatarUrl, router]);

  const onAvatarFile = useCallback(
    async (file: File) => {
      setAvatarUploading(true);
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user?.id) {
          toast.error("Not signed in");
          return;
        }
        const folderPath = `user-avatars/${user.id}`;
        const url = await uploadEmployeeDocToFolder(supabase, file, folderPath);
        setAvatarUrl(url);
        const { error } = await supabase.rpc("update_my_profile", {
          p_full_name: fullName.trim(),
          p_avatar_url: url,
        });
        if (error) {
          toast.error("Could not save photo", { description: error.message });
          return;
        }
        toast.success("Profile photo saved");
        router.refresh();
      } catch (e) {
        toast.error(
          e instanceof Error ? e.message : "Upload failed",
        );
      } finally {
        setAvatarUploading(false);
      }
    },
    [fullName, router],
  );

  const clearAvatar = useCallback(async () => {
    setAvatarUrl(null);
    const supabase = createClient();
    const { error } = await supabase.rpc("update_my_profile", {
      p_full_name: fullName.trim(),
      p_avatar_url: "",
    });
    if (error) {
      toast.error("Could not remove photo", { description: error.message });
      return;
    }
    toast.success("Profile photo removed");
    router.refresh();
  }, [fullName, router]);

  const changePassword = useCallback(async () => {
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    setSavingPassword(true);
    const supabase = createClient();
    const { error: signErr } = await supabase.auth.signInWithPassword({
      email,
      password: oldPassword,
    });
    if (signErr) {
      setSavingPassword(false);
      toast.error("Current password is wrong", {
        description: signErr.message,
      });
      return;
    }
    const { error: updErr } = await supabase.auth.updateUser({
      password: newPassword,
    });
    setSavingPassword(false);
    if (updErr) {
      toast.error("Could not update password", { description: updErr.message });
      return;
    }
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    toast.success("Password updated");
  }, [email, oldPassword, newPassword, confirmPassword]);

  const roleLabel = USER_ACCESS_ROLE_LABELS[role as UserAccessRole];

  return (
    <div className="mx-auto w-full max-w-2xl space-y-10">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          Profile
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Your account details and security.
        </p>
      </div>

      <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm dark:border-slate-700/80 dark:bg-slate-900">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Account
        </h2>
        <div className="mt-4 space-y-4">
          <div>
            <span className={labelClass}>Email</span>
            <p className="mt-1.5 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5 font-mono text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
              {email}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Email cannot be changed here.
            </p>
          </div>
          <div>
            <span className={labelClass}>Access role</span>
            <p className="mt-1.5 text-sm text-slate-800 dark:text-slate-200">
              {roleLabel}
            </p>
          </div>
          <div>
            <label htmlFor="profile-full-name" className={labelClass}>
              Display name
            </label>
            <input
              id="profile-full-name"
              type="text"
              autoComplete="name"
              className={inputClass}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <FileUploadField
            id="profile-avatar"
            label="Profile photo"
            description="Optional — shown in the header. Square images work best."
            value={avatarUrl ?? undefined}
            uploading={avatarUploading}
            onFileSelect={onAvatarFile}
          />
          {avatarUrl ? (
            <button
              type="button"
              onClick={() => void clearAvatar()}
              className="text-sm font-medium text-slate-600 underline-offset-2 hover:underline dark:text-slate-400"
            >
              Remove photo
            </button>
          ) : null}
          <button
            type="button"
            disabled={savingProfile}
            onClick={() => void saveProfile()}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
          >
            {savingProfile ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : null}
            Save profile
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm dark:border-slate-700/80 dark:bg-slate-900">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Change password
        </h2>
        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="pw-old" className={labelClass}>
              Current password
            </label>
            <input
              id="pw-old"
              type="password"
              autoComplete="current-password"
              className={inputClass}
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="pw-new" className={labelClass}>
              New password
            </label>
            <input
              id="pw-new"
              type="password"
              autoComplete="new-password"
              className={inputClass}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={8}
            />
          </div>
          <div>
            <label htmlFor="pw-confirm" className={labelClass}>
              Confirm new password
            </label>
            <input
              id="pw-confirm"
              type="password"
              autoComplete="new-password"
              className={inputClass}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <button
            type="button"
            disabled={savingPassword}
            onClick={() => void changePassword()}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            {savingPassword ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : null}
            Update password
          </button>
        </div>
      </section>
    </div>
  );
}
