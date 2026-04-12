# VIDYA — Comprehensive Build Prompt for VS Code

Use this prompt in VS Code with an AI assistant (Cursor, GitHub Copilot, or Claude Code). 
Paste the full contents below as your starting instruction.

---

## THE PROMPT

You are helping me build **Vidya** — a world-class, AI-powered self-learning web application. 
The name comes from the Sanskrit word for knowledge and wisdom. 
This is a full-stack web app where users can learn anything they want, 
on their own terms, powered by Claude (Anthropic API).

Build this as a production-grade application with exceptional UI design. 
The aesthetic should feel premium, intelligent, and warm — not cold or corporate. 
Think: a personal tutor that happens to be beautiful software.

---

## TECH STACK

- **Frontend**: React (with Vite)
- **Styling**: Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: MongoDB Atlas (via Mongoose)
- **Auth**: Google OAuth 2.0 (via Passport.js or Firebase Auth)
- **AI**: Anthropic Claude API (claude-sonnet-4-20250514)
- **Video**: YouTube Data API v3 (for embedding relevant videos per module)
- **Hosting-ready**: Structure for eventual deployment to Vercel (frontend) + Railway or Render (backend)

---

## DESIGN PHILOSOPHY

The UI must feel world-class. Follow these principles:

- **First screen**: A centered prompt bar with placeholder text *"What do you want to learn today?"* 
  Below it, 6–8 rotating "spark cards" showing example learning intentions 
  (e.g. *"Teach me negotiation from scratch"*, *"How does compound interest work?"*, 
  *"I want to understand machine learning"*). These are not categories — they are example phrasings 
  that show users how to talk to Vidya.
- **Home screen energy**: Even before a user has any curricula, the home should feel alive — 
  featured learning paths, trending topics, a "Start Learning" CTA.
- **Typography**: Use a distinctive, premium font pairing. 
  Avoid Inter, Roboto, Arial. Consider something like Fraunces + DM Sans, 
  or Playfair Display + Outfit.
- **Color**: Deep, rich tones. Not purple-on-white generic AI. 
  Consider deep indigo/midnight + warm amber accents, or forest green + cream. 
  Commit to a palette with personality.
- **Motion**: Subtle, purposeful animations. Staggered reveals on load. 
  Smooth transitions between states. Nothing gratuitous.
- **No generic AI aesthetics.** This should look like it was designed by a world-class product team.

---

## CORE USER JOURNEY

Build the following flow end to end:

### 1. LANDING / HOME
- Prompt bar (main input) + spark cards beneath it
- Featured learning paths section
- Trending topics section
- "Get Started with Google" CTA for non-logged-in users
- Logged-in users see their dashboard instead

### 2. GOOGLE SIGN-IN
- One-click Google OAuth
- On first login: brief welcome, then straight to the prompt bar
- No lengthy onboarding — get users to their first curriculum fast
- Store user profile in MongoDB (name, email, Google ID, learning history)

### 3. TOPIC INPUT & CLARIFICATION
- User types their topic in natural language
- Claude analyses the input and determines ambiguity level:
  - **Clear intent** → proceed directly to time selection
  - **Partial ambiguity** → Claude asks 1 clarifying question
  - **High ambiguity** → Claude asks maximum 2 clarifying questions
- Questions appear as a friendly conversational UI (chat bubble style), not a form
- Maximum 2 follow-up questions ever — after that, Claude proceeds with best interpretation

### 4. TIME COMMITMENT SELECTION
After clarification, user selects their time commitment from these options presented as 
pill/chip selectors (not a dropdown):

| Option | What it delivers |
|--------|-----------------|
| 2 min  | One core idea. The "cocktail party" version |
| 10 min | The mental model and why it matters |
| 30 min | Foundation: key concepts, one example, one quiz |
| 2 hrs  | Solid working knowledge, multiple modules |
| 10 hrs | Real competency — you can use this in real life |
| 20 hrs | Proficiency — you're dangerous in this subject |
| 30 hrs | Near-expertise: deep theory, edge cases, advanced application |

### 5. CURRICULUM GENERATION
- Claude generates a full structured curriculum in real time
- Show a beautiful loading state while generating (not a spinner — something that feels alive, 
  like "Building your learning journey..." with animated steps)
- The curriculum is stored in MongoDB and tied to the user's account
- Curriculum structure:

```
Topic: [User's topic]
Duration: [Selected time]
Total Modules: [Scaled to duration]

Module 1: [Title]
  - Estimated time
  - Concepts covered
  - Prerequisites (if any)

Module 2: [Title]
...and so on
```

- Curriculum always progresses from foundational concepts → intermediate → advanced/complex
- At the end, Claude includes 3–5 "Further Learning" recommendations with a brief explanation 
  of why each matters and what it unlocks

