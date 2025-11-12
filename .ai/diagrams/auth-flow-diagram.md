# Authentication Flow Diagram - 10xCards

This diagram visualizes the complete authentication sequence for the 10xCards application, showing interactions between Browser, Middleware, Astro API, and Supabase Auth.

## Overview

The authentication system handles:
- User registration and login
- Session management with automatic token refresh
- Password recovery and reset
- Account management (change password, delete account)
- Protected route access control
- Logout functionality

## Authentication Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    
    participant Browser
    participant Middleware
    participant AstroAPI as Astro API
    participant SupabaseAuth as Supabase Auth
    
    Note over Browser,SupabaseAuth: REGISTRATION FLOW
    
    Browser->>Browser: User visits /register
    Browser->>Middleware: GET /register
    Middleware->>SupabaseAuth: Check session
    SupabaseAuth-->>Middleware: No session
    Middleware-->>Browser: Render register page
    
    Browser->>Browser: User fills email + password
    Browser->>AstroAPI: POST /api/auth/register
    activate AstroAPI
    AstroAPI->>AstroAPI: Validate with Zod schema
    AstroAPI->>SupabaseAuth: signUp(email, password)
    activate SupabaseAuth
    SupabaseAuth->>SupabaseAuth: Create user account
    SupabaseAuth->>SupabaseAuth: Create session tokens
    SupabaseAuth-->>AstroAPI: User + Session
    deactivate SupabaseAuth
    AstroAPI-->>Browser: Success response
    deactivate AstroAPI
    Browser->>Browser: Redirect to /my-flashcards
    
    Note over Browser,SupabaseAuth: LOGIN FLOW
    
    Browser->>Browser: User visits /login
    Browser->>Middleware: GET /login
    Middleware->>SupabaseAuth: Check session
    SupabaseAuth-->>Middleware: No session
    Middleware-->>Browser: Render login page
    
    Browser->>Browser: User enters credentials
    Browser->>AstroAPI: POST /api/auth/login
    activate AstroAPI
    AstroAPI->>AstroAPI: Validate with Zod schema
    AstroAPI->>SupabaseAuth: signInWithPassword(email, password)
    activate SupabaseAuth
    
    alt Valid credentials
        SupabaseAuth->>SupabaseAuth: Create session tokens
        SupabaseAuth-->>AstroAPI: User + Session
        deactivate SupabaseAuth
        AstroAPI-->>Browser: Success response
        deactivate AstroAPI
        Browser->>Browser: Redirect to /my-flashcards
    else Invalid credentials
        SupabaseAuth-->>AstroAPI: Authentication error
        deactivate SupabaseAuth
        AstroAPI-->>Browser: Error: Invalid credentials
        deactivate AstroAPI
        Browser->>Browser: Display error message
    end
    
    Note over Browser,SupabaseAuth: PROTECTED PAGE ACCESS
    
    Browser->>Middleware: GET /my-flashcards
    activate Middleware
    Middleware->>SupabaseAuth: getSession()
    activate SupabaseAuth
    
    alt Valid session
        SupabaseAuth-->>Middleware: Session data
        deactivate SupabaseAuth
        Middleware->>Middleware: Add supabase to context.locals
        Middleware-->>Browser: Render protected page
        deactivate Middleware
    else No session or expired
        SupabaseAuth-->>Middleware: No session
        deactivate SupabaseAuth
        Middleware-->>Browser: Redirect to /login
        deactivate Middleware
    end
    
    Note over Browser,SupabaseAuth: TOKEN REFRESH (AUTOMATIC)
    
    Browser->>AstroAPI: Request to protected endpoint
    activate AstroAPI
    AstroAPI->>SupabaseAuth: getUser()
    activate SupabaseAuth
    SupabaseAuth->>SupabaseAuth: Check access token
    
    alt Access token expired
        SupabaseAuth->>SupabaseAuth: Use refresh token
        SupabaseAuth->>SupabaseAuth: Issue new access token
        SupabaseAuth-->>AstroAPI: New session with fresh token
        deactivate SupabaseAuth
        AstroAPI-->>Browser: Continue request
        deactivate AstroAPI
    else Refresh token expired
        SupabaseAuth-->>AstroAPI: Session expired
        deactivate SupabaseAuth
        AstroAPI-->>Browser: 401 Unauthorized
        deactivate AstroAPI
        Browser->>Browser: Redirect to /login
    end
    
    Note over Browser,SupabaseAuth: PASSWORD RECOVERY FLOW
    
    Browser->>Browser: User visits /password-recovery
    Browser->>Browser: User enters email
    Browser->>AstroAPI: POST /api/auth/password-recovery
    activate AstroAPI
    AstroAPI->>AstroAPI: Validate email with Zod
    AstroAPI->>SupabaseAuth: resetPasswordForEmail(email)
    activate SupabaseAuth
    SupabaseAuth->>SupabaseAuth: Generate reset token
    SupabaseAuth->>Browser: Send email with reset link
    Note over Browser: Email contains link:<br/>/password-reset?token=xxx
    SupabaseAuth-->>AstroAPI: Success
    deactivate SupabaseAuth
    AstroAPI-->>Browser: Generic success message
    deactivate AstroAPI
    Browser->>Browser: Display success message
    
    Note over Browser,SupabaseAuth: PASSWORD RESET FLOW
    
    Browser->>Browser: User clicks email link
    Browser->>Middleware: GET /password-reset?token=xxx
    Middleware-->>Browser: Render password reset page
    
    Browser->>Browser: User enters new password
    Browser->>AstroAPI: POST /api/auth/password-reset
    activate AstroAPI
    AstroAPI->>AstroAPI: Validate password with Zod
    AstroAPI->>SupabaseAuth: updateUser(password)
    activate SupabaseAuth
    
    alt Valid token
        SupabaseAuth->>SupabaseAuth: Update password
        SupabaseAuth-->>AstroAPI: Success
        deactivate SupabaseAuth
        AstroAPI-->>Browser: Success response
        deactivate AstroAPI
        Browser->>Browser: Redirect to /login
    else Invalid or expired token
        SupabaseAuth-->>AstroAPI: Token error
        deactivate SupabaseAuth
        AstroAPI-->>Browser: Error: Token invalid
        deactivate AstroAPI
        Browser->>Browser: Display error message
    end
    
    Note over Browser,SupabaseAuth: CHANGE PASSWORD FLOW
    
    Browser->>Browser: User visits /my-account
    Browser->>Browser: User fills password form
    Browser->>AstroAPI: POST /api/auth/change-password
    activate AstroAPI
    AstroAPI->>AstroAPI: Validate with Zod schema
    AstroAPI->>SupabaseAuth: Verify current password
    activate SupabaseAuth
    
    alt Current password correct
        SupabaseAuth-->>AstroAPI: Verified
        AstroAPI->>SupabaseAuth: updateUser(newPassword)
        SupabaseAuth->>SupabaseAuth: Update password
        SupabaseAuth-->>AstroAPI: Success
        deactivate SupabaseAuth
        AstroAPI-->>Browser: Success response
        deactivate AstroAPI
        Browser->>Browser: Display success toast
    else Current password incorrect
        SupabaseAuth-->>AstroAPI: Verification failed
        deactivate SupabaseAuth
        AstroAPI-->>Browser: Error: Incorrect password
        deactivate AstroAPI
        Browser->>Browser: Display error message
    end
    
    Note over Browser,SupabaseAuth: DELETE ACCOUNT FLOW
    
    Browser->>Browser: User clicks Delete Account
    Browser->>Browser: Modal opens for confirmation
    Browser->>Browser: User enters password
    Browser->>AstroAPI: DELETE /api/auth/delete-account
    activate AstroAPI
    AstroAPI->>AstroAPI: Validate password with Zod
    AstroAPI->>SupabaseAuth: Verify password
    activate SupabaseAuth
    
    alt Password correct
        SupabaseAuth-->>AstroAPI: Verified
        AstroAPI->>SupabaseAuth: Delete user (Admin API)
        SupabaseAuth->>SupabaseAuth: Delete user account
        Note over SupabaseAuth: CASCADE deletes<br/>all flashcards
        SupabaseAuth->>SupabaseAuth: Clear session
        SupabaseAuth-->>AstroAPI: Success
        deactivate SupabaseAuth
        AstroAPI-->>Browser: Success response
        deactivate AstroAPI
        Browser->>Browser: Redirect to /login
    else Password incorrect
        SupabaseAuth-->>AstroAPI: Verification failed
        deactivate SupabaseAuth
        AstroAPI-->>Browser: Error: Incorrect password
        deactivate AstroAPI
        Browser->>Browser: Display error message
    end
    
    Note over Browser,SupabaseAuth: LOGOUT FLOW
    
    Browser->>Browser: User clicks Logout button
    Browser->>AstroAPI: POST /api/auth/logout
    activate AstroAPI
    AstroAPI->>SupabaseAuth: signOut()
    activate SupabaseAuth
    SupabaseAuth->>SupabaseAuth: Clear session tokens
    SupabaseAuth-->>AstroAPI: Success
    deactivate SupabaseAuth
    AstroAPI-->>Browser: Success response
    deactivate AstroAPI
    Browser->>Browser: Redirect to /login
