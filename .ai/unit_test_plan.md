# Unit Test Plan for 10xCards

## Overview

This document outlines which elements of the 10xCards project are worth testing with unit tests and the rationale behind these decisions. The plan prioritizes high-ROI testing targets that provide maximum confidence with minimal maintenance overhead.

---

## High-Priority Unit Testing Targets

### 1. Pure Utility Functions (`src/lib/utils/`)

#### `flashcard-helpers.ts`

**Functions to test:**
- `generateClientId()` - Ensures UUID generation works consistently
- `computeGenerationMetrics()` - Complex business logic with multiple conditions; critical for analytics accuracy
- `validateFlashcardForm()` - Input validation logic that prevents invalid data

**Dependency Structure:**
```
src/lib/utils/flashcard-helpers.ts
├── imports from:
│   ├── @/hooks/useCreateFlashcards (types only)
│   │   └── CandidateCardViewModel
│   │   └── FlashcardFormData
│   └── @/types
│       └── GenerationMetadataDto
└── used by:
    └── src/hooks/useCreateFlashcards.ts
        └── generateClientId()
        └── computeGenerationMetrics()
```

**Mocking Strategy:**
- No mocks needed - pure functions with primitive inputs/outputs
- Use vi.spyOn(crypto, 'randomUUID') for generateClientId() tests

**Why test:**
These are pure functions with no side effects, making them ideal for unit testing. They contain business logic that's isolated from framework/database concerns.

---

#### `fsrs.ts`

**Functions to test:**
- `convertToFSRSCard()` - Data transformation with edge cases (null/undefined SRS data)
- `buildReviewCommand()` - Critical for spaced repetition accuracy; wrong calculations break the learning algorithm
- State mapping functions (`mapStateToFSRS`, `mapStateFromFSRS`) - Enum conversions that must be bidirectional

**Dependency Structure:**
```
src/lib/utils/fsrs.ts
├── imports from:
│   ├── ts-fsrs (external library)
│   │   └── FSRS, createEmptyCard, Rating, RecordLogItem, State, Card
│   └── @/types
│       └── FlashcardWithSrsDto
│       └── ReviewFlashcardCommand
└── used by:
    └── src/hooks/useStudySession.ts
        └── initializeFSRS()
        └── convertToFSRSCard()
        └── buildReviewCommand()
```

**Mocking Strategy:**
- Mock ts-fsrs module using vi.mock() factory pattern
- Create fixture data for FlashcardWithSrsDto with various SRS states
- Test bidirectional state mapping (New ↔ Learning ↔ Review ↔ Relearning)

**Why test:**
The spaced repetition algorithm is the core value proposition of the application. Any bugs in FSRS calculations directly impact the learning experience and user trust.

---

### 2. Validation Schemas (`src/lib/validation/`)

#### `flashcard.schemas.ts`

**Schemas to test:**
- All Zod schemas (query params, create/update payloads, review data)
- Edge cases: min/max lengths, required fields, enum values, coercion

**Dependency Structure:**
```
src/lib/validation/flashcard.schemas.ts
├── imports from:
│   └── zod (external library)
└── exports:
    ├── getFlashcardsQuerySchema
    ├── createFlashcardsSchema
    ├── updateFlashcardSchema
    ├── flashcardIdSchema
    └── reviewFlashcardSchema
└── used by:
    └── src/pages/api/flashcards/*.ts (API endpoints)
```

**Mocking Strategy:**
- No mocks needed - test schemas directly with .parse() and .safeParse()
- Use inline test data for valid/invalid inputs

**Test scenarios:**
- Valid inputs pass validation
- Invalid inputs are rejected with appropriate error messages
- Boundary conditions (exactly at min/max limits)
- Type coercion works correctly (e.g., string to number)

---

#### `auth.schemas.ts`

**Schemas to test:**
- Email format validation
- Password length requirements
- Required field validation

**Dependency Structure:**
```
src/lib/validation/auth.schemas.ts
├── imports from:
│   └── zod (external library)
└── exports:
    ├── loginSchema
    ├── registerSchema
    ├── passwordRecoverySchema
    ├── changePasswordSchema
    └── deleteAccountSchema
└── used by:
    └── src/pages/api/auth/*.ts (API endpoints)
    └── src/components/auth/*.tsx (form validation)
```

**Mocking Strategy:**
- No mocks needed - test schemas directly
- Test email edge cases (missing @, invalid domain, etc.)
- Test password boundaries (7 chars, 8 chars, empty)

