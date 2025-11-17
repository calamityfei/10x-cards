import type { FlashcardCandidateDto, GenerationMetadataDto } from "../../types";
import type { GenerationOptions, OpenRouterResponse, ResponseFormat } from "./openrouter.types";
import { OpenRouterError } from "./openrouter.types";
import { OpenRouterFlashcardResponseSchema } from "../validation/openrouter.schemas";

export interface GenerationServiceResult {
  candidates: FlashcardCandidateDto[];
  metadata: GenerationMetadataDto;
}

/**
 * Service for generating flashcards using OpenRouter AI API.
 * Handles API communication, response validation, and error handling.
 */
export class OpenRouterService {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly defaultModel = "openai/gpt-4o-mini";

  /**
   * Creates a new OpenRouterService instance.
   * @param apiKey - OpenRouter API key (required)
   * @param baseUrl - OpenRouter API base URL (defaults to https://openrouter.ai/api/v1)
   * @throws {Error} If API key is empty or invalid
   */
  constructor(apiKey: string, baseUrl = "https://openrouter.ai/api/v1") {
    if (!apiKey || apiKey.trim() === "") {
      throw new Error("OpenRouter API key is required");
    }
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  private buildSystemMessage(): string {
    return `You are an expert educational content creator specializing in flashcard generation.
Your task is to analyze the provided text and create high-quality flashcards that:
- Focus on key concepts, definitions, and important facts
- Use clear, concise language
- Create questions that test understanding, not just memorization
- Ensure the answer is directly supported by the source text
- Avoid creating irrelevant, off-topic and duplicated flashcards

IMPORTANT CONSTRAINTS:
- The flashcards must be generated from the provided text only
- Each flashcard front (question) must be 1-200 characters
- Each flashcard back (answer) must be 1-500 characters
- Keep questions and answers concise and focused
- Generated text should be in the same language as the source text.
`;
  }

  private buildUserMessage(sourceText: string, maxCards: number): string {
    return `Generate up to ${maxCards} flashcards from the following text:

---
${sourceText}
---

Create flashcards that cover the most important concepts and information.

Remember:
- Front (question): maximum 200 characters
- Back (answer): maximum 500 characters
- Generate no more than ${maxCards} flashcards`;
  }

  private buildResponseFormat(): ResponseFormat {
    return {
      type: "json_schema",
      json_schema: {
        name: "flashcard_generation",
        strict: true,
        schema: {
          type: "object",
          properties: {
            flashcards: {
              type: "array",
              maxItems: 50,
              items: {
                type: "object",
                properties: {
                  front: {
                    type: "string",
                    minLength: 1,
                    maxLength: 200,
                    description: "The question or prompt for the flashcard (1-200 characters)",
                  },
                  back: {
                    type: "string",
                    minLength: 1,
                    maxLength: 500,
                    description: "The answer or explanation for the flashcard (1-500 characters)",
                  },
                },
                required: ["front", "back"],
                additionalProperties: false,
              },
            },
          },
          required: ["flashcards"],
          additionalProperties: false,
        },
      },
    };
  }

  private async calculateMetadata(sourceText: string, model: string, duration: number): Promise<GenerationMetadataDto> {
    const encoder = new TextEncoder();
    const data = encoder.encode(sourceText);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const sourceTextHash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

    return {
      model_used: model,
      generation_duration_ms: duration,
      source_text_length: sourceText.length,
      source_text_hash: sourceTextHash,
    };
  }

  private async makeApiRequest(
    model: string,
    messages: { role: string; content: string }[],
    responseFormat: ResponseFormat,
    temperature: number
  ): Promise<OpenRouterResponse> {
    const url = `${this.baseUrl}/chat/completions`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          "X-Title": "10xCards",
        },
        body: JSON.stringify({
          model,
          messages,
          response_format: responseFormat,
          temperature,
          max_tokens: 4000,
        }),
      });

      if (!response.ok) {
        await this.handleApiError(response);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof OpenRouterError) {
        throw error;
      }
      throw new OpenRouterError(
        "Network error occurred while connecting to OpenRouter",
        "NETWORK_ERROR",
        undefined,
        error
      );
    }
  }

  private async handleApiError(response: Response): Promise<never> {
    let errorDetails: string | undefined;
    try {
      const fullError = await response.json();
      errorDetails = fullError.error?.message || fullError.message;

      // Log full error for debugging
      console.error("[OpenRouter] API Error:", {
        status: response.status,
        error: fullError,
        timestamp: new Date().toISOString(),
      });
    } catch {
      // Ignore JSON parse errors
    }

    switch (response.status) {
      case 401:
        throw new OpenRouterError(
          "Invalid API key. Please check your OpenRouter credentials.",
          "AUTH_ERROR",
          401,
          errorDetails
        );
      case 402:
        throw new OpenRouterError("OpenRouter account has insufficient credits.", "PAYMENT_ERROR", 402, errorDetails);
      case 429:
        throw new OpenRouterError(
          "Rate limit exceeded. Please try again later.",
          "RATE_LIMIT_ERROR",
          429,
          errorDetails
        );
      case 500:
      case 502:
      case 503:
        throw new OpenRouterError(
          "OpenRouter service is temporarily unavailable.",
          "SERVICE_ERROR",
          response.status,
          errorDetails
        );
      default:
        throw new OpenRouterError(
          `API request failed with status ${response.status}`,
          "API_ERROR",
          response.status,
          errorDetails
        );
    }
  }

  private parseAndValidateResponse(apiResponse: OpenRouterResponse): FlashcardCandidateDto[] {
    const content = apiResponse.choices[0]?.message?.content;

    if (!content) {
      throw new OpenRouterError("No content in API response", "INVALID_RESPONSE");
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch (error) {
      throw new OpenRouterError("Failed to parse API response as JSON", "PARSE_ERROR", undefined, error);
    }

    const validationResult = OpenRouterFlashcardResponseSchema.safeParse(parsed);

    if (!validationResult.success) {
      console.error("[OpenRouter] Schema validation failed:", {
        errors: validationResult.error.errors,
        parsed: JSON.stringify(parsed).substring(0, 500),
      });
      throw new OpenRouterError(
        "API response does not match expected schema",
        "VALIDATION_ERROR",
        undefined,
        validationResult.error
      );
    }

    return validationResult.data.flashcards.map((card) => ({
      front: card.front,
      back: card.back,
    }));
  }

  /**
   * Generates flashcard candidates from source text using AI.
   * @param sourceText - The source text to generate flashcards from (1,000-10,000 characters)
   * @param options - Optional generation configuration
   * @param options.model - AI model to use (defaults to google/gemini-2.0-flash-exp:free)
   * @param options.maxCards - Maximum number of cards to generate (defaults to 50)
   * @param options.temperature - Model temperature 0-1 (defaults to 0.7)
   * @returns Promise resolving to flashcard candidates and generation metadata
   * @throws {OpenRouterError} If validation fails, API request fails, or response is invalid
   */
  async generateFlashcards(sourceText: string, options?: GenerationOptions): Promise<GenerationServiceResult> {
    const startTime = Date.now();

    // Guard clauses - validate input first
    if (!sourceText || sourceText.trim().length === 0) {
      throw new OpenRouterError("Source text cannot be empty", "VALIDATION_ERROR");
    }

    if (sourceText.length < 1000) {
      throw new OpenRouterError("Source text must be at least 1,000 characters", "VALIDATION_ERROR");
    }

    if (sourceText.length > 10000) {
      throw new OpenRouterError("Source text cannot exceed 10,000 characters", "VALIDATION_ERROR");
    }

    // Set defaults
    const model = options?.model || this.defaultModel;
    const maxCards = options?.maxCards || 50;
    const temperature = options?.temperature || 0.7;

    // Build request components
    const systemMessage = this.buildSystemMessage();
    const userMessage = this.buildUserMessage(sourceText, maxCards);
    const responseFormat = this.buildResponseFormat();

    const messages = [
      { role: "system", content: systemMessage },
      { role: "user", content: userMessage },
    ];

    // Make API call
    const apiResponse = await this.makeApiRequest(model, messages, responseFormat, temperature);

    // Calculate metadata
    const duration = Date.now() - startTime;
    const metadata = await this.calculateMetadata(sourceText, model, duration);

    // Parse and validate
    const candidates = this.parseAndValidateResponse(apiResponse);

    return {
      candidates,
      metadata,
    };
  }
}

/**
 * Gets the OpenRouterService instance.
 * @param env - Optional runtime environment variables (for Cloudflare Workers)
 * @returns The OpenRouterService instance
 * @throws {Error} If OPENROUTER_API_KEY environment variable is not set
 */
export function getOpenRouterService(env?: { OPENROUTER_API_KEY?: string }): OpenRouterService {
  const apiKey = env?.OPENROUTER_API_KEY ?? import.meta.env?.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY environment variable is not set");
  }
  return new OpenRouterService(apiKey);
}