### 6. THE LEARNING EXPERIENCE (per module)

Each module contains these sections in order:

**A. Lesson**
- Clear, well-structured written explanation
- Progresses from simple to complex within the module
- On core concept blocks and example blocks: show a subtle 
  **"Explain differently"** button and a **"Show another example"** button
- Clicking either regenerates ONLY that block via Claude — 
  fresh angle, different analogy, simpler language — without disrupting the rest of the module
- These buttons do NOT appear on: quiz sections, video sections, navigation elements, or summaries

**B. Video**
- Claude generates a precise, contextual search intent — not just a keyword.
  It identifies exactly what the learner needs to see demonstrated or explained
  visually at this specific point in their learning journey
- YouTube Data API fetches the top 10 candidate results (not just top 3)
  for richer selection
- Claude scores all candidates holistically and selects the best.
  No single metric is a hard filter — Claude weighs all signals together:

  - **Content-topic alignment**: does this video actually teach the right 
    concept at the right depth for this specific module? This is the 
    most important signal — a perfectly aligned video with 1,000 views 
    beats a loosely related video with 10 million views
  - **Channel credibility signals**: is the channel clearly educational 
    in nature? Does the channel name, description, or track record suggest 
    subject matter expertise? Known institutions are a positive signal 
    but NOT a requirement — an independent expert with a small audience 
    can produce superior content
  - **View count as context, not threshold**: high views can signal 
    broad appeal but never disqualify a low-view video. A recent upload 
    on a fast-moving topic with 800 views may be far more accurate and 
    useful than a 5-year-old video with 2 million views. Claude should 
    weigh view count relative to upload date and topic niche — 
    a specialist topic will naturally have fewer views than a general one
  - **Duration fit**: video length should match the module's learning depth.
    Don't embed a 45-minute lecture for a 2-minute module. Don't embed 
    a 90-second clip for a module that needs depth
  - **Recency where it matters**: for fast-moving topics (AI, finance, 
    software, geopolitics), strongly prefer recent content. For timeless 
    topics (mathematics, philosophy, logic, classical history), 
    a 10-year-old video can be perfectly valid
  - **Title and description specificity**: specific, precise titles 
    signal intentional, well-structured content. Vague or clickbait 
    titles are a negative signal regardless of view count
  - **Production quality signals from metadata**: length relative to 
    topic complexity, whether the description includes timestamps or 
    structured chapters — these indicate a creator who thinks carefully 
    about the learner experience

- Claude must reason about the full picture — a brilliant new video 
  from an unknown creator that perfectly matches the concept should 
  always beat a famous channel's tangentially related video
- If genuinely no candidate is a good fit for the learner at this 
  point in their journey, do NOT embed a poor video. Show a graceful 
  "No video available for this concept" state, and Claude provides 
  an additional written example to compensate
- The selected video is presented with a Claude-written context line
  telling the user exactly what to watch for and the most relevant timestamp:
  *"This video explains [concept] using [approach] — the key insight starts at 2:30"*
- Always pass video metadata (title, channel, description, view count, duration)
  to Claude for scoring — never select blindly by search rank alone

**C. Quiz**
- 3–5 questions per module (scaled to module complexity)
- Mix of multiple choice and short-answer questions
- Immediate feedback on each answer
- At the end of the quiz, Claude provides a brief performance summary

**D. Adaptive Pacing**
- If user scores 80%+ on quiz → next module is slightly compressed, 
  acknowledging they're moving fast
- If user scores below 60% → before next module, Claude inserts a 
  "Let me re-approach this" block with an alternative explanation of the weakest concepts
- This happens automatically, invisibly — user never feels penalised

**E. Module Summary**
- 3–5 bullet recap of what was covered
- A cliffhanger teaser for the next module: 
  *"Next up: why 90% of negotiators make the same mistake in the opening move"*
- "Further Learning" contextual suggestion where appropriate 
  (not every module — use judgement based on content)

### 7. END OF CURRICULUM
- Full curriculum quiz (drawing from all modules)
- Overall performance summary from Claude
- Certificate of completion (visual, downloadable as PDF eventually)
- Full "Further Learning" recommendations — 5 items minimum, 
  each with Claude's explanation of why it matters
- "Start a new topic" CTA

### 8. DASHBOARD
User's personal learning hub. Three distinct zones:

**Zone 1 — The Return Zone (top, most prominent)**
- Personalised greeting: *"Welcome back [Name]. You're 60% through Negotiation Tactics."*
- One dominant "Continue Learning" button leading directly to the next module
- Nothing else competes with this CTA visually — it is the hero of the dashboard
- If no curriculum is in progress, this zone becomes an invitation: 
  *"Ready to learn something new?"* with the prompt bar

