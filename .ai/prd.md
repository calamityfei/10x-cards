# Product Requirements Document (PRD) - 10xCards

## 1. Product Overview

10xCards is an MVP (Minimum Viable Product) web application designed to accelerate the learning process by automating flashcard creation. The core problem it solves is the time-consuming nature of manually creating high-quality flashcards. The product allows users to paste text (e.g., study notes) and uses an AI to generate flashcard "candidates" (front/back). Users can then review, edit, and save these cards to their personal deck. The application also supports manual card creation, a centralized "My flashcards" page for management, and a simple, integrated spaced repetition system to help users study effectively.

## 2. User Problem

The primary problem is that the manual creation of high-quality educational flashcards is extremely time-consuming. This high barrier to entry discourages many potential learners from using spaced repetition, which is one of the most effective and scientifically-backed study methods. 10xCards aims to reduce this friction to near zero, making effective learning accessible to anyone.

## 3. Functional Requirements

### 3.1. User Authentication & Account Management

- Users must be able to register for a new account using an email and password on "Register" page.
- Registered users must be able to log in through "Login" page.
- If a user forgets his login credentials, he has the possibility to recover password using "Forgot password" link on "Login" page, which redirects user to "Password Recovery" page.
- Logged-in users will have access to authentication restricted parts of the application: flashcards creation and management, study sessions and account magagement on "My Account" page.
- On the "My Account" page, users can:
  - View their registered email (read-only).
  - Change their password.
  - Delete their account (requires password confirmation for security).
- Pages for login, register, and password recovery functionalities will be publicly available.

### 3.2. AI Flashcard Generation

- Users must be able to navigate to a "Create Flashcards" page.
- A "Create Flashcards" page will be accessible to logged-in users.
- This page will feature a text input field for pasting source material.
- Input text must be between 1,000 and 10,000 characters.
- The AI will generate a maximum of 50 flashcard candidates from the source text.
- The AI model will be optimized to extract factual information only.
- Generated candidates will be displayed in a list on the same page, below the input.
- For each candidate, the user will have three actions: "Accept", "Edit", and "Delete".
- "Edit" will open the universal edit/add modal pre-filled with the card's content.
- "Accept" marks the card for saving (as-is).
- "Delete" removes the candidate from the list.
- A final "Save" button will persist all "Accepted" and "Edited" cards to the user's deck.
- If the AI cannot generate valid cards, a user-friendly message will be displayed.
- Malformed or incomplete data from the AI API will be silently ignored and not shown.

### 3.3. Manual Flashcard Creation

- On the "Create flashcards" page, a button ("Add Manually") will be present.
- Clicking this button will open a universal modal.
- The modal will be in "Add Mode" (empty "front" and "back" fields).
- On saving, the card is added to the user's deck, the modal closes, and the user remains on the "Create" page.

### 3.4. Flashcard Management ("My flashcards" page)

- A "My Flashcards" page will be accessible to logged-in users.
- This page will be the default landing page after a user logs in.
- It will list all flashcards saved by the user (from the single "default deck").
- The list will be paginated, showing 50 flashcards per page.
- A search bar will be present. The search will query text on both the "front" and "back" of all cards and filter the list.
- Each card in the list will have "Edit" and "Delete" buttons.
- "Edit" will open the universal modal in "Edit Mode" (pre-filled).

### 3.5. Study Session

- A "Study Session" page will be accessible to logged-in users.
- This feature will integrate an existing open-source spaced repetition library.
- When a session is started, the system will present all cards currently due for review.
- The study interface will show the "front" of a card.
- After the user reveals the "back," they will have two self-grading buttons: "Forgot" and "Knew".
- After the last due card is graded, a "Session Complete" message will be shown, with a button to return to the "My flashcards" page.

### 3.6. UI & Error Handling

- "My flashcards" page: If the user has 0 cards, a message will be shown with a link to the "Create flashcards" page.
- "Study Session" page: If the user has 0 cards in their deck, a message will be shown with a link to the "Create flashcards" page.
- "Study Session" page: If the user has cards, but none are due, a message ("You're all caught up!") will be shown.

## 4. Product Boundaries

### 4.1. What is IN scope for the MVP

- Web-based application only.
- Simple email/password authentication.
- AI generation from copy-pasted text (1k-10k chars).
- Manual card creation.
- A single "default deck" for all of a user's cards.
- Browse, edit, and delete functionality for all saved cards.
- Integration with an existing spaced repetition algorithm.

### 4.2. What is OUT of scope for the MVP

- A native mobile application (iOS/Android).
- Advanced or custom-built repetition algorithms (e.g., SM-2, Anki-style).
- File imports (e.g., PDF, DOCX, CSV).
- Sharing flashcard decks between users or publicly.
- Integrations with other platforms (e.g., LMS, note-taking apps).
- Multi-deck management (creating, naming, or organizing multiple decks).
- User-facing dashboards for success metrics.

## 5. User Stories

### 5.1. Authentication & Account Management

