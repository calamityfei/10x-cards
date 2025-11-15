# OpenRouter Service Implementation Plan

## 1. Service Description

The OpenRouter service is responsible for communicating with the OpenRouter.ai API to generate flashcard candidates from user-provided source text. This service will replace the current mock implementation in `ai-generation.service.ts` and provide real AI-powered flashcard generation using various LLM models available through OpenRouter.

**Purpose:**

- Send source text to OpenRouter API with structured prompts
- Receive structured JSON responses containing flashcard candidates
- Handle API errors and rate limiting
- Track generation metadata (model used, duration, token usage)
- Ensure type-safe responses using Zod validation

**Location:** `src/lib/services/openrouter.service.ts`

---

## 2. Constructor Description

The service will be implemented as a class with a constructor that initializes the API configuration.

**Constructor Parameters:**

- `apiKey: string` - OpenRouter API key (from environment variables)
- `baseUrl?: string` - Optional base URL (defaults to `https://openrouter.ai/api/v1`)

**Constructor Responsibilities:**

1. Validate that the API key is provided and not empty
2. Store configuration for use in API calls
3. Initialize any default headers or request options

**Example:**

```typescript
constructor(apiKey: string, baseUrl = 'https://openrouter.ai/api/v1') {
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('OpenRouter API key is required');
  }
  this.apiKey = apiKey;
  this.baseUrl = baseUrl;
}
```

---

## 3. Public Methods and Fields

### 3.1 Public Method: `generateFlashcards`

**Signature:**

```typescript
async generateFlashcards(
  sourceText: string,
  options?: GenerationOptions
): Promise<GenerationServiceResult>
```

**Parameters:**

- `sourceText: string` - The user's input text (1,000-10,000 characters)
- `options?: GenerationOptions` - Optional configuration:
  - `model?: string` - Model to use (default: cost-effective model)
  - `maxCards?: number` - Maximum number of cards to generate (default: 50)
  - `temperature?: number` - Model temperature (default: 0.7)

**Returns:**

```typescript
interface GenerationServiceResult {
  candidates: FlashcardCandidateDto[];
  metadata: GenerationMetadataDto;
}
```

**Responsibilities:**

1. Validate input (text length, character limits)
2. Build the API request with system/user messages
3. Define response_format for structured JSON output
4. Make the API call
5. Validate and parse the response
6. Calculate metadata (duration, hash, etc.)
7. Handle errors gracefully

---

## 4. Private Methods and Fields

### 4.1 Private Fields

```typescript
private readonly apiKey: string;
private readonly baseUrl: string;
private readonly defaultModel = 'openai/gpt-3.5-turbo'; // Cost-effective default
```

### 4.2 Private Method: `buildSystemMessage`

**Purpose:** Constructs the system message that defines the AI's role and behavior.

**Signature:**

```typescript
private buildSystemMessage(): string
```

**Returns:** A string containing instructions for the AI model.

**Example Content:**

```
You are an expert educational content creator specializing in flashcard generation.
Your task is to analyze the provided text and create high-quality flashcards that:
- Focus on key concepts, definitions, and important facts
- Use clear, concise language
- Create questions that test understanding, not just memorization
- Ensure the answer is directly supported by the source text
```

### 4.3 Private Method: `buildUserMessage`

**Purpose:** Constructs the user message containing the source text and generation instructions.

**Signature:**

```typescript
private buildUserMessage(sourceText: string, maxCards: number): string
```

**Parameters:**

- `sourceText: string` - The user's input text
- `maxCards: number` - Maximum number of cards to generate

**Returns:** A formatted string with the source text and instructions.

**Example Content:**

```
Generate up to ${maxCards} flashcards from the following text:

---
${sourceText}
---

Create flashcards that cover the most important concepts and information.
```

### 4.4 Private Method: `buildResponseFormat`

**Purpose:** Defines the JSON schema for structured responses from the AI model.

**Signature:**

```typescript
private buildResponseFormat(): ResponseFormat
```

**Returns:**

```typescript
interface ResponseFormat {
  type: "json_schema";
  json_schema: {
    name: string;
    strict: true;
    schema: object;
  };
}
```

**Example Implementation:**

