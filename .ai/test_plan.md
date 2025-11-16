# 10xCards - Comprehensive Test Plan

## 1. Introduction and Test Objectives

### 1.1 Introduction

This document outlines the testing plan for the **10xCards** application, a web platform for creating and managing educational flashcards. The application is built on a modern stack including Astro, React, Supabase, and an external AI API (OpenRouter) for content generation. It allows users to generate flashcards from source text, create them manually, and manage their collection.

### 1.2 Test Objectives

The primary goal of the testing process is to ensure the highest quality, stability, and security of the 10xCards application before its production deployment.

Specific objectives include:

- **Functional Verification:** Confirm that all key features (authentication, AI generation, flashcard CRUD, account management) function according to specifications.
- **Security Assurance:** Verify that user data is properly isolated (RLS) and that the system is resilient against basic security threats.
- **Integration Validation:** Check the correctness of integrations with external services, particularly Supabase (Auth, DB) and OpenRouter (AI).
- **Usability (UX/UI) Assessment:** Ensure the application is intuitive, responsive, and visually consistent across different devices and in both light and dark themes.
- **Defect Identification and Reporting:** Systematically detect, document, and track defects to ensure their resolution.

---

## 2. Test Scope

### 2.1 In-Scope Functionality

- **Authentication Module:**
  - New user registration.
  - Login (with valid and invalid credentials).
  - Logout.
  - Password recovery.
  - Password reset.
- **Route Protection (Middleware):**
  - Access to protected pages (e.g., `/my-flashcards`, `/create-flashcards`) only for authenticated users.
  - Redirection of authenticated users from public pages (e.g., `/login`) to the app.
- **Flashcard Creation (`/create-flashcards` page):**
  - AI-powered flashcard generation (`POST /api/generations/generate-candidates`):
    - Source text validation (min/max length).
    - Loading state handling.
    - API error handling (including OpenRouter errors).
  - Review process for generated candidates:
    - Accept (`onAccept`).
    - Edit (`onEdit`) and save changes (`FlashcardAddEditModal`).
    - Delete (`onDelete`).
  - Manual flashcard creation (`ManualAddButton`).
  - Saving flashcards (`SaveAllButton`):
    - Saving only "accepted" and "edited" cards.
    - Partial save logic (`ConfirmPartialSaveModal`).
    - Re-generation logic (`ConfirmRegenerateModal`).
    - Correctly saving generation logs (`POST /api/generations`).
    - Correctly saving flashcards (`POST /api/flashcards`).
- **Flashcard Management (`/my-flashcards` page):**
  - Displaying the user's list of flashcards (`FlashcardGrid`).
  - Integration with `useFlashcards` and `@tanstack/react-query` (data fetching).
  - Pagination (`Pagination`).
  - Search (`SearchInput`).
  - Sorting.
  - Editing an existing flashcard (`PATCH /api/flashcards/[id]`).
  - Deleting a flashcard with confirmation (`DELETE /api/flashcards/[id]`).
  - Interactions with the `FlashCard` component (flipping).
- **Study Session (`/study-session` page):**
  - Fetching due flashcards (`GET /api/flashcards/due`).
  - Displaying flashcards one at a time with flip functionality by using "Show Answer" button interaction only.
  - Self-grading with "Forgot" (Rating.Again = 1) and "Knew" (Rating.Good = 3) buttons.
  - FSRS (Free Spaced Repetition Scheduler) algorithm integration:
    - Client-side SRS calculations using ts-fsrs library.
    - Conversion between database DTOs and FSRS Card objects.
    - Scheduling calculations based on user ratings.
  - Updating flashcard SRS metadata (`PATCH /api/flashcards/[id]/review`).
  - Progress tracking (card X of Y).
  - Session statistics (cards reviewed, forgot count, knew count).
  - Empty states:
    - No flashcards exist (US-021).
    - No flashcards due (US-022).
  - Session completion state (US-019).
  - Keyboard shortcuts (Space/Enter for show answer, 1/F for Forgot, 2/K for Knew).
  - Optimistic UI updates with background server synchronization.
  - Error handling and retry functionality.