**Why test:**
Validation is your first line of defense against bad data. Testing schemas ensures they catch invalid inputs before they reach your database or business logic.

---

### 3. Service Layer Business Logic (`src/lib/services/`)

#### `flashcard.service.ts`

**Functions to test (with mocked Supabase client):**
- Query building logic in `getFlashcards()` (pagination, search, sorting)
- Data transformation in `getDueFlashcards()` (filtering user_id)
- Error handling patterns (PGRST116 for not found)

**Dependency Structure:**
```
src/lib/services/flashcard.service.ts
├── imports from:
│   ├── @/db/supabase.client
│   │   └── SupabaseClient (type)
│   └── @/types
│       └── CreateFlashcardDto, FlashcardDto, FlashcardWithSrsDto
│       └── GetFlashcardsQueryDto, GetFlashcardsResponseDto
│       └── ReviewFlashcardCommand, ReviewFlashcardResponseDto
│       └── UpdateFlashcardCommand
└── exports:
    ├── getFlashcards(supabase, query)
    ├── createFlashcards(supabase, userId, flashcards)
    ├── getFlashcardById(supabase, id)
    ├── updateFlashcard(supabase, id, updates)
    ├── deleteFlashcard(supabase, id)
    ├── getDueFlashcards(supabase)
    └── reviewFlashcard(supabase, id, reviewData)
└── used by:
    └── src/pages/api/flashcards/*.ts (API endpoints)
```

**Mocking Strategy:**
- Use vi.fn() to create mock Supabase client with chainable methods
- Mock .from().select().eq().single() query chains
- Test error responses (PGRST116 for not found, generic errors)
- Verify correct query parameters passed to Supabase methods

**Why test:**
While these interact with Supabase, you can mock the database client to test:
- Correct query construction
- Proper error handling
- Data transformation logic
- Edge cases (empty results, null values)

---

### 4. API Error Handling (`src/lib/utils/api-errors.ts`)

**Functions to test:**
- `createErrorResponse()` - Standardized error format
- `handleApiError()` - Zod error vs generic error handling

**Dependency Structure:**
```
src/lib/utils/api-errors.ts
├── imports from:
│   └── zod (external library)
│       └── z.ZodError
└── exports:
    ├── createErrorResponse(status, message, details?)
    └── handleApiError(error)
└── used by:
    └── src/pages/api/**/*.ts (all API endpoints)
```

**Mocking Strategy:**
- Create mock ZodError instances for validation error tests
- Use vi.spyOn(console, 'error') to verify error logging
- Test Response object structure and headers

**Why test:**
Consistent error responses are critical for frontend error handling. These are pure functions that are easy to test and provide high confidence in API reliability.

---

## Medium-Priority (Consider for MVP+)

### 5. React Hooks (`src/hooks/`)

#### `useCreateFlashcards.ts`

**Dependency Structure:**
```
src/hooks/useCreateFlashcards.ts
├── imports from:
│   ├── react (useState)
│   ├── sonner (toast)
│   ├── @/types
│   │   └── GenerationMetadataDto
│   ├── @/lib/api/flashcards
│   │   └── generateCandidates(), saveGenerationLog(), saveFlashcards()
│   └── @/lib/utils/flashcard-helpers
│       └── generateClientId(), computeGenerationMetrics()
└── exports:
    └── useCreateFlashcards() hook
└── used by:
    └── src/components/CreateFlashcardsContainer.tsx
```

**Mocking Strategy:**
- Use @testing-library/react-hooks or renderHook from @testing-library/react
- Mock fetch API with vi.stubGlobal() or MSW
- Mock toast.success/error with vi.mock('sonner')
- Test state transitions and async operations

---

#### `useFlashcards.ts`

**Dependency Structure:**
```
src/hooks/useFlashcards.ts
├── imports from:
│   ├── @tanstack/react-query
│   │   └── useQuery, useMutation, useQueryClient
│   ├── @/types
│   │   └── GetFlashcardsQueryDto, UpdateFlashcardCommand
│   └── @/lib/api/flashcards
│       └── fetchFlashcards(), updateFlashcard(), deleteFlashcard()
└── exports:
    └── useFlashcards(queryParams) hook
└── used by:
    └── src/components/MyFlashcardsView.tsx
```

**Mocking Strategy:**
- Wrap tests in QueryClientProvider with test QueryClient
- Mock API functions from @/lib/api/flashcards
- Test query invalidation on mutations
- Verify loading/error states

---

#### `useStudySession.ts`