**Zone 2 — Your Learning (middle)**
- Active curricula displayed as cards showing:
  - Topic name and selected duration
  - Visual progress bar with % complete
  - Estimated time remaining
  - Last accessed date
  - "Continue" button per card
- Completed curricula displayed below active ones:
  - Stamp icon representing the subject
  - Overall quiz score badge
  - Completion date
  - "Revisit" button to rewind to any module
- Users can rewind to any previous module within any curriculum at any time
- **Passport Preview**: a condensed row of 4–6 most recent stamps 
  with a "See full passport →" link — gives the passport daily visibility 
  without overwhelming the dashboard

**Zone 3 — Discover (bottom)**
Two layers, in this order — personal always above editorial:

*Layer A — Claude-powered personal suggestions:*
- Based on the user's completed and in-progress curricula
- Contextually connected recommendations, not random:
  *"You just completed Negotiation — Behavioural Economics would be 
  a natural next step. Here's why: [Claude's explanation]"*
- Always framed as "for you specifically" — never generic

*Layer B — Editorial Featured Paths:*
- Curated multi-topic learning journeys promoted by Vidya
- Examples:
  - *"The Founder Stack"* — Business Strategy → Negotiation → 
    Financial Modelling → Leadership
  - *"The AI Literacy Path"* — How AI Works → Prompt Engineering → AI Ethics
  - *"The Investor's Mind"* — Behavioural Economics → Financial Markets → Valuation
- These are Vidya's editorial voice — shaped by the product owner, 
  not the algorithm
- Stored in the database as curated content, editable without a code deploy
- Serve users who don't yet know what they want to learn next
- Over time these become a marketing and positioning tool for the product

### 9. KNOWLEDGE PASSPORT (dedicated page)
Accessible from the main navigation — this is the user's full intellectual identity.

**Stamp grid:**
- Every topic the user has touched gets a unique visual stamp
- Stamp icons reflect the subject domain:
  - 💡 Ideas and innovation
  - 📈 Finance and economics  
  - 🧠 Psychology and behaviour
  - 💻 Technology and programming
  - 🌍 History and geography
  - 🎨 Creativity and design
  - ⚖️ Law and ethics
  - 🔬 Science and research
  - (and so on — Claude assigns the most fitting category at curriculum creation)
- Stamps have three visual states:
  - **Faint / outlined** → started, less than 50% complete
  - **Half filled** → 50–80% complete  
  - **Fully stamped** → completed, with quiz score badge overlay
- Tapping a stamp shows a summary card: topic, duration selected, 
  score, completion date, and a "Revisit" button

**Stats panel:**
- Total learning time across all topics
- Number of topics started vs completed
- Average quiz score
- Current learning streak (days with at least one active session)
- Favourite subject category (based on most stamps)

**Shareable:**
- Users can share their passport as a visual snapshot
- Eventually: this is a natural social / viral mechanic — 
  screenshot-worthy and worth building toward

---

## NOTIFICATIONS & RE-ENGAGEMENT

### Core Philosophy
Every notification must feel personally written for that specific user 
at that specific moment. Generic reminders are ignored and damage trust. 
Specific, contextual, curious notifications build habits.

❌ Never: *"Don't forget to keep learning today!"*
✅ Always: *"You're 2 modules away from finishing Negotiation Tactics — 
the next one covers the opening move mistake 90% of people make."*

### V1 Stack — Email Only
Web push, SMS, and in-app push notifications are V2.
Email is the right starting point — no permission friction, 
deeply personal when done well, lower implementation complexity.

**V1 — Two active email triggers:**

| Trigger | When | Tone |
|---------|------|------|
| Gentle Nudge | User inactive 48hrs with in-progress curriculum | Warm, curious |
| New Path Suggestion | Within 1hr of completing a curriculum | Celebratory |

**Email rules (apply to both):**
- Plain text style — not heavily designed HTML templates.
  Feels more personal, higher open rates
- 3–4 sentences maximum — never longer
- Generated by Claude, personalised to the user's actual topic and progress
- Always one clear CTA link returning the user to exactly the right screen
  (not the homepage — the specific module or dashboard state they need)
- Maximum one email per 48 hours per user — never exceed this
- Never email free users who've hit the paywall to nudge learning —
  that's spam. Their re-engagement email is a single, separate,
  well-crafted message focused on subscription value only
- Always include a plain unsubscribe link — one click, no confirmation screen

**Gentle Nudge email example:**
> Subject: Your [Topic] curriculum is waiting
>
> You left off at Module 3 of [Topic] — [module title].
> [One-line cliffhanger teaser for that module]
> Pick up where you left off: [direct link to module]

