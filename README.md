# 10xCards Project

## 1. Project Description

**10xCards** is a web application designed to accelerate the learning process by automating flashcard creation. It solves the common problem of manual flashcard creation being too time-consuming, which often discourages learners from using the powerful **spaced repetition** study method.

This application allows you to paste your study notes, and an AI will generate high-quality flashcard "candidates" for you. You can then quickly review, edit, or accept these cards into your personal deck, all in one seamless flow.

### Core Features

- **AI Flashcard Generation:** Paste text (1,000-10,000 characters) and receive up to 50 AI-generated flashcards.
- **Review & Edit Flow:** Instantly review, edit, and approve AI-generated cards before saving them.
- **Manual Creation:** Manually create your own flashcards with a simple "front" and "back" modal.
- **Card Management:** All your cards are saved in a central "My Flashcards" page, which includes search and pagination (50 per page).
- **Study Session:** A built-in study tool that uses a spaced repetition algorithm to show you cards you need to review.
- **User Accounts:** A simple and secure email/password system to store your cards.

---

## 2. Table of Contents

- [1. Project Description](#1-project-description)
- [2. Table of Contents](#2-table-of-contents)
- [3. Tech Stack](#3-tech-stack)
- [4. Getting Started Locally](#4-getting-started-locally)
- [5. Available Scripts](#5-available-scripts)
- [6. Project Scope](#6-project-scope)
- [7. Project Status](#7-project-status)
- [8. License](#8-license)

---

## 3. Tech Stack

This project uses a modern, decoupled architecture designed for performance, developer experience, and scalability.

### Frontend

- **[Astro 5](https://astro.build/):** A web framework for building fast, content-driven websites with "Islands Architecture" (minimal JS by default).
- **[React 19](https://react.dev/):** Used for building interactive UI components ("islands") where state management is needed, such as the study session and AI review list.
- **[TypeScript 5](https://www.typescriptlang.org/):** For static type-checking across the entire application.
- **[Tailwind CSS 4](https://tailwindcss.com/):** A utility-first CSS framework for rapid UI development.
- **[Shadcn/ui](https://ui.shadcn.com/):** A collection of accessible and reusable UI components (modals, buttons, etc.).

### Backend & Database

- **[Supabase](https://supabase.com/):** A comprehensive open-source backend-as-a-service (BaaS). It provides:
  - A managed PostgreSQL database.
  - Real-time data synchronization.
  - Built-in user authentication and management.

### AI Integration

- **[Openrouter.ai](https://openrouter.ai/):** A single API endpoint to access a wide variety of AI models (from OpenAI, Anthropic, Google, etc.). This allows us to find the most cost-effective model that meets the project's quality goals.

### Testing

- **[Vitest](https://vitest.dev/):** Test framework for unit, component, and integration tests.
- **[React Testing Library](https://testing-library.com/docs/react-testing-library/intro/):** For testing React components in isolation.
- **[Playwright](https://playwright.dev/):** End-to-end testing framework for simulating complete user flows.
- **[Mock Service Worker (MSW)](https://mswjs.io/):** API mocking for component and E2E tests.

#### Unit Testing Quick Guide

```bash
# Run all unit tests
npm test

# Run only unit tests (exclude e2e)
npm test -- tests/unit/

# Run with watch mode (auto-rerun on file changes)
npm test -- tests/unit/ --watch

# Run with UI (visual test runner)
npm run test:ui
```

### DevOps

- **[GitHub Actions](https://github.com/features/actions):** Used for Continuous Integration and Continuous Deployment (CI/CD) pipelines.
- **[DigitalOcean](https://www.digitalocean.com/):** Hosts the production application as a Docker image.

---

## 4. Getting Started Locally

Follow these instructions to get a copy of the project up and running on your local machine.

### Prerequisites

- **Node.js:** This project uses a specific Node.js version: **22.14.0**. It is recommended to use a version manager like `nvm`.
  ```sh
  # Install the correct Node.js version
  nvm install 22.14.0
  nvm use 22.14.0
  ```
- **Package Manager:** `npm` (or `pnpm`/`yarn`).
- **Supabase Account:** You will need a free Supabase project.
- **Openrouter.ai Account:** You will need an Openrouter API key.

### Installation

1.  **Clone the repository:**

    ```sh
    git clone [https://github.com/calamityfei/10x-cards.git](https://github.com/calamityfei/10x-cards.git)
    cd 10x-cards
    ```

2.  **Install dependencies:**

    ```sh
    npm install
    ```

3.  **Run the development server:**
    ```sh
    npm run dev
    ```
    The application will be available at `http://localhost:3000`.

---

## 4. Available Scripts

The following scripts are available in the `package.json`:

- `npm run dev`: Runs the Astro development server with hot-reloading.
- `npm run build`: Builds the application for production.
- `npm run preview`: Starts a local server to preview the production build.
- `npm run lint`: Lints the code using ESLint to find issues.
- `npm run lint:fix`: Lints the code and automatically fixes fixable issues.
- `npm run format`: Formats all code using Prettier.

---

## 5. Project Status and Scope

**Status: MVP**

This project is a **MVP** (Minimum Viable Product), currently in the initial development phase, focusing on building the core features defined in the PRD. The primary goal is to validate the core user-flow (AI generation -> review -> study) with minimal, focused features.

### In Scope for MVP

- Simple email/password authentication (Register, Login, Change Password, Delete Account).
- AI card generation from pasted text (1k-10k characters).
- Manual card creation.
- A single "default deck" for all user cards.
- Browse, search, edit, and delete functionality for all saved cards.
- Integration with a simple, existing spaced repetition algorithm.

### Out of Scope for MVP

- Native mobile applications (iOS/Android).
- Advanced or custom-built repetition algorithms (like Anki's SM-2).
- File imports (e.g., PDF, DOCX, CSV).
- Sharing flashcard decks between users.
- Integrations with other platforms (e.g., LMS, note-taking apps).
- Multi-deck management (creating, naming, or organizing multiple decks).
- Automated password reset ("Forgot Password") emails.

---

## 7. License

This project is licensed under the **MIT License**. See the `LICENSE` file for more details.