```typescript
private buildResponseFormat(): ResponseFormat {
  return {
    type: 'json_schema',
    json_schema: {
      name: 'flashcard_generation',
      strict: true,
      schema: {
        type: 'object',
        properties: {
          flashcards: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                front: {
                  type: 'string',
                  description: 'The question or prompt for the flashcard'
                },
                back: {
                  type: 'string',
                  description: 'The answer or explanation for the flashcard'
                }
              },
              required: ['front', 'back'],
              additionalProperties: false
            }
          }
        },
        required: ['flashcards'],
        additionalProperties: false
      }
    }
  };
}
```

### 4.5 Private Method: `makeApiRequest`

**Purpose:** Handles the actual HTTP request to OpenRouter API.

**Signature:**

```typescript
private async makeApiRequest(
  model: string,
  messages: Array<{ role: string; content: string }>,
  responseFormat: ResponseFormat,
  temperature: number
): Promise<OpenRouterResponse>
```

**Parameters:**

- `model: string` - The model identifier
- `messages: Array<{role, content}>` - System and user messages
- `responseFormat: ResponseFormat` - JSON schema for response
- `temperature: number` - Model temperature parameter

**Request Structure:**

```typescript
const requestBody = {
  model: model,
  messages: messages,
  response_format: responseFormat,
  temperature: temperature,
  max_tokens: 4000, // Sufficient for 50 flashcards
};

const headers = {
  Authorization: `Bearer ${this.apiKey}`,
  "Content-Type": "application/json",
  "HTTP-Referer": "https://10xcards.app", // Optional: for OpenRouter analytics
  "X-Title": "10xCards", // Optional: for OpenRouter analytics
};
```

**Returns:** Raw API response object

### 4.6 Private Method: `parseAndValidateResponse`

**Purpose:** Validates and transforms the API response into the expected format.

**Signature:**

```typescript
private parseAndValidateResponse(
  apiResponse: OpenRouterResponse
): FlashcardCandidateDto[]
```

**Responsibilities:**

1. Extract the content from the API response
2. Parse JSON string to object
3. Validate structure using Zod schema
4. Transform to FlashcardCandidateDto[] format
5. Throw descriptive errors if validation fails

**Example Zod Schema:**

```typescript
const OpenRouterFlashcardSchema = z.object({
  flashcards: z.array(
    z.object({
      front: z.string().min(1).max(500),
      back: z.string().min(1).max(2000),
    })
  ),
});
```

### 4.7 Private Method: `calculateMetadata`

**Purpose:** Generates metadata about the generation process.

**Signature:**

```typescript
private calculateMetadata(
  sourceText: string,
  model: string,
  duration: number,
  apiResponse: OpenRouterResponse
): GenerationMetadataDto
```

**Returns:**

```typescript
interface GenerationMetadataDto {
  model_used: string;
  generation_duration_ms: number;
  source_text_length: number;
  source_text_hash: string;
  tokens_used?: number; // If available from API response
}
```

---

## 5. Error Handling

### 5.1 Error Scenarios

The service must handle the following error scenarios:

**1. Input Validation Errors**

- Empty or whitespace-only source text
- Source text too short (< 1,000 characters)
- Source text too long (> 10,000 characters)
- Invalid options (negative maxCards, invalid temperature range)

**2. API Authentication Errors (401)**

- Invalid API key
- Expired API key
- Missing API key

**3. API Rate Limiting Errors (429)**

- Too many requests
- Rate limit exceeded
- Quota exceeded

**4. API Server Errors (500, 502, 503)**

- OpenRouter service unavailable
- Model unavailable
- Timeout errors

**5. Response Validation Errors**

- Invalid JSON in response
- Response doesn't match expected schema
- Empty or malformed flashcard data

**6. Network Errors**

- Connection timeout
- DNS resolution failure
- Network unavailable

### 5.2 Error Handling Strategy

**Early Returns for Validation:**