**Dependency Structure:**
```
src/hooks/useStudySession.ts
├── imports from:
│   ├── react (useState, useEffect, useCallback)
│   ├── ts-fsrs
│   │   └── Rating, RecordLog, Grade
│   ├── @/types
│   │   └── StudySessionState, GetDueFlashcardsResponseDto
│   └── @/lib/utils/fsrs
│       └── initializeFSRS(), convertToFSRSCard(), buildReviewCommand()
└── exports:
    └── useStudySession() hook
└── used by:
    └── src/components/StudySession.tsx
```

**Mocking Strategy:**
- Mock fetch API for /api/flashcards/due endpoint
- Mock FSRS utility functions with vi.mock()
- Test keyboard event handlers with fireEvent
- Test state transitions (loading → active → complete)

**Why test:**
Hooks contain complex state logic but require React Testing Library setup. Consider testing these after core utilities are covered.

---

### 6. React Components (Selected)

#### `Pagination.tsx`

**Dependency Structure:**
```
src/components/Pagination.tsx
├── imports from:
│   ├── @/components/ui/button
│   │   └── Button (Shadcn UI)
│   └── lucide-react
│       └── ChevronLeft, ChevronRight
└── props:
    └── currentPage, totalPages, totalCount, onPageChange
└── used by:
    └── src/components/MyFlashcardsView.tsx
```

**Mocking Strategy:**
- Mock Button component with vi.mock('@/components/ui/button')
- Use @testing-library/react for rendering
- Test button disabled states and click handlers
- Verify conditional rendering (totalPages <= 1)

---

#### `GradingButtons.tsx`

**Dependency Structure:**
```
src/components/study-session/GradingButtons.tsx
├── imports from:
│   ├── @/components/ui/button
│   │   └── Button (Shadcn UI)
│   └── ts-fsrs
│       └── Rating (enum)
└── props:
    └── onGrade(rating), disabled?
└── used by:
    └── src/components/study-session/StudySessionActive.tsx
```

**Mocking Strategy:**
- Mock Button component
- Use @testing-library/user-event for click interactions
- Verify correct Rating values passed to onGrade callback
- Test disabled state propagation

**Why test:**
Components with complex logic or critical user flows benefit from unit tests, but prioritize integration/E2E tests for UI validation.

---

## Low-Priority (Skip for MVP)

**Elements not recommended for unit testing:**
- Shadcn UI components (`src/components/ui/`) - Already tested by the library
- Astro components - Better tested with E2E tests
- API endpoints - Better tested with integration tests
- Middleware - Better tested with integration tests

---

## Why This Testing Strategy?

1. **ROI Focus:** Pure functions and business logic give the highest return on testing investment
2. **Confidence:** FSRS calculations and validation schemas are critical - bugs here break core functionality
3. **Regression Prevention:** Utility functions are likely to be refactored; tests catch breaking changes
4. **Fast Feedback:** Unit tests run in milliseconds, enabling TDD workflow
5. **Documentation:** Tests serve as executable documentation for complex logic

---

## Recommended Test Structure

```
tests/unit/
├── lib/
│   ├── utils/
│   │   ├── flashcard-helpers.test.ts
│   │   ├── fsrs.test.ts
│   │   └── api-errors.test.ts
│   ├── validation/
│   │   ├── flashcard.schemas.test.ts
│   │   └── auth.schemas.test.ts
│   └── services/
│       └── flashcard.service.test.ts (with mocked Supabase)
```

---

## Implementation Priority

**Phase 1 (Critical):**
1. `fsrs.test.ts` - Most critical for spaced repetition feature
2. `flashcard-helpers.test.ts` - Core business logic
3. `flashcard.schemas.test.ts` - Data validation

**Phase 2 (Important):**
4. `auth.schemas.test.ts` - Security validation
5. `api-errors.test.ts` - Error handling consistency

**Phase 3 (Nice to have):**
6. `flashcard.service.test.ts` - Service layer with mocks
7. Selected React hooks and components

---

## Testing Guidelines

- Use Vitest with jsdom environment (already configured)
- Mock external dependencies (Supabase, OpenRouter API)
- Follow AAA pattern (Arrange, Act, Assert)
- Test edge cases and error conditions
- Aim for meaningful coverage, not 100% coverage
- Keep tests fast and isolated
- Use descriptive test names that explain the scenario

---

## Success Metrics

- All high-priority utilities have >90% coverage
- All validation schemas have comprehensive test cases
- Tests run in <5 seconds
- Zero flaky tests
- Tests catch regressions before production
