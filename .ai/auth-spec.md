# Authentication Architecture Specification - 10xCards

## 1. USER INTERFACE ARCHITECTURE

### 1.1. Public Pages (Unauthenticated Zone)

#### 1.1.1. Login Page (`/login`)

**Purpose:** Authenticate existing users (US-002)

**Components:**

- **Astro Page:** `/src/pages/login.astro`
  - Server-side: Check if user is already authenticated, redirect to `/my-flashcards` if true
  - Renders LoginForm React component
  - Uses minimal public layout (no header)

- **React Component:** `LoginForm` (`/src/components/auth/LoginForm.tsx`)
  - Email input field (type="email", required)
  - Password input field (type="password", required)
  - "Login" button with loading state
  - "Forgot password?" link to `/password-recovery`
  - "Don't have an account? Register" link to `/register`
  - Form submission handler calling `/api/auth/login` endpoint

**Validation:**

- Client-side: Email format validation, non-empty password
- Error messages displayed inline below fields

**User Flow:**

1. User enters email and password
2. On submit, call `POST /api/auth/login`
3. On success: Redirect to `/my-flashcards`
4. On error: Display error message via toast (e.g., "Invalid credentials")

---

#### 1.1.2. Register Page (`/register`)

**Purpose:** Create new user accounts (US-001)

**Components:**

- **Astro Page:** `/src/pages/register.astro`
  - Server-side: Check if user is already authenticated, redirect to `/my-flashcards` if true
  - Renders RegisterForm React component
  - Uses minimal public layout (no header)

- **React Component:** `RegisterForm` (`/src/components/auth/RegisterForm.tsx`)
  - Email input field (type="email", required)
  - Password input field (type="password", required, min 8 characters)
  - Confirm password input field (type="password", required)
  - "Register" button with loading state
  - "Already have an account? Login" link to `/login`
  - Form submission handler calling `/api/auth/register` endpoint

**Validation:**

- Client-side:
  - Email format validation
  - Password minimum 8 characters
  - Password and confirm password match
  - Display inline error messages
- Server-side: Supabase validates email uniqueness and password strength

**User Flow:**

1. User enters email, password, and confirm password
2. On submit, call `POST /api/auth/register`
3. On success: User is automatically logged in, redirect to `/my-flashcards`
4. On error: Display error message (e.g., "Email already in use")

---

#### 1.1.3. Password Recovery Page (`/password-recovery`)

**Purpose:** Initiate password reset flow (US-000)

**Components:**

- **Astro Page:** `/src/pages/password-recovery.astro`
  - Server-side: Check if user is already authenticated, redirect to `/my-flashcards` if true
  - Renders PasswordRecoveryForm React component
  - Uses minimal public layout (no header)

- **React Component:** `PasswordRecoveryForm` (`/src/components/auth/PasswordRecoveryForm.tsx`)
  - Email input field (type="email", required)
  - "Send Recovery Email" button with loading state
  - "Back to Login" link to `/login`
  - Form submission handler calling `/api/auth/password-recovery` endpoint

**Validation:**

- Client-side: Email format validation
- Error messages displayed inline

**User Flow:**

1. User enters email address
2. On submit, call `POST /api/auth/password-recovery`
3. On success: Display success message "Check your email for password reset instructions"
4. On error: Display generic message "If account exists, email will be sent" (security best practice)

---

#### 1.1.4. Password Reset Page (`/password-reset`)

**Purpose:** Complete password reset with token from email (US-000)

**Components:**

- **Astro Page:** `/src/pages/password-reset.astro`
  - Server-side: Extract token from URL query params, validate token exists
  - If no token or invalid token, show error and link to `/password-recovery`
  - Renders PasswordResetForm React component
  - Uses minimal public layout (no header)

- **React Component:** `PasswordResetForm` (`/src/components/auth/PasswordResetForm.tsx`)
  - Hidden token field (from URL)
  - New password input field (type="password", required, min 8 characters)
  - Confirm password input field (type="password", required)
  - "Reset Password" button with loading state
  - Form submission handler calling `/api/auth/password-reset` endpoint

**Validation:**

- Client-side:
  - Password minimum 8 characters
  - Password and confirm password match
  - Display inline error messages

**User Flow:**

1. User clicks link from email, lands on page with token in URL
2. User enters new password and confirm password
3. On submit, call `POST /api/auth/password-reset` with token
4. On success: Display success message, redirect to `/login` after 2 seconds
5. On error: Display error message (e.g., "Token expired or invalid")

