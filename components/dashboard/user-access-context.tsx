"use client";

import { createContext, useContext } from "react";
import type { UserAccessRole } from "@/lib/user-access";

export type UserAccessContextValue = {
  role: UserAccessRole;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  userAccessId: string;
  /** Department title scope — null = no restriction. */
  allowedDepartment: string | null;
};

const UserAccessContext = createContext<UserAccessContextValue | null>(null);

export function UserAccessProvider({
  profile,
  children,
}: {
  profile: UserAccessContextValue;
  children: React.ReactNode;
}) {
  return (
    <UserAccessContext.Provider value={profile}>
      {children}
    </UserAccessContext.Provider>
  );
}

export function useUserAccess(): UserAccessContextValue {
  const ctx = useContext(UserAccessContext);
  if (!ctx) {
    throw new Error("useUserAccess must be used within DashboardShell");
  }
  return ctx;
}

/** Safe variant for optional use outside provider (returns null). */
export function useUserAccessOptional(): UserAccessContextValue | null {
  return useContext(UserAccessContext);
}
