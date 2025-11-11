Here is the list of questions and recommendations to help build UI:

1st phase:

Question: Given the tech stack (Astro for static pages, React for interactive islands), which specific areas should be built as interactive React components versus static Astro pages? Recommendation: Define clear "islands of interactivity." The primary candidates for React components are:

- The entire "Create flashcards" page (managing the text input, AI generation, and the client-side candidate review list).
- The "My flashcards" page (handling the dynamic list, search, pagination, and edit/delete actions).
- The "Study Session" page (for the card-flipping and grading logic).
- All authentication forms ("Login", "Register", "My Account").
  Static content pages (like a potential "About" or "Landing" page) can be pure Astro.

Answer:
Interactive React components:

- Main "My flashcards" page - handling the dynamic list of flashcards, search, pagination, and edit/delete actions (edit on universal reusable modal, delete with confirmation modal).

- "Create flashcards" page - managing the source text input for AI generation, the candidate review list, triggering universal modal for manual add of flashcard or created flashcard candidate edit.

- "Study Session" page - the card-flipping functionality and grading logic using external library.

- All authentication forms ("Login", "Register", "My Account").

Most of the application will be built upon interactive components.

Question: How should the "universal modal" (mentioned in US-008, US-011, US-015) differentiate its logic for editing a transient AI candidate (client-side state) versus editing a saved flashcard (which requires a PATCH /flashcards/:id API call)?

Recommendation: The modal component (from Shadcn/ui) should be stateless and controlled by its parent. It should receive an onSave callback function as a prop.

On the "My flashcards" page, the onSave prop will execute the PATCH /flashcards/:id API call.

On the "Create flashcards" page, the onSave prop will simply update the item in the local React state (the candidate list), not call an API.

Answer: The modal component (from Shadcn/ui) should be stateless and controlled by its parent. It should receive an `onSave` callback function as a prop. On the "My flashcards" page, the `onSave` prop will execute the PATCH /flashcards/:id API call. On the "Create flashcards" page, the `onSave` prop will simply update the item (edit mode) or add a new flashcard (add mode) to the local React state (the candidate list), not call an API. The dual-mode functionality should be achieved be implementing `mode` prop when calling modal.

Question: How should the client orchestrate the two-step save process described in the API plan (US-010), which involves first logging metrics (POST /generations) and then saving the cards (POST /flashcards)?

Recommendation: When the user clicks the final "Save" button on the "Create" page, the client-side function should:

First, await a call to POST /generations with the metric log (counts of accepted, edited, deleted).

On success, retrieve the generation_id from the response.

Append this generation_id to all AI-generated cards in the local state.

Finally, await the call to POST /flashcards with the complete batch of all "Accepted" and "Edited" cards (both AI and manual).

Answer: When the user clicks the final "Save" button on the "Create flashcards" page, the client-side function should:

a. Check if there were any flashcards generated using AI generation service (we have received and stored `GenerateCandidatesResponseDto` type response from it in the local state). If not, and only manually added flashcard candidates are on the review list, move directly to step `e`.

b. Await a call to POST `/generations` with the metric log (counts of accepted, edited, deleted) and other necessary metadata from AI generation.

c. On success, retrieve the `generation_id` from the response.

d. Append this `generation_id` to all AI-generated cards in the local state.

e. Finally, await the call to POST `/flashcards` with the complete batch of all "Accepted" and "Edited" cards (both AI and manual if present).

Question: What is the strategy for handling client-side state for the asynchronous search and pagination on the "My flashcards" page (US-013, US-014)?

Recommendation: Use a client-side data-fetching library like SWR or React Query within the "My flashcards" React island. Store searchTerm and currentPage in React state. Use a "debouncing" hook (e.g., 300ms) on the search input to update the searchTerm. The data-fetching hook should automatically re-fetch from GET /flashcards whenever these state variables change.

Answer:Use a client-side data-fetching library React Query within the "My flashcards" React island. Store searchTerm and currentPage in React state. Use a "debouncing" hook (e.g., 300ms) on the search input to update the searchTerm. The data-fetching hook should automatically re-fetch from GET /flashcards whenever these state variables change.

