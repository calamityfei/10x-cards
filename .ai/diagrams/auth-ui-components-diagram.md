# Authentication UI Components Architecture Diagram

This diagram visualizes the architecture of Astro pages and React components for the authentication module in the 10xCards application.

## Architecture Overview

The authentication system is divided into:
- **Public Zone**: Unauthenticated pages (login, register, password recovery/reset)
- **Protected Zone**: Authenticated pages (account management, flashcards, study sessions)
- **Middleware Layer**: Session validation and routing logic
- **API Layer**: Authentication endpoints
- **Service Layer**: Business logic and Supabase integration

## Component Diagram

```mermaid
flowchart TD
    subgraph "Middleware Layer"
        MW[Middleware]
        MW -->|Check Session| AUTH_CHECK{Authenticated?}
    end

    subgraph "Public Pages - Unauthenticated Zone"
        LOGIN_PAGE["/login.astro"]
        REGISTER_PAGE["/register.astro"]
        RECOVERY_PAGE["/password-recovery.astro"]
        RESET_PAGE["/password-reset.astro"]
        
        LOGIN_PAGE --> PUB_LAYOUT[PublicLayout]
        REGISTER_PAGE --> PUB_LAYOUT
        RECOVERY_PAGE --> PUB_LAYOUT
        RESET_PAGE --> PUB_LAYOUT
        
        PUB_LAYOUT --> LOGIN_FORM[LoginForm]
        PUB_LAYOUT --> REGISTER_FORM[RegisterForm]
        PUB_LAYOUT --> RECOVERY_FORM[PasswordRecoveryForm]
        PUB_LAYOUT --> RESET_FORM[PasswordResetForm]
    end

    subgraph "Protected Pages - Authenticated Zone"
        ACCOUNT_PAGE["/my-account.astro"]
        FLASHCARDS_PAGE["/my-flashcards.astro"]
        CREATE_PAGE["/create-flashcards.astro"]
        STUDY_PAGE["/study-session.astro"]
        
        ACCOUNT_PAGE --> PROT_LAYOUT[ProtectedLayout]
        FLASHCARDS_PAGE --> PROT_LAYOUT
        CREATE_PAGE --> PROT_LAYOUT
        STUDY_PAGE --> PROT_LAYOUT
        
        PROT_LAYOUT --> HEADER[PersistentHeader]
        HEADER -->|Logout Action| LOGOUT_API
    end

    subgraph "Auth React Components"
        LOGIN_FORM -->|Submit| LOGIN_API["/api/auth/login"]
        REGISTER_FORM -->|Submit| REGISTER_API["/api/auth/register"]
        RECOVERY_FORM -->|Submit| RECOVERY_API["/api/auth/password-recovery"]
        RESET_FORM -->|Submit| RESET_API["/api/auth/password-reset"]
        
        ACCOUNT_PAGE --> ACCOUNT_SETTINGS[AccountSettings]
        ACCOUNT_SETTINGS -->|Change Password| CHANGE_PWD_API["/api/auth/change-password"]
        ACCOUNT_SETTINGS -->|Delete Account| DELETE_MODAL[DeleteAccountModal]
        DELETE_MODAL -->|Confirm| DELETE_API["/api/auth/delete-account"]
    end

    subgraph "Shared UI Components"
        UI_BUTTON[Button]
        UI_CARD[Card]
        UI_DIALOG[Dialog]
        
        LOGIN_FORM -.->|Uses| UI_BUTTON
        REGISTER_FORM -.->|Uses| UI_BUTTON
        RECOVERY_FORM -.->|Uses| UI_BUTTON
        RESET_FORM -.->|Uses| UI_BUTTON
        ACCOUNT_SETTINGS -.->|Uses| UI_CARD
        ACCOUNT_SETTINGS -.->|Uses| UI_BUTTON
        DELETE_MODAL -.->|Uses| UI_DIALOG
    end

    subgraph "API Endpoints"
        LOGIN_API --> SUPABASE[Supabase Auth]
        REGISTER_API --> SUPABASE
        RECOVERY_API --> SUPABASE
        RESET_API --> SUPABASE
        CHANGE_PWD_API --> SUPABASE
        DELETE_API --> SUPABASE
        LOGOUT_API["/api/auth/logout"] --> SUPABASE
    end

    subgraph "Validation Layer"
        AUTH_SCHEMAS["auth.schemas.ts<br/>(Zod Validation)"]
        LOGIN_API -.->|Validates| AUTH_SCHEMAS
        REGISTER_API -.->|Validates| AUTH_SCHEMAS
        RECOVERY_API -.->|Validates| AUTH_SCHEMAS
        RESET_API -.->|Validates| AUTH_SCHEMAS
        CHANGE_PWD_API -.->|Validates| AUTH_SCHEMAS
        DELETE_API -.->|Validates| AUTH_SCHEMAS
    end

    subgraph "Service Layer"
        AUTH_SERVICE["auth.service.ts"]
        LOGIN_API --> AUTH_SERVICE
        REGISTER_API --> AUTH_SERVICE
        RECOVERY_API --> AUTH_SERVICE
        RESET_API --> AUTH_SERVICE
        CHANGE_PWD_API --> AUTH_SERVICE
        DELETE_API --> AUTH_SERVICE
        LOGOUT_API --> AUTH_SERVICE
        AUTH_SERVICE --> SUPABASE
    end

    AUTH_CHECK -->|No| LOGIN_PAGE
    AUTH_CHECK -->|Yes + Public Page| FLASHCARDS_PAGE
    AUTH_CHECK -->|Yes + Protected Page| ACCOUNT_PAGE

    LOGIN_API -->|Success| FLASHCARDS_PAGE
    REGISTER_API -->|Success| FLASHCARDS_PAGE
    RESET_API -->|Success| LOGIN_PAGE
    DELETE_API -->|Success| LOGIN_PAGE
    LOGOUT_API -->|Success| LOGIN_PAGE

    classDef newComponent fill:#a8dadc,stroke:#457b9d,stroke-width:2px
    classDef existingComponent fill:#f1faee,stroke:#457b9d,stroke-width:1px
    classDef apiEndpoint fill:#e63946,stroke:#1d3557,stroke-width:2px,color:#fff
    classDef layout fill:#ffd60a,stroke:#003566,stroke-width:2px

    class LOGIN_PAGE,REGISTER_PAGE,RECOVERY_PAGE,RESET_PAGE,ACCOUNT_PAGE newComponent
    class LOGIN_FORM,REGISTER_FORM,RECOVERY_FORM,RESET_FORM,ACCOUNT_SETTINGS,DELETE_MODAL,HEADER newComponent
    class PUB_LAYOUT,PROT_LAYOUT newComponent
    class LOGIN_API,REGISTER_API,RECOVERY_API,RESET_API,CHANGE_PWD_API,DELETE_API,LOGOUT_API apiEndpoint
    class AUTH_SCHEMAS,AUTH_SERVICE newComponent
    class FLASHCARDS_PAGE,CREATE_PAGE,STUDY_PAGE,UI_BUTTON,UI_CARD,UI_DIALOG existingComponent
    class MW layout
```

