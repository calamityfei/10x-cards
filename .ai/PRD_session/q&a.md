Here is the list of questions and recommendations to help build the PRD:

1st phase:

Question: Who is the specific primary target user for this tool (e.g., medical students, language learners, high-school students)? Recommendation: We should define a clear primary user persona. This will guide the AI's prompt engineering to ensure the quality and style of the generated flashcards (e.g., simple definitions vs. complex "cloze deletion" cards) match their specific study needs.

Answer: Anybody who would want to use this application to generate flashcards for easier learning process. The complexity of the generated material should be adjusted to source material given.

Question: What is the expected input length for the "copy-paste" text generation (e.g., a single paragraph, a full chapter)? Recommendation: For the MVP, let's set a specific character limit (e.g., 5,000 characters) for the text input. This manages AI API costs, ensures faster processing, and allows us to test the generation quality on a manageable scale.

Answer: Let's set this limit to minimum 1000 and maximum 10000 characters, so that generating multiple flashcards from one source material is possible. Live character limit counter should be visible to end user when entering / pasting source material, and excess should be auto-trimmed from the end of it.

Question: How will the "75% acceptance rate" for AI cards be measured in the UI? Recommendation: The PRD should define a specific user flow where, after generation, the user is presented with the cards and must take an explicit action, such as clicking an "Accept" button versus "Edit" or "Delete." We should define "accepted" as a card saved to a deck without any edits during this initial review.

Answer: Flashcards generated and proposed by AI are treated only as candidates for our system flashcards. Below the source material input field, User is presented with a list of AI generated flashcards and needs to take explicit action ("Accept", "Edit" or "Delete") on each of them before being able to submit final versions of flashcards and store them in the database. For the 75% acceptance rate criteria, we define "accepted" as flashcards that were approved without any edits during the review step.

Question: For the "integration with a ready-made repetition algorithm," are you planning to use a specific open-source library, or implement a simple, well-known system? Recommendation: Since a complex algorithm (like SuperMemo/Anki) is out of scope, I recommend we implement a basic Leitner box system (e.g., 3-5 boxes) ourselves. This avoids external dependencies, meets the "simple algorithm" requirement, and gives us full control over the study experience.

Answer: We will be using an existing open-source library algorithm.

Question: What is the relative priority between the AI generation flow and the manual creation flow? Recommendation: Given the success criteria (75% of cards created via AI), we should allocate the vast majority of our design and development resources to making the AI generation and review flow fast and seamless. The manual creation flow should be functional but basic.

Answer: AI generation flow should have priority here. The manual creation flow should be as basic as possible - simple form with 2 fields to enter text to be shown on the "front" and "back" of the flashcard.

Question: What specific AI model or API (e.g., GPT-3.5-Turbo, GPT-4, Claude) are we planning to use, and have we budgeted for its cost at scale? Recommendation: We must benchmark 2-3 different models for both generation quality (to hit the 75% metric) and cost per user. The choice of model is a critical dependency that impacts both our finances and the core user experience.

Answer: At this point we haven't decided yet what LLM we will use for generating flashcards. Assume we will use the LLM through API.

Question: What is the minimum definition of "simple user accounts"? Is it just email/password, or does it include social logins (e.g., Google)? Recommendation: To minimize scope, the MVP should only support email and password authentication. We can add social logins in a later release after validating the core product.

Answer: For this MVP always assume minimal scope. User accounts will be defined only by email address and password.

Question: What does the user flow look like after the AI generates cards but before they are saved? Recommendation: The PRD needs to detail a dedicated "Review Screen." This screen should allow the user to quickly view each generated card (Q and A), edit it inline, or delete it before confirming which cards to add to their deck. This flow is essential for measuring the "acceptance" metric.

Answer: We won't use a separate screen for reviewing. Below the source material input field, after generating propositions User is presented with a list of AI generated flashcards and needs to take explicit action ("Accept", "Edit" or "Delete") on each of them before being able to submit final versions of flashcards and store them in the database.

Question: What is our primary contingency plan if user testing shows the AI-generated card quality is low and we can't meet the 75% acceptance metric? Recommendation: We must schedule a dedicated "Prompt Engineering & Tuning" phase after initial development. This is the highest-risk area; we must be prepared to iterate on the AI prompts and logic based on real user feedback, rather than assuming it will work perfectly on the first try.

Answer: For the MVP, we only want to monitor and show the statistics for AI generation and it's acceptance criteria.