---

### 1.2. Protected Pages (Authenticated Zone)

All protected pages require authentication. Middleware checks for valid session and redirects to `/login` if not authenticated.

#### 1.2.1. My Account Page (`/my-account`)

**Purpose:** Manage account settings (US-004, US-005)

**Components:**

- **Astro Page:** `/src/pages/my-account.astro`
  - Server-side: Fetch user email from `context.locals.supabase.auth.getUser()`
  - Pass user data to React component
  - Uses protected layout with PersistentHeader

- **React Component:** `AccountSettings` (`/src/components/account/AccountSettings.tsx`)
  - Two Card sections:
    1. **Account Information Card:**
       - Display email (read-only)
    2. **Change Password Card:**
       - Current password input (type="password", required)
       - New password input (type="password", required, min 8 characters)
       - Confirm new password input (type="password", required)
       - "Update Password" button
       - Form handler calling `/api/auth/change-password` endpoint
    3. **Delete Account Card:**
       - Warning text about permanent deletion
       - "Delete My Account" button (destructive variant)
       - Opens ConfirmationModal on click

- **React Component:** `DeleteAccountModal` (`/src/components/account/DeleteAccountModal.tsx`)
  - Confirmation dialog
  - Password input for verification (type="password", required)
  - "Cancel" and "Delete Account" buttons
  - On confirm, call `/api/auth/delete-account` endpoint

**Validation:**

- Change Password:
  - Client-side: New password min 8 chars, passwords match
  - Server-side: Verify current password is correct
- Delete Account:
  - Server-side: Verify password is correct before deletion

**User Flow - Change Password:**

1. User fills current password, new password, confirm password
2. On submit, call `POST /api/auth/change-password`
3. On success: Display toast "Password updated successfully", clear form
4. On error: Display error message (e.g., "Current password is incorrect")

**User Flow - Delete Account:**

1. User clicks "Delete My Account" button
2. Modal opens with password confirmation field
3. User enters password and clicks "Delete Account"
4. On submit, call `DELETE /api/auth/delete-account`
5. On success: User is logged out, redirect to `/login` with message "Account deleted"
6. On error: Display error message

---

#### 1.2.2. Updates to Existing Protected Pages

**PersistentHeader Component** (`/src/components/layout/PersistentHeader.tsx`)

Add logout functionality:

- **Logout Button:** Located in top-right corner
  - On click, call `/api/auth/logout` endpoint
  - On success, redirect to `/login`
  - Display loading state during logout

**Existing Pages to Update:**

- `/my-flashcards` - Add PersistentHeader with logout
- `/create-flashcards` - Add PersistentHeader with logout
- `/study-session` - Add PersistentHeader with logout

---

### 1.3. Layout Structure

#### 1.3.1. Public Layout (`/src/layouts/PublicLayout.astro`)

**New layout for unauthenticated pages:**

- Minimal design, centered content
- No header or navigation
- Used by: `/login`, `/register`, `/password-recovery`, `/password-reset`

#### 1.3.2. Protected Layout (`/src/layouts/ProtectedLayout.astro`)

**Update existing Layout.astro or create new:**

- Includes PersistentHeader component
- Content area below header
- Used by: `/my-flashcards`, `/create-flashcards`, `/study-session`, `/my-account`

---

### 1.4. Validation Rules and Error Messages

#### Client-Side Validation

**Email:**

- Rule: Valid email format
- Error: "Please enter a valid email address"

**Password (Registration/Reset):**

- Rule: Minimum 8 characters
- Error: "Password must be at least 8 characters"

**Confirm Password:**

- Rule: Must match password field
- Error: "Passwords do not match"

**Current Password (Change Password):**

- Rule: Non-empty
- Error: "Current password is required"

#### Server-Side Error Messages

**Login:**

- Invalid credentials: "Invalid email or password"
- Account not confirmed: "Please confirm your email address"
- Too many attempts: "Too many login attempts. Please try again later"

**Register:**

- Email already exists: "An account with this email already exists"
- Weak password: "Password is too weak. Please use a stronger password"
- Invalid email: "Please provide a valid email address"

**Password Recovery:**

- Generic success: "If an account exists, you will receive a password reset email"
- Rate limit: "Too many requests. Please try again later"