| ID     | Title                            | Description                                                                                                                                                                                           | Acceptance Criteria                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| :----- | :------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| US-000 | Secure Access and Authentication | As a system user, I want to be able to authenticate to the protected parts of the system in a way that ensures the security of my data.                                                               | 1. Login, registration and password recovery are handled on dedicated pages.<br>2. Authentication is required to access auth protected pages and endpoints of the application: account management, flashcards creation and management, and study sessions.<br>3. The user can log out from the system via a button in the top-right corner, on the header.<br>4. Password recovery is possible through "Forgot password" link on the Login page. User enters "Password Recovery" page through it, fills out "Email" field and clicks "Recover password" button to get an email with password recovery link.<br>5. Password recovery link allows user to access page with "Password Reset" page, where he inputs new password and confirm password fields.<br>6. If done correctly, user's password in the system is changed to the newly passed one. |
| US-001 | New User Registration            | As a new user, I want to create an account using my email and a password so I can save my flashcards.                                                                                                 | 1. A public "Register" page must exist.<br>2. User must enter a valid email and a password.<br>3. Upon successful registration, the user is logged in and redirected to the "My flashcards" page.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| US-002 | User Login                       | As a returning user, I want to log in with my email and password so I can access auth protected parts of the application: account management, flashcards creation and management, and study sessions. | 1. A public "Login" page must exist.<br>2. User enters their email and password.<br>3. Upon successful login, the user is redirected to the "My flashcards" page (their default landing page).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| US-003 | User Logout                      | As a logged-in user, I want to log out of the application so my account is secure.                                                                                                                    | 1. A "Logout" button must be available in the application's navigation.<br>2. Clicking "Logout" ends the user's session and redirects them to the public login page.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| US-004 | Change Password                  | As a logged-in user, I want to change my password from my account page so I can keep my account secure.                                                                                               | 1. A "My Account" page must be accessible.<br>2. The page must have an empty "Current password", "New password" and "Confirm password" fields.<br>3. The password is only updated after clicking "Update" button if the beforementioned password fields are not empty.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| US-005 | Delete Account                   | As a logged-in user, I want to delete my account and all my data so I am no longer part of the service.                                                                                               | 1. The "My Account" page must have a "Delete Account" button.<br>2. Clicking it opens a confirmation modal.3. Upon confirmation, the user account and all associated flashcards are permanently deleted.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |

### 5.2. Flashcard Creation

| ID     | Title                      | Description                                                                                             | Acceptance Criteria                                                                                                                                                                                                                                                                                |
| :----- | :------------------------- | :------------------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| US-006 | Generate Flashcards via AI | As a user, I want to paste my notes into a text box and have the AI generate flashcards for me.         | 1. On the "Create flashcards" page, I can paste text into an input field.<br>2. The input must be between 1,000 and 10,000 characters.<br>3. Clicking "Generate" sends the text to the AI service.<br>4. The AI returns up to 50 flashcard candidates (front/back), which are displayed in a list. |
| US-007 | Accept AI Candidate        | As a user, I want to accept a good AI-generated card so it can be added to my deck.                     | 1. In the AI review list, each card has an "Accept" button.<br>2. Clicking "Accept" marks the card for saving without any edits.                                                                                                                                                                   |
| US-008 | Edit AI Candidate          | As a user, I want to edit an AI-generated card before saving it.                                        | 1. In the AI review list, each card has an "Edit" button.<br>2. Clicking "Edit" opens the universal modal, pre-filled with that card's "front" and "back" text.<br>3. After saving in the modal, the card in the list is updated and marked as "Edited."                                           |
| US-009 | Delete AI Candidate        | As a user, I want to delete a bad AI-generated card from the review list so it is not added to my deck. | 1. In the AI review list, each card has a "Delete" button.<br>2. Clicking "Delete" removes the card candidate from the review list.                                                                                                                                                                |
| US-010 | Save Reviewed Cards        | As a user, after reviewing all AI candidates, I want to save the accepted/edited ones to my deck.       | 1. A "Save" button is present on the "Create flashcards" page.<br>2. Clicking this button persists all "Accepted" and "Edited" cards to the database under the user's account.<br>3. The review list is then cleared.                                                                              |
| US-011 | Manual Card Creation       | As a user, I want to manually create a single flashcard with my own "front" and "back" text.            | 1. On the "Create flashcards" page, I can click an "Add Manually" button.<br>2. This opens the universal modal with blank "front" and "back" fields.<br>3. Clicking "Save" in the modal adds the card to proposed flashcards list and closes the modal.                                            |

### 5.3. Flashcard Management