**New Path Suggestion email example:**
> Subject: You just completed [Topic] — what's next?
>
> That's a real achievement. You now understand [Topic]
> at a level most people never reach.
> Here's what naturally follows: [Claude-generated suggestion with one line explanation]
> Start learning: [direct link to prompt bar pre-filled with suggestion]

**V2 Backlog — email triggers to enable later:**
- Streak Protect: user active 3+ consecutive days, no session by 8pm
- Completion Pull: user 70%+ complete, inactive 72hrs

---

### In-App Re-engagement (V1)

Even without push notifications, the app re-engages users on every return visit:

**Return banner (dashboard):**
- If user has been away 24–72 hours and has an active curriculum:
  *"Welcome back — ready to pick up [Topic] where you left off?"*
  with a direct "Continue" button
- If away more than 72 hours: warmer tone:
  *"Good to see you again — [Topic] is waiting for you."*
- Never show this banner if they have no active curricula

**Progress recap after long absence:**
- If user returns to an in-progress curriculum after 14+ days away,
  before re-entering the module show a gentle prompt:
  *"It's been a little while — want a quick recap before diving back in?"*
- "Yes, recap me" → Claude generates a 3-bullet summary of 
  everything covered so far in plain language
- "Jump straight in" → proceeds directly to the module
- This makes returning after a gap feel safe, not shameful

**Completion celebration screen:**
- When a user finishes a curriculum, trigger a full-screen celebration moment
  before returning to the dashboard — not a toast notification
- Elements: animated confetti, their new passport stamp being awarded, 
  their overall quiz score, total time invested
- Tone: genuinely celebratory — make it feel earned
- Ends with: *"What do you want to learn next?"* with the prompt bar 
  front and centre — strike while motivation is at its peak
- This is a re-engagement mechanic disguised as a reward

---

### What Vidya Never Does:
- Daily reminders on a fixed schedule — becomes wallpaper within a week
- More than one notification per 48 hours under any circumstances
- Generic notifications with no reference to the user's actual content
- Guilt-based language ("You haven't learned in X days!")
- Notifications to users who have explicitly unsubscribed
- Pop-ups or interstitials that interrupt active learning sessions

---

### V2 Backlog (do not build in V1):
- Web push notifications with permission request flow
- In-app notification centre
- Weekly learning digest email (summary of progress)
- SMS reminders (opt-in only)
- Smart send-time optimisation (send at the time each user 
  is historically most likely to open)

---

## ERROR STATES & FAILURE HANDLING

Vidya must handle all failure scenarios gracefully. Users judge a product 
most harshly when something goes wrong. Every error state must feel 
intentional, warm, and always offer a clear path forward.

### Golden Rules (apply to every error state):
- **Never show raw error messages** — no stack traces, HTTP codes, 
  or technical language ever reaches a user
- **Always preserve user data** — progress, input, and position 
  must survive any failure. Never lose what the user has done
- **Always offer a next action** — every error state includes 
  a button or clear path forward. Dead ends are unacceptable
- **Match Vidya's tone** — error messages sound warm and human, 
  never cold or robotic
- **Log everything server-side** — while users see friendly messages, 
  full error details are always captured for debugging

---

### 1. Claude API Failures

**Curriculum generation fails:**
- Retain the user's topic input — never make them retype
- Show: *"We're having trouble building your curriculum right now — 
  your topic has been saved. Try again in a moment."*
- Display a single "Try Again" button that retries the exact same request
- If failure persists after 2 retries, offer: *"Want us to email you 
  when this is ready?"* (saves the job for async processing — v2 feature, 
  but design the UI placeholder now)

**Module lesson fails to load:**
- If cached content exists in MongoDB → serve it immediately. 
  This should cover the vast majority of returning user cases
- If no cache exists → show: *"This lesson is taking a moment to load."* 
  with an animated loading state and auto-retry every 10 seconds (max 3 attempts)
- After 3 failed attempts → *"We're having trouble loading this lesson. 
  Your progress is saved — come back in a moment."* with a "Return to Dashboard" button

**Quiz generation fails:**
- Never block forward progress because of a failed quiz generation
- Show: *"We couldn't load the quiz for this module — you can skip it 
  and continue, or try again."*
- Two buttons: "Skip Quiz" and "Try Again"
- Skipped quizzes are logged but don't penalise the user's progress

**"Explain Differently" / "Show Another Example" fails:**
- Quietly reset the button to its default state
- Show a subtle inline message: *"Couldn't generate a new explanation 
  right now — try again in a moment."*
- Never crash or disrupt the rest of the module over one block failure

**Adaptive pacing insert fails:**
- If Claude fails to generate the re-explanation block after a low quiz score,
  skip it silently and proceed to the next module normally
- Log the failure — never surface it to the user

---

### 2. YouTube API Failures

