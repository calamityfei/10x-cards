# API Endpoint Implementation Plan: POST /generations/generate-candidates

## 1. Endpoint Overview

This is an RPC-style endpoint that accepts source text from an authenticated user, sends it to an external AI service (Openrouter.ai), and returns a list of non-persistent flashcard candidates for user review. This endpoint does NOT persist any data to the database - it only generates and returns candidates that the user can later accept via the POST /flashcards endpoint.

**Key Characteristics:**

- Synchronous operation (waits for AI response)
- No database writes
- Requires authentication
- Depends on external AI service availability
- Returns structured flashcard candidates with metadata

## 2. Request Details

- **HTTP Method**: POST
- **URL Structure**: `/api/generations/generate-candidates`
- **Content-Type**: `application/json`
- **Authentication**: Required (JWT token via Supabase Auth)

### Parameters

**Required:**

- `source_text` (string): The text content to generate flashcards from
  - Minimum length: 1,000 characters
  - Maximum length: 10,000 characters

**Optional:**

- None

### Request Body Example

```json
{
  "source_text": "The mitochondria is the powerhouse of the cell..."
}
```

## 3. Used Types

All types are already defined in `src/types.ts`:

### Command Model (Request)

```typescript
interface GenerateCandidatesCommand {
  source_text: string;
}
```

### Response DTOs

```typescript
interface GenerateCandidatesResponseDto {
  candidates: FlashcardCandidateDto[];
  metadata: GenerationMetadataDto;
}

type FlashcardCandidateDto = Pick<FlashcardRow, "front" | "back">;

interface GenerationMetadataDto {
  model_used: string | null;
  generation_duration_ms: number | null;
  source_text_length: number;
}
```

### Validation Schema (New - to be created)

```typescript
// In the endpoint file
const generateCandidatesSchema = z.object({
  source_text: z
    .string()
    .min(1000, "Source text must be at least 1,000 characters")
    .max(10000, "Source text must not exceed 10,000 characters"),
});
```

## 4. Response Details

### Success Response (200 OK)

```json
{
  "candidates": [
    {
      "front": "What is the mitochondria?",
      "back": "The powerhouse of the cell."
    },
    {
      "front": "What is the function of the cell?",
      "back": "..."
    }
  ],
  "metadata": {
    "model_used": "anthropic/claude-3-haiku",
    "generation_duration_ms": 1450,
    "source_text_length": 1200
  }
}
```

### Error Responses

**400 Bad Request**

```json
{
  "error": "Validation failed",
  "details": "Source text must be at least 1,000 characters"
}
```

**401 Unauthorized**

```json
{
  "error": "Unauthorized",
  "details": "No valid JWT provided"
}
```

**502 Bad Gateway**

```json
{
  "error": "AI service unavailable",
  "details": "The external AI service failed or timed out"
}
```

## 5. Data Flow

1. **Request Reception**: Astro API endpoint receives POST request
2. **Authentication Check**: Validate JWT token via Supabase Auth (from context.locals)
3. **Input Validation**: Validate request body using Zod schema
4. **Service Call**: Pass source_text to AI Generation Service (`generation.service`)
5. **External API Call**: Service calls Openrouter.ai with configured model
6. **Response Parsing**: Parse AI response into flashcard candidates
7. **Metadata Collection**: Gather model info, duration, and text length
8. **Response Formation**: Structure response according to DTO
9. **Return to Client**: Send 200 OK with candidates and metadata

### External Service Integration

**Openrouter.ai API Call:**

- Endpoint: `https://openrouter.ai/api/v1/chat/completions`
- Method: POST
- Headers:
  - `Authorization: Bearer ${OPENROUTER_API_KEY}`
  - `Content-Type: application/json`
- Timeout: 30 seconds (configurable)
- Model: `anthropic/claude-3-haiku` (or configurable via env)

**AI Prompt Structure:**
The service should construct a prompt that instructs the AI to:

- Generate flashcards from the provided text
- Return up to 50 flashcard pairs
- Format as JSON array with "front" and "back" properties
- Keep front text under 200 characters
- Keep back text under 500 characters

## 6. Security Considerations

### Authentication

- **JWT Validation**: Use `context.locals.supabase.auth.getUser()` to verify authentication
- **User Context**: Extract `user.id` for potential rate limiting or logging
- **Early Return**: Return 401 immediately if authentication fails

### Input Sanitization

- **Zod Validation**: Strict validation of source_text length
- **Trim Whitespace**: Consider trimming before length validation
- **Character Encoding**: Ensure proper UTF-8 handling

