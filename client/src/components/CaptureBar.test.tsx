// Feature: idea-vault-and-hook-engine, Property 10: CaptureBar Enter Submits, Shift+Enter Inserts Newline
// Feature: idea-vault-and-hook-engine, Property 11: CaptureBar Rejects Empty Submission

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, fireEvent, screen } from "@testing-library/react";
import * as fc from "fast-check";
import { CaptureBar } from "./CaptureBar";

// Mock Web Speech API
beforeEach(() => {
  Object.defineProperty(window, "SpeechRecognition", {
    writable: true,
    value: undefined,
  });
  Object.defineProperty(window, "webkitSpeechRecognition", {
    writable: true,
    value: undefined,
  });

  // Mock navigator.clipboard
  Object.defineProperty(navigator, "clipboard", {
    writable: true,
    value: {
      readText: vi.fn().mockResolvedValue(""),
    },
  });
});

describe("CaptureBar — P10: Enter submits, Shift+Enter inserts newline", () => {
  it("pressing Enter on a non-empty value calls onSubmit", async () => {
    await fc.assert(
      fc.asyncProperty(fc.string({ minLength: 1 }), async (value) => {
        const onSubmit = vi.fn().mockResolvedValue(undefined);
        const { unmount } = render(<CaptureBar onSubmit={onSubmit} />);

        const textarea = screen.getByPlaceholderText("What's the idea?") as HTMLTextAreaElement;

        // Set the textarea value
        fireEvent.change(textarea, { target: { value } });

        // Press Enter (no Shift)
        fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });

        expect(onSubmit).toHaveBeenCalledWith(value.trim());

        unmount();
      }),
      { numRuns: 100 }
    );
  });

  it("pressing Shift+Enter does NOT call onSubmit", async () => {
    await fc.assert(
      fc.asyncProperty(fc.string({ minLength: 1 }), async (value) => {
        const onSubmit = vi.fn().mockResolvedValue(undefined);
        const { unmount } = render(<CaptureBar onSubmit={onSubmit} />);

        const textarea = screen.getByPlaceholderText("What's the idea?") as HTMLTextAreaElement;

        fireEvent.change(textarea, { target: { value } });

        // Press Shift+Enter
        fireEvent.keyDown(textarea, { key: "Enter", shiftKey: true });

        expect(onSubmit).not.toHaveBeenCalled();

        unmount();
      }),
      { numRuns: 100 }
    );
  });
});

describe("CaptureBar — P11: Rejects empty/whitespace submission", () => {
  it("does not call onSubmit for whitespace-only strings", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string().filter((s) => s.trim() === ""),
        async (value) => {
          const onSubmit = vi.fn().mockResolvedValue(undefined);
          const { unmount } = render(<CaptureBar onSubmit={onSubmit} />);

          const textarea = screen.getByPlaceholderText("What's the idea?") as HTMLTextAreaElement;

          fireEvent.change(textarea, { target: { value } });

          // Try submitting via Enter
          fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });

          expect(onSubmit).not.toHaveBeenCalled();

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it("does not call onSubmit when clicking Save idea with whitespace-only text", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string().filter((s) => s.trim() === ""),
        async (value) => {
          const onSubmit = vi.fn().mockResolvedValue(undefined);
          const { unmount } = render(<CaptureBar onSubmit={onSubmit} />);

          const textarea = screen.getByPlaceholderText("What's the idea?") as HTMLTextAreaElement;
          fireEvent.change(textarea, { target: { value } });

          const saveBtn = screen.getByLabelText("Save idea");
          fireEvent.click(saveBtn);

          expect(onSubmit).not.toHaveBeenCalled();

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });
});
