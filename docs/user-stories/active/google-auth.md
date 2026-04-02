# Google Social Login

## Story

As a user, I want to sign in with my Google account so my topics are
tied to me and sync across devices.

## Acceptance Criteria

- [ ] Google sign-in button on launch / home screen
- [ ] Supabase Auth handles the OAuth flow (no custom token management)
- [ ] After sign-in, user sees their own topics (not everyone's)
- [ ] Topics, nodes, versions scoped to the authenticated user
- [ ] Sign-out option accessible from the app
- [ ] Unauthenticated users cannot access the API
- [ ] Smooth first-time experience: sign in → empty state → create first topic

## Priority: 2
## Phase: 3 (Multi-user)

## Dependencies

- Requires Supabase Auth configured with Google OAuth provider
- Requires RLS policies on topics, nodes, versions tables
- Requires user_id column on topics table

## Notes

- Use Supabase Auth with Google provider — no custom auth server needed
- The server currently uses service_role key (bypasses RLS). After auth,
  the app should pass the user's JWT and let RLS handle access control.
- Migration: existing topics have no user_id — need a migration strategy
  (assign to first user, or delete and start fresh)
- Expo has `expo-auth-session` or `expo-web-browser` for OAuth flows

## Implementation

- Issue: #37 - Add Google OAuth via Supabase Auth + RLS policies
- Issue: #38 - Build Google sign-in UI with auth flow and sign-out
- Created: 2026-04-02