### API Key Protection

- **Environment Variables**: Store Openrouter API key in `OPENROUTER_API_KEY` env var
- **Never Expose**: Never return API key in responses or logs
- **Rotation**: Document key rotation procedures

### Rate Limiting (Future Consideration)

- Not in MVP scope, but consider implementing per-user rate limits
- Track generation attempts per user per time window

## 7. Error Handling

### Validation Errors (400)

```typescript
// Handle Zod validation errors
catch (error) {
  if (error instanceof z.ZodError) {
    return new Response(
      JSON.stringify({
        error: "Validation failed",
        details: error.errors[0].message
      }),
      { status: 400 }
    );
  }
}
```

### Authentication Errors (401)

```typescript
const {
  data: { user },
  error,
} = await context.locals.supabase.auth.getUser();

if (error || !user) {
  return new Response(
    JSON.stringify({
      error: "Unauthorized",
      details: "No valid JWT provided",
    }),
    { status: 401 }
  );
}
```

### External Service Errors (502)

```typescript
// Handle Openrouter.ai failures
catch (error) {
  if (error.name === 'TimeoutError' || error.code === 'ECONNREFUSED') {
    return new Response(
      JSON.stringify({
        error: "AI service unavailable",
        details: "The external AI service failed or timed out"
      }),
      { status: 502 }
    );
  }
}
```

### Unexpected Errors (500)

```typescript
// Catch-all for unexpected errors
catch (error) {
  console.error("Unexpected error in generate-candidates:", error);
  return new Response(
    JSON.stringify({
      error: "Internal server error",
      details: "An unexpected error occurred"
    }),
    { status: 500 }
  );
}
```

## 8. Performance Considerations

### Bottlenecks

- **External API Latency**: Openrouter.ai response time (1-5 seconds typical)
- **Network Timeouts**: Set reasonable timeout (60s)
- **Large Text Processing**: 10,000 character limit helps control this

### Optimization Strategies

- **Timeout Configuration**: Implement configurable timeout for AI service
- **Caching**: Not applicable for this endpoint (each generation is unique)

### Monitoring

- Log generation duration for performance tracking
- Log AI service failures for reliability monitoring
- Track source_text_length distribution for usage patterns

## 9. Implementation Steps

### Step 1: Create AI Generation Service `generation.service`

**File**: `src/lib/services/ai-generation.service.ts`

- Create service class or module with `generateFlashcards()` function
- Accept `source_text` as parameter
- Configure Openrouter.ai API endpoint and model
- Construct AI prompt for flashcard generation
- Make HTTP request to Openrouter.ai with timeout of 60s (for the development phase use mocks instead real AI service API call)
- Parse AI response into `FlashcardCandidateDto[]` array
- Extract metadata (model, generated_count, generation_duration, source_text_length, source_text_hash)
- Handle AI-specific errors (timeout, invalid response, rate limits)
- Return structured result with candidates and metadata

**Key Functions:**

```typescript
interface GenerationServiceResult {
  candidates: FlashcardCandidateDto[];
  metadata: {
    model_used: string | null;
    generation_duration_ms: number | null;
    source_text_length: number;
  };
}

export async function generateFlashcards(sourceText: string): Promise<GenerationServiceResult>;
```

### Step 2: Create API Endpoint

**File**: `src/pages/api/generations/generate-candidates.ts`

- Export `export const prerender = false` for SSR
- Define POST handler function
- Extract request body and parse JSON
- Validate authentication using `context.locals.supabase.auth.getUser()`
- Define Zod schema for request validation
- Validate request body against schema
- Call AI generation service (`generation.service`) with source_text
- Format response according to `GenerateCandidatesResponseDto`
- Implement comprehensive error handling for all scenarios
- Return appropriate HTTP status codes

**Handler Structure:**

```typescript
export const POST = async (context: APIContext) => {
  // 1. Authentication check
  // 2. Parse and validate request body
  // 3. Call service
  // 4. Format response
  // 5. Error handling
};
```

---

## Implementation Checklist

- [ ] Create `src/lib/services/ai-generation.service.ts`
- [ ] Implement Openrouter.ai integration with timeout
- [ ] Create AI prompt for flashcard generation
- [ ] Parse and validate AI responses
- [ ] Create `src/pages/api/generations/generate-candidates.ts`
- [ ] Implement POST handler with authentication
- [ ] Add Zod validation schema
- [ ] Implement error handling for all scenarios