| ID     | Title                  | Description                                                                                       | Acceptance Criteria                                                                                                                                                                                                                                           |
| :----- | :--------------------- | :------------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| US-012 | View Flashcard List    | As a user, I want to see a list of all my saved flashcards so I can manage them.                  | 1. After logging in, I am taken to the "My flashcards" page.<br>2. The page displays a paginated list of my cards (50 per page).<br>3. Each list item shows the "front" text (and flips to "back" text after click), an "Edit" button, and a "Delete" button. |
| US-013 | Search Flashcards      | As a user, I want to search my flashcards so I can quickly find a specific one to edit or delete. | 1. On the "My flashcards" page, a search bar is visible.<br>2. As I type, the list filters to show only cards that match the text in _either_ their "front" or "back" fields.                                                                                 |
| US-014 | Paginate Flashcards    | As a user, I want to navigate through pages of my flashcards.                                     | 1. If I have more than 50 cards, pagination controls appear at the bottom of the list.<br>2. I can click "Next" and "Previous" buttons to navigate the full list.                                                                                             |
| US-015 | Edit Saved Flashcard   | As a user, I want to edit a flashcard that is already in my deck.                                 | 1. On the "My flashcards" list, I can click "Edit" on any card.<br>2. This opens the universal modal, pre-filled with that card's "front" and "back" text.<br>3. Saving the modal updates the card in the database.                                           |
| US-016 | Delete Saved Flashcard | As a user, I want to permanently delete a flashcard I no longer need.                             | 1. On the "My flashcards" list, I can click "Delete" on any card.<br>2. A confirmation prompt appears.<br>3. Upon confirmation, the card is permanently removed from the database and the list.                                                               |

### 5.4. Study Session

| ID     | Title                  | Description                                                                                    | Acceptance Criteria                                                                                                                                                                                                                                                                                       |
| :----- | :--------------------- | :--------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| US-017 | Start Study Session    | As a user, I want to start a study session so I can review the cards I need to practice.       | 1. A "Start Study Session" button is available.<br>2. Clicking it navigates me to the "Study Session" page.<br>3. The session loads _all_ cards that are currently marked as "due" by the repetition algorithm.                                                                                           |
| US-018 | Study a Card           | As a user, I want to see a card, guess the answer, and then grade myself on whether I knew it. | 1. The study interface shows the "front" text of a card.<br>2. I can click a "Show Answer" button/action to reveal the "back" text.<br>3. Once the back is revealed, two buttons appear: "Forgot" and "Knew".<br>4. Clicking either button logs my answer with the algorithm and loads the next due card. |
| US-019 | Complete Study Session | As a user, I want to know when I have finished reviewing all my due cards for the day.         | 1. After I grade the final due card in the session, the study interface is replaced.<br>2. A "Session Complete! Congratulations!" message is displayed.<br>3. A single button "Return to my flashcards" is present, which navigates me back to the "My flashcards" page.                                  |

### 5.5. Empty States & Error Handling

| ID     | Title                                | Description                                                                  | Acceptance Criteria                                                                                                                                                                                                                                   |
| :----- | :----------------------------------- | :--------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| US-020 | Empty "My flashcards" Page           | As a new user, I want to be guided on what to do when I have no flashcards.  | 1. If I go to the "My flashcards" page and have 0 cards, the list area shows a message.<br>2. The message says something like "Your deck is empty!"<br>3. A button/link is present that directs me to the "Create flashcards" page.                   |
| US-021 | Empty "Study Session" (No Cards)     | As a new user, I want to be guided if I try to study but have no flashcards. | 1. If I go to the "Study Session" page and have 0 total cards, a message is shown.<br>2. The message says something like "You don't have any flashcards to study."<br>3. A button/link is present that directs me to the "Create flashcards" page.    |
| US-022 | Empty "Study Session" (No Cards Due) | As an active user, I want to know if I have no cards to review right now.    | 1. If I go to the "Study Session" page and I _have_ cards, but 0 are due, a message is shown.<br>2. The message says "You're all caught up! No cards are due for review right now."                                                                   |
| US-023 | AI Generation Fails (No Facts)       | As a user, I want to know if the AI couldn't find anything in my text.       | 1. If I submit text and the AI returns 0 candidates, a message is shown.<br>2. The message says "We couldn't find any factual items to create cards from. This tool works best with definitions and key terms. Please adjust the text and try again." |

## 6. Success Metrics

The success of the MVP will be measured by its ability to deliver on the core value proposition: creating high-quality cards with minimal effort.

### 6.1. Metric 1: AI Generation Quality

- Metric: 75% of AI-generated flashcards are "accepted" by the user.
- Definition: "Accepted" means the user clicked the "Accept" button for an AI candidate (i.e., they did _not_ click "Edit" or "Delete").
- Measurement: The system will log every "Accept", "Edit" and "Delete" action taken in the AI review list. The metric will be calculated as: `(Total "Accept" actions) / (Total "Accept" + "Edit" + "Delete" actions)`.

### 6.2. Metric 2: AI Feature Adoption

- Metric: 75% of all new flashcards created in the system are generated via the AI flow.
- Definition: This measures user reliance on the AI feature versus manual creation.
- Measurement: The system will track the source of every card saved (e.g. "AI" or "Manual"). The metric will be calculated as: `(Total cards from AI flow) / (Total cards from AI flow + Total cards from Manual flow)`.

### 6.3. Reporting

- Both metrics will be tracked internally in the application database for review by the product team. These metrics will not be exposed to end-users in the MVP.
