import { BASE_PATH, getAppPath } from "@/const/appConst";

/**
 * Resolves avatar image URLs safely across environments (local dev and subpath production).
 */
export function resolveAvatarUrl(avatarUrl: string | null | undefined): string {
  if (!avatarUrl || !avatarUrl.trim()) {
    return getAppPath("/avatar.png");
  }

  // Already a full external URL or data URI
  if (/^(?:https?:)?\/\//i.test(avatarUrl) || avatarUrl.startsWith("data:")) {
    return avatarUrl;
  }

  // If avatarUrl starts with '/api/static/' and app is deployed under a subpath
  if (avatarUrl.startsWith("/api/static/") && BASE_PATH !== "/") {
    return `${BASE_PATH}${avatarUrl}`;
  }

  return avatarUrl;
}