**No suitable video found:**
- Do not show a broken embed or empty box
- Show a clean "No video available for this concept" state 
  with a subtle icon
- Claude automatically provides an additional written example 
  to compensate — the user should feel they received something 
  extra, not that something is missing

**YouTube API quota exceeded:**
- Same fallback as above — graceful written example substitution
- Log the quota error server-side with high priority alert
- Never surface the word "quota" or any API language to the user

**Embedded video unavailable or deleted:**
- Detect on embed load via YouTube's iframe API error events
- Swap silently to the written example fallback state
- Trigger a background job to find a replacement video for 
  that module (v2 feature — placeholder the logic now)

---

### 3. Network & Connectivity Failures

**Mid-lesson loss of connection:**
- Show a subtle, non-intrusive offline banner at the top:
  *"You're offline — your progress has been saved."*
- Do not interrupt the reading experience — cached lesson 
  content remains fully readable offline
- When connection restores, sync progress silently 
  with no user action required

**Slow connection / timeout:**
- Show skeleton loading states that feel intentional and designed,
  never a blank white screen
- Skeleton screens should match the layout of the content 
  being loaded — lesson skeleton, quiz skeleton, dashboard skeleton
- After 15 seconds with no response, show a gentle message:
  *"This is taking longer than usual — still working on it."*

**Auth session expires mid-lesson:**
- Save the user's exact module position and progress 
  before redirecting to sign-in
- After re-authentication, return them to exactly where they left off
- Show: *"Welcome back — picking up right where you left off."*

---

### 4. User-Triggered Edge Cases

**Topic too vague after clarification:**
- If Claude still cannot generate a quality curriculum after 
  2 clarifying questions, respond warmly:
  *"We need a little more direction to build the best curriculum 
  for you — could you tell us more about what you'd like to learn 
  or why?"*
- Never fail silently — always prompt for more input

**Topic Vidya cannot teach well:**
- If Claude signals very low confidence on extremely obscure, 
  nonsensical, or genuinely unteachable input, be honest:
  *"We're not confident we can teach this well yet — 
  try a related topic and we'll give it our best."*
- Suggest 2–3 related topics Claude can handle well

**Duplicate curriculum detected:**
- If a user starts a topic they have already learned or 
  have in progress, detect it before generating
- Show: *"You've already explored this topic — want to revisit 
  your existing curriculum, or start a completely fresh one?"*
- Two clear buttons: "Revisit Existing" and "Start Fresh"
- Starting fresh creates a new curriculum without deleting the old one

**Payment failure (subscription):**
- If a Stripe payment fails, do not immediately revoke access
- Show a gentle banner: *"There was an issue with your payment — 
  please update your details to keep learning."*
- Give a 3-day grace period before restricting to free tier
- Never use alarming language — treat it as an admin matter, 
  not a punishment

---

## SEARCH & BROWSE

### V1 Scope — Personal Library Search
Users can search and filter their own curricula from the dashboard.

**Search bar:**
- Sits at the top of the dashboard "Your Learning" zone
- Searches across topic names and subject categories in real time
- No page reload — instant client-side filtering

**Filter options:**
- **Status**: All / In Progress / Completed / Not Started
- **Duration**: All / 2min / 10min / 30min / 2hrs / 10hrs / 20hrs / 30hrs
- **Category**: pulled from passport stamp categories (Finance, Technology, etc.)
- **Date**: Most Recent (default) / Oldest First / Last Accessed

**Empty state:**
- If no results match, show an encouraging empty state:
  *"Nothing matches that search — want to start learning [search term]?"*
  with a CTA that pre-fills the prompt bar with their search term

### V1 Scope — Topic Suggestions in Prompt Bar
As the user types in the main prompt bar, show a soft suggestion layer:
- 3–4 suggestions drawn from:
  - The user's own previous topics (personalised first)
  - A seeded list of popular starting topics (fallback for new users)
- Suggestions are example phrasings, not rigid categories:
  *"Teach me negotiation from scratch"*
  *"I want to understand how negotiation works in business"*
- Clicking a suggestion pre-fills the prompt bar — user can edit freely before submitting
- Suggestions disappear the moment the user starts typing their own input
- Never feel prescriptive — always feel like helpful inspiration

### Backlog (V2+) — Do NOT build in V1:
- Trending topics across the platform
- Shared curriculum outlines visible to other users
- Community discovery and social features
- "What others are learning" feeds
These features require meaningful user volume to be valuable. 
Defer until Vidya has a live and growing user base.

---

## DATABASE SCHEMA (MongoDB)

### User
```javascript
{
  googleId: String,
  name: String,
  email: String,
  avatar: String,
  createdAt: Date,
  totalLearningTime: Number, // in minutes
}
```

