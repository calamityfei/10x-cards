# E2E Test Plan for 10xCards

## Overview

This document outlines which user flows and features of the 10xCards project are worth testing with end-to-end (E2E) tests using Playwright. The plan prioritizes critical user journeys that validate the integration of frontend, backend, and database layers, ensuring the application works correctly from the user's perspective.

---

## High-Priority E2E Testing Targets

### 1. Authentication & Account Management Flows

#### User Registration Flow (US-001)

**Test Scenario:** New user creates an account

- Navigate to `/register`
- Fill email and password fields
- Submit registration form
- Verify redirect to `/my-flashcards`
- Verify user is authenticated (check for logout button)

**Component Dependency Tree:**
```
/register (Astro page)
├── PublicLayout.astro
│   └── ThemeToggle.tsx
├── Card (Shadcn UI)
└── RegisterForm.tsx
    ├── Button (Shadcn UI)
    ├── Input (Shadcn UI)
    ├── Label (Shadcn UI)
    ├── Alert (Shadcn UI)
    └── API: POST /api/auth/register
        └── Supabase auth.signUp()
```

**Why test:**
Registration is the entry point for all users. Any failure here blocks access to the entire application.

---

#### User Login Flow (US-002)

**Test Scenario:** Returning user logs in

- Navigate to `/login`
- Enter valid credentials
- Submit login form
- Verify redirect to `/my-flashcards`
- Verify authenticated state

**Test Scenario:** Invalid login attempt

- Navigate to `/login`
- Enter invalid credentials
- Verify error message displayed
- Verify user remains on login page

**Component Dependency Tree:**
```
/login (Astro page)
├── PublicLayout.astro
│   └── ThemeToggle.tsx
├── Card (Shadcn UI)
└── LoginForm.tsx
    ├── Button (Shadcn UI)
    ├── Input (Shadcn UI)
    ├── Label (Shadcn UI)
    ├── Alert (Shadcn UI)
    └── API: POST /api/auth/login
        └── Supabase auth.signInWithPassword()
```

**Why test:**
Login is the most frequent authentication action. Must work reliably for user retention.

---

#### User Logout Flow (US-003)

**Test Scenario:** Authenticated user logs out

- Login as test user
- Click logout button in navigation
- Verify redirect to `/login`
- Verify unauthenticated state (cannot access protected routes)

**Component Dependency Tree:**
```
PersistentHeader.tsx (in ProtectedLayout)
├── Button (Shadcn UI) - Logout button
├── ThemeToggle.tsx
├── NavigationMenu (Shadcn UI)
└── API: POST /api/auth/logout
    └── Supabase auth.signOut()
```

**Why test:**
Ensures session management works correctly and protected routes are secured.

---

#### Password Recovery Flow (US-000)

**Test Scenario:** User initiates password recovery

- Navigate to `/login`
- Click "Forgot password" link
- Verify redirect to `/password-recovery`
- Enter email address
- Submit form
- Verify success message

**Test Scenario:** User resets password

- Navigate to `/password-reset` with valid token (from test setup)
- Enter new password and confirmation
- Submit form
- Verify redirect to `/login`
- Login with new password
- Verify successful authentication

**Component Dependency Tree:**
```
/password-recovery (Astro page)
├── PublicLayout.astro
├── Card (Shadcn UI)
└── PasswordRecoveryForm.tsx
    ├── Button, Input, Label, Alert (Shadcn UI)
    └── API: POST /api/auth/password-recovery
        └── Supabase auth.resetPasswordForEmail()

/password-reset (Astro page)
├── PublicLayout.astro
├── Card (Shadcn UI)
└── PasswordResetForm.tsx
    ├── Button, Input, Label, Alert (Shadcn UI)
    └── API: POST /api/auth/password-reset
        └── Supabase auth.updateUser()
```

**Why test:**
Password recovery is critical for user account access. Broken recovery flow leads to locked-out users.

---

#### Change Password Flow (US-004)

**Test Scenario:** User changes password from account page

- Login as test user
- Navigate to `/my-account`
- Fill current password, new password, and confirm password fields
- Click "Update" button
- Verify success message
- Logout and login with new password
- Verify successful authentication