Question: How will protected routes (e.g., "My flashcards", "Study Session") be handled using Astro and Supabase authentication?

Recommendation: Implement Astro middleware (src/middleware.ts). In the middleware, check for a valid Supabase session cookie/token. If a user tries to access a protected route without a valid session, redirect them to the /login page. Conversely, if an authenticated user tries to access /login or /register, redirect them to /my-flashcards.

Answer: Implement Astro middleware (src/middleware.ts). In the middleware, check for a valid Supabase session token. If a user tries to access a protected route without a valid session, redirect them to the /login page. Conversely, if an authenticated user tries to access /login or /register, redirect them to /my-flashcards. User can forfeit his authentication by clicking Logout from the quick menu (available on all pages, also contains links to other pages in the application), which logs him out and redirects to Login page.

Question: How should the application globally handle and display API errors to the user (e.g., 400 validation errors, 502 AI gateway failures, 401 unauthorized)?

Recommendation: Use a combination of UI elements from Shadcn/ui:

Toasts: For non-blocking, general errors (e.g., 502 Bad Gateway from the AI, or a generic "Save failed" message).

In-line errors: For 400-level validation errors. Display the error message directly beneath the corresponding form field (e.g., "Text must be over 1,000 characters" under the text area).

Global redirect: A 401 Unauthorized error should immediately log the user out (clear the Supabase session) and redirect them to the /login page.

Answer: Use a combination of UI elements from Shadcn/ui:

- Toasts: For non-blocking, general errors (e.g., 502 Bad Gateway from the AI, or a generic "Save failed" message). Toasts should be also used for displaying success massages (ie. "Flashcard edited successfully").

- In-line errors: For 400-level validation errors. Display the error message directly beneath the corresponding form field (e.g., "Text must be over 1,000 characters" under the textarea).

- Global redirect: A 401 Unauthorized error should immediately log the user out (clear the Supabase session) and redirect them to the /login page.

Question: What is the strategy for displaying loading states, especially for potentially long-running actions like the AI generation (POST /generations/generate-candidates)?

Recommendation:

AI Generation: When the "Generate" button is clicked, disable it and replace the (empty) "Candidates" list area with a skeleton loader component.

List Loading: Use a similar skeleton loader for the main list on the "My flashcards" page during the initial data fetch.

Button Actions: For all save/update/delete actions, show a spinner icon inside the button that was clicked (e.g., "Save", "Delete", "Login") and set it to a disabled state to prevent double-clicks.

Answer:

- AI Generation: When the "Generate" button is clicked, disable it and add spinner inside it, and replace the (empty) "Candidates" list area with a skeleton (placeholder) loader component. If there are already some flashcards added manually, persist them below the skeleton.

- List Loading: Use a similar placeholder loader for the main list on the "My flashcards" page during the initial data fetch.

- Button Actions: For all save/update/delete actions, show a spinner icon inside the button that was clicked (e.g., "Save", "Delete", "Login") and set it to a disabled state to prevent double-clicks.

Question: How should the UI on the "My flashcards" page (US-012) adapt for mobile devices, considering it needs to display a list with "Edit" and "Delete" actions?

Recommendation: Use Tailwind's responsive breakpoints. On desktop (md: and up), display the data in a <table> for easy scanning. On mobile (default), switch to a "card"-based list, where each flashcard is a distinct <div> block showing the "Front" text prominently, with the "Edit" and "Delete" buttons clearly visible within each card. The "click to flip" (AC3) should be implemented on this card.

Answer: For flashcard presentation, use a slick Card component (ideally from Shadcn/ui) with:

- Edit (pencil) / Delete (trash bin) icons for all pages, and additionally Accept icon (checkmark) for AI generated candidates on Create Flashcards page. Icons should be placed in the top right corner of the flashcard, and trigger specific action on click.

- On the Create Flashcards page, the Unapproved (before clicking Approve or editing it) AI-generated flashcards should have a slightly different looks to distinguish them from approved ones - maybe a little opacity-based transparency or grey filter. The approved flashcards should look the same as on other pages, but the green Approved icon should still be visible (non-clickable in this state). Icons should have minimal size still allowing them to be UX compliant on mobile devices (touch area). Manually created flashcards should be auto-approved.