```typescript
async generateFlashcards(sourceText: string, options?: GenerationOptions) {
  // Guard clauses at the beginning
  if (!sourceText || sourceText.trim().length === 0) {
    throw new OpenRouterError('Source text cannot be empty', 'VALIDATION_ERROR');
  }

  if (sourceText.length < 1000) {
    throw new OpenRouterError('Source text must be at least 1,000 characters', 'VALIDATION_ERROR');
  }

  if (sourceText.length > 10000) {
    throw new OpenRouterError('Source text cannot exceed 10,000 characters', 'VALIDATION_ERROR');
  }

  // Happy path continues...
}
```

**Custom Error Types:**

```typescript
class OpenRouterError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public details?: unknown
  ) {
    super(message);
    this.name = "OpenRouterError";
  }
}
```

**Error Code Mapping:**

```typescript
private handleApiError(error: unknown): never {
  if (error instanceof Response) {
    switch (error.status) {
      case 401:
        throw new OpenRouterError(
          'Invalid API key. Please check your OpenRouter credentials.',
          'AUTH_ERROR',
          401
        );
      case 429:
        throw new OpenRouterError(
          'Rate limit exceeded. Please try again later.',
          'RATE_LIMIT_ERROR',
          429
        );
      case 500:
      case 502:
      case 503:
        throw new OpenRouterError(
          'OpenRouter service is temporarily unavailable.',
          'SERVICE_ERROR',
          error.status
        );
      default:
        throw new OpenRouterError(
          `API request failed with status ${error.status}`,
          'API_ERROR',
          error.status
        );
    }
  }

  throw new OpenRouterError(
    'An unexpected error occurred during flashcard generation',
    'UNKNOWN_ERROR'
  );
}
```

**Logging Strategy:**

```typescript
// Log errors with context but never expose sensitive data
console.error("[OpenRouterService] Error:", {
  code: error.code,
  message: error.message,
  timestamp: new Date().toISOString(),
  // Never log: API keys, full source text, user data
});
```

---

## 6. Security Considerations

### 6.1 API Key Protection

**1. Never expose API key in client-side code**

- Service must only be used in server-side contexts (API routes, middleware)
- API key should be loaded from environment variables
- Never log or return API key in responses

**2. Environment Variable Validation**

```typescript
// In service initialization
const apiKey = import.meta.env.OPENROUTER_API_KEY;
if (!apiKey) {
  throw new Error("OPENROUTER_API_KEY environment variable is not set");
}
```

### 6.2 Input Sanitization

**1. Validate and sanitize source text**

- Remove or escape potentially harmful characters
- Enforce length limits strictly
- Trim whitespace

**2. Prevent injection attacks**

- Don't interpolate user input directly into system messages
- Use parameterized message construction
- Validate all user-provided options

### 6.3 Rate Limiting

**1. Implement client-side rate limiting**

- Track request timestamps
- Prevent rapid successive calls
- Implement exponential backoff for retries

**2. Respect OpenRouter limits**

- Set appropriate timeout values
- Handle 429 responses gracefully
- Consider implementing request queuing

### 6.4 Data Privacy

**1. Minimize data exposure**

- Don't log full source text (use hash or truncated version)
- Don't store API responses longer than necessary
- Sanitize error messages before returning to client

**2. Secure transmission**

- Always use HTTPS for API calls
- Validate SSL certificates
- Use secure headers

---

## 7. Step-by-Step Implementation Plan

### Step 1: Create Type Definitions

**File:** `src/lib/services/openrouter.types.ts`

**Tasks:**

1. Define `GenerationOptions` interface
2. Define `OpenRouterResponse` interface
3. Define `ResponseFormat` interface
4. Define `OpenRouterError` class
5. Export all types

**Example:**

```typescript
export interface GenerationOptions {
  model?: string;
  maxCards?: number;
  temperature?: number;
}

export interface OpenRouterResponse {
  id: string;
  model: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface ResponseFormat {
  type: "json_schema";
  json_schema: {
    name: string;
    strict: true;
    schema: object;
  };
}

export class OpenRouterError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public details?: unknown
  ) {
    super(message);
    this.name = "OpenRouterError";
  }
}
```

### Step 2: Create Validation Schema

**File:** `src/lib/validation/openrouter.schemas.ts`

**Tasks:**

1. Create Zod schema for API response validation
2. Create Zod schema for flashcard structure
3. Export schemas and inferred types

**Example:**