**Component Dependency Tree:**
```
/my-account (Astro page)
├── ProtectedLayout.astro
│   └── PersistentHeader.tsx
└── AccountSettings.tsx
    ├── Card (Shadcn UI) - Account Info
    ├── Card (Shadcn UI) - Change Password
    │   ├── Button, Input, Label, Alert (Shadcn UI)
    │   └── API: POST /api/auth/change-password
    │       └── Supabase auth.updateUser()
    └── Card (Shadcn UI) - Delete Account
        └── DeleteAccountModal.tsx
```

**Why test:**
Validates password update logic and ensures users can maintain account security.

---

#### Delete Account Flow (US-005)

**Test Scenario:** User deletes their account

- Login as test user
- Navigate to `/my-account`
- Click "Delete Account" button
- Verify confirmation modal appears
- Confirm deletion
- Verify redirect to `/login`
- Attempt to login with deleted credentials
- Verify login fails

**Component Dependency Tree:**
```
/my-account (Astro page)
└── AccountSettings.tsx
    └── DeleteAccountModal.tsx
        ├── Dialog (Shadcn UI)
        ├── Button, Input, Label, Alert (Shadcn UI)
        └── API: POST /api/auth/delete-account
            ├── Supabase: Delete user flashcards
            └── Supabase auth.admin.deleteUser()
```

**Why test:**
Account deletion must work correctly for GDPR compliance and user trust. Must verify data is actually deleted.

---

### 2. Flashcard Creation Flows

#### AI Flashcard Generation Flow (US-006, US-007, US-008, US-009, US-010)

**Test Scenario:** Generate and save AI flashcards

- Login as test user
- Navigate to `/create-flashcards`
- Paste text (1,500 characters) into input field
- Click "Generate" button
- Wait for AI candidates to appear
- Verify candidates list is displayed
- Accept 2 cards (click "Accept" button)
- Edit 1 card (click "Edit", modify text, save modal)
- Delete 1 card (click "Delete")
- Click "Save" button
- Verify success message
- Navigate to `/my-flashcards`
- Verify 3 new cards appear in list

**Test Scenario:** AI generation with invalid input

- Navigate to `/create-flashcards`
- Paste text with 500 characters (below minimum)
- Verify error message or disabled generate button
- Paste text with 15,000 characters (above maximum)
- Verify error message or disabled generate button

**Test Scenario:** AI generation returns no candidates (US-023)

- Navigate to `/create-flashcards`
- Paste non-factual text (e.g., poetry)
- Click "Generate"
- Verify message: "We couldn't find any factual items..."

**Component Dependency Tree:**
```
/create-flashcards (Astro page)
├── ProtectedLayout.astro
│   └── PersistentHeader.tsx
└── CreateFlashcardsContainer.tsx
    ├── useCreateFlashcards hook
    ├── ManualAddButton.tsx
    ├── SourceTextInput.tsx
    │   ├── Card, Button, Label, Textarea (Shadcn UI)
    │   └── Character validation (1000-10000)
    ├── CandidateReviewList.tsx
    │   ├── FlashcardGrid.tsx
    │   └── CandidateCard.tsx (for each candidate)
    │       ├── FlashCard.tsx
    │       └── Buttons: Accept, Edit, Delete
    ├── SaveAllButton.tsx (floating button)
    ├── FlashcardAddEditModal.tsx
    │   └── Dialog, Button, Input, Textarea (Shadcn UI)
    ├── ConfirmRegenerateModal.tsx
    ├── ConfirmPartialSaveModal.tsx
    └── APIs:
        ├── POST /api/generations/generate-candidates
        │   └── OpenRouter AI API call
        ├── POST /api/generations (save metadata)
        └── POST /api/flashcards (save cards)
            └── Supabase: Insert flashcards
```

**Why test:**
This is the core value proposition of the application. The entire AI generation → review → save flow must work seamlessly.

---

#### Manual Flashcard Creation Flow (US-011)

**Test Scenario:** Create flashcard manually

- Login as test user
- Navigate to `/create-flashcards`
- Click "Add Manually" button
- Verify modal opens with empty fields
- Fill "front" and "back" fields
- Click "Save" in modal
- Verify modal closes
- Verify card appears in proposed flashcards list
- Click "Save" button to persist
- Navigate to `/my-flashcards`
- Verify new card appears