### Curriculum
```javascript
{
  userId: ObjectId,
  topic: String,
  clarifiedTopic: String, // after Claude's clarification
  duration: String, // "2min", "10min", "30min", "2hrs", "10hrs", "20hrs", "30hrs"
  modules: [ModuleSchema],
  status: String, // "in_progress" | "completed"
  currentModuleIndex: Number,
  overallQuizScore: Number,
  furtherLearning: [String],
  createdAt: Date,
  completedAt: Date,
}
```

### Module
```javascript
{
  title: String,
  estimatedTime: String,
  lesson: String, // HTML/markdown content
  videoQuery: String,
  videoId: String, // YouTube video ID
  quiz: [QuestionSchema],
  quizScore: Number,
  status: String, // "locked" | "in_progress" | "completed"
  completedAt: Date,
}
```

### Question
```javascript
{
  question: String,
  type: String, // "multiple_choice" | "short_answer"
  options: [String], // for multiple choice
  correctAnswer: String,
  userAnswer: String,
  isCorrect: Boolean,
}
```

---

## CONTENT QUALITY STRATEGY

### Written Lesson Quality
Claude's lesson quality depends entirely on precise prompt engineering.
Every module lesson prompt must explicitly require:

- **Real-world examples first**: introduce every concept through a scenario or 
  story before giving the formal definition — never lead with abstract theory
- **Progressive complexity**: each paragraph builds on the last. 
  Never jump levels. Go from "a 10-year-old could follow this" 
  to "sophisticated enough to challenge a practitioner"
- **Concrete over abstract always**: every claim must be illustrated. 
  No vague explanations. If you can't give an example, rephrase until you can
- **Practitioner framing**: draw on how real experts think about this topic — 
  not textbook definitions. "How VCs actually think about valuation" 
  not "Valuation is the process of determining worth"
- **Socratic moments**: include 1–2 pause points per module where Claude 
  poses a question to the user before revealing the answer — builds active recall
- **No filler**: every sentence must earn its place. 
  No "Great question!", no padding, no repetition of what was just said

### Lesson Prompt Engineering Rules
When generating any lesson, Claude must be instructed to:
1. Open with a real-world scenario or provocative question — never a definition
2. Build the mental model before introducing terminology
3. Use analogies anchored in everyday experience
4. Explicitly flag the most common misconception about this concept
5. End each concept block with a one-sentence "why this matters" statement

---

## CACHING STRATEGY

### The Core Rule (implement from day one):
**Never call Claude twice for content that already exists in MongoDB.**

Every piece of Claude-generated content must be saved to the database 
immediately after generation. Before any Claude API call, always check 
if the content already exists for that user and curriculum.

```
Request for content → Check MongoDB → 
  EXISTS: serve from DB (free)
  DOES NOT EXIST: call Claude → save to DB → serve to user
```

### What to cache (save to DB, never regenerate):
- Curriculum plans and module outlines
- All module lesson content
- Quiz questions and answers
- Further learning recommendations
- Video selection results (store the chosen YouTube video ID per module)
- Module summaries and cliffhanger teasers

### What NOT to cache (always fresh from Claude):
- "Explain differently" responses — these must always be genuinely different
- "Show another example" responses — same reason
- Intent analysis / clarification questions — these are input-dependent

### What to defer to v2 (cross-user caching):
Do NOT implement this in v1. It adds architectural complexity not worth it yet.
In v2+, you could hash topic + duration + module index and serve the same 
pre-generated lesson to multiple users learning identical curricula.
For now: one curriculum per user, cached per user only.

### Estimated API cost savings from caching:
- A user who leaves mid-curriculum and returns: 0 additional API cost
- A user who replays a module: 0 additional API cost  
- A free user who hits the paywall after generating several modules: 
  those modules are already saved — no repeat generation cost
- Estimated saving: 60–70% reduction in API calls vs. no caching

### Implementation notes:
- Add a `generatedAt` timestamp to all cached content
- For topics where freshness matters (news, AI, markets), 
  add a `staleAfter` field — content older than 90 days 
  gets regenerated on next access
- Never delete cached lesson content when a user deletes a curriculum — 
  soft delete only, in case they return

---

## CLAUDE API INTEGRATION

Use the Anthropic Node.js SDK. All Claude calls go through the backend — never expose the API key to the frontend.

Key prompts to engineer carefully:

**1. Intent Analysis Prompt**
Analyse the user's learning request. Determine if it is clear, partially ambiguous, 
or highly ambiguous. If clarification is needed, generate 1-2 targeted questions. 
Return JSON: `{ clarity: "clear"|"partial"|"ambiguous", questions: [] }`

**2. Curriculum Generation Prompt**
Given topic, duration, and any clarification answers, generate a complete structured curriculum. 
Scale module count and depth to the duration selected. Always progress from foundational to advanced. 
Include time estimates per module. Return structured JSON.

