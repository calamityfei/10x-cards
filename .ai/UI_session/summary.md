## Conversation Summary

### Decisions

1.  A persistent, responsive header will be implemented using Tailwind for all authenticated pages. It will feature the "10xCards" logo at the center (linking to `/my-flashcards`), a "Menu" (Shadcn Navigation Menu) on the left with links to "My Flashcards," "Create Flashcards," "Study Session," and "My Account," and a "Logout" button on the right.
2.  On the "Create flashcards" page, AI candidates will have two distinct "approved" states for metric tracking: `accepted` (user clicked the "Accept" checkmark) and `edited` (user saved via the edit modal). Both states will render identically (green checkmark, no opacity).
3.  The "Study Session" page interaction will be distinct from browsing: a "Show answer" button will be placed _below_ the card, and only this button will trigger the flip animation.
4.  The multi-step save flow on the "Create" page (`POST /generations` then `POST /flashcards`) will be treated as a single transaction. If the final `POST /flashcards` call fails, an error toast will be shown, and the local state (candidates, metadata) will be preserved for a retry.
5.  The "Study Session" page functionality (US-017, US-018, US-019) will be deferred for the MVP. The page will exist but will display a static message: "Study Sessions will launch soon."
6.  On the "My flashcards" page, when a user types in the search bar, the pagination state (`currentPage`) will be programmatically reset to `1` to avoid fetching non-existent pages of filtered results.
7.  The "My Account" page (US-004) form for changing a password will be implemented with three fields for security: "Current Password," "New Password," and "Confirm New Password."
8.  The "My flashcards" page (US-012) will use a responsive grid of Shadcn `Card` components, not a simple list, to display flashcards.
9.  The universal "Add/Edit" modal will include real-time character counters for the "front" (max 200) and "back" (max 500) text areas to provide immediate validation feedback.
10. All "empty state" messages (US-020, US-021, US-022) will be implemented using a single, reusable "Empty State" React component built with Shadcn/ui.

---

### Matched Recommendations

