import { useState, useEffect } from "react";
import { fetchTrendingHashtags, type TrendingHashtag } from "../api/trending";

export function useTrending() {
  const [hashtags, setHashtags] = useState<TrendingHashtag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrendingHashtags()
      .then(setHashtags)
      .catch(() => setHashtags([]))
      .finally(() => setLoading(false));
  }, []);

  return { hashtags, loading };
}