- **Account Management (`/my-account` page):**
  - Password change (with current password validation).
  - Account deletion (with password confirmation, `DeleteAccountModal`).
- **User Interface (UI):**
  - Responsiveness (Mobile, Tablet, Desktop).
  - Theme toggle (Light/Dark).
  - Display of notifications (Toasts via `sonner`).
  - Loading states (`Skeleton`, `Spinner`).
  - Empty and error states (e.g., `CandidateReviewList`, `MyFlashcardsView`).

### 2.2 Out-of-Scope Functionality

- **Performance testing of external services:** We will not performance test the OpenRouter or Supabase APIs themselves; we will focus on the performance of _our_ application and API.
- **AI model quality testing:** We are not testing the _mSmerit_ of the generated flashcards (e.g., whether the AI "understood" the text well), only that the generation technically works and returns the correct data format.
- **Advanced FSRS features:** Custom FSRS parameters, 4-point rating scale (Hard/Easy), or adaptive parameter optimization are out of scope for MVP.
- **Study session persistence:** Saving incomplete sessions to resume later is not in scope.

---

## 3. Types of Testing

The 10xCards project will employ the following test types for comprehensive coverage:

1.  **Unit Tests:**
    - **Objective:** To verify small, isolated pieces of code (utility functions, React hooks).
    - **Scope:**
      - Validation functions (e.g., `src/lib/validation/*.schemas.ts`).
      - Helper functions (e.g., `src/lib/utils/flashcard-helpers.ts`, `src/lib/utils/fsrs.ts`).
      - React hook logic (e.g., `useCreateFlashcards`, `useStudySession`) with mocked dependencies (API).
      - FSRS utility functions: `convertToFSRSCard()`, `buildReviewCommand()`, `initializeFSRS()`.

2.  **Component Tests:**
    - **Objective:** To test React components in isolation, simulating user interactions.
    - **Scope:**
      - Interactive UI components (e.g., `FlashCard.tsx`, `FlashcardAddEditModal.tsx`).
      - Components with conditional logic (e.g., `CandidateReviewList.tsx` - testing loading, error, and empty states).
      - Forms (e.g., `LoginForm.tsx`, `SourceTextInput.tsx`) - testing validation and `disabled` states.

3.  **Integration Tests:**
    - **Objective:** To verify cooperation between different parts of the system.
    - **Scope:**
      - Integration of front-end components (React) with data-fetching hooks (e.g., `MyFlashcardsView` with `useFlashcards`).
      - Integration of server-side logic (e.g., `flashcard.service.ts` with `database.types.ts`).
      - Integration with the AI API (`openrouter.service.ts`) - tests with mocked and (occasionally) real API calls.

4.  **API (Back-end) Tests:**
    - **Objective:** To directly verify API endpoints (in `src/pages/api`) for business logic, validation, and security.
    - **Scope:** Testing every endpoint (GET, POST, PATCH, DELETE) for the `auth`, `flashcards`, and `generations` resources. This includes:
      - Happy paths and error scenarios.
      - Zod validation for request/response schemas.
      - Authentication and RLS policy enforcement.
      - Study session endpoints: `GET /api/flashcards/due` and `PATCH /api/flashcards/[id]/review`.

5.  **End-to-End (E2E) Tests:**
    - **Objective:** To simulate complete user flows in a browser, from start to finish.
    - **Scope:** Key business scenarios, e.g., "User registers, logs in, generates AI flashcards, reviews them, saves them, then finds them in 'My Flashcards' and deletes one."

6.  **Security Tests:**
    - **Objective:** To verify basic security aspects, especially data isolation.
    - **Scope:**
      - Verifying Supabase RLS policies: Attempting to fetch/modify another user's data via direct API calls with a different resource ID.
      - Testing API endpoint protection (requires authentication token).
      - Testing middleware (route protection).

7.  **Usability and Compatibility (Cross-Browser/Responsive) Tests:**
    - **Objective:** To ensure consistent and correct behavior across different browsers and screen sizes.
    - **Scope:** Manual and/or automated E2E tests on various viewports (mobile, desktop) and in major browsers (Chrome, Firefox, Safari).

---

## 4. Test Scenarios (Key Functionality)

Below are high-priority sample test scenarios. The full list will be managed in a Test Management System (TMS).

### 4.1 Authentication and Authorization (P0)

| ID           | Scenario                                                 | Expected Result                                                                 | Test Type      |
| :----------- | :------------------------------------------------------- | :------------------------------------------------------------------------------ | :------------- |
| **AUTH-001** | User registers with valid and unique credentials         | User is successfully registered and redirected to `/my-flashcards`.             | E2E, API       |
| **AUTH-002** | User attempts to register with an existing email         | `RegisterForm` displays the error "An account with this email already exists".  | E2E, API       |
| **AUTH-003** | User logs in with correct credentials                    | User is successfully logged in and redirected to `/my-flashcards`.              | E2E, API       |
| **AUTH-004** | User attempts to log in with an incorrect password       | `LoginForm` displays the error "Invalid email or password".                     | E2E, API       |
| **AUTH-005** | Unauthenticated user attempts to access `/my-flashcards` | User is redirected to `/login`.                                                 | E2E (Security) |
| **AUTH-006** | Authenticated user attempts to access `/login`           | User is redirected to `/my-flashcards`.                                         | E2E (Security) |
| **AUTH-007** | User (A) attempts to fetch User (B)'s flashcard via API  | `GET /api/flashcards/[id]` returns 404 Not Found (or 403 Forbidden) due to RLS. | API (Security) |

### 4.2 Flashcard Generation and Saving (P0)

| ID          | Scenario                                                    | Expected Result                                                                                                                                                 | Test Type        |
| :---------- | :---------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------- |
| **GEN-001** | User enters valid text (1k-10k chars) and clicks "Generate" | A loading state (`Spinner`) is displayed. After a moment, `CandidateReviewList` is populated with flashcards. A `success` toast is shown.                       | E2E              |
| **GEN-002** | User attempts to generate with text < 1000 chars            | The "Generate" button is `disabled`. A validation error message is displayed.                                                                                   | E2E, Component   |
| **GEN-003** | AI API (`OpenRouter`) returns an error (e.g., 500 or 429)   | The loading state disappears. `CandidateReviewList` displays an error message fetched from the API.                                                             | E2E, Integration |
| **GEN-004** | User accepts, edits, and deletes candidates                 | The accepted card changes style. The deleted card disappears from the list. Edit opens a modal and saves changes.                                               | E2E, Component   |
| **GEN-005** | User clicks "Save Cards" with only accepted/edited cards    | An `isSaving` loading state is shown. Data is sent to `POST /api/flashcards`. User sees a `success` toast, and the page state (`useCreateFlashcards`) is reset. | E2E              |
| **GEN-006** | User clicks "Save Cards" with unreviewed AI cards           | The `ConfirmPartialSaveModal` opens. Clicking "Cancel" closes the modal. Clicking "Discard & Save" proceeds with the save (as in GEN-005).                      | E2E              |
| **GEN-007** | User adds a flashcard manually                              | `FlashcardAddEditModal` opens in "add" mode. After saving, the new card appears in the list with `accepted` status and `manual` source.                         | E2E              |
| **GEN-008** | API Validation for `POST /api/flashcards`                   | Attempting to send a flashcard with `front` > 200 chars returns a 400 (Zod) error.                                                                              | API              |

### 4.3 Flashcard Management (P1)