**Password Reset:**

- Invalid/expired token: "Password reset link is invalid or has expired"
- Weak password: "Password is too weak. Please use a stronger password"

**Change Password:**

- Wrong current password: "Current password is incorrect"
- Same as old: "New password must be different from current password"

**Delete Account:**

- Wrong password: "Password is incorrect"
- Server error: "Unable to delete account. Please try again"

---

### 1.5. Key User Scenarios

#### Scenario 1: New User Registration

1. User visits `/login`
2. Clicks "Register" link → navigates to `/register`
3. Fills email, password, confirm password
4. Submits form
5. On success: Automatically logged in, redirected to `/my-flashcards`

#### Scenario 2: Existing User Login

1. User visits `/login`
2. Enters email and password
3. Submits form
4. On success: Redirected to `/my-flashcards`

#### Scenario 3: Forgot Password

1. User visits `/login`
2. Clicks "Forgot password?" link → navigates to `/password-recovery`
3. Enters email address
4. Submits form
5. Receives email with reset link
6. Clicks link → navigates to `/password-reset?token=xxx`
7. Enters new password and confirm password
8. Submits form
9. On success: Redirected to `/login`, can log in with new password

#### Scenario 4: Change Password (Logged In)

1. User navigates to `/my-account`
2. Scrolls to "Change Password" section
3. Enters current password, new password, confirm new password
4. Clicks "Update Password"
5. On success: Toast notification, form cleared

#### Scenario 5: Delete Account

1. User navigates to `/my-account`
2. Scrolls to "Delete Account" section
3. Clicks "Delete My Account" button
4. Modal opens requesting password confirmation
5. Enters password, clicks "Delete Account"
6. On success: Logged out, redirected to `/login`

#### Scenario 6: Logout

1. User clicks "Logout" button in header
2. Session cleared
3. Redirected to `/login`

---

## 2. BACKEND LOGIC

### 2.1. API Endpoints

All authentication endpoints follow REST conventions and return JSON responses.

#### 2.1.1. POST `/api/auth/register`

**Purpose:** Create new user account (US-001)

**Request Body:**

```typescript
{
  email: string; // Valid email format
  password: string; // Min 8 characters
}
```

**Response (Success - 201):**

```typescript
{
  success: true;
  user: {
    id: string;
    email: string;
  }
}
```

**Response (Error - 400/409):**

```typescript
{
  success: false;
  error: string; // Error message
}
```

**Logic:**

1. Validate input with Zod schema
2. Call `supabase.auth.signUp({ email, password })`
3. If successful, session is automatically created
4. Return user data
5. Handle errors (email exists, weak password, etc.)

---

#### 2.1.2. POST `/api/auth/login`

**Purpose:** Authenticate existing user (US-002)

**Request Body:**

```typescript
{
  email: string;
  password: string;
}
```

**Response (Success - 200):**

```typescript
{
  success: true;
  user: {
    id: string;
    email: string;
  }
}
```

**Response (Error - 401):**

```typescript
{
  success: false;
  error: string;
}
```

**Logic:**

1. Validate input with Zod schema
2. Call `supabase.auth.signInWithPassword({ email, password })`
3. If successful, session is automatically created
4. Return user data
5. Handle errors (invalid credentials, unconfirmed email, etc.)

---

#### 2.1.3. POST `/api/auth/logout`

**Purpose:** End user session (US-003)

**Request Body:** None

**Response (Success - 200):**

```typescript
{
  success: true;
}
```

**Logic:**

1. Call `supabase.auth.signOut()`
2. Clear session cookies
3. Return success

---

#### 2.1.4. POST `/api/auth/password-recovery`

**Purpose:** Initiate password reset flow (US-000)

**Request Body:**

```typescript
{
  email: string;
}
```

**Response (Success - 200):**

```typescript
{
  success: true;
  message: string; // Generic message for security
}
```

**Logic:**

