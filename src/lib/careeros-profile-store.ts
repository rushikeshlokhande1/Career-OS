"use client";

import { createSupabaseClient } from "@/lib/supabase/client";

export type CareerOSArtifactType = "resume" | "portfolio" | "readiness" | "github";

export type CareerOSArtifact = {
  id: string;
  type: CareerOSArtifactType;
  title: string;
  createdAt: string;
  summary: string;
  payload: unknown;
};

export type CareerOSProfile = {
  id: string;
  updatedAt: string;
  artifacts: CareerOSArtifact[];
};

const profileKey = "careeros.profile.v1";

function storageAvailable() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function loadCareerOSProfile(): CareerOSProfile {
  if (!storageAvailable()) return createEmptyProfile();
  try {
    const raw = window.localStorage.getItem(profileKey);
    if (!raw) return createEmptyProfile();
    const parsed = JSON.parse(raw) as CareerOSProfile;
    return {
      ...parsed,
      artifacts: Array.isArray(parsed.artifacts) ? parsed.artifacts : [],
    };
  } catch {
    return createEmptyProfile();
  }
}

export function saveCareerOSArtifact(artifact: Omit<CareerOSArtifact, "id" | "createdAt">) {
  const profile = loadCareerOSProfile();
  const nextArtifact: CareerOSArtifact = {
    ...artifact,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  const next: CareerOSProfile = {
    ...profile,
    updatedAt: nextArtifact.createdAt,
    artifacts: [nextArtifact, ...profile.artifacts].slice(0, 24),
  };
  persistLocalProfile(next);
  void syncCareerOSProfile(next);
  return next;
}

export function deleteCareerOSArtifact(id: string) {
  const profile = loadCareerOSProfile();
  const next: CareerOSProfile = {
    ...profile,
    updatedAt: new Date().toISOString(),
    artifacts: profile.artifacts.filter((artifact) => artifact.id !== id),
  };
  persistLocalProfile(next);
  void syncCareerOSProfile(next);
  return next;
}

export async function syncCareerOSProfile(profile = loadCareerOSProfile()) {
  const hasConfig = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  if (!hasConfig) return { status: "local" as const };

  try {
    const supabase = createSupabaseClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return { status: "local" as const };

    const { error } = await supabase.from("careeros_profiles").upsert({
      user_id: user.id,
      profile,
      updated_at: profile.updatedAt,
    });
    if (error) return { status: "error" as const, error: error.message };
    return { status: "synced" as const };
  } catch (error) {
    return { status: "error" as const, error: error instanceof Error ? error.message : "Sync failed" };
  }
}

function persistLocalProfile(profile: CareerOSProfile) {
  if (!storageAvailable()) return;
  try {
    window.localStorage.setItem(profileKey, JSON.stringify(profile));
  } catch {
    // Storage may be blocked by browser privacy settings.
  }
}

function createEmptyProfile(): CareerOSProfile {
  return {
    id: "local-careeros-profile",
    updatedAt: new Date().toISOString(),
    artifacts: [],
  };
}
