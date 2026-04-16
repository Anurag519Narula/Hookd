import { useState, useEffect, useCallback } from "react";
import type { User } from "../types/index";
import { getMe, patchMe } from "../api/users";

export interface UseCreatorProfileResult {
  profile: User | null;
  loading: boolean;
  error: string | null;
  updateProfile: (data: Partial<User>) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useCreatorProfile(): UseCreatorProfileResult {
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const user = await getMe();
      setProfile(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchProfile();
  }, [fetchProfile]);

  const updateProfile = useCallback(async (data: Partial<User>): Promise<void> => {
    setError(null);
    try {
      const updated = await patchMe(data);
      setProfile(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
      throw err;
    }
  }, []);

  const refresh = useCallback(async (): Promise<void> => {
    await fetchProfile();
  }, [fetchProfile]);

  return { profile, loading, error, updateProfile, refresh };
}