```typescript
import { z } from "zod";

export const FlashcardSchema = z.object({
  front: z.string().min(1).max(500),
  back: z.string().min(1).max(2000),
});

export const OpenRouterFlashcardResponseSchema = z.object({
  flashcards: z.array(FlashcardSchema).min(1).max(50),
});

export type ValidatedFlashcardResponse = z.infer<typeof OpenRouterFlashcardResponseSchema>;
```

### Step 3: Implement Private Helper Methods

**File:** `src/lib/services/openrouter.service.ts`

**Tasks:**

1. Implement `buildSystemMessage()` - Define AI role and instructions
2. Implement `buildUserMessage()` - Format source text with instructions
3. Implement `buildResponseFormat()` - Create JSON schema for structured output
4. Implement `calculateMetadata()` - Generate generation metadata

**Order:** Start with the simplest methods first (buildSystemMessage, buildUserMessage), then move to more complex ones.

### Step 4: Implement API Request Method

**File:** `src/lib/services/openrouter.service.ts`

**Tasks:**

1. Implement `makeApiRequest()` method
2. Configure request headers (Authorization, Content-Type, etc.)
3. Build request body with model, messages, response_format, temperature
4. Make fetch call to OpenRouter API
5. Handle HTTP errors
6. Return parsed response

**Example:**

```typescript
private async makeApiRequest(
  model: string,
  messages: Array<{ role: string; content: string }>,
  responseFormat: ResponseFormat,
  temperature: number
): Promise<OpenRouterResponse> {
  const url = `${this.baseUrl}/chat/completions`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://10xcards.app',
      'X-Title': '10xCards'
    },
    body: JSON.stringify({
      model,
      messages,
      response_format: responseFormat,
      temperature,
      max_tokens: 4000
    })
  });

  if (!response.ok) {
    this.handleApiError(response);
  }

  return await response.json();
}
```

### Step 5: Implement Response Validation

**File:** `src/lib/services/openrouter.service.ts`

**Tasks:**

1. Implement `parseAndValidateResponse()` method
2. Extract content from API response
3. Parse JSON string to object
4. Validate using Zod schema
5. Transform to FlashcardCandidateDto[] format
6. Handle validation errors with descriptive messages

**Example:**

```typescript
private parseAndValidateResponse(
  apiResponse: OpenRouterResponse
): FlashcardCandidateDto[] {
  // Extract content from first choice
  const content = apiResponse.choices[0]?.message?.content;

  if (!content) {
    throw new OpenRouterError(
      'No content in API response',
      'INVALID_RESPONSE'
    );
  }

  // Parse JSON
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch (error) {
    throw new OpenRouterError(
      'Failed to parse API response as JSON',
      'PARSE_ERROR',
      undefined,
      error
    );
  }

  // Validate with Zod
  const validationResult = OpenRouterFlashcardResponseSchema.safeParse(parsed);

  if (!validationResult.success) {
    throw new OpenRouterError(
      'API response does not match expected schema',
      'VALIDATION_ERROR',
      undefined,
      validationResult.error
    );
  }

  // Transform to expected format
  return validationResult.data.flashcards.map(card => ({
    front: card.front,
    back: card.back
  }));
}
```

### Step 6: Implement Error Handling

**File:** `src/lib/services/openrouter.service.ts`

**Tasks:**

1. Implement `handleApiError()` method
2. Map HTTP status codes to error types
3. Create descriptive error messages
4. Implement error logging (without sensitive data)

### Step 7: Implement Main Public Method

**File:** `src/lib/services/openrouter.service.ts`

**Tasks:**

1. Implement `generateFlashcards()` method
2. Add input validation with guard clauses at the beginning
3. Set default options
4. Build messages (system + user)
5. Build response format
6. Call `makeApiRequest()`
7. Parse and validate response
8. Calculate metadata
9. Return GenerationServiceResult
10. Handle all errors appropriately

**Example Structure:**

