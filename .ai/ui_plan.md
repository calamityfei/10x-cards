# UI Architecture for 10xCards

## 1. UI Structure Overview

This UI architecture defines a secure, responsive web application for "10xCards". The structure is built using **Astro** for static pages and routing, with interactive "islands" powered by **React**.

- **Public Zone:** Consists of `Login` and `Register` pages. These are simple, centered forms.
- **Protected Zone:** Accessible only to authenticated users, enforced by **Astro middleware**. This zone includes all core application functionality (`/my-flashcards`, `/create-flashcards`, etc.) and features a **persistent, responsive header** for primary navigation.
- **Styling:** **Tailwind** and **Shadcn/ui** will be used for a consistent, accessible, and modern component-based design.
- **State Management:**
  - **Server State:** **React Query** manages all data fetching, caching, and invalidation for the flashcard list (`GET /flashcards`).
  - **Client State:** Local React state (`useState`) manages transient data, such as the AI candidate list on the "Create" page and form inputs.
- **Error Handling:** A combination of **inline error messages** for form validation and **Toasts** for asynchronous feedback (e.g., API errors, success messages) will be used. A global error handler will catch 401 Unauthorized responses and redirect to the login page.

---

## 2. View List

This section details the primary views (pages) of the application.

### 2.1. Login View

- **View Path:** `/login`
- **Access:** Public (Unauthenticated users only)
- **Main Purpose:** To authenticate an existing user (US-002).
- **Key Information:** Email and password fields.
- **Key View Components:**
  - `Card`: Wraps the login form.
  - `Form (React)`: Manages email, password, and submission state.
  - `Input` (Shadcn): For email and password.
  - `Button` (Shadcn): "Login" button with loading spinner on loading state.
  - `Link`: Navigational link to the `/register` view.
- **UX/Accessibility/Security:**
  - **UX:** Redirects to `/my-flashcards` on success. Displays a toast on auth failure.
  - **Accessibility:** Proper form labels, `aria-invalid` for errors.
  - **Security:** Astro middleware redirects authenticated users away from this page.

### 2.2. Register View

- **View Path:** `/register`
- **Access:** Public (Unauthenticated users only)
- **Main Purpose:** To create a new user account (US-001).
- **Key Information:** Email and password fields.
- **Key View Components:**
  - `Card`: Wraps the registration form.
  - `Form (React)`: Manages email, password, and submission state.
  - `Input` (Shadcn): For email and password.
  - `Button` (Shadcn): "Register" button with loading spinner on loading state.
  - `Link`: Navigational link to the `/login` view.
- **UX/Accessibility/Security:**
  - **UX:** Redirects to `/my-flashcards` on success. Displays inline errors for validation (e.g., weak password) and a toast for server errors (e.g., "Email already in use").
  - **Accessibility:** Proper form labels, password strength indicators.
  - **Security:** Astro middleware redirects authenticated users away from this page.

### 2.3. My Flashcards View

- **View Path:** `/my-flashcards`
- **Access:** Protected (Default page after login)
- **Main Purpose:** To list, search, and manage all the user's saved flashcards (US-012).
- **Key Information:** A grid of the user's flashcards, search bar, and pagination.
- **Key View Components:**
  - `Search Input`: A debounced text field for filtering cards (US-013).
  - `Flashcard Grid`: A responsive grid (Decision #8) of `Card` components.
  - `Flashcard Item`: A `FlashCard` component that displays "front" text. Flips on click to show "back" text (US-012). Includes "Edit" and "Delete" icon buttons (US-015, US-016).
  - `Pagination`: "Next" and "Previous" buttons (US-014).
  - `ReusableEmptyState`: (Decision #10) Shown if the user has 0 cards (US-020).
  - `FlashcardAddEditModal`: (See Key Components) Opened in "Edit Mode" by the "Edit" button.
  - `ConfirmationModal`: (See Key Components) Opened by the "Delete" button.
- **UX/Accessibility/Security:**
  - **UX:** Data is fetched via React Query, providing caching and auto-refresh on mutation (edit/delete). A skeleton loader is shown on the initial load.
  - **Accessibility:** Grid items are focusable, buttons are clearly labeled.
  - **Security:** All data is scoped to the authenticated user via RLS (API-level).

### 2.4. Create Flashcards View

- **View Path:** `/create-flashcards`
- **Access:** Protected
- **Main Purpose:** To generate new flashcards via AI (US-006) or create them manually (US-011).
- **Key Information:** Text area for source text, list of generated "candidates," and save controls.
- **Key View Components:**
  - `Textarea`: For pasting source text (1k-10k char validation).
  - `Button`: "Generate" button (shows spinner on click while in loading response state).
  - `Button`: "Add Manually" button (opens modal).
  - `Candidate Review List`: A list area that shows:
    - Skeleton loaders during generation.
    - An error message if AI fails (US-023).
    - A list of `CandidateCard` components.
  - `CandidateCard`: A `FlashCard` component showing "front" and "back" of a candidate.
    - **Actions:** "Accept" (icon), "Edit" (icon), "Delete" (icon) (US-007, 008, 009).
    - **State:** Unreviewed cards are greyed out. `accepted` and `edited` cards are full opacity with a green checkmark (Decision #2).
  - `Button`: A final "Save" button to persist all approved/edited/manual cards (US-010).
  - `FlashcardAddEditModal`: (See Key Components) Opened by "Add Manually" (Add Mode) or "Edit" (Edit Mode).
- **UX/Accessibility/Security:**
  - **UX:** The entire page is one complex React island. The review list is managed in local state. The two-step save (`POST /generations` -> `POST /flashcards`) is treated as one UI transaction.
  - **Accessibility:** All form elements and interactive cards are keyboard-navigable.
  - **Security:** Validation prevents oversize/undersize text submission.

### 2.5. Study Session View

- **View Path:** `/study-session`
- **Access:** Protected
- **Main Purpose:** To inform the user that the study feature is not yet available (Decision #5).
- **Key Information:** A "Coming Soon" message.
- **Key View Components:**
  - `ReusableEmptyState` (or similar container): Displays a user-friendly message, e.g., "Study Sessions will launch soon. We're working hard to bring you the best-in-class review experience!"
- **UX/Accessibility/Security:**
  - **UX:** This view acts as a placeholder, fulfilling the navigation requirement without implementing the deferred user stories (US-017, 018, 019, 021, 022).

### 2.6. My Account View

- **View Path:** `/my-account`
- **Access:** Protected
- **Main Purpose:** To allow users to change their password (US-004) or delete their account (US-005).
- **Key Information:** User's email (read-only), password change form, delete account section.
- **Key View Components:**
  - `Card`: One `Card` for "Change Password".
    - `Form (React)`: With fields for "Current Password," "New Password," and "Confirm New Password" (Decision #7).
    - `Button`: "Update Password" button.
  - `Card`: A second `Card` for "Delete Account".
    - `Text`: Warning message about permanent deletion.
    - `Button` (destructive variant): "Delete My Account".
  - `ConfirmationModal`: (See Key Components) Opened by the "Delete My Account" button.
- **UX/Accessibility/Security:**
  - **UX:** Clear separation of concerns. Toasts provide feedback on success/failure of password change.
  - **Accessibility:** Forms are properly labeled. Destructive actions are clearly marked.
  - **Security:** Requires current password to change password. Requires confirmation for account deletion.

---

## 3. User Journey Map

This map outlines the primary flow for a new user creating their first set of flashcards.

1.  **Start (Unauthenticated):** User lands on `/login`.
2.  **Navigate to Register:** User clicks the "Register" link.
3.  **View `/register`:**
    - User fills the registration form and submits.
    - On success, the user is authenticated and redirected.
4.  **View `/my-flashcards` (Default):**
    - The user sees the `ReusableEmptyState` component because their deck is empty (US-020).
    - User clicks the "Create flashcards" CTA in the empty state (or in the main header).
5.  **View `/create-flashcards`:**
    - **Action:** User pastes 4,000 characters of text and clicks "Generate".
    - **UI:** "Generate" button shows a spinner while in loading state. The review list shows skeleton loaders.
    - **API:** `POST /generations/generate-candidates` is called.
    - **UI:** The review list populates with `CandidateCard` components (greyed out).
    - **Action (Review):**
      - User clicks "Accept" on Card 1. (UI: Card 1 gets a green check, state = `accepted`).
      - User clicks "Edit" on Card 2. (UI: `FlashcardAddEditModal` opens, pre-filled).
      - User saves the modal. (UI: Card 2 gets a green check, state = `edited`).
      - User clicks "Delete" on Card 3. (UI: Card 3 is removed from the list).
    - **Action (Manual):**
      - User clicks "Add Manually". (UI: `FlashcardAddEditModal` opens, empty).
      - User fills and saves. (UI: A new card is added to the list with a green check).
    - **Action (Save):**
      - User clicks the final "Save" button.
      - **API 1:** `POST /generations` (logs metrics: 1 accepted, 1 edited, 1 deleted).
      - **API 2:** `POST /flashcards` (sends a batch of 3 cards: Card 1, Edited Card 2, Manual Card).
    - **UI:** On success, a "Flashcards saved!" toast appears, and the review list is cleared.
6.  **Navigate to `/my-flashcards`:**
    - User clicks "My Flashcards" in the persistent header.
7.  **View `/my-flashcards`:**
    - The user now sees their 3 saved flashcards in the responsive grid.
8.  **View `/my-account`:**
    - User navigates to their account page to manage settings.
9.  **Logout:**
    - User clicks "Logout" in the header and is redirected to `/login`.

---

## 4. Layout and Navigation Structure

The application layout is divided into two distinct zones, managed by Astro's file-based routing and middleware.

### 4.1. Public Layout (Unauthenticated)

- **Paths:** `/login`, `/register`
- **Structure:** A minimal layout with no header or navigation. Content is centered on the page.
- **Middleware Logic:** If an authenticated user tries to access these pages, the middleware will redirect them to `/my-flashcards`.

### 4.2. Protected Layout (Authenticated)

- **Paths:** `/my-flashcards`, `/create-flashcards`, `/study-session`, `/my-account`
- **Structure:** A persistent, responsive layout featuring the main header and a content area for the specific view.
- **Middleware Logic:** If an unauthenticated user tries to access these pages, the middleware will redirect them to `/login`.

### 4.3. Persistent Header Navigation (Decision #1)

This header is present on all pages within the Protected Layout.

- **Left Side (Shadcn Navigation Menu):**
  - `Link`: "My Flashcards" (to `/my-flashcards`)
  - `Link`: "Create Flashcards" (to `/create-flashcards`)
  - `Link`: "Study Session" (to `/study-session`)
  - `Link`: "My Account" (to `/my-account`)
- **Center:**
  - `Logo/Brand`: "10xCards" (links to `/my-flashcards`)
- **Right Side:**
  - `Button`: "Logout" (clears session, redirects to `/login`) (US-003)

---

## 5. Key Components

These are reusable React components (built with Shadcn/ui) used across multiple views to ensure consistency and maintainability.

- **`FlashCard`**
  - **Purpose:** A single reusable modal for visualizing all flashcards in the system: saved and candidate ones.
  - **Features:**
    - Displays "front" text initially.
    - Flip animation (horizontal) on click to show "back" text (US-012).
    - Includes "Edit" and "Delete" icon buttons (US-015, US-016) always. Additionally, "Accept" icon button for AI generated candidates on "Create Flashcards" page. Icons trigger specific action on click.
    - Has a slightly different looks in "unreviewed candidate" state to distinguish from approved ones - uses opacity or greyed-out filter.

- **`FlashcardAddEditModal`**
  - **Purpose:** A single reusable modal for both creating a new manual card (US-011) and editing an existing card (US-008, US-015).
  - **Features:**
    - Operates in "Add Mode" (empty fields) or "Edit Mode" (pre-filled).
    - Contains "front" and "back" `Textarea` fields.
    - Includes real-time character counters (e.g., "45 / 200") to prevent validation errors (Decision #9).
    - "Save" button triggers the relevant `onSave` action from props, like API call (`PATCH /flashcards/:id` in Edit Mode) or updates local state (in Add Mode on `/create-flashcards`).

- **`ConfirmationModal`**
  - **Purpose:** To prevent accidental destructive actions.
  - **Used For:**
    - Deleting a saved flashcard (US-016).
    - Deleting the user's account (US-005).
  - **Features:** A title (e.g., "Are you sure?"), descriptive text ("This action cannot be undone."), a "Cancel" button, and a "Confirm" (or "Delete") button with a destructive visual style.

- **`ReusableEmptyState` (Decision #10)**
  - **Purpose:** A standardized component for handling empty lists (might be built upon Shadcn/ui's `Empty` component).
  - **Used For:**
    - "My flashcards" page when the user has 0 cards (US-020).
  - **Features:** An icon, a heading ("Your deck is empty!"), a description, and a primary Call-to-Action (CTA) `Button` (e.g., "Create your first flashcard" linking to `/create-flashcards`).

- **`PersistentHeader`**
  - **Purpose:** The main navigation element for all authenticated users.
  - **Features:** Implements the layout described in section 4.3 (Left Menu, Center Logo, Right Logout). It is responsive and built with Shadcn navigation and button components.