**3. Module Lesson Prompt**
Generate the lesson content for a specific module. Write clearly, engagingly, 
progressively (simple → complex). Structure with clear concept blocks and example blocks 
(marked so the frontend knows where to render the "Explain differently" button).

**4. Alternative Explanation Prompt**
Given the original explanation of [concept], generate a completely fresh explanation 
using a different analogy, a different real-world example, or simpler language. 
Do not repeat the previous explanation.

**5. Quiz Generation Prompt**
Generate [n] quiz questions for this module. Mix multiple choice and short answer. 
Vary difficulty. Return structured JSON with questions, options, and correct answers.

**6. Adaptive Response Prompt**
User scored [X]% on the module quiz. Their weakest areas were [concepts]. 
Generate a brief re-explanation of those concepts using a different approach.

**7. Further Learning Prompt**
Given the completed topic, generate [n] further learning recommendations. 
For each, explain what it is, why it matters, and what it unlocks for the learner. 
Be specific and contextual — not generic.

---

## API ROUTES (Express Backend)

```
POST   /api/auth/google          → Google OAuth
GET    /api/auth/me              → Get current user
POST   /api/curriculum/analyse   → Claude analyses topic input
POST   /api/curriculum/generate  → Claude generates full curriculum
GET    /api/curriculum/:id       → Get a curriculum
GET    /api/curriculum/user/all  → Get all user's curricula
PATCH  /api/curriculum/:id/progress → Update progress
POST   /api/module/:id/quiz      → Submit quiz answers
POST   /api/module/:id/explain   → Get alternative explanation for a block
POST   /api/module/:id/example   → Get alternative example for a block
GET    /api/video/search         → YouTube API search for module video
```

---

## ENVIRONMENT VARIABLES NEEDED

```
# Backend (.env)
ANTHROPIC_API_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
MONGODB_URI=
SESSION_SECRET=
YOUTUBE_API_KEY=
CLIENT_URL=http://localhost:5173

# Frontend (.env)
VITE_API_URL=http://localhost:3000
VITE_GOOGLE_CLIENT_ID=
```

---

## FOLDER STRUCTURE

```
vidya/
├── client/                  # React frontend (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/          # Reusable UI components
│   │   │   ├── curriculum/  # Curriculum-specific components
│   │   │   ├── module/      # Module learning components
│   │   │   └── dashboard/   # Dashboard components
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Learn.jsx
│   │   │   ├── Module.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   └── Complete.jsx
│   │   ├── hooks/           # Custom React hooks
│   │   ├── context/         # Auth context, curriculum context
│   │   ├── services/        # API call functions
│   │   └── utils/
│   └── index.html
│
├── server/                  # Node/Express backend
│   ├── routes/
│   ├── controllers/
│   ├── models/              # Mongoose schemas
│   ├── services/
│   │   ├── claude.js        # All Anthropic API calls
│   │   └── youtube.js       # YouTube API calls
│   ├── middleware/
│   └── index.js
│
└── README.md
```

---

## MONETIZATION — FREEMIUM MODEL

### Free Tier
Every user gets a **30-minute cumulative free learning allowance** across their entire account.

Key rules:
- The 30 minutes is tracked as **active module learning time** — not time the app is open
- Time is cumulative across ALL topics and ALL sessions — not per course or per topic
- Users can generate and view curriculum plans for free (seeing the full plan is always free)
- The counter only runs when a user is actively reading a module lesson
- Quiz access, "Explain differently", video embeds, and further learning 
  recommendations are all part of the gated content beyond 30 minutes

### What is always free (no limit):
- Account creation and Google sign-in
- Topic input, clarification flow, and time selection
- Full curriculum plan generation and preview (they can see the full outline)
- The first 30 minutes of actual module lesson content (cumulative, across all topics)
- Dashboard access (progress is always visible, even for free users — 
  this keeps them invested)

### What requires a paid subscription:
- Any module content beyond the 30-minute cumulative free allowance
- Quizzes and quiz feedback
- "Explain differently" and "Show another example" buttons
- Video embeds
- Knowledge passport (full feature)
- Further learning recommendations
- End-of-curriculum overall quiz and completion certificate

### Persistent Freemium Countdown Indicator — Always Visible:

A subtle but always-present indicator must be shown to all free users 
throughout the entire app — on every screen, every page, every session. 
It should never be hidden or dismissable for free users.

**Design spec:**
- Position: Top of the screen as a slim banner, OR as a persistent 
  element in the navigation bar — consistent across all pages
- For free users with time remaining, show:
  *"⏱ X min of free learning remaining"* — updates in real time as they learn
