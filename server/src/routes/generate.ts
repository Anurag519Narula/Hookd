import { Router, Request, Response } from "express";
import { generateSelected } from "../services/generator";
import type { GenerateRequest } from "../types/index";

const router = Router();

router.post("/", async (req: Request, res: Response): Promise<void> => {
  const { rawContent, platforms } = req.body as Partial<GenerateRequest>;

  if (!rawContent || !rawContent.trim()) {
    res.status(400).json({ error: "rawContent is required" });
    return;
  }

  if (!platforms || !Array.isArray(platforms) || platforms.length === 0) {
    res.status(400).json({ error: "platforms array is required and must not be empty" });
    return;
  }

  const result = await generateSelected(platforms, rawContent);
  res.json(result);
});

export default router;