**Component Dependency Tree:**
```
/create-flashcards (Astro page)
└── CreateFlashcardsContainer.tsx
    ├── ManualAddButton.tsx
    │   └── Button (Shadcn UI)
    ├── FlashcardAddEditModal.tsx (mode="add")
    │   ├── Dialog (Shadcn UI)
    │   ├── Input (front, max 200 chars)
    │   ├── Textarea (back, max 500 chars)
    │   └── Button: Save, Cancel
    ├── CandidateReviewList.tsx (shows manual card)
    ├── SaveAllButton.tsx
    └── API: POST /api/flashcards
        └── Supabase: Insert flashcard
```

**Why test:**
Manual creation is the fallback when AI fails. Must work independently of AI flow.

---

### 3. Flashcard Management Flows

#### View Flashcards List (US-012)

**Test Scenario:** User views their flashcards

- Login as test user with existing flashcards
- Verify redirect to `/my-flashcards`
- Verify flashcard list is displayed
- Verify each card shows front text
- Click on a card to flip
- Verify back text is displayed

**Test Scenario:** Empty flashcards list (US-020)

- Login as new test user with 0 cards
- Navigate to `/my-flashcards`
- Verify empty state message: "Your deck is empty!"
- Verify link to `/create-flashcards` is present
- Click link and verify navigation

**Component Dependency Tree:**
```
/my-flashcards (Astro page)
├── ProtectedLayout.astro
│   └── PersistentHeader.tsx
└── MyFlashcardsView.tsx
    ├── QueryClientProvider (@tanstack/react-query)
    ├── useFlashcards hook
    ├── SearchInput.tsx
    ├── Select (Shadcn UI) - Sort dropdown
    ├── FlashcardGrid.tsx
    │   └── FlashCard.tsx (for each flashcard)
    │       ├── Card (Shadcn UI) - Flippable
    │       └── Buttons: Edit, Delete
    ├── Pagination.tsx
    ├── Empty (Shadcn UI) - Empty state
    ├── FlashcardAddEditModal.tsx (for edit)
    ├── ConfirmationModal.tsx (for delete)
    └── APIs:
        ├── GET /api/flashcards?page=1&limit=50&search=...
        ├── PUT /api/flashcards/[id]
        └── DELETE /api/flashcards/[id]
            └── Supabase: Query/Update/Delete flashcards
```

**Why test:**
This is the default landing page after login. Must handle both populated and empty states correctly.

---

#### Search Flashcards (US-013)

**Test Scenario:** Search filters flashcards

- Login as test user with multiple flashcards
- Navigate to `/my-flashcards`
- Type search query in search bar
- Verify list filters to show only matching cards (front or back)
- Clear search
- Verify full list is restored

**Component Dependency Tree:**
```
/my-flashcards (Astro page)
└── MyFlashcardsView.tsx
    ├── SearchInput.tsx
    │   └── Input (Shadcn UI) with search icon
    ├── useFlashcards hook (with search param)
    └── API: GET /api/flashcards?search=query
        └── Supabase: .ilike() on front and back columns
```

**Why test:**
Search is critical for users with large decks. Must search both front and back text.

---

#### Pagination (US-014)

**Test Scenario:** Navigate through paginated flashcards

- Login as test user with 75 flashcards
- Navigate to `/my-flashcards`
- Verify 50 cards displayed on page 1
- Verify pagination controls are visible
- Click "Next" button
- Verify page 2 displays remaining 25 cards
- Click "Previous" button
- Verify page 1 is displayed again

**Component Dependency Tree:**
```
/my-flashcards (Astro page)
└── MyFlashcardsView.tsx
    ├── Pagination.tsx
    │   ├── Button (Shadcn UI) - Previous/Next
    │   └── ChevronLeft, ChevronRight icons
    ├── useFlashcards hook (with page param)
    └── API: GET /api/flashcards?page=2&limit=50
        └── Supabase: .range() for pagination
```

**Why test:**
Pagination prevents performance issues with large decks. Must work correctly to avoid lost cards.

---

#### Edit Flashcard (US-015)

**Test Scenario:** Edit existing flashcard

