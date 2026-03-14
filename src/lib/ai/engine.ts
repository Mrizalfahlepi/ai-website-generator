import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { SYSTEM_PROMPT, ENHANCE_PROMPT } from "./prompts";

type AIProvider = "gemini" | "claude-sonnet" | "claude-haiku";

function getModel(provider: AIProvider) {
  switch (provider) {
    case "gemini":
      return google("gemini-2.5-flash");
    case "claude-sonnet":
      return anthropic("claude-sonnet-4-5");
    case "claude-haiku":
      return anthropic("claude-haiku-4-5");
  }
}

function getMaxTokens(provider: AIProvider) {
  return provider === "claude-haiku" ? 4000 : 8000;
}

export interface GenerateResult {
  html: string;
  provider: AIProvider;
  tokensUsed: { input: number; output: number };
  enhancedPrompt?: string;
}

function extractHtml(text: string): string {
  const patterns = [
    /```html\s*\n([\s\S]*?)\n\s*```/,
    /```html\s*([\s\S]*?)```/,
    /```\s*\n([\s\S]*?)\n\s*```/,
    /```([\s\S]*?)```/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1] && (match[1].includes("<html") || match[1].includes("<!DOCTYPE") || match[1].includes("<body"))) {
      return match[1].trim();
    }
  }

  if (text.includes("<!DOCTYPE") || text.includes("<html")) {
    const start = text.indexOf("<!DOCTYPE") !== -1 ? text.indexOf("<!DOCTYPE") : text.indexOf("<html");
    const end = text.lastIndexOf("</html>");
    if (end !== -1) {
      return text.substring(start, end + 7).trim();
    }
    return text.substring(start).trim();
  }

  return text.trim();
}

function validateHtml(html: string): boolean {
  return html.includes("<") && html.includes(">") && html.length > 100;
}

async function enhancePrompt(userPrompt: string): Promise<string> {
  if (userPrompt.length > 100) {
    return userPrompt;
  }

  try {
    console.log("Enhancing short prompt:", userPrompt);
    const result = await generateText({
      model: google("gemini-2.5-flash"),
      maxTokens: 500,
      system: ENHANCE_PROMPT,
      prompt: userPrompt,
    });
    const enhanced = result.text.trim();
    console.log("Enhanced prompt:", enhanced);
    return enhanced;
  } catch (error) {
    console.warn("Prompt enhancement failed, using original:", error);
    return userPrompt;
  }
}

export async function generateWebsite(
  userPrompt: string,
  provider: AIProvider = "gemini"
): Promise<GenerateResult> {
  try {
    const finalPrompt = await enhancePrompt(userPrompt);
    console.log("Final prompt to AI:", finalPrompt.substring(0, 200));

    const result = await generateText({
      model: getModel(provider),
      maxTokens: getMaxTokens(provider),
      system: SYSTEM_PROMPT,
      prompt: finalPrompt,
    });

    console.log("Raw AI output length:", result.text.length);
    console.log("Raw AI output starts with:", result.text.substring(0, 100));

    const html = extractHtml(result.text);
    console.log("Extracted HTML length:", html.length);
    console.log("Extracted HTML starts with:", html.substring(0, 100));

    if (!validateHtml(html)) {
      console.error("HTML validation failed. First 200 chars:", html.substring(0, 200));
      throw new Error("AI output is not valid HTML");
    }

    return {
      html,
      provider,
      tokensUsed: {
        input: result.usage?.promptTokens || 0,
        output: result.usage?.completionTokens || 0,
      },
      enhancedPrompt: finalPrompt !== userPrompt ? finalPrompt : undefined,
    };
  } catch (error) {
    if (provider === "gemini") {
      console.warn("Gemini failed, falling back to Claude Haiku", error);
      return generateWebsite(userPrompt, "claude-haiku");
    }
    if (provider === "claude-haiku") {
      console.warn("Claude Haiku failed, falling back to Claude Sonnet", error);
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
