import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useCreatorProfile } from "./useCreatorProfile";
import type { User } from "../types/index";

// Mock the API module
vi.mock("../api/users", () => ({
  getMe: vi.fn(),
  patchMe: vi.fn(),
}));

import { getMe, patchMe } from "../api/users";

const mockUser: User = {
  id: "user-1",
  email: "test@example.com",
  name: "Test User",
  created_at: 1700000000,
  niche: "fitness",
  sub_niche: "strength training",
  language: "English",
  platform_priority: ["instagram", "linkedin", "reels", "youtube_shorts"],
  onboarding_complete: true,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useCreatorProfile", () => {
  it("fetches profile on mount and exposes it", async () => {
    vi.mocked(getMe).mockResolvedValue(mockUser);

    const { result } = renderHook(() => useCreatorProfile());

    expect(result.current.loading).toBe(true);
    expect(result.current.profile).toBeNull();

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.profile).toEqual(mockUser);
    expect(result.current.error).toBeNull();
  });

  it("sets error when getMe fails", async () => {
    vi.mocked(getMe).mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useCreatorProfile());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.profile).toBeNull();
    expect(result.current.error).toBe("Network error");
  });

  it("updateProfile calls patchMe and updates local state", async () => {
    vi.mocked(getMe).mockResolvedValue(mockUser);
    const updatedUser = { ...mockUser, niche: "nutrition" };
    vi.mocked(patchMe).mockResolvedValue(updatedUser);

    const { result } = renderHook(() => useCreatorProfile());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.updateProfile({ niche: "nutrition" });
    });

    expect(patchMe).toHaveBeenCalledWith({ niche: "nutrition" });
    expect(result.current.profile?.niche).toBe("nutrition");
  });

  it("updateProfile sets error and rethrows when patchMe fails", async () => {
    vi.mocked(getMe).mockResolvedValue(mockUser);
    vi.mocked(patchMe).mockRejectedValue(new Error("Save failed"));

    const { result } = renderHook(() => useCreatorProfile());
    await waitFor(() => expect(result.current.loading).toBe(false));

    let thrown: Error | undefined;
    await act(async () => {
      try {
        await result.current.updateProfile({ niche: "nutrition" });
      } catch (err) {
        thrown = err as Error;
      }
    });

    expect(thrown?.message).toBe("Save failed");
    expect(result.current.error).toBe("Save failed");
    // Profile should remain unchanged
    expect(result.current.profile).toEqual(mockUser);
  });

  it("refresh re-fetches the profile", async () => {
    const refreshedUser = { ...mockUser, name: "Updated Name" };
    vi.mocked(getMe)
      .mockResolvedValueOnce(mockUser)
      .mockResolvedValueOnce(refreshedUser);

    const { result } = renderHook(() => useCreatorProfile());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.profile?.name).toBe("Test User");

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.profile?.name).toBe("Updated Name");
    expect(getMe).toHaveBeenCalledTimes(2);
  });
});