- Login as test user
- Navigate to `/my-flashcards`
- Click "Edit" button on a card
- Verify modal opens with pre-filled fields
- Modify "front" and "back" text
- Click "Save" in modal
- Verify modal closes
- Verify card in list shows updated text

**Component Dependency Tree:**
```
/my-flashcards (Astro page)
└── MyFlashcardsView.tsx
    ├── FlashCard.tsx
    │   └── Button - Edit (triggers modal)
    ├── FlashcardAddEditModal.tsx (mode="edit")
    │   ├── Dialog (Shadcn UI)
    │   ├── Input (front, pre-filled)
    │   ├── Textarea (back, pre-filled)
    │   └── Button: Save, Cancel
    ├── useFlashcards hook (updateFlashcard mutation)
    └── API: PUT /api/flashcards/[id]
        └── Supabase: .update() flashcard
```

**Why test:**
Users must be able to correct mistakes or improve cards. Edit flow must preserve card ID and update database.

---

#### Delete Flashcard (US-016)

**Test Scenario:** Delete flashcard

- Login as test user
- Navigate to `/my-flashcards`
- Note total card count
- Click "Delete" button on a card
- Verify confirmation prompt appears
- Confirm deletion
- Verify card is removed from list
- Verify total count decreased by 1
- Refresh page
- Verify card is still deleted (persisted to database)

**Component Dependency Tree:**
```
/my-flashcards (Astro page)
└── MyFlashcardsView.tsx
    ├── FlashCard.tsx
    │   └── Button - Delete (triggers modal)
    ├── ConfirmationModal.tsx
    │   ├── Dialog (Shadcn UI)
    │   └── Button: Confirm, Cancel
    ├── useFlashcards hook (deleteFlashcard mutation)
    └── API: DELETE /api/flashcards/[id]
        └── Supabase: .delete() flashcard
```

**Why test:**
Deletion must be permanent and reflected immediately. Confirmation prevents accidental deletions.

---

### 4. Study Session Flows

#### Start Study Session (US-017, US-018)

**Test Scenario:** Complete study session with due cards

- Login as test user with due flashcards
- Navigate to `/study-session`
- Verify first card's front is displayed
- Click "Show Answer" button
- Verify back text is revealed
- Verify "Forgot" and "Knew" buttons appear
- Click "Knew" button
- Verify next card is loaded
- Repeat until all due cards are graded
- Verify "Session Complete! Congratulations!" message
- Click "Return to my flashcards" button
- Verify navigation to `/my-flashcards`

**Test Scenario:** Study session with keyboard shortcuts

- Start study session
- Press Space to reveal answer
- Press "1" for "Forgot"
- Verify next card loads
- Press Space to reveal answer
- Press "2" for "Knew"
- Verify next card loads

**Component Dependency Tree:**
```
/study-session (Astro page)
├── ProtectedLayout.astro
│   └── PersistentHeader.tsx
└── StudySession.tsx
    ├── useStudySession hook
    │   ├── FSRS algorithm (ts-fsrs)
    │   └── Keyboard event listeners
    ├── StudySessionActive.tsx
    │   ├── Card (Shadcn UI) - Shows front/back
    │   ├── Button - Show Answer
    │   └── GradingButtons.tsx
    │       └── Button: Forgot (Rating.Again), Knew (Rating.Good)
    ├── StudySessionComplete.tsx
    │   └── Button - Return to my flashcards
    ├── StudySessionEmpty.tsx
    ├── StudySessionError.tsx
    └── APIs:
        ├── GET /api/flashcards/due
        │   └── Supabase: Query cards with due_date <= now
        └── POST /api/flashcards/[id]/review
            └── Supabase: Update SRS data (next_review, etc.)
```

**Why test:**
Study session is the core learning feature. Spaced repetition algorithm must update card schedules correctly.

---

#### Empty Study Session States (US-021, US-022)

**Test Scenario:** No cards in deck (US-021)

- Login as new test user with 0 cards
- Navigate to `/study-session`
- Verify message: "You don't have any flashcards to study."
- Verify link to `/create-flashcards` is present

**Test Scenario:** No cards due (US-022)

- Login as test user with cards but none due
- Navigate to `/study-session`
- Verify message: "You're all caught up! No cards are due for review right now."