| ID           | Scenario                                     | Expected Result                                                                                                                                      | Test Type      |
| :----------- | :------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------- | :------------- |
| **CRUD-001** | User opens the `/my-flashcards` page         | The page displays a `FlashcardGrid` with the user's flashcards.                                                                                      | E2E            |
| **CRUD-002** | User uses the search bar                     | The flashcard list is dynamically filtered (with debouncing) based on `front` or `back` text.                                                        | E2E            |
| **CRUD-003** | User changes sorting to "Front (A-Z)"        | The list of flashcards is reloaded and sorted alphabetically by the `front` field. The URL is updated.                                               | E2E            |
| **CRUD-004** | User navigates to the next page (Pagination) | The next set of results is displayed. The URL is updated. The "Previous" button becomes active.                                                      | E2E            |
| **CRUD-005** | User edits a flashcard                       | `FlashcardAddEditModal` opens. After saving, the modal closes, and the card in the list has updated content. `PATCH /api/flashcards/[id]` is called. | E2E            |
| **CRUD-006** | User deletes a flashcard                     | `ConfirmationModal` opens. After confirmation, the flashcard disappears from the list. `DELETE /api/flashcards/[id]` is called.                      | E2E            |
| **CRUD-007** | User has no flashcards                       | `MyFlashcardsView` displays an "Empty" state with a CTA button to `/create-flashcards`.                                                              | E2E, Component |

### 4.4 Study Session (P0)

| ID            | Scenario                                                        | Expected Result                                                                                                                                              | Test Type         |
| :------------ | :-------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------- |
| **STUDY-001** | User navigates to `/study-session` with no flashcards           | `StudySessionEmpty` component is displayed with message "You don't have any flashcards to study" and CTA button to `/create-flashcards`.                     | E2E, Component    |
| **STUDY-002** | User navigates to `/study-session` with flashcards but none due | `StudySessionEmpty` component is displayed (simplified MVP behavior - treats same as no cards).                                                              | E2E, Component    |
| **STUDY-003** | User starts study session with due cards                        | `StudySessionActive` displays first card front, progress indicator ("Card 1 of X"), and "Show Answer" button. Grading buttons are hidden.                    | E2E               |
| **STUDY-004** | User clicks "Show Answer" button                                | Card flips to show back text. "Show Answer" button disappears. Grading buttons (Forgot/Knew) appear.                                                         | E2E, Component    |
| **STUDY-005** | User presses Space or Enter key (answer hidden)                 | Card flips to show back text (same as clicking "Show Answer").                                                                                               | E2E               |
| **STUDY-006** | User clicks "Forgot" button                                     | FSRS calculates new schedule with Rating.Again (1). UI advances to next card. `PATCH /api/flashcards/[id]/review` is called. Stats increment forgotCount.    | E2E, Integration  |
| **STUDY-007** | User clicks "Knew" button                                       | FSRS calculates new schedule with Rating.Good (3). UI advances to next card. `PATCH /api/flashcards/[id]/review` is called. Stats increment knewCount.       | E2E, Integration  |
| **STUDY-008** | User presses 1 or F key (answer revealed)                       | Card is graded as "Forgot" (same as clicking "Forgot" button).                                                                                               | E2E               |
| **STUDY-009** | User presses 2 or K key (answer revealed)                       | Card is graded as "Knew" (same as clicking "Knew" button).                                                                                                   | E2E               |
| **STUDY-010** | User grades the last card in session                            | `StudySessionComplete` component displays with congratulations message, session stats, and "Return to my flashcards" button.                                 | E2E               |
| **STUDY-011** | User clicks "Return to my flashcards" after completion          | User is navigated to `/my-flashcards` page.                                                                                                                  | E2E               |
| **STUDY-012** | API returns error during initial fetch (GET /flashcards/due)    | `StudySessionError` component displays with error message and "Retry" button.                                                                                | E2E, Integration  |
| **STUDY-013** | User clicks "Retry" button after error                          | `fetchDueCards()` is called again, loading state is shown.                                                                                                   | E2E               |
| **STUDY-014** | API returns error during card review (PATCH)                    | Error is logged to console. UI continues to next card (optimistic update). User is not blocked.                                                              | E2E, Integration  |
| **STUDY-015** | FSRS calculation throws error                                   | Error is caught and logged. Session continues (graceful degradation).                                                                                        | Integration       |
| **STUDY-016** | User attempts to grade before revealing answer                  | Grading buttons are not rendered/clickable. Keyboard shortcuts are ignored.                                                                                  | E2E, Component    |
| **STUDY-017** | Progress indicator updates correctly                            | After each card is graded, progress shows "Card X of Y" with correct incremented index.                                                                      | E2E               |
| **STUDY-018** | Session stats are calculated correctly                          | After session completion, stats show correct totalReviewed, forgotCount, knewCount, startTime, and endTime.                                                  | E2E, Unit         |
| **STUDY-019** | New card (no SRS data) is scheduled correctly                   | Card with null srs_state/srs_due is converted to FSRS empty card with default values. Scheduling works correctly.                                            | Integration, Unit |
| **STUDY-020** | Existing card (with SRS data) is scheduled correctly            | Card with existing SRS metadata is converted to FSRS Card with correct state, stability, difficulty. Next review date is calculated based on FSRS algorithm. | Integration, Unit |
| **STUDY-021** | API Validation for `PATCH /api/flashcards/[id]/review`          | Sending invalid rating (e.g., 5) returns 400 Zod validation error. Sending missing required fields returns 400 error.                                        | API               |
| **STUDY-022** | User (A) attempts to review User (B)'s flashcard                | `PATCH /api/flashcards/[id]/review` returns 404 Not Found due to RLS policy.                                                                                 | API (Security)    |
| **STUDY-023** | Unauthenticated user attempts to access `/study-session`        | User is redirected to `/login` by middleware.                                                                                                                | E2E (Security)    |