## Legend

- **Light Blue (New Components)**: Components and pages to be created for authentication
- **Light Green (Existing Components)**: Components that already exist and will be updated
- **Red (API Endpoints)**: Backend API endpoints for authentication operations
- **Yellow (Middleware)**: Request/response middleware layer

## Key Components

### Public Pages (New)
- **login.astro**: User login page
- **register.astro**: New user registration page
- **password-recovery.astro**: Password recovery initiation page
- **password-reset.astro**: Password reset completion page

### Protected Pages
- **my-account.astro** (New): Account management page
- **my-flashcards.astro** (Updated): Add authentication check and header
- **create-flashcards.astro** (Updated): Add authentication check and header
- **study-session.astro** (Updated): Add authentication check and header

### React Components (New)
- **LoginForm**: Email/password login form with validation
- **RegisterForm**: Registration form with password confirmation
- **PasswordRecoveryForm**: Email input for password recovery
- **PasswordResetForm**: New password input with token validation
- **AccountSettings**: Account management interface with change password and delete account
- **DeleteAccountModal**: Confirmation dialog for account deletion

### Layout Components (New)
- **PublicLayout**: Minimal layout for unauthenticated pages
- **ProtectedLayout**: Layout with header for authenticated pages
- **PersistentHeader** (Updated): Navigation header with logout button

### API Endpoints (New)
- POST `/api/auth/login`: Authenticate user
- POST `/api/auth/register`: Create new account
- POST `/api/auth/logout`: End user session
- POST `/api/auth/password-recovery`: Initiate password reset
- POST `/api/auth/password-reset`: Complete password reset
- POST `/api/auth/change-password`: Update user password
- DELETE `/api/auth/delete-account`: Delete user account

### Service Layer (New)
- **auth.service.ts**: Encapsulates Supabase Auth operations
- **auth.schemas.ts**: Zod validation schemas for authentication

## Data Flow

1. **Middleware** checks authentication status on every request
2. **Public pages** redirect authenticated users to `/my-flashcards`
3. **Protected pages** redirect unauthenticated users to `/login`
4. **Form components** validate input and submit to API endpoints
5. **API endpoints** validate with Zod schemas and call service layer
6. **Service layer** interacts with Supabase Auth
7. **Successful operations** redirect users to appropriate pages

## Dependencies

- All form components use shared UI components (Button, Card, Dialog)
- All API endpoints use validation schemas and service layer
- Middleware controls access to all pages based on authentication state
- Protected pages require PersistentHeader with logout functionality
