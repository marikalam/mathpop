# MathPop — App Review information

Paste the text below into App Store Connect → App Review Information →
**Notes**. Turn **Sign-in required on** and enter a demo family account's
email and password there (create one in the app; never put it in this repo).

---

MathPop is a math practice game for Pre-K through 4th grade, made for the
Kids category (ages 6–8). Kids can play without signing in; the family
account is optional and only for grown-ups.

How to use it:
- Each player's grade and how they answer (tap a choice, type, or write
  with a finger) are set in Players & grades, from the player button at the
  top. The home page shows a "Today's practice" list (mistakes to fix, a
  topic to work on, something new) and a tile for each section.
- Tap any item or topic to start a round of ten problems. Tap the problem
  to hear it read aloud; "Show me how" talks the child through it step by
  step. Each finished round earns a sticker for the sticker book.
- Explore Numbers lets the child tap numbers and hear each one in 23
  languages, using the iPhone's built-in voices.

Family account (optional):
- Tap "Sign in or create account" at the top right, then sign in with the
  demo account above.
- The account stores the grown-up's email and password plus each player's
  name and grade, so players sync across devices. Progress and settings stay
  on the device. The account is shared with our other app, PitchPop.
- To delete the account: Account → Delete account. This removes the account
  and its players from our servers.

Kids category notes:
- The only ways out of the app are for grown-ups, in Players & grades:
  "Rate MathPop" (opens the App Store) and "Share <child>'s week" (the share
  sheet). Both ask a grown-ups-only question first (type the answer to a
  two-digit by one-digit multiplication).
- MathPop Plus (optional auto-renewing subscription, monthly or yearly,
  7-day free trial) is only offered to grown-ups: Players & grades ->
  MathPop Plus, behind the same grown-ups check. It unlocks grown-up
  features only (the full progress report and assigning practice); kids'
  practice is all free and never shows an offer. In TestFlight/sandbox the
  "founding family" check (free Plus for families from before Plus) is
  skipped so the purchase can be tested.
- No ads, no third-party analytics
  and no tracking. MathPop sends its own anonymous usage counts (app opened;
  a round's grade, game, language and score) with no account, device or
  advertising ID, declared as Product Interaction, not linked to the user.
  The only network service is Supabase, which hosts the optional family
  account and these counts; it is never used for advertising.
- The read-aloud voice is the open-source Piper text-to-speech model bundled
  inside the app; Explore Numbers' other languages use the iPhone's built-in
  voices. Handwriting is read by a small on-device model; drawings are never
  saved or sent anywhere.

The interface is in English and works the same in all regions.