```typescript
async generateFlashcards(
  sourceText: string,
  options?: GenerationOptions
): Promise<GenerationServiceResult> {
  const startTime = Date.now();

  // Guard clauses - validate input first
  if (!sourceText || sourceText.trim().length === 0) {
    throw new OpenRouterError('Source text cannot be empty', 'VALIDATION_ERROR');
  }

  if (sourceText.length < 1000) {
    throw new OpenRouterError(
      'Source text must be at least 1,000 characters',
      'VALIDATION_ERROR'
    );
  }

  if (sourceText.length > 10000) {
    throw new OpenRouterError(
      'Source text cannot exceed 10,000 characters',
      'VALIDATION_ERROR'
    );
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
    { role: 'system', content: systemMessage },
    { role: 'user', content: userMessage }
  ];

  // Make API call
  const apiResponse = await this.makeApiRequest(
    model,
    messages,
    responseFormat,
    temperature
  );

  // Parse and validate
  const candidates = this.parseAndValidateResponse(apiResponse);

  // Calculate metadata
  const duration = Date.now() - startTime;
  const metadata = this.calculateMetadata(sourceText, model, duration, apiResponse);

  // Happy path - return result
  return {
    candidates,
    metadata
  };
}
```

### Step 8: Create Service Instance

**File:** `src/lib/services/openrouter.service.ts`

**Tasks:**

1. Implement constructor
2. Validate API key
3. Store configuration
4. Export singleton instance for use in API routes

**Example:**

```typescript
export class OpenRouterService {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly defaultModel = "openai/gpt-3.5-turbo";

  constructor(apiKey: string, baseUrl = "https://openrouter.ai/api/v1") {
    if (!apiKey || apiKey.trim() === "") {
      throw new Error("OpenRouter API key is required");
    }
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  // ... all methods
}

// Export singleton instance
export const openRouterService = new OpenRouterService(import.meta.env.OPENROUTER_API_KEY);
```

### Step 9: Update AI Generation Service

**File:** `src/lib/services/ai-generation.service.ts`

**Tasks:**

1. Import OpenRouterService
2. Replace mock implementation with real OpenRouter calls
3. Keep the same interface (GenerationServiceResult)
4. Add error handling wrapper
5. Maintain backward compatibility

**Example:**

```typescript
import { openRouterService } from "./openrouter.service";
import type { GenerationServiceResult } from "../../types";

export async function generateFlashcards(sourceText: string): Promise<GenerationServiceResult> {
  try {
    return await openRouterService.generateFlashcards(sourceText);
  } catch (error) {
    // Log error and re-throw with user-friendly message
    console.error("[AI Generation] Error:", error);
    throw new Error("Failed to generate flashcards. Please try again.");
  }
}
```

### Step 10: Update Environment Configuration

**File:** `.env` and `.env.example`

**Tasks:**

1. Ensure OPENROUTER_API_KEY is in .env
2. Update .env.example with placeholder
3. Update src/env.d.ts with type definition

**Example (.env.example):**

```env
OPENROUTER_API_KEY=sk-or-v1-your-api-key-here
```

**Example (src/env.d.ts):**

```typescript
interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
  readonly OPENROUTER_API_KEY: string; // Add this line
}
```

### Step 11: Testing and Validation

**Tasks:**

1. Test with various source text lengths (edge cases: 1000, 5000, 10000 chars)
2. Test error scenarios (invalid API key, rate limiting, network errors)
3. Validate response structure matches expected schema
4. Test with different models (if needed)
5. Verify metadata is calculated correctly
6. Check that no sensitive data is logged
7. Test integration with existing API endpoints

### Step 12: Documentation

**Tasks:**

1. Add JSDoc comments to all public methods
2. Document error codes and their meanings
3. Add usage examples in comments
4. Update README if needed
5. Document model selection strategy

---

## Summary

This implementation plan provides a complete roadmap for creating a production-ready OpenRouter service that:

- ✅ Follows the project's coding practices (error handling first, early returns, guard clauses)
- ✅ Uses TypeScript 5 with proper type safety
- ✅ Integrates with the existing Astro 5 architecture
- ✅ Implements structured responses using JSON schema
- ✅ Handles all error scenarios gracefully
- ✅ Protects sensitive data (API keys, user content)
- ✅ Provides clear, maintainable code structure
- ✅ Maintains backward compatibility with existing interfaces

The service can be implemented incrementally, testing each step before moving to the next, ensuring a stable and reliable integration with OpenRouter.ai.