Question: What is the desired user experience for the "studying" part of the app that uses the repetition algorithm? Recommendation: The PRD should specify a simple, clean "Study Session" interface. It should show one card at a time and have clear buttons for the user to self-grade (e.g., "Forgot," "Knew," "Knew Well"), which will then trigger the Leitner algorithm to move the card to the appropriate box.

Answer: Logged in user should be able to access "Study session" view, in which the spaced repetition algorithm will be used to show one flashcard after the other. Each flashcard is shown with the "front" text first. After clicking on it, user is shown the "back" of the flashcard and buttons below it allow him to self-grade his knowledge of this flashcard's topic.

2nd phase:

Question: Since the target user is "anybody" and complexity should adapt, how should the AI handle ambiguous or broad source material (e.g., a poem, a story) versus factual text (e.g., a biology chapter)? Recommendation: For the MVP, we should focus the AI's prompting only on extracting factual information (like definitions, Q&A pairs, or key terms). The PRD should state that the AI is not optimized for subjective or non-factual text, which helps manage user expectations and simplifies the AI engineering.

Answer: For MVP let's focus only on extracting factual information.

Question: You plan to use an open-source library for the repetition algorithm. To define the study UI, we must decide on the algorithm type. Will it be a simple pass/fail (like Leitner) or a graded-recall (like Anki's SM-2)? Recommendation: Let's specify that the MVP will use an algorithm based on the SM-2 (Anki) model, as libraries for this are common. This defines the self-grading buttons in the study session as: "Again" (Forgot), "Hard," "Good," and "Easy," which is a well-understood user experience.

Answer: Let's assume that the grading mechanism will provide options to be shown on the buttons, we don't need to worry about that.

Question: Given the LLM choice is a major dependency and risk, what are the specific criteria we will use to select the final API? Recommendation: The PRD should define our selection criteria, prioritized as: 1. Generation Quality (Can it hit the 75% acceptance metric?), 2. Cost (What is the cost per 1000 cards generated?), and 3. Speed (How long does it take to generate 20 cards?). We should time-box a technical investigation to test 2-3 models against these criteria.

Answer: LLM will be decided outside of this initial scoping process and no investigation is needed at this point. Just assume that LLM will be able to complete it's initial generation task.

Question: (Re-addressing the risk) My previous question was about risk mitigation if the 75% acceptance metric is not met after launch (e.g., it's only 40%). What is our business and development contingency plan? Recommendation: The PRD should state that if the 75% acceptance metric is not met within 30 days of launch, our only priority for the following development sprint will be prompt engineering and AI model tuning. All other new features will be postponed until this core value prop is fixed.

Answer: Let's not go outside this initial MVP release process. Future plans for the application development are not part of this initial scope.

Question: How will users organize their flashcards? Your description implies cards are just "stored in the database," but users will need a way to group them. Recommendation: Let's introduce the concept of "Decks" as the primary organizational unit. The PRD should specify that all flashcards (both AI-generated and manual) must belong to a Deck. The user must either select an existing Deck or create a new one before they can access the generation/creation page.

Answer: For MVP let's assume that all flashcards are stored and available under one, default "my deck". Ability to define and manage decks is not part of this MVP scope.

Question: For the review flow (list below the input), what is the exact user interaction for the "Edit" action on a single card candidate? Recommendation: To keep the UI simple and avoid modals, let's define "Edit" as an action that converts that card's "front" and "back" text fields into editable "inline" text inputs. The "Edit" button changes to a "Save" button for that specific card.

Answer: We will use modal for editing flashcard fields - using the same modal for adding new flashcard manually by user (modal will be invoked in add or edit mode).

Question: How exactly do we define and measure the second success metric: "Users create 75% of flashcards with utilization of AI"? Recommendation: We should define this in the PRD as a simple ratio: (Total flashcards created via the AI flow) / (Total flashcards created via AI flow + Total flashcards created via Manual flow) measured over a rolling 30-day period.

Answer: Let's use the recommended approach of simple ratio: (Total flashcards created via the AI flow) / (Total flashcards created via AI flow + Total flashcards created via Manual flow). We would like to have this ratio measured live, not only in 30-day period, and available for statistics.

Question: What does the user see if the AI fails to generate cards (e.g., the API is down, the API key is invalid, or the source text is un-parseable)? Recommendation: The PRD should specify that in place of the card list, a clear, user-friendly error message will appear (e.g., "Sorry, we couldn't generate cards from this text. Please adjust the text and try again."). We must explicitly avoid showing technical error codes.

Answer: Let's use a user-friendly error message like the one suggested.

Question: Where does the user access the "manual creation" flow? Recommendation: On the "Create Cards" page (which will contain the AI input field by default), let's include a simple toggle or tab (e.g., "AI Generator" | "Manual Entry"). Clicking "Manual Entry" will hide the AI input and show the simple two-field form.

Answer: Logged in user can access manual creation modal by clicking "Add manually" button on the flashcard creation page.

Question: Regarding the "Study Session" view, what information or controls should be present besides the flashcard itself and the self-grading buttons? Recommendation: The PRD should specify that the Study Session view must also display: (1) The name of the Deck being studied, and (2) A dynamic counter showing "Cards due for review: [X]" to motivate the user.

Answer: Other controls or information is not part of this PRD scope.

3r phase:

Question: Given that all cards will be in one "My Deck," how does the user fulfill the requirement to "Browse, edit, and delete flashcards"? A single, long, unorganized list will quickly become unusable. Recommendation: We must add a simple "My Deck" page to the MVP. This page will list all saved flashcards (e.g., 20 per page) and show the "front" and "back" text for each, along with the "Edit" and "Delete" buttons. This is the minimum viable way to support the "browse" requirement.

Answer: Logged in user will have access to "My flashcards" page (showing only default deck for now). This page will list all flashcards added by the user (manually or by accepting AI generated ones) using simple pagination and search engine (basic filtering of flashcards list by matching given search phrase).

Question: To clarify the edit flow: When a user clicks "Edit" on an AI-generated candidate (in the review list, before saving), does this open the modal you mentioned? Or is that modal only for editing cards after they are saved in "My Deck"? Recommendation: I recommend that the same modal is used for all "add" and "edit" actions. Clicking "Add Manually" opens a blank modal. Clicking "Edit" (either on an AI candidate or a saved card) opens the same modal, pre-filled with the content to be edited. This reuses components effectively.

Answer: Same, universal modal with "front" and "back" form fields should be used for all "add" (modal in add mode with empty fields) and "edit" (modal in edit mode with pre-filled fields) actions.

Question: You mentioned the algorithm library will "provide options" for grading, but to build the "Study Session" UI, we must define the buttons. Will we use a simple two-button "Forgot" / "Knew" system or a multi-grade "Again" / "Hard" / "Good" / "Easy" system? Recommendation: For a minimal MVP, I strongly recommend a simple two-button system: "I Forgot" (resets the card) and "I Knew" (advances the card). This is the simplest viable implementation of spaced repetition.

Answer: Let's assume that the library will use the two button system.

Question: What is the exact data format (e.g., JSON structure) we expect the LLM API to return? We cannot build the front-end review list without knowing this. Recommendation: The PRD must define a strict API contract. I recommend specifying that the AI must return a JSON array of objects, for example: [{"front": "Question 1", "back": "Answer 1"}, {"front": "Question 2", "back": "Answer 2"}]. Our application will then parse this structure.

Answer: Let's not specify the PAI contract here in the PRD.

Question: You want the 75% AI utilization metric tracked "live." Where in the application should this statistic be displayed, and for whom (the user or just the admin)? Recommendation: To keep the MVP scope minimal, let's specify that this metric is tracked in the database for the product team only. A user-facing statistics dashboard is a significant feature and should be postponed to a future release.

Answer: For the MVP minimal scope, metrics will be tracked in the database for the product team only, based on flashcard generation stored data.

Question: Regarding the user account system (email/password), is a "Forgot Password" flow included in the MVP? Recommendation: A "Forgot Password" flow (which involves sending a reset email) is a critical part of any authentication system. We must include this in the MVP, as its absence will lead to immediate and frequent user lock-out and support problems.

Answer: For this MVP we will not send out emails, same with password reset link. But a logged in user should be able to delete his account (and all flashcards related to it).

Question: What should the system do if the user inputs non-factual text (like a poem) and the AI (which is optimized for facts) returns 0 cards or very low-quality cards? Recommendation: The PRD should specify that if the AI returns 0 cards, we will display a message in the review area like: "We couldn't find any factual items to create cards from. This tool works best with definitions, key terms, and question/answer-style text."

Answer: We should show a user-friendly text suggesting to try again with a different source material.

Question: When a user clicks "Study Session," does it pull all cards from "My Deck" that are due for review, or does the user choose a number of cards to study (e.g., "Study 20 cards")? Recommendation: Let's simplify this. The "Study Session" button will start a session containing all cards that are currently due for review according to the algorithm's schedule. We will not include an option to select a specific number of cards for the MVP.

Answer: All cards for the MVP.

Question: For the other success metric ("75% of AI-generated cards are accepted"), how will we technically track this "live" metric if it's only measured during the review step? Recommendation: We will log every "Accept," "Edit," and "Delete" action from the AI review list to a database table. The "live" metric will be a database query of (Total 'Accept' actions) / (Total 'Accept' + 'Edit' + 'Delete' actions), which can be calculated as needed (e.g., over the last 7 or 30 days).

Answer: Let's go with the recommended flow.

Question: What is the maximum number of flashcards the AI should be allowed to generate from a single 10,000-character text input? Recommendation: We should set a reasonable upper limit (e.g., 25 cards) per generation request. This prevents unexpectedly large API costs and long wait times for the user if the text is very dense.

Answer: Let's assume max 50 flashcards.

4th phase:

Question: Regarding the new "Delete Account" requirement, how does the user access this? And what is the exact confirmation step to prevent accidental deletion? Recommendation: We should add a minimal "Account" page accessible from the user's logged-in menu. This page will have a single "Delete My Account" button. Clicking this must open a confirmation modal that requires the user to type their password to confirm the deletion. This is safer than just typing "DELETE".

Answer: We should have a very simple "My account" page with email (read-only), password field (allows to change account password) and delete account button.

Question: You've added a "search engine" for the "My flashcards" page. What fields should this search query (the "search phrase") match against? Recommendation: To keep this simple and effective, the search should be a case-insensitive query that matches against the text on both the "front" and "back" of the flashcards.

Answer: Search field on flashcard list should match against both "front" and "back" of the flashcards.

Question: Since "Forgot Password" is explicitly out of scope, what should the user experience be on the login page if they cannot remember their password? Recommendation: We must add a static text note directly on the login screen (e..g., "Note: This MVP does not include a password reset feature. Please store your password securely."). This manages user expectations and is crucial for transparency.

Answer: For now password reset will be available through support team, but it's not part of this MVP's scope. Let's not focus on this.

Question: You rejected defining the AI API contract. To build the review UI, the development team must know the data structure. What should the UI do if the AI returns an invalid card (e.g., a card with a "front" but no "back," or an empty object)? Recommendation: The PRD must state that the front-end will only render AI candidates that are valid (i.e., contain non-empty "front" AND "back" text fields). Any malformed items returned by the API will be silently ignored and not shown to the user.

Answer: We should assume API will return valid non-empty fields for both "front" and "back". Any malformed items returned by the API should be silently ignored and not shown to the user.

Question: What does the user see on the "My flashcards" page if they have 0 flashcards saved? Recommendation: We must define an "empty state" for this page. It should display a clear message (e.g., "Your deck is empty!") and a prominent "Create your first flashcard" button/link that directs them to the creation page.

Answer: We should show user-friendly empty-state message on "My flashcards" page when no flashcards created yet, with link to flashcard creation page.

Question: What does the user see when they navigate to the "Study Session" page but have no cards currently due for review? Recommendation: This page also needs an "empty state." It should display a message like, "You're all caught up! No cards are due for review right now. Come back later or add more cards to your deck."

Answer: We should show user-friendly empty-state message on "Study Session" page when no flashcards created yet, with link to flashcard creation page.

Question: What is the desired behavior when a user finishes a study session (i.e., they have graded the last due card)? Recommendation: After the last card is graded, the user should be shown a simple "Session Complete!" screen. This screen should display a "Congratulations" message and a single button, "Return to Deck," that navigates them back to the "My flashcards" page.

Answer: After finishing the study session, the user should be shown a simple "Session Complete! Congratulations!" message and a single button "Return to my flashcards" page.

Question: For the "My flashcards" page, you mentioned "simple pagination." How many flashcards should we display per page? Recommendation: Let's define "simple pagination" as 25 flashcards per page. This provides a good default that balances performance and usability.

Answer: Let's show 50 results per page on flashcards list.

Question: What is the exact behavior after a user clicks "Save" in the "Add Manually" modal? Recommendation: The PRD should specify that clicking "Save" will: (1) Save the new card to the database, (2) Close the modal, and (3) Keep the user on the "Create" page, so they can immediately choose to add another card or generate cards via AI.

Answer: After clicking "Save" on manually add flashcard modal: (1) Save the new card to the database, (2) Close the modal, and (3) Keep the user on the "Create flashcard" page, so they can immediately choose to add another card or generate cards via AI.

Question: What should be the default, primary page the user lands on immediately after they log in successfully? Recommendation: Given the two main user flows (creating vs. studying), I recommend the default "home page" after login should be the "My flashcards" page. This allows them to see their content and choose whether to "Study" or "Create" from there.

Answer: After logging in, user should see "My flashcards" page, with buttons linking to "Create flashcards" and start "Study Session".
