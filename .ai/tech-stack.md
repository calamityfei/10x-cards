## Tech Stack

### Frontend - Astro with React

- **Astro 5**: Allows for creating fast, efficient sites and applications with a minimal amount of JavaScript.
- **React 19**: Will provide interactivity where it is needed.
- **TypeScript 5**: For static code typing and better IDE support.
- **Tailwind 4**: Allows for convenient application styling.
- **Shadcn/ui**: Provides a library of accessible React components on which we will base the UI.

### Backend - Supabase

- **Supabase**: A comprehensive backend solution.
  - Provides a **PostgreSQL** database.
  - Provides SDKs in many languages that will serve as a Backend-as-a-Service.
  - It is an open-source solution that can be hosted locally or on your own server.
  - It has built-in user authentication.

### AI - Openrouter.ai

- **Openrouter.ai**: Communication with models via this service.
  - Access to a wide range of models (**OpenAI**, **Anthropic**, **Google**, and many others), which will allow us to find a solution ensuring high efficiency and low costs.
  - Allows for setting financial limits on API keys.

### Testing

- **Vitest**: Test framework for unit, component, and integration tests.
- **React Testing Library**: For testing React components in isolation.
- **Playwright**: End-to-end testing framework for simulating complete user flows.
- **Mock Service Worker (MSW)**: API mocking for component and E2E tests.

### CI/CD and Hosting

- **Github Actions**: For creating CI/CD pipelines.
- **DigitalOcean**: For hosting the application via a **Docker** image.