```

## Key Authentication Flows

### 1. Registration (Steps 1-15)
- User submits email and password
- Zod validates input format
- Supabase creates user account and session
- User automatically logged in and redirected

### 2. Login (Steps 16-30)
- User submits credentials
- Supabase verifies credentials
- Session created with JWT tokens (access + refresh)
- User redirected to dashboard

### 3. Protected Page Access (Steps 31-41)
- Middleware intercepts all requests
- Session validated before rendering
- Invalid sessions redirect to login
- Valid sessions add Supabase client to context

### 4. Token Refresh (Steps 42-53)
- Automatic process handled by Supabase client
- Access token expires after ~1 hour
- Refresh token used to get new access token
- Seamless for user, no re-login required
- If refresh token expired, user must re-login

### 5. Password Recovery (Steps 54-64)
- User requests password reset via email
- Supabase generates one-time token
- Email sent with reset link containing token
- Token expires in 1 hour

### 6. Password Reset (Steps 65-78)
- User clicks email link with token
- Enters new password
- Supabase validates token and updates password
- User redirected to login

### 7. Change Password (Steps 79-93)
- Authenticated user provides current password
- System verifies current password
- New password updated in Supabase
- Session remains active

### 8. Delete Account (Steps 94-111)
- User confirms with password
- System verifies password
- Supabase Admin API deletes user
- CASCADE constraint deletes all user data
- Session cleared, user logged out

### 9. Logout (Steps 112-118)
- User initiates logout
- Supabase clears session tokens
- User redirected to login page

## Security Features

### Session Management
- **HTTP-only cookies**: Tokens not accessible via JavaScript
- **Access token**: Short-lived (~1 hour) for security
- **Refresh token**: Long-lived (~7 days) for convenience
- **Automatic refresh**: Seamless token renewal

### Password Security
- **Minimum 8 characters**: Enforced by validation
- **Bcrypt hashing**: Passwords never stored in plain text
- **Current password verification**: Required for changes
- **Password confirmation**: Required for account deletion

### Token Security
- **JWT signed tokens**: Cryptographically secure
- **One-time reset tokens**: Expire in 1 hour
- **Token validation**: Performed by Supabase

### Route Protection
- **Middleware validation**: Every request checked
- **Automatic redirects**: Unauthorized access prevented
- **Session-based access**: No manual token handling

## Error Handling

### Client-Side
- Form validation errors displayed inline
- API errors shown via toast notifications
- Network errors show generic message
- 401 errors trigger redirect to login

### Server-Side
- Validation errors (400) return specific messages
- Authentication errors (401) return generic messages
- Server errors (500) logged and return generic message
- Rate limiting (429) prevents abuse

## Integration with Existing Features

The authentication system integrates seamlessly with existing features:

- **Flashcards API**: Uses `context.locals.supabase.auth.getUser()` for user ID
- **RLS Policies**: Automatically filter data by authenticated user
- **Middleware**: Enhanced to add session validation
- **Protected Routes**: All flashcard pages require authentication

No breaking changes to existing functionality.
