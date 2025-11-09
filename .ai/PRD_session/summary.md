## 🎯 Decisions

* **Target User & Scope:** The MVP targets "anybody" wanting to create flashcards. The AI generation will focus only on factual information from the source text.
* **Authentication:** A simple email/password system. A "My Account" page will allow password changes and account deletion. There will be no password reset or email functionality in the MVP.
* **Core AI Generation Flow:** Users paste text (1,000-10,000 chars). The AI generates a maximum of 50 flashcard "candidates."
* **Review Flow:** Generated candidates are displayed in a list below the text input. The user must take an explicit action ("Accept," "Edit," or "Delete") on each candidate before they are saved to the database.
* **Card Creation/Editing:** A single, universal modal will be used for both "Add Manually" (blank fields) and "Edit" (pre-filled fields). This "Edit" action is used for both AI candidates (in the review list) and saved cards (in the "My flashcards" list).
* **Card Organization:** All flashcards will be stored in a single "default deck." There is no multi-deck management in the MVP.
* **Card Management:** A "My flashcards" page will list all saved cards. This page is the default landing page after login. It will feature pagination (50 cards/page) and a search bar that queries both the "front" and "back" text.
* **Study Session:** A "Study Session" page will use an open-source spaced repetition library. It will use a two-button self-grading system ("Forgot" / "Knew") and will present all cards currently due for review.
* **Success Metrics:**
    * **Quality:** 75% of AI-generated cards are "Accepted" (saved without edits). This is tracked by logging the "Accept," "Edit," and "Delete" actions during the review step.
    * **Adoption:** 75% of all user flashcards are created using the AI flow (AI-created / (AI + Manual)).
* **Metric Tracking:** Both success metrics will be tracked in the database for internal product team monitoring only.
* **Error Handling:** User-friendly "empty state" messages will be used for the "My flashcards" and "Study Session" pages. Malformed data from the AI API will be silently ignored.

---

## 👍 Matched Recommendations

* A specific user flow must be defined to measure the 75% acceptance rate, where "accepted" means a card is saved without any edits during the initial review.
* The AI generation flow should be prioritized, and the manual creation flow should be as basic as possible (a simple form in a modal).
* For the MVP, the AI's prompt engineering should focus only on extracting factual information.
* The 75% AI utilization metric will be defined as the ratio: (Total AI-created cards) / (Total AI-created cards + Total Manual-created cards).
* A central "My flashcards" page is required to fulfill the user's need to "browse, edit, and delete" cards.
* A single, reusable modal component should be used for all "add" and "edit" actions to maintain consistency and reduce development scope.
* A simple two-button ("Forgot" / "Knew") self-grading system is the most minimal viable implementation for the study session.
* All user actions ("Accept," "Edit," "Delete") during the AI review step must be logged to a database to calculate the 75% quality metric.
* Clear "empty state" UI must be designed for the "My flashcards" and "Study Session" pages to guide new users.
* The default landing page after login should be the "My flashcards" list, as it serves as the user's "home base" from which to navigate.

---

## 📝 PRD Planning Summary

### 1. Main Functional Requirements

**User Authentication & Management:**
* User registration using email and password.
* User login.
* "My Account" page with:
    * Read-only email display.
    * Password change functionality.
    * Account deletion button (with password confirmation).
* **Out of Scope:** Password reset, email notifications.

**Flashcard Creation (AI):**
* A "Create flashcard" page with a text input (1,000-10,000 char limit).
* AI generation (max 50 cards) of factual Q&A pairs.
* An "AI Review List" displayed on the same page, showing candidates.
* Buttons for "Accept," "Edit" (opens modal), and "Delete" for each candidate.
* A final "Save to Deck" button to add all accepted/edited cards.

**Flashcard Creation (Manual):**
* An "Add Manually" button on the "Create" page.
* This button opens a modal with "front" and "back" text fields.
* On save, the modal closes, and the user remains on the "Create" page.

**Flashcard Management:**
* A "My flashcards" page (default page post-login).
* Lists all cards in a single "default deck."
* Pagination (50 cards per page).
* A search bar that filters the list by matching text on the "front" or "back" of cards.
* "Edit" (opens modal) and "Delete" buttons for each card.

**Study Session:**
* A "Study Session" page that uses an open-source spaced repetition library.
* The session includes all cards currently due for review.
* A two-button ("Forgot" / "Knew") self-grading interface.
* A "Session Complete" screen upon finishing, with a button to return to "My flashcards."

### 2. Key User Stories & Usage Paths

* **AI Creation Path:** As a user, I want to paste a large block of my study notes so that the app can automatically generate flashcards for me. I want to quickly review these cards, fix any small errors in a modal, and accept them into my deck.
* **Manual Creation Path:** As a user, I want to quickly add a single, specific flashcard, so I can click "Add Manually," fill in two fields in a modal, and save it.
* **Study Path:** As a user, I want to start a study session so that the app can show me only the cards I need to review today. I want to grade myself with a simple "Forgot" or "Knew" button.
* **Management Path:** As a user, I want to find a specific card I created, so I can go to my "My flashcards" page, use the search bar to find it, and click "Edit" to update its content in a modal.
* **Account Path:** As a user, I want to change my password or delete my account, so I can go to a "My Account" page to manage my profile.

### 3. Success Criteria & Measurement

**Metric 1: AI Generation Quality**
* **Criteria:** 75% of AI-generated flashcards are "accepted" by the user (i.e., saved without requiring any edits).
* **Measurement:** We will log every "Accept," "Edit," and "Delete" action taken in the AI review list. The metric will be calculated as: (Total "Accept" actions) / (Total "Accept" + "Edit" + "Delete" actions).

**Metric 2: AI Feature Adoption**
* **Criteria:** 75% of all new flashcards created in the system are generated using the AI flow.
* **Measurement:** We will track the source of every new card. The metric will be calculated as: (Total cards from AI flow) / (Total cards from AI flow + Total cards from Manual flow).

**Reporting:**
* Both metrics will be tracked internally in the database for the product team. They will not be displayed to the end-user in the MVP.

---

## ❓ Unresolved Issues

* **AI Model Selection:** The specific LLM API to be used is undecided. This is the highest-risk dependency as it directly impacts cost, generation speed, and the ability to meet the 75% quality (acceptance) metric.
* **AI API Contract:** The exact JSON structure (API contract) that the front-end will receive from the AI backend has been explicitly deferred. The development team cannot build the review interface without a defined structure for "front," "back," and how to handle errors or malformed data (even if the decision is to "silently ignore" them, the definition of "malformed" is required). This is the most critical technical blocker for the next development stage.