### 4.5 Account Management (P2)

| ID          | Scenario                                                            | Expected Result                                                            | Test Type |
| :---------- | :------------------------------------------------------------------ | :------------------------------------------------------------------------- | :-------- |
| **ACC-001** | User changes password with the correct current password             | The password is changed. A success message is displayed.                   | E2E, API  |
| **ACC-002** | User attempts to change password with an incorrect current password | The form displays the error "Current password is incorrect".               | E2E, API  |
| **ACC-003** | User deletes their account with the correct password                | The account is deleted. The user is logged out and redirected to `/login`. | E2E, API  |

---

## 5. Test Environment

The testing process will utilize three main environments:

1.  **Local:**
    - **Purpose:** Development and running unit/component tests by developers.
    - **Specification:** Developer's local machine running the app (`npm run dev`) and a local or remote (dev) Supabase instance.

2.  **Staging:**
    - **Purpose:** The primary environment for Integration, API, E2E, and UAT testing. It should be an exact replica of the production environment.
    - **Specification:** Deployed on a hosting platform (e.g., Vercel, Netlify) connected to a dedicated Supabase (staging) database. API keys (OpenRouter) should be configured for this environment.

3.  **Production:**
    - **Purpose:** Smoke tests after each deployment to verify critical paths.
    - **Specification:** The live, public-facing application.

---

## 6. Test Tooling

