# MathPop — App Review information

Paste the text below into App Store Connect → App Review Information →
**Notes**. Turn **Sign-in required on** and enter a demo family account's
email and password there (create one in the app; never put it in this repo).

---

MathPop is a math practice game for Pre-K through 4th grade, made for the
Kids category (ages 6–8). Kids can play without signing in; the family
account is optional and only for grown-ups.

How to use it:
- Choose a grade with the "Grade" button at the top of the home page. The
  topic cards change to fit that grade.
- Tap any card to start a round of ten problems. Answer by tapping a choice,
  typing, or writing the number with a finger (⚙️ Settings on the home page
  switches between these). Tap the problem to hear it read aloud.
- Explore Numbers lets the child tap numbers and hear each one in English,
  Japanese, Cantonese or Mandarin.

Family account (optional):
- Tap "Sign in or create account" at the top right. A grown-ups-only
  question appears first (multiply a two-digit number by a one-digit number,
  typed in). Answer it, then sign in with the demo account above.
- The account stores the grown-up's email and password plus each player's
  name and grade, so players sync across devices. Progress and settings stay
  on the device. The account is shared with our other app, PitchPop.
- To delete the account: Account → Delete account. This removes the account
  and its players from our servers.

Kids category notes:
- No links out of the app, no purchases, no ads, no analytics and no
  tracking. The only network service is Supabase, which hosts the optional
  family account; it is never used for advertising.
- The read-aloud voice is the open-source Piper text-to-speech model bundled
  inside the app; Explore Numbers' other languages use the iPhone's built-in
  voices. Handwriting is read by a small on-device model; drawings are never
  saved or sent anywhere.

The interface is in English and works the same in all regions.