1. Validate email format with Zod schema
2. Call `supabase.auth.resetPasswordForEmail(email, { redirectTo: 'https://domain.com/password-reset' })`
3. Always return success message (don't reveal if email exists)
4. Supabase sends email with reset link containing token

---

#### 2.1.5. POST `/api/auth/password-reset`

**Purpose:** Complete password reset with token (US-000)

**Request Body:**

```typescript
{
  token: string; // From URL/email
  password: string; // New password, min 8 characters
}
```

**Response (Success - 200):**

```typescript
{
  success: true;
}
```

**Response (Error - 400/401):**

```typescript
{
  success: false;
  error: string;
}
```

**Logic:**

1. Validate input with Zod schema
2. Verify token is valid (Supabase handles this)
3. Call `supabase.auth.updateUser({ password })`
4. Return success or error

---

#### 2.1.6. POST `/api/auth/change-password`

**Purpose:** Change password for logged-in user (US-004)

**Authentication:** Required

**Request Body:**

```typescript
{
  currentPassword: string;
  newPassword: string;
}
```

**Response (Success - 200):**

```typescript
{
  success: true;
}
```

**Response (Error - 400/401):**

```typescript
{
  success: false;
  error: string;
}
```

**Logic:**

1. Validate input with Zod schema
2. Get current user from `context.locals.supabase.auth.getUser()`
3. Verify current password by attempting sign in
4. If valid, call `supabase.auth.updateUser({ password: newPassword })`
5. Return success or error

---

#### 2.1.7. DELETE `/api/auth/delete-account`

**Purpose:** Permanently delete user account (US-005)

**Authentication:** Required

**Request Body:**

```typescript
{
  password: string; // For confirmation
}
```

**Response (Success - 200):**

```typescript
{
  success: true;
}
```

**Response (Error - 400/401):**

```typescript
{
  success: false;
  error: string;
}
```

**Logic:**

1. Validate input with Zod schema
2. Get current user from `context.locals.supabase.auth.getUser()`
3. Verify password by attempting sign in
4. If valid, call Supabase Admin API to delete user (requires service role key)
5. Flashcards are automatically deleted via CASCADE constraint
6. Return success or error

---

### 2.2. Data Models and Validation Schemas

#### 2.2.1. Zod Schemas (`/src/lib/validation/auth.schemas.ts`)

```typescript
// Register schema
const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

// Login schema
const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

// Password recovery schema
const passwordRecoverySchema = z.object({
  email: z.string().email("Invalid email format"),
});

// Password reset schema
const passwordResetSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

// Change password schema
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

// Delete account schema
const deleteAccountSchema = z.object({
  password: z.string().min(1, "Password is required"),
});
```

---

### 2.3. Service Layer

#### 2.3.1. Auth Service (`/src/lib/services/auth.service.ts`)

Encapsulates all Supabase Auth operations:

**Functions:**

- `registerUser(email, password)` - Create new user
- `loginUser(email, password)` - Authenticate user
- `logoutUser()` - End session
- `initiatePasswordRecovery(email)` - Send reset email
- `resetPassword(token, newPassword)` - Complete password reset
- `changePassword(userId, currentPassword, newPassword)` - Update password
- `deleteUserAccount(userId, password)` - Delete user and data
- `getCurrentUser()` - Get authenticated user
- `verifyPassword(email, password)` - Verify password is correct

---

### 2.4. Exception Handling

#### Error Response Format

All API endpoints return consistent error format:

```typescript
{
  success: false;
  error: string;        // User-friendly message
  code?: string;        // Optional error code for client handling
}
```

#### Error Handling Strategy

**Client-Side:**

- Form validation errors: Display inline below field
- API errors: Display toast notification
- 401 Unauthorized: Redirect to `/login`
- Network errors: Display generic "Something went wrong" message

**Server-Side:**

- Validation errors (400): Return specific validation message
- Authentication errors (401): Return "Invalid credentials" or similar
- Not found errors (404): Return "Resource not found"
- Server errors (500): Log error, return generic message
- Rate limiting (429): Return "Too many requests"

#### Logging

- Log all authentication attempts (success and failure)
- Log account deletions
- Log password changes
- Do not log passwords or sensitive data

---

### 2.5. Server-Side Rendering Updates

#### 2.5.1. Middleware Enhancement (`/src/middleware/index.ts`)

Update existing middleware to handle authentication:

```typescript
export const onRequest = defineMiddleware(async (context, next) => {
  // Existing: Add Supabase client to context
  context.locals.supabase = supabaseClient;

  // New: Get current session
  const {
    data: { session },
  } = await context.locals.supabase.auth.getSession();

  const url = new URL(context.request.url);
  const isPublicRoute = ["/login", "/register", "/password-recovery", "/password-reset"].includes(url.pathname);
  const isProtectedRoute = ["/my-flashcards", "/create-flashcards", "/study-session", "/my-account"].includes(
    url.pathname
  );

  // Redirect authenticated users away from public pages
  if (session && isPublicRoute) {
    return context.redirect("/my-flashcards");
  }

  // Redirect unauthenticated users to login
  if (!session && isProtectedRoute) {
    return context.redirect("/login");
  }

  return next();
});
```

#### 2.5.2. Protected Page Pattern

All protected Astro pages follow this pattern:

```typescript
---
// Example: /src/pages/my-account.astro
const { data: { user }, error } = await Astro.locals.supabase.auth.getUser();

if (error || !user) {
  return Astro.redirect('/login');
}

// Page has access to authenticated user
---
```

---

## 3. AUTHENTICATION SYSTEM

### 3.1. Supabase Auth Integration

#### 3.1.1. Session Management

**Session Storage:**

- Supabase uses JWT tokens stored in HTTP-only cookies
- Access token (short-lived, ~1 hour)
- Refresh token (long-lived, ~7 days)

**Session Refresh:**

- Supabase client automatically refreshes tokens
- No manual intervention required

**Session Validation:**

- Middleware checks session on every request to protected routes
- Invalid/expired sessions redirect to `/login`

---

#### 3.1.2. Email Configuration

**Email Templates (Configured in Supabase Dashboard):**

1. **Confirmation Email** (if email confirmation enabled)
   - Subject: "Confirm your email for 10xCards"
   - Contains confirmation link

2. **Password Recovery Email**
   - Subject: "Reset your password for 10xCards"
   - Contains reset link with token
   - Link format: `https://domain.com/password-reset?token=xxx`
   - Token expires in 1 hour

3. **Email Change Confirmation** (future feature)
   - Not in MVP scope

---

#### 3.1.3. Security Configuration

**Password Requirements:**

- Minimum 8 characters (enforced by Supabase)
- Can be configured in Supabase dashboard for stronger requirements

**Rate Limiting:**

- Supabase provides built-in rate limiting
- Login attempts: Limited per IP
- Password recovery: Limited per email

**Account Lockout:**

- Handled by Supabase
- Temporary lockout after multiple failed attempts

---

### 3.2. Authentication Flow Diagrams

#### 3.2.1. Registration Flow

```
User → Register Page → POST /api/auth/register → Supabase Auth
                                                      ↓
                                                  Create User
                                                      ↓
                                                Create Session
                                                      ↓
User ← Redirect to /my-flashcards ← Return Success ←
```

#### 3.2.2. Login Flow

```
User → Login Page → POST /api/auth/login → Supabase Auth
                                                ↓
                                          Verify Credentials
                                                ↓
                                          Create Session
                                                ↓
User ← Redirect to /my-flashcards ← Return Success ←
```

#### 3.2.3. Password Recovery Flow

```
User → Password Recovery Page → POST /api/auth/password-recovery → Supabase Auth
                                                                         ↓
                                                                   Send Email
                                                                         ↓
User ← Show Success Message ← Return Success ←

User receives email → Clicks link → Password Reset Page
                                          ↓
                    POST /api/auth/password-reset → Supabase Auth
                                                         ↓
                                                   Update Password
                                                         ↓
User ← Redirect to /login ← Return Success ←
```

#### 3.2.4. Logout Flow

```
User → Click Logout → POST /api/auth/logout → Supabase Auth
                                                    ↓
                                              Clear Session
                                                    ↓
User ← Redirect to /login ← Return Success ←
```

---

### 3.3. Security Considerations

#### 3.3.1. CSRF Protection

- Supabase handles CSRF protection for auth endpoints
- Use SameSite cookies for additional protection

#### 3.3.2. XSS Protection

- All user input sanitized
- React automatically escapes output
- HTTP-only cookies prevent JavaScript access

#### 3.3.3. Password Security

- Passwords never logged or stored in plain text
- Supabase uses bcrypt for password hashing
- Minimum 8 character requirement

#### 3.3.4. Token Security

- JWT tokens signed by Supabase
- Short expiration times (1 hour for access token)
- Refresh tokens rotated on use

#### 3.3.5. Account Deletion

- Requires password confirmation
- Cascading delete removes all user data (flashcards, generations)
- Irreversible operation with clear warning

---

### 3.4. Environment Variables

Required environment variables in `.env`:

```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=xxx  # Anon/public key
SUPABASE_SERVICE_ROLE_KEY=xxx  # For admin operations (delete user)
```

---

### 3.5. Database Integration

#### User Reference in Existing Tables

Existing tables already reference `auth.users`:

```sql
-- flashcards table
user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE

-- generations table
user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
```

**No database migrations required** - existing schema already supports authentication.

---

## 4. IMPLEMENTATION CHECKLIST

### 4.1. Frontend Components

- [ ] `/src/components/auth/LoginForm.tsx`
- [ ] `/src/components/auth/RegisterForm.tsx`
- [ ] `/src/components/auth/PasswordRecoveryForm.tsx`
- [ ] `/src/components/auth/PasswordResetForm.tsx`
- [ ] `/src/components/account/AccountSettings.tsx`
- [ ] `/src/components/account/DeleteAccountModal.tsx`
- [ ] `/src/components/layout/PersistentHeader.tsx` (add logout)
- [ ] `/src/layouts/PublicLayout.astro`
- [ ] Update `/src/layouts/Layout.astro` for protected pages

### 4.2. Frontend Pages

- [ ] `/src/pages/login.astro`
- [ ] `/src/pages/register.astro`
- [ ] `/src/pages/password-recovery.astro`
- [ ] `/src/pages/password-reset.astro`
- [ ] `/src/pages/my-account.astro`
- [ ] Update existing protected pages with auth checks

### 4.3. Backend API Endpoints

- [ ] `/src/pages/api/auth/register.ts`
- [ ] `/src/pages/api/auth/login.ts`
- [ ] `/src/pages/api/auth/logout.ts`
- [ ] `/src/pages/api/auth/password-recovery.ts`
- [ ] `/src/pages/api/auth/password-reset.ts`
- [ ] `/src/pages/api/auth/change-password.ts`
- [ ] `/src/pages/api/auth/delete-account.ts`

### 4.4. Backend Services and Validation

- [ ] `/src/lib/services/auth.service.ts`
- [ ] `/src/lib/validation/auth.schemas.ts`
- [ ] Update `/src/middleware/index.ts` with auth logic
- [ ] Update `/src/env.d.ts` if needed

### 4.5. Configuration

- [ ] Add `SUPABASE_SERVICE_ROLE_KEY` to `.env`
- [ ] Configure email templates in Supabase dashboard
- [ ] Set password recovery redirect URL in Supabase
- [ ] Test email delivery

---

## 5. COMPATIBILITY WITH EXISTING FEATURES

### 5.1. No Breaking Changes

- Existing flashcard and generation endpoints remain unchanged
- RLS policies already filter by `auth.uid()`
- Middleware enhancement is additive (doesn't break existing functionality)

### 5.2. Integration Points

**Existing Features That Now Require Auth:**

- `/create-flashcards` - Already uses `user_id` from session
- `/my-flashcards` - Already uses `user_id` from session
- All `/api/flashcards/*` endpoints - Already use RLS

**How Auth Integrates:**

- Middleware provides session to all routes
- Protected pages check for valid session
- API endpoints use `context.locals.supabase.auth.getUser()` to get `user_id`
- RLS policies automatically filter data by authenticated user

### 5.3. User ID Extraction Pattern

Current pattern in API endpoints:

```typescript
const {
  data: { user },
} = await context.locals.supabase.auth.getUser();
if (!user) {
  return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
}
const userId = user.id;
```

This pattern is already compatible with the authentication system.

---

## 6. TESTING CONSIDERATIONS

### 6.1. Manual Testing Scenarios

- [ ] Register new account
- [ ] Login with valid credentials
- [ ] Login with invalid credentials
- [ ] Access protected page without auth (should redirect)
- [ ] Access public page with auth (should redirect)
- [ ] Logout
- [ ] Request password recovery
- [ ] Reset password with valid token
- [ ] Reset password with expired token
- [ ] Change password with correct current password
- [ ] Change password with incorrect current password
- [ ] Delete account with correct password
- [ ] Delete account with incorrect password
- [ ] Verify flashcards deleted after account deletion

### 6.2. Edge Cases

- [ ] Session expiration during active use
- [ ] Multiple tabs/windows with same user
- [ ] Browser back button after logout
- [ ] Direct URL access to protected pages
- [ ] Malformed tokens in password reset
- [ ] Rate limiting on login attempts
- [ ] Email already exists during registration

---

## END OF SPECIFICATION
