import { Router, Request, Response } from "express";
import { fetchTranscript } from "../services/transcript";

const router = Router();

router.post("/", async (req: Request, res: Response): Promise<void> => {
  const { url } = req.body as { url?: string };

  if (!url || !url.trim()) {
    res.status(400).json({ error: "url is required" });
    return;
  }

  try {
    const transcript = await fetchTranscript(url.trim());
    res.json({ transcript });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch transcript";
    res.status(422).json({ error: message });
  }
});

export default router;
