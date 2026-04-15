import { Router, Request, Response } from "express";
import { generateForPlatform } from "../services/generator";
import type { Platform, GenerateRequest } from "../types/index";

const VALID_PLATFORMS: Platform[] = ["instagram", "linkedin", "reels", "youtube_shorts"];

const router = Router();

router.post("/:platform", async (req: Request, res: Response): Promise<void> => {
  const { platform } = req.params;

  if (!VALID_PLATFORMS.includes(platform as Platform)) {
    res.status(400).json({ error: "Invalid platform" });
    return;
  }

  const { rawContent } = req.body as Partial<GenerateRequest>;

  if (!rawContent) {
    res.status(400).json({ error: "rawContent is required" });
    return;
  }

  const result = await generateForPlatform(platform as Platform, rawContent);
  res.json(result);
});

export default router;
