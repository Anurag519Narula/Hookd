import type { User } from "../types/index";
import { authHeaders } from "./auth";

export async function getMe(): Promise<User> {
  const res = await fetch("/api/users/me", {
    headers: { ...authHeaders() },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error ?? "Failed to fetch user");
  }
  return res.json() as Promise<User>;
}

export async function patchMe(data: Partial<User>): Promise<User> {
  const res = await fetch("/api/users/me", {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(data),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as { error?: string }).error ?? "Failed to update user");
  return body as User;
}

export async function deleteMe(): Promise<void> {
  const res = await fetch("/api/users/me", {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error ?? "Failed to delete user");
  }
}