1.  **Navigation:** Implement a persistent, responsive header with a logo, primary navigation links ("My Flashcards," "Create Flashcards," "Study Session"), and a user dropdown menu ("My Account," "Logout"). (Modified by user decision #1 to use a Shadcn Nav Menu on the left and a separate Logout button on the right).
2.  **AI Candidate State:** Treat "Accepted" and "Edited" cards as visually "approved" (e.g., remove opacity, show a checkmark) to confirm they are in the "to-be-saved" batch. (Refined by user decision #2 to track states as `accepted` vs. `edited` for metrics).
3.  **Study Interaction:** The "Study Session" page should strictly follow US-018, requiring a click on a dedicated "Show Answer" button, distinct from the browse-mode "click-to-flip" interaction. (Accepted by user decision #3).
4.  **Save Error Handling:** The UI should treat the two-step save as a single transaction. If the final `POST /flashcards` fails, show an error toast and preserve the local React state to allow the user to retry. (Accepted by user decision #4).
5.  **Study Session Logic:** (Initial recommendation for implementing the library was superseded by user decision #5 to defer the feature).
6.  **Search/Pagination:** When the `searchTerm` state changes, the `currentPage` state must be programmatically reset to `1`. (Accepted by user decision #6).
7.  **Account Security:** The "Change Password" form (US-004) should include "Current Password," "New Password," and "Confirm New Password" fields for better security. (Accepted by user decision #7).
8.  **Card Layout:** Proceed with a responsive grid of cards for the "My flashcards" page. (Accepted by user decision #8).
9.  **Modal Validation:** Add real-time character counters (e.g., "150 / 200") inside the universal modal for the "front" and "back" fields to prevent API validation errors. (Accepted by user decision #9).
10. **Empty States:** Use a standardized, reusable "Empty State" React component (with icon, heading, description, and CTA button) for all empty state scenarios (US-020, 021, 022). (Accepted by user decision #10).

---

### UI Architecture Planning Summary

#### a. Main UI Architecture Requirements

- **Framework:** The application will be built using **Astro 5** for the overall page structure, routing, and middleware.
- **Interactivity:** **React 19** will be used to create interactive "islands" for all dynamic sections of the application.
- **Styling:** **Tailwind 4** will be used for all styling, complemented by the **Shadcn/ui** component library for accessible, pre-built components (Cards, Buttons, Modals, etc.).
- **Data Fetching:** **React Query** will be used for server-state management, specifically for fetching, caching, and updating the flashcard list.
- **State:**
  - **Server State:** Managed by React Query (e.g., the paginated list on `/my-flashcards`).
  - **Client State:** Managed within individual React components using `useState` (e.g., the transient candidate list on `/create-flashcards`, form inputs).

#### b. Key Views, Screens, and User Flows

1.  **Public Views (Astro Pages with React Islands):**
    - `/login`: React form for user login (US-002).
    - `/register`: React form for new user registration (US-001).

2.  **Protected Views (Handled by Astro Middleware):**
    - **Persistent Header:** A responsive header (per decision #1) will be present on all protected pages.
    - `/my-flashcards` (Default Page):
      - **View:** A React island displaying a responsive grid of `Card` components (US-012, decision #8).
      - **Data:** Fetched via React Query from `GET /flashcards`.
      - **Interactions:**
        - **Search (US-013):** A debounced search input that filters the list.
        - **Pagination (US-014):** Controls to navigate pages. Resets to 1 on search (decision #6).
        - **Edit (US-015):** Opens the universal modal in "Edit Mode."
        - **Delete (US-016):** Opens a confirmation modal before calling `DELETE /flashcards/:id`.
      - **Empty State (US-020):** Shows the reusable "Empty State" component (decision #10).
    - `/create-flashcards`:
      - **View:** A single, complex React island managing the entire creation process.
      - **Flow 1: AI Generation (US-006):**
        1.  User pastes text (1k-10k chars) into a `Textarea`.
        2.  User clicks "Generate." Button shows a spinner; a skeleton loader appears in the candidate list area.
        3.  Calls `POST /generations/generate-candidates`.
        4.  Renders candidates as `Card` components with an opacity or grey filter applied on unreviewed ones, and action icons ("Accept," "Edit," "Delete").
      - **Flow 2: AI Review (US-007, 008, 009):**
        1.  Clicking "Accept" changes the card state to `accepted` and updates visual (decision #2).
        2.  Clicking "Edit" opens the universal modal; on save, card state changes to `edited` (decision #2).
        3.  Clicking "Delete" removes the card from local state.
      - **Flow 3: Manual Creation (US-011):**
        1.  Clicking "Add Manually" opens the universal modal in "Add Mode."
        2.  On save, the new card is added directly to the local state, in "approved" state (client-side only).
      - **Flow 4: Final Save (US-010):**
        1.  User clicks the final "Save" button.
        2.  Client orchestrates the two-step API call (first `POST /generations` for metrics, then `POST /flashcards` with the batch of cards) as per decision #4.
        3.  On success, the local state is cleared. On failure, state is preserved for retry.
    - `/study-session`:
      - **View:** A static page displaying the message "Study Sessions will launch soon" (decision #5). All study-related user stories (US-017, 018, 019) and empty states (US-021, 022) are deferred.
    - `/my-account`:
      - **View:** A React form.
      - **Flow 1: Change Password (US-004):** Form with "Current," "New," and "Confirm New" password fields (decision #7).
      - **Flow 2: Delete Account (US-005):** A "Delete Account" button that triggers a confirmation modal.

#### c. API Integration and State Management

- **API Client:** A simple wrapper (e.g., using `fetch`) will be used, integrated with Supabase's auth client to automatically include the JWT bearer token.
- **State Management:**
  - **React Query:** Will be the SWR (stale-while-revalidate) solution for all `GET` requests, primarily `GET /flashcards`. Its key will include `searchTerm` and `currentPage`.
  - **Local Component State:** The `candidates` list on the "Create" page will be managed entirely in React `useState` until the final "Save" action.
- **Loading States:**
  - **Buttons:** Will show an internal spinner and be disabled during API calls.
  - **Lists:** Skeleton loaders will be used for the initial load of `/my-flashcards` and the AI candidate list.
- **Error Handling:**
  - **Toasts (Shadcn/ui):** Used for non-blocking, asynchronous errors (e.g., 502 Bad Gateway from AI, "Save failed") and success messages ("Flashcards saved!").
  - **In-line Errors:** Used for synchronous 400-level validation errors (e.g., "Text must be over 1,000 characters").
  - **Global 401:** A global error handler will catch 401 Unauthorized responses, log the user out (clear session), and redirect to `/login`.

#### d. Responsiveness, Accessibility, and Security

- **Responsiveness:** Tailwind's responsive breakpoints will be used for the header (decision #1) and the `Card` grid (adapting from 1 to 2 to auto-fit columns).
- **Accessibility:** Will be primarily achieved by correctly implementing the Shadcn/ui component library.
- **Security (UI-Level):**
  - **Route Protection:** Astro middleware will check for a valid Supabase session token on all protected routes and redirect to `/login` if absent.
  - **Auth Redirects:** The middleware will also redirect already-authenticated users from `/login` or `/register` to `/my-flashcards`.
  - **Logout:** The "Logout" button will clear the Supabase session and redirect to `/login`.
  - **Sensitive Actions:** All destructive actions ("Delete Flashcard," "Delete Account") will require a confirmation modal.

---

### Unresolved Issues

1.  **Spaced Repetition Schema:** The "Study Session" feature is deferred (decision #5). However, the current `flashcards` resource in the API plan (`GET /flashcards`, `PATCH /flashcards/:id`) does not include any fields to store spaced repetition data (e.g., `due_date`, `interval`, `ease_factor`). Before the "Study Session" feature can be built, the database schema and API endpoints must be updated to support storing and retrieving this data.
