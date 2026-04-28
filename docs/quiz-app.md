# Quiz App Design

## File structure

- `app/page.tsx` orchestrates the player view, host toggle, and Firestore subscriptions.
- `components/NameEntry.tsx` handles name capture and join gating.
- `components/HostControls.tsx` exposes start and end actions for the single shared session.
- `components/Quiz.tsx` owns the quiz state machine, timers, adaptive difficulty, and hard-stop behavior.
- `components/QuestionCard.tsx` renders one question with large tappable answers and timer feedback.
- `components/ResultScreen.tsx` shows the final score summary.
- `components/Leaderboard.tsx` renders the shared leaderboard.
- `lib/firebase.ts` wraps Firestore plus a localStorage fallback for session and leaderboard state.
- `lib/questions.ts` contains adaptive quiz helpers and difficulty labels.
- `data/questions.json` stores the local question bank grouped by difficulty.

## Hook and state design

- The page listens to the session document and leaderboard collection with two subscriptions.
- `Quiz` tracks phase, current question, countdown, feedback, and score stats.
- A single interval in `Quiz` handles both countdown updates and the delayed transition after feedback.
- Refs are used for timer anchors and one-shot guards so the quiz cannot double-submit or double-advance.
- `Quiz` watches the session status in real time and hard-stops immediately when the session becomes `ended`.

## Firestore schema

### Session document

- Path: `quizSessions/current`
- Fields:
  - `status`: `waiting | active | ended`
  - `startTime`: number timestamp or null
  - `endTime`: number timestamp or null

### Leaderboard collection

- Path: `quizResults`
- Fields per document:
  - `name`: player display name
  - `score`: final score
  - `timeTaken`: time in seconds
  - `createdAt`: numeric timestamp used for sorting and display

## Quiz logic

- Each question has 15 seconds.
- Answering early locks the input, shows correctness feedback, and advances after 3 seconds.
- Timeout counts as wrong and also advances after 3 seconds.
- Streak logic:
  - correct answer increments the streak
  - two consecutive correct answers raise difficulty by 1, up to 5, and reset streak tracking for the next run
  - wrong answers drop difficulty by 1, down to 1, and reset the streak
- Final score formula:

```text
finalScore = (correctAnswers * 100) + (maxStreak * 50) - (timeTakenInSeconds * 2)
```

## Session listener behavior

- While the session is `waiting`, joined players see a lobby screen.
- When the host switches to `active`, players begin automatically.
- If the session becomes `ended` at any point, the quiz cancels the round, computes the score from current progress, submits the result, and switches to the final view.
- If the session is already ended before the player starts, the UI blocks entry and shows the leaderboard only.

## Host access

- Regular users never see a host toggle or host controls.
- To open the host-only controls, visit the app with `?host=1` once on the host device.
- After that first visit, the host mode is remembered in local storage on that device.

## Firebase setup

- Set these environment variables for the Firestore path:
  - `NEXT_PUBLIC_FIREBASE_API_KEY`
  - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
  - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
  - `NEXT_PUBLIC_FIREBASE_APP_ID`
  - Optional: `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
  - Optional: `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`

## Firestore rules

- The repo includes [firestore.rules](../firestore.rules) and [firebase.json](../firebase.json) for deployment.
- The rules validate the session document and leaderboard documents while still allowing the app to read and write without auth.
- To publish them with the Firebase CLI, run:

```bash
firebase deploy --only firestore
```

- If you prefer the console, open Firestore Rules in Firebase Console and paste the same contents from [firestore.rules](../firestore.rules).

## UI notes

- The layout is mobile-first and stacks cleanly on narrow screens.
- Answer buttons are large enough for thumb taps.
- The question view includes question number, difficulty label, and a visible countdown bar.
- Correct answers are green, wrong selections are red, and the overall styling stays intentionally simple.