- **Test Framework (Unit/Component/Integration):** [**Vitest**](https://vitest.dev/) (integrated with Vite/Astro).
- **Component Testing Library:** [**React Testing Library**](https://testing-library.com/docs/react-testing-library/intro/) (for testing `.tsx` components).
- **E2E Tests:** [**Playwright**](https://playwright.dev/) (chosen for its speed, reliability, and cross-browser capabilities).
- **API Tests (Manual/Automated):** [**Postman**](https://www.postman.com/) (for exploration and manual API tests) and API tests integrated within Playwright or Vitest.
- **API Mocking:** [**Mock Service Worker (MSW)**](https://mswjs.io/) (for mocking `fetch` for component and E2E tests) or native Vitest mocks (`vi.fn()`).
- **FSRS Library:** [**ts-fsrs**](https://github.com/open-spaced-repetition/ts-fsrs) v5.2.3+ (for spaced repetition algorithm - unit tests for utility functions).
- **CI/CD:** [**GitHub Actions**](https://github.com/features/actions) (to automatically run unit tests, linting, and builds on every push/PR).
- **Bug Tracking:** [**GitHub Issues**](https://github.com/features/issues) (or a dedicated tool like Jira/ClickUp if available).

---

## 7. Test Schedule (Sample Sprint Cycle)

This plan assumes an iterative development process (e.g., 2-week sprints).

- **Week 1: Development and Continuous Testing**
  - **Day 1-5:** Developers implement new features and write unit/component tests.
  - **Day 1-5:** QA Engineer prepares new test scenarios (E2E, API) for upcoming features.
  - **CI:** Unit tests and linting run automatically on every commit.

- **Week 2: Stabilization and Regression Testing**
  - **Day 6-7:** Features are deployed to the **Staging** environment.
  - **Day 7-8:** QA Engineer executes tests for new features (E2E, API) and performs exploratory testing on Staging. Bugs are reported.
  - **Day 9:** Developers fix reported bugs (Bugfixing).
  - **Day 10:** Full regression (automated and manual) is run on Staging.
  - **End of Week:** Go/No-Go decision for production deployment.

- **Post-Deployment (Deployment Day):**
  - Execution of **Smoke Tests** on the Production environment to verify critical paths (login, main page).

---

## 8. Acceptance Criteria

### 8.1 Entry Criteria (Start of Test Cycle)

- Code has been successfully built and deployed to the test (Staging) environment.
- All unit and integration tests in the CI pipeline have passed.
- Documentation for new features (if any) is available.

### 8.2 Exit Criteria (End of Test Cycle / Go-Live Approval)

- All automated E2E tests are passing.
- 100% of **P0** (Critical) priority test scenarios have been executed and passed.
- At least 95% of **P1** (High) priority test scenarios have been executed and passed.
- No known P0 (Critical) or P1 (High) bugs remain open.
- All known lower-priority bugs (P2, P3) are documented and accepted by the Product Owner for fixing in future iterations.

---

## 9. Roles and Responsibilities

- **Product Owner / Project Manager:**
  - Defining requirements and acceptance criteria.
  - Prioritizing bugs.
  - Making the final Go/No-Go decision based on QA reports.
- **Developers (Frontend/Backend):**
  - Writing unit and component tests for their code.
  - Fixing bugs reported by QA.
  - Maintaining the CI/CD pipeline.
- **QA Engineer:**
  - Creating, maintaining, and executing this test plan.
  - Automating E2E and API scenarios.
  - Performing manual tests (exploratory, regression).
  - Reporting and tracking bugs.
  - Communicating quality status and risks.

---

## 10. Bug Reporting Procedures

All detected defects will be reported in **GitHub Issues** (or another chosen TMS).

### 10.1 Bug Report Format

Every bug report must include:

- **Title:** A concise and clear summary of the issue (e.g., "[Login] 'Login' button is unresponsive after entering an incorrect password").
- **Environment:** (e.g., Staging, Production, Local).
- **Browser / Device:** (e.g., Chrome 125.0, Mobile Safari iOS 17).
- **Priority:**
  - **P0 (Blocker/Critical):** Blocks key functionality (e.g., login, saving flashcards), no workaround.
  - **P1 (High):** A major functional bug that impedes app usage, but a workaround exists.
  - **P2 (Medium):** A minor functional bug or a significant UI issue.
  - **P3 (Low):** A minor cosmetic issue, typo.
- **Steps to Reproduce:**
  1.  Go to `/login`.
  2.  Enter valid email "user@test.com".
  3.  Enter incorrect password "123456".
  4.  Click "Login".
- **Actual Result:**
  - (Description of what happened, e.g., "Page reloads, the form is cleared, no error is shown").
- **Expected Result:**
  - (Description of what should have happened, e.g., "A red alert should appear below the form with the message 'Invalid email or password'").
- **Attachments:**
  - Screenshots, video recordings (GIF/MP4), browser console logs.

### 10.2 Bug Lifecycle

1.  **New:** Bug reported by QA.
2.  **In Triage / To Do:** Bug reviewed and accepted by PO/Lead Dev.
3.  **In Progress:** Developer has started working on a fix.
4.  **Ready for QA / In Review:** Fix has been deployed to the Staging environment.
5.  **In QA:** QA is verifying the fix on Staging.
    - **If OK -> Done/Closed:** The bug is fixed and verified.
    - **If Not OK -> Reopened:** The bug persists, returned to the Developer with comments.
