import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { SYSTEM_PROMPT } from "./prompts";

type AIProvider = "gemini" | "claude-sonnet" | "claude-haiku";

function getModel(provider: AIProvider) {
  switch (provider) {
    case "gemini":
      return google("gemini-2.0-flash");
    case "claude-sonnet":
      return anthropic("claude-sonnet-4-5-20250514");
    case "claude-haiku":
      return anthropic("claude-haiku-4-5-20250514");
  }
}

function getMaxTokens(provider: AIProvider) {
  return provider === "claude-haiku" ? 4000 : 8000;
}

export interface GenerateResult {
  html: string;
  provider: AIProvider;
  tokensUsed: { input: number; output: number };
}

function extractHtml(text: string): string {
  const match = text.match(/```html\n([\s\S]*?)\n```/);
  if (match) return match[1];
  return text;
}

function validateHtml(html: string): boolean {
  return (
    html.includes("<html") ||
    html.includes("<!DOCTYPE") ||
    html.includes("<body")
  );
}

export async function generateWebsite(
  userPrompt: string,
  provider: AIProvider = "gemini"
): Promise<GenerateResult> {
  try {
    const result = await generateText({
      model: getModel(provider),
      maxTokens: getMaxTokens(provider),
      system: SYSTEM_PROMPT,
      prompt: userPrompt,
    });

    const html = extractHtml(result.text);

    if (!validateHtml(html)) {
      throw new Error("AI output is not valid HTML");
    }

    return {
      html,
      provider,
      tokensUsed: {
        input: result.usage?.promptTokens || 0,
        output: result.usage?.completionTokens || 0,
      },
    };
  } catch (error) {
    if (provider === "gemini") {
      console.warn("Gemini failed, falling back to Claude Haiku");
      return generateWebsite(userPrompt, "claude-haiku");
    }
    if (provider === "claude-haiku") {
      console.warn("Claude Haiku failed, falling back to Claude Sonnet");
      return generateWebsite(userPrompt, "claude-sonnet");
    }
    throw error;
  }
}

export async function editWebsite(
  currentHtml: string,
  editPrompt: string,
  provider: AIProvider = "claude-haiku"
): Promise<GenerateResult> {
  const result = await generateText({
    model: getModel(provider),
    maxTokens: getMaxTokens(provider),
    system: "You are a website editor. Receive existing HTML and an edit instruction. Apply the edit and return ONLY the complete updated HTML.",
    prompt: `Current HTML:\n${currentHtml}\n\nEdit: ${editPrompt}`,
  });

  const html = extractHtml(result.text);

  return {
    html,
    provider,
    tokensUsed: {
      input: result.usage?.promptTokens || 0,
      output: result.usage?.completionTokens || 0,
    },
  };
}