**Component Dependency Tree:**
```
/study-session (Astro page)
└── StudySession.tsx
    ├── useStudySession hook
    │   └── API: GET /api/flashcards/due
    └── StudySessionEmpty.tsx
        ├── Empty (Shadcn UI)
        └── Button - Link to /create-flashcards
```

**Why test:**
Empty states guide users to the correct action. Must differentiate between "no cards" and "no cards due".

---

## Medium-Priority E2E Testing Targets

### 5. Navigation & Protected Routes

**Test Scenario:** Unauthenticated user cannot access protected routes

- Ensure logged out state
- Attempt to navigate to `/my-flashcards`
- Verify redirect to `/login`
- Attempt to navigate to `/create-flashcards`
- Verify redirect to `/login`
- Attempt to navigate to `/study-session`
- Verify redirect to `/login`
- Attempt to navigate to `/my-account`
- Verify redirect to `/login`

**Component Dependency Tree:**
```
Middleware (src/middleware/index.ts)
├── Supabase auth.getUser()
├── PUBLIC_PATHS check
└── Redirect logic

Protected Pages:
├── /my-flashcards
├── /create-flashcards
├── /study-session
└── /my-account
    └── All use ProtectedLayout.astro
        └── Check: if (!Astro.locals.user) redirect("/login")
```

**Why test:**
Security validation. Protected routes must enforce authentication.

---

### 6. Cross-Feature Integration

**Test Scenario:** End-to-end user journey

- Register new account
- Verify redirect to empty `/my-flashcards`
- Navigate to `/create-flashcards`
- Generate AI flashcards
- Accept and save cards
- Navigate to `/my-flashcards`
- Verify cards appear
- Edit one card
- Delete one card
- Navigate to `/study-session`
- Complete study session
- Verify session complete message

**Component Dependency Tree:**
```
Complete User Journey Flow:

1. /register
   └── RegisterForm.tsx → API: POST /api/auth/register

2. /my-flashcards (empty state)
   └── MyFlashcardsView.tsx → Empty component

3. /create-flashcards
   └── CreateFlashcardsContainer.tsx
       ├── SourceTextInput.tsx → API: POST /api/generations/generate-candidates
       ├── CandidateReviewList.tsx (Accept/Edit/Delete)
       └── SaveAllButton.tsx → API: POST /api/flashcards

4. /my-flashcards (with cards)
   └── MyFlashcardsView.tsx
       ├── FlashcardGrid.tsx (displays cards)
       ├── FlashcardAddEditModal.tsx → API: PUT /api/flashcards/[id]
       └── ConfirmationModal.tsx → API: DELETE /api/flashcards/[id]

5. /study-session
   └── StudySession.tsx
       ├── API: GET /api/flashcards/due
       ├── StudySessionActive.tsx (grade cards)
       ├── API: POST /api/flashcards/[id]/review
       └── StudySessionComplete.tsx
```

**Why test:**
Validates the entire application flow from registration to study. Catches integration issues between features.

---

## Low-Priority (Skip for MVP)

**Elements not recommended for E2E testing:**

- Individual UI component styling (use visual regression tests instead)
- API endpoint responses in isolation (use integration tests)
- Form validation error messages (covered by unit tests on schemas)
- Loading states and spinners (flaky and low value)
- Responsive design breakpoints (use visual regression tests)

---

## Why This Testing Strategy?

1. **User-Centric:** E2E tests validate complete user journeys, not isolated components
2. **Integration Confidence:** Tests verify frontend, backend, and database work together
3. **Regression Prevention:** Critical flows are protected from breaking changes
4. **Business Value:** Tests map directly to user stories in PRD
5. **Realistic Scenarios:** Tests use real browser, real database, real API calls

---

## Recommended Test Structure

```
tests/e2e/
├── auth/
│   ├── registration.spec.ts
│   ├── login.spec.ts
│   ├── logout.spec.ts
│   ├── password-recovery.spec.ts
│   └── account-management.spec.ts
├── flashcards/
│   ├── ai-generation.spec.ts
│   ├── manual-creation.spec.ts
│   ├── flashcard-list.spec.ts
│   ├── search-pagination.spec.ts
│   └── edit-delete.spec.ts
├── study-session/
│   ├── study-flow.spec.ts
│   └── empty-states.spec.ts
└── integration/
    └── end-to-end-journey.spec.ts
```