- Front / back visibility toggle using flip animation (left-right direction) when clicked on any part of the flashcard other than beforementioned action icons.

As for showing flashcards on different devices / screen sizes, use Tailwind's responsive breakpoints for adapting font, element sizes and column count accordingly:

- smaller mobile devices - prefer one column layout

- larger mobile devices - prefer two column layout

- desktop - auto-adapt number of columns to available width (flashcards have set width)

Question: What is the plan for managing the transient list of AI "candidates" on the "Create flashcards" page (US-006 to US-010) before they are saved to the database?

Recommendation: This entire interactive section should be a single React component. Use a React useState hook to hold the list of candidates (e.g., const [candidates, setCandidates] = useState([])). Each object in this array should include the front, back, and a status field (e.g., 'pending', 'accepted', 'edited') to track user actions, which makes rendering the UI and calculating metrics for the POST /generations call straightforward.

Answer: Go with the recommendation. Also, trying to re-generate new AI candidates before saving existing ones (after first generation on the Create flashcards page) should trigger a confirmation modal (with message that user should save existing ones first or they will be discarded) and if user proceeds with it, previously generated candidates (with metadata) should be cleared from local state and disappear from page (manually added ones should be preserved). Successfully saving reviewed flashcard candidates should using POST `/flashcards` should clear the local page's state to initial empty state, allowing for swift usage of generation form again.

Question: How will the UI implement the "Edit" action for an AI candidate (US-008)? The user story says the card in the list is updated, implying it doesn't just happen in the modal.

Recommendation: When the user clicks "Edit" on a candidate, open the universal modal pre-filled with that candidate's data. When the user clicks "Save" in the modal, the onSave callback should update the corresponding candidate object in the client-side React state (the candidates[] array) and also set its status to 'edited'. This will cause the list to re-render, showing the updated text.

Answer: Go with the recommendation.

2nd phase:

Question: Regarding the "quick menu" (mentioned in point 5), what is the intended overall navigation structure for authenticated users?

Recommendation: Implement a persistent, responsive header (using Tailwind) across all authenticated pages. This header should contain:

- A "10xCards" logo/brand name that links back to the default "/my-flashcards" page.
- Primary navigation links: "My Flashcards", "Create Flashcards", and "Study Session".
- A navigation menu (e.g., Shadcn's "Dropdown Menu" triggered by a user icon or email) that contains links to "My Account" and the "Logout" button.

Answer: Implement a persistent, responsive header (using Tailwind) across all authenticated pages. This header should contain:

- A "10xCards" logo/brand name that links back to the default "/my-flashcards" page at the center.

- A navigation menu (e.g., Shadcn's "Navigation Menu") called Menu, that contains links to "My Flashcards", "Create Flashcards", "Study Session" and "My Account" pages, located to the left.

- "Logout" button located to the right.

This should make this header navigation usable both on desktop and mobile devices.

Question: On the "Create flashcards" page, what is the desired visual difference between a candidate card that was "Accepted" (US-007) and one that was "Edited" (US-008)?

Recommendation: Treat both "Accepted" and "Edited" cards as "approved" for saving. When a user clicks "Accept" OR saves an "Edit" in the modal:

The card's opacity/grey filter (from point 8) is removed.

The card's state in the React component is set to 'approved'.

The "Accept" icon (checkmark) appears and remains, but becomes non-clickable, visually confirming it's in the "to-be-saved" batch. This provides a single, clear "approved" state for the user.

Answer: Go with the recommendation, but `accepted` state means accepted without edit (clicking "Accept"), while "editing" (saving changes in edit modal, even for beforehand accepted candidate) changes it's status to `edited`. Both statuses result in the same visuals of the flashcard, but are distinct for AI generation metrics. Also, the green accepted checkmark is the same icon used for triggering "Accept" action, just in different colour (black beforehand, like the rest of the icons).

Question: The "My flashcards" page will use a responsive grid of cards (point 8), but the Study Session (US-018) has a "Show Answer" button. Should the card-flipping interaction be consistent?

Recommendation: No, they should be different, as their context is different.

My flashcards (Browse Mode): Keep the simple "click anywhere on the card to flip" (point 8) for easy browsing and review.

Study Session (Study Mode): Strictly follow US-018. The user must click the dedicated "Show Answer" button. This is a deliberate cognitive step in the study process and prevents accidental flipping.

Answer: Follow the recommendation. On the study session page, the "Show answer" button should be presented below the flashcard, and only clicking it should trigger flashcard's flip action to show the back.

Question: How should the client-side UI handle a partial failure in the "Save" flow from the "Create" page (e.g., POST /generations succeeds, but the subsequent POST /flashcards fails)?

Recommendation: The UI should treat this as a single transaction. If the final step (POST /flashcards) fails, show an error toast (e.g., "Error: Could not save flashcards. Please try again."). The local state (the candidates[] array and generation metadata) should be preserved, allowing the user to click "Save" again without losing their reviewed work or re-running the generation.

Answer: Go with the recommendation.

Question: The API plan does not detail endpoints for the Study Session. How should the frontend manage the spaced repetition logic and state?

Recommendation: Since the PRD (3.5) specifies integrating an existing open-source library, the React component for the "Study Session" page should:

On load, fetch all cards from GET /flashcards (iterating through all pages if necessary, or a new API endpoint GET /flashcards/all might be better).

Initialize the spaced repetition library (e.g., srs.js, anki-js) in React state with this full deck.

Use the library's methods to get the list of "due" cards for the session.

For each "Forgot"/"Knew" click, update the card's state using the library's methods.

After the session, trigger PATCH /flashcards/:id calls only for the cards that were reviewed, updating their "due date" or other SRS metadata (assuming the flashcards table has columns for this, which needs clarification).

Answer: For now, don't implement the logic of Study Session page. For now, just place message "Study Sessions will launch soon" message.

Question: On the "My flashcards" page, if a user is on page 3 and then types a search query, what should the pagination state be?

Recommendation: When the searchTerm state changes (after debouncing), the currentPage state must be programmatically reset to 1. The React Query fetch-key should include both searchTerm and currentPage, so this state change will automatically trigger a re-fetch for page 1 of the new search results.

Answer: Follow the recommendation.

Question: The "My Account" page (US-004) only mentions a single "Password" field for changing the password. Is this intentional?

Recommendation: For better security and user experience, the form should include three fields:

Current Password (to verify the user).

New Password

Confirm New Password The Supabase "change password" function will likely require the current password anyway. This should be clarified, and the UI built accordingly. If this is out of scope for MVP, at minimum a "Confirm New Password" field should be added to prevent typos.

Answer: Let's follow the recommendation for easier Supabase mechanics integration.

Question: The "My flashcards" list (US-012) originally mentioned a "list" but the new plan (point 8) uses a responsive "grid." This seems like a good design change. Should we confirm this is the new direction?

Recommendation: Yes, proceed with the responsive grid of cards (as described in point 8). This is more modern and visually engaging than a simple list and aligns with the new, detailed Card component plan. The user story (US-012) can be considered superseded by this more specific design requirement.

Answer: Yes.

Question: The API validates front (max 200) and back (max 500) text lengths. How should the UI handle this?

Recommendation: Add real-time character counters (e.g., "150 / 200") inside the "universal modal" for both the "front" and "back" text areas. This provides immediate feedback to the user and prevents them from hitting a 400 validation error from the API.

Answer: Let's go with the recommendation. Also, remember that changes to front / back made on the edit modal are propagated only after successful edit modal changes save, not in real time.

Question: How should the empty state messages (US-020, 021, 022) be styled?

Recommendation: Use a standardized, reusable "Empty State" React component built with Shadcn/ui. This component should be centered and include:

A relevant icon (e.g., FileText for no cards, Coffee for "all caught up").

A bold "Heading" (e.g., "Your deck is empty!").

A "Description" (e.g., "Get started by creating your first flashcard.").

The "Call to Action" (e.g., a Shadcn Button component that links to the "/create-flashcards" page).

Answer: Go with the recommendation.