- As they get closer to the limit, the urgency increases visually:
  - **> 15 minutes remaining**: neutral tone, subtle colour (e.g. muted grey or brand colour)
  - **8–15 minutes remaining**: warm amber tone — *"⏱ 12 min of free learning left"*
  - **< 8 minutes remaining**: soft red/coral tone — *"⏱ 5 min left — unlock unlimited learning"*
  - **0 minutes remaining**: paywall state — banner becomes a CTA: 
    *"You've used your free learning time — Subscribe to continue"*
- The countdown only ticks down when the user is actively in a module lesson 
  (not on the dashboard, home, or curriculum preview screens)
- On non-learning screens (dashboard, home), show the static remaining time 
  without a live countdown — just a reminder
- The indicator includes a small **"Upgrade"** link at all times for free users, 
  styled subtly so it doesn't feel aggressive
- Once subscribed, the banner disappears entirely and is replaced by nothing — 
  paid users should feel the freedom of an uncluttered experience

**Tone guidance:**
Never use words like "limit", "restriction", or "blocked." 
Use "free learning time", "unlock", "continue your journey." 
The countdown should feel like a helpful heads-up from a friend, 
not a threat from a corporation.

---

### The Paywall Gate — UX Rules:
This is the most sensitive moment in the product. Handle it carefully:

- **Never interrupt mid-sentence.** The gate triggers at the END of a module, 
  not mid-lesson. If a user is 28 minutes in and the current module would push 
  them to 35 minutes, let them finish the current module. Gate before the next one starts.
- **Show what's coming.** When the gate appears, show the title and a one-line 
  teaser of the next module — make the value of subscribing feel concrete and immediate.
- **Frame it positively.** The message should feel like an achievement, not a wall:
  *"You've covered [X minutes] of [Topic] — you're making real progress. 
  Unlock the full journey to keep going."*
- **Show the free time used.** A subtle progress indicator 
  (e.g. "30 / 30 free minutes used") should be visible in the UI so users 
  are never surprised by the gate.
- **One-click to subscribe.** The paywall screen should have a single, 
  clear CTA to subscribe. No friction.

### Subscription Pricing (implement as placeholder, real payments via Stripe later):
- Monthly plan: $9.99/month
- Annual plan: $79.99/year (save 33%)
- Add a `subscriptionStatus` field to the User model: 
  `"free"` | `"active"` | `"cancelled"` | `"expired"`

### Database additions for monetization:

Add to **User schema**:
```javascript
{
  subscriptionStatus: { type: String, default: "free" },
  subscriptionStartDate: Date,
  subscriptionEndDate: Date,
  freeMinutesUsed: { type: Number, default: 0 }, // cumulative, in minutes
  stripeCustomerId: String, // for future Stripe integration
}
```

### Backend middleware:
Create a `checkAccess` middleware that runs before serving any module content:
- If `subscriptionStatus === "active"` → allow access
- If `freeMinutesUsed < 30` → allow access, increment time on completion
- If `freeMinutesUsed >= 30` AND not subscribed → return paywall response

### Time tracking:
- When a user opens a module, record a `moduleStartTime` on the session
- When they complete or leave the module, calculate elapsed time and 
  add to `freeMinutesUsed` in the database
- Use a heartbeat ping (every 60 seconds) from the frontend to update 
  time server-side — this prevents losing time data if user closes the tab

---

## BUILD INSTRUCTIONS FOR THE AI ASSISTANT

1. Scaffold the full folder structure first
2. Set up the Express backend with MongoDB connection and Google OAuth
3. Build the React frontend with Vite and Tailwind
4. Implement Google Sign-in flow end to end
5. Build the home page with prompt bar and spark cards
6. Build the topic input → clarification → time selection flow
7. Implement curriculum generation with Claude API
8. Build the module learning experience (lesson → video → quiz)
9. Implement the "Explain differently" and "Show another example" buttons
10. Build adaptive pacing logic based on quiz scores
11. Build the user dashboard with progress tracking and knowledge passport
12. Build the end-of-curriculum experience with further learning
13. **Implement freemium access control** — 30-minute cumulative free allowance, 
    paywall gate UX, time tracking heartbeat, checkAccess middleware
14. Add Stripe payment integration placeholders (routes and UI) ready for activation
15. Add polish: loading states, transitions, error handling, empty states
16. Ensure full mobile responsiveness throughout

Build one section at a time. After each section, confirm it works before moving on. 
Always keep the API key server-side only. Never hardcode credentials.

---

## QUALITY BAR

This is not a prototype. Every screen should feel like it belongs in a 
world-class product. Loading states should be beautiful. Empty states should 
be encouraging. Error states should be helpful. The typography, spacing, 
and color must be consistent and intentional throughout.

Vidya should feel like the learning tool someone wishes had existed their whole life.