---

## Test Data Strategy

### Setup Fixtures

- Seed database with flashcards in various states (new, due, reviewed)
- Use Supabase test database instance

### Cleanup Strategy

- Use `beforeEach` to reset test user state
- Delete generated flashcards after each test
- Use database transactions or snapshots for isolation

### Test User And Database Data

- Data for test user and test database to use during is available in .env.test file.

---

## Page Object Model (POM) Structure

Following Playwright best practices, implement POM for maintainability:

```typescript
// tests/e2e/pages/LoginPage.ts
export class LoginPage {
  constructor(private page: Page) {}

  async navigate() {
    await this.page.goto("/login");
  }

  async login(email: string, password: string) {
    await this.page.fill('[name="email"]', email);
    await this.page.fill('[name="password"]', password);
    await this.page.click('button[type="submit"]');
  }

  async getErrorMessage() {
    return this.page.textContent('[role="alert"]');
  }
}
```

---

## Implementation Priority

**Phase 1 (Critical - MVP Blocker):**

1. `auth/login.spec.ts` - Must work for any user access
2. `auth/registration.spec.ts` - Entry point for new users
3. `flashcards/ai-generation.spec.ts` - Core value proposition
4. `study-session/study-flow.spec.ts` - Core learning feature

**Phase 2 (Important - MVP Quality):** 5. `flashcards/manual-creation.spec.ts` - Fallback creation method 6. `flashcards/flashcard-list.spec.ts` - Default landing page 7. `flashcards/edit-delete.spec.ts` - Card management 8. `auth/logout.spec.ts` - Session security

**Phase 3 (Nice to have - Post-MVP):** 9. `flashcards/search-pagination.spec.ts` - UX enhancement 10. `auth/password-recovery.spec.ts` - Account recovery 11. `auth/account-management.spec.ts` - Account settings 12. `integration/end-to-end-journey.spec.ts` - Full flow validation

---

## Testing Guidelines

### Playwright Best Practices

- Use Chromium/Desktop Chrome only (per project rules)
- Implement Page Object Model for maintainable tests
- Use locators with `getByRole`, `getByLabel`, `getByText` for resilience
- Use locators with `getByTestId` only when above locators will not work correctly
- Leverage `expect(page).toHaveScreenshot()` for visual comparison
- Use trace viewer for debugging failures (`trace: 'on-first-retry'`)
- Implement test hooks (`beforeEach`, `afterEach`) for setup/teardown
- Use specific matchers: `toBeVisible()`, `toHaveText()`, `toHaveURL()`
- Leverage parallel execution for faster test runs

### Test Isolation

- Each test should be independent and runnable in any order
- Use unique test data per test (e.g., timestamp in email)
- Clean up test data in `afterEach` hooks
- Use browser contexts for isolating test environments

### Assertions

- Verify navigation with `await expect(page).toHaveURL('/expected-path')`
- Verify visibility with `await expect(element).toBeVisible()`
- Verify text content with `await expect(element).toHaveText('expected')`
- Wait for network requests with `await page.waitForResponse()`

### Error Handling

- Use `test.fail()` for known issues
- Add retry logic for flaky network requests
- Capture screenshots on failure (automatic in Playwright)
- Use `test.slow()` for tests that need more time

---

## Success Metrics

- All critical user journeys (Phase 1) have E2E coverage
- Tests run in <3 minutes for full suite
- Zero flaky tests (consistent pass/fail)
- Tests catch regressions before production
- Test failures clearly indicate which user story broke
- 100% of PRD user stories have corresponding E2E tests

---

## CI/CD Integration

```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install chromium
      - run: npm run build
      - run: npm run test:e2e
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_TEST_URL }}
          SUPABASE_KEY: ${{ secrets.SUPABASE_TEST_KEY }}
          E2E_USERNAME: ${{ secrets.E2E_USERNAME }}
          E2E_PASSWORD: ${{ secrets.E2E_PASSWORD }}
```

---

## Maintenance Strategy

- Review and update tests when user stories change
- Refactor POM classes when UI structure changes
- Keep test data fixtures up to date with schema changes
- Monitor test execution time and optimize slow tests
- Document flaky tests and root causes
- Regular review of test coverage vs. PRD requirements
