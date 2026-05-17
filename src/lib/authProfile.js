import { supabase } from "./supabaseClient"

const usernameRegex = /^[a-zA-Z0-9_]+$/

export function getAuthRedirectUrl() {
  if (typeof window === "undefined") {
    return undefined
  }

  return window.location.origin
}

export function getProfileUsername(user, fallback = "Player") {
  const metadata = user?.user_metadata ?? {}
  const rawUsername =
    metadata.username ||
    metadata.preferred_username ||
    metadata.name ||
    user?.email?.split("@")[0] ||
    fallback

  return normalizeUsername(rawUsername, user?.id)
}

export async function ensureUserProfile(user, overrides = {}) {
  if (!user?.id) {
    return null
  }

  const profile = {
    id: user.id,
    username: normalizeUsername(overrides.username ?? getProfileUsername(user), user.id),
    email: overrides.email ?? user.email ?? "",
  }

  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id, username, email")
    .eq("id", user.id)
    .maybeSingle()

  if (existingProfile) {
    const updates = {
      username: existingProfile.username || profile.username,
      email: existingProfile.email || profile.email,
    }

    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id)
      .select("id, username, email")
      .single()

    if (error) {
      throw error
    }

    return data
  }

  const { data, error } = await insertProfile(profile)

  if (error?.code === "23505") {
    const fallbackProfile = {
      ...profile,
      username: normalizeUsername(`player_${user.id}`, user.id),
    }
    const fallbackResult = await insertProfile(fallbackProfile)

    if (fallbackResult.error) {
      throw fallbackResult.error
    }

    return fallbackResult.data
  }

  if (error) {
    throw error
  }

  return data
}

function insertProfile(profile) {
  return supabase
    .from("profiles")
    .insert([profile])
    .select("id, username, email")
    .single()
}

function normalizeUsername(value, userId = "") {
  const compactValue = String(value)
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_]/g, "")
    .slice(0, 16)

  if (compactValue.length >= 6 && usernameRegex.test(compactValue)) {
    return compactValue
  }

  const suffix = String(userId || crypto.randomUUID()).replace(/-/g, "").slice(0, 8)
  return `player_${suffix}`.slice(0, 16)
}
