# UI Context

## Theme

KIKO AI uses a **modern dark productivity + AI aesthetic**.

The interface should feel:

* focused
* intelligent
* calm
* modern
* technical without feeling overly complex
* productivity-oriented
* trustworthy
* student-friendly

The visual language should communicate that KIKO is an **AI study companion**, not a generic dashboard or an aggressive website-blocking application.

Use a dark-first interface with layered surfaces, subtle borders, controlled accent colors, clear typography, and restrained visual effects.

Avoid excessive gradients, excessive glassmorphism, neon-heavy styling, unnecessary animations, and visually distracting decorations.

The UI should help the student **focus rather than become another source of distraction**.

---

# Design Principles

### 1. Focus first

Important information should be visually prominent.

During an active study session, the UI should prioritize:

* study goal
* current task
* remaining time
* focus status
* distraction warnings
* session controls

Do not overload the active-session screen with unnecessary analytics.

### 2. Clear hierarchy

Every page should have a clear visual hierarchy:

**Page → Section → Card → Information → Action**

Primary actions must be visually distinguishable from secondary actions.

### 3. Calm over flashy

KIKO AI is a productivity application.

Avoid visual effects that compete with study content.

Use animation only when it communicates:

* state changes
* loading
* progress
* success
* intervention
* navigation

### 4. Consistency

The same component should look and behave consistently throughout the application.

Do not create multiple visual styles for equivalent UI elements.

### 5. Data should be easy to understand

Analytics should use simple visual representations.

Focus metrics, distraction metrics, session duration, and trends should be understandable without requiring the user to interpret complicated charts.

---

# Color System

All application colors must use semantic CSS custom properties.

Do not use hardcoded hex values directly inside components.

The following tokens define the primary KIKO AI visual system.

| Role              | CSS Variable             | Value     |
| ----------------- | ------------------------ | --------- |
| Page background   | `--bg-base`              | `#0B0F14` |
| Primary surface   | `--bg-surface`           | `#111820` |
| Elevated surface  | `--bg-elevated`          | `#17212B` |
| Secondary surface | `--bg-subtle`            | `#0F151C` |
| Primary text      | `--text-primary`         | `#F5F7FA` |
| Secondary text    | `--text-secondary`       | `#C2CBD5` |
| Muted text        | `--text-muted`           | `#8793A1` |
| Primary accent    | `--accent-primary`       | `#7C5CFF` |
| Accent hover      | `--accent-hover`         | `#9178FF` |
| Accent subtle     | `--accent-subtle`        | `#211A3D` |
| Border            | `--border-default`       | `#25313D` |
| Border subtle     | `--border-subtle`        | `#1B252F` |
| Success           | `--state-success`        | `#35C98A` |
| Success subtle    | `--state-success-subtle` | `#102D24` |
| Warning           | `--state-warning`        | `#F4B740` |
| Warning subtle    | `--state-warning-subtle` | `#332912` |
| Error             | `--state-error`          | `#F06A6A` |
| Error subtle      | `--state-error-subtle`   | `#32191B` |
| Info              | `--state-info`           | `#4FA3FF` |
| Info subtle       | `--state-info-subtle`    | `#12283C` |

### Color usage

**Purple (`--accent-primary`)**

Use for:

* primary CTA
* active navigation
* AI-related actions
* selected states
* important interactive elements

**Green (`--state-success`)**

Use for:

* focused state
* successful operations
* completed sessions
* positive productivity indicators

**Yellow (`--state-warning`)**

Use for:

* mild distraction
* attention required
* warnings
* break suggestions

**Red (`--state-error`)**

Use for:

* serious errors
* failed operations
* repeated/high-level distraction warnings where appropriate

**Blue (`--state-info`)**

Use for:

* informational messages
* neutral system states
* contextual information

Do not use status colors as decorative colors.

---

# Color Rules

1. Every UI color must reference a semantic token.
2. Do not place raw hex values inside JSX.
3. Do not create one-off colors for individual components.
4. If a required semantic color does not exist, add it to the UI context before implementing it.
5. Status colors must communicate meaning consistently.
6. Maintain sufficient contrast between text and background.
7. Do not use accent colors excessively.

---

# Typography

KIKO AI uses a clean sans-serif interface font and a monospace font for technical/session data where appropriate.

| Role                  | Font           | Variable      |
| --------------------- | -------------- | ------------- |
| UI text               | Inter          | `--font-sans` |
| Code / technical data | JetBrains Mono | `--font-mono` |

## Typography hierarchy

### Page title

Use for major page headings.

Characteristics:

* strong visual weight
* large size
* high contrast
* limited use

### Section heading

Use for dashboard and feature sections.

Characteristics:

* medium-large
* semibold
* clear separation from body content

### Card title

Use for metric cards and panels.

Characteristics:

* medium size
* semibold
* high readability

### Body text

Use for:

* descriptions
* explanations
* AI responses
* supporting information

Keep line length comfortable and avoid dense paragraphs inside dashboard cards.

### Muted text

Use `--text-muted` for:

* secondary descriptions
* timestamps
* labels
* supporting metadata

Do not use muted text for primary actions or critical information.

---

# Font Rules

1. Use `--font-sans` as the default application font.
2. Use `--font-mono` only where a technical/data representation benefits from it.
3. Do not introduce additional fonts for individual pages.
4. Maintain consistent font weights across equivalent components.
5. Do not use typography as decoration.

---

# Spacing

Use a consistent spacing scale based on Tailwind's spacing system.

Preferred spacing values:

* `4px`
* `8px`
* `12px`
* `16px`
* `20px`
* `24px`
* `32px`
* `40px`
* `48px`
* `64px`

Prefer existing Tailwind spacing utilities over arbitrary values.

Avoid excessive use of arbitrary spacing such as:

`mt-[37px]`

unless there is a genuine layout requirement.

---

# Border Radius

KIKO AI uses moderately rounded surfaces.

| Context                | Class          |
| ---------------------- | -------------- |
| Inline / small UI      | `rounded-md`   |
| Buttons / inputs       | `rounded-lg`   |
| Cards / panels         | `rounded-xl`   |
| Large feature surfaces | `rounded-2xl`  |
| Modals / overlays      | `rounded-xl`   |
| Circular indicators    | `rounded-full` |

Do not mix unrelated radius styles for equivalent components.

---

# Borders

Use subtle borders to establish hierarchy between dark surfaces.

Preferred token:

`--border-default`

For very subtle separation:

`--border-subtle`

Avoid heavy borders around every element.

Cards should generally use either:

* a subtle border,
* a surface contrast,
* or both with restrained intensity.

---

# Shadows and Elevation

Dark surfaces should rely primarily on:

* surface contrast
* borders
* restrained shadows

Do not use large glowing shadows around every card.

Elevated elements such as:

* dropdowns
* modals
* popovers
* important intervention dialogs

may use stronger elevation.

---

# Component Library

KIKO AI uses:

**Tailwind CSS + reusable React components.**

The project currently contains shared components under:

```text
frontend/src/components/
```

Reusable UI primitives should be created when a pattern appears in multiple places.

Do not duplicate the same button, card, modal, metric, or status implementation across multiple pages.

Before creating a new reusable component:

1. Check whether an existing component already solves the problem.
2. Extend the existing component if appropriate.
3. Create a new component only when it represents a genuinely reusable pattern.

---

# Component Organization

Use the following conceptual structure:

```text
frontend/src/
├── components/
│   ├── common/
│   ├── session/
│   ├── analytics/
│   ├── assistant/
│   └── ui/
├── layouts/
├── pages/
├── context/
└── services/
```

The exact folder structure may evolve according to the approved architecture, but responsibilities must remain clear.

### Common components

Reusable application-wide elements such as:

* buttons
* cards
* badges
* loading states
* empty states
* dialogs
* navigation elements

### Session components

Components specific to:

* study sessions
* timers
* focus state
* session controls
* intervention states

### Analytics components

Components specific to:

* charts
* metric displays
* session statistics
* activity timelines

### Assistant components

Components specific to:

* document upload
* AI chat
* summaries
* flashcards
* quizzes
* AI responses

---

# Buttons

Buttons must have clear hierarchy.

### Primary button

Use for the main action of a page or section.

Examples:

* Start Study Session
* Upload Notes
* Generate Quiz
* Start Learning

Use:

`--accent-primary`

### Secondary button

Use for supporting actions.

Examples:

* View Details
* Cancel
* Back

Use a surface/background treatment with a subtle border.

### Destructive button

Use only for actions that genuinely destroy or permanently remove data.

Examples:

* Delete document
* Delete session

Use `--state-error`.

Do not use destructive styling merely to make an action visually noticeable.

---

# Inputs and Forms

Inputs must:

* use the defined surface colors,
* use consistent borders,
* have clear labels,
* provide visible focus states,
* show validation feedback,
* maintain consistent height and spacing.

Focus state should use the primary accent without becoming visually overwhelming.

Forms should clearly distinguish:

**Label → Input → Supporting text/error**

Do not rely on placeholder text as the only label.

---

# Cards

Cards are the primary information grouping mechanism throughout KIKO AI.

A standard card should generally use:

* `--bg-surface`
* `--border-default`
* `rounded-xl`

Cards should have consistent internal padding.

Avoid nesting too many cards inside other cards.

---

# Dashboard Layout

The dashboard should present the user's current productivity state at a glance.

High-level structure:

```text
┌───────────────────────────────────────────────┐
│ Header / Page Introduction                    │
├───────────────────────────────────────────────┤
│ Metric Cards                                  │
│ Study Time | Focus Score | Distraction | ... │
├───────────────────────────────────────────────┤
│ Recent Sessions            │ Quick Action     │
│                            │ Start Session    │
├───────────────────────────────────────────────┤
│ Additional analytics / activity              │
└───────────────────────────────────────────────┘
```

The most important action should remain easy to find:

**Start Study Session**

---

# Application Navigation

Authenticated application pages use a consistent navigation structure.

The primary navigation should provide access to major KIKO functions such as:

* Dashboard
* Study Session
* AI Study Assistant
* Analytics
* relevant account/settings areas when implemented

Navigation should visually communicate the current page.

Use:

* clear active state
* icon + label where appropriate
* consistent spacing
* subtle borders

Do not use excessive navigation animation.

---

# Sidebar

Where a sidebar is used:

* keep width consistent,
* use a clear separator,
* maintain comfortable item spacing,
* highlight the active route,
* avoid unnecessary nested navigation.

The sidebar should support the application, not dominate the content area.

On smaller screens, the sidebar should transform into an appropriate mobile navigation pattern.

---

# Landing Page

The landing page should communicate KIKO AI's value before presenting technical details.

Recommended hierarchy:

```text
Hero
  ↓
Problem
  ↓
KIKO Solution
  ↓
Learn
  ↓
Focus
  ↓
Analyze
  ↓
How KIKO Works
  ↓
Call to Action
```

The primary message should communicate:

**KIKO helps students learn better and stay focused.**

The landing page should visually connect the three core ideas:

**Learn → Focus → Improve**

Do not turn the landing page into a technical documentation page.

---

# Study Session UI

The active study session is one of the most important screens in KIKO AI.

It should prioritize:

1. Study goal
2. Subject
3. Current task
4. Timer
5. Focus status
6. Session controls

Example conceptual structure:

```text
┌──────────────────────────────────────────────┐
│ Subject / Session Status                    │
├──────────────────────────────────────────────┤
│                                              │
│              Remaining Time                  │
│                 42:18                        │
│                                              │
│           ● Focused                          │
│                                              │
├──────────────────────────────────────────────┤
│ Current Goal                                 │
│ Study Linked Lists and solve practice       │
├──────────────────────────────────────────────┤
│ Current Task                                 │
│ Implement insertion and deletion             │
├──────────────────────────────────────────────┤
│              End Session                     │
└──────────────────────────────────────────────┘
```

During active study:

* focused state should feel calm,
* distraction warnings should be noticeable but not disruptive,
* timer should be prominent,
* unnecessary controls should remain hidden.

---

# MindGuard Intervention UI

MindGuard interventions must be visually clear without becoming aggressive.

### Gentle reminder

Use warning styling.

Example conceptual message:

> You may be getting distracted. Return to your study goal?

Actions:

* Return to Study
* Take a Break

### Stronger warning

Use stronger warning/error styling only when the defined intervention level requires it.

Do not use full-screen disruptive overlays unless explicitly defined by the feature specification.

The intervention UI must preserve the product philosophy:

**Guide first, restrict only when necessary.**

---

# Focus Status

Focus state should have consistent visual language.

### Focused

Use:

* success token
* positive indicator
* calm messaging

### Mild distraction

Use:

* warning token
* subtle attention indicator

### Distracted

Use:

* stronger warning/error treatment
* clear intervention message

Do not rely on color alone.

Pair status colors with:

* icon
* label
* text
* or another visual indicator

for accessibility.

---

# Analytics UI

Analytics should prioritize comprehension.

Use:

* metric cards
* simple charts
* timelines
* progress indicators
* tables where appropriate

Important metrics include:

* study duration
* focused time
* distraction time
* focus score
* longest uninterrupted focus
* distraction events
* website activity

Charts should have:

* clear labels
* readable legends
* meaningful units
* accessible contrast
* concise supporting text

Avoid charts that exist only for visual decoration.

---

# Session Report Layout

The session report should tell a clear story:

**What happened → How focused was the student → Where were distractions → What can improve**

Recommended structure:

```text
Session Summary
      ↓
Key Metrics
      ↓
Focus Timeline
      ↓
Website Activity
      ↓
Distraction Events
      ↓
Longest Focus Period
      ↓
AI Session Insights
```

The AI insight section should visually distinguish AI-generated observations from raw analytics.

---

# AI Study Assistant UI

The AI Study Assistant should feel like an integrated part of KIKO AI rather than a separate chatbot.

Primary areas include:

* study-material upload
* material selection
* summary
* important points
* flashcards
* quizzes
* AI tutor/chat

The interface should make the relationship between the uploaded material and AI responses clear.

For example:

```text
Study Material
      ↓
Choose Learning Mode
      ↓
Summary / Flashcards / Quiz / Tutor
```

AI responses should prioritize readability.

Use:

* clear message hierarchy
* readable line length
* appropriate spacing
* code formatting where required
* loading states
* error states

---

# Loading States

Every operation that may take noticeable time must provide feedback.

Examples:

* document upload
* text extraction
* AI generation
* quiz generation
* session analysis
* report generation

Use appropriate:

* skeletons
* spinners
* progress indicators
* disabled states

Do not leave the user wondering whether an operation is still running.

---

# Empty States

Empty states should explain:

1. What is currently missing.
2. Why it matters.
3. What the user can do next.

Example:

**No study sessions yet**

Start your first focused study session to begin building your productivity history.

**Start Study Session**

Do not display empty tables or blank cards without explanation.

---

# Error States

Errors should be:

* understandable,
* concise,
* actionable when possible.

Avoid exposing raw backend exceptions to users.

Example:

Instead of:

> `500 Internal Server Error`

prefer:

> Something went wrong while analyzing your session. Please try again.

Technical details may be logged for developers without being displayed directly to users.

---

# Responsive Design

KIKO AI must work on:

* desktop
* tablet
* mobile-sized screens

Desktop is the primary environment because the Chrome extension and study workflow are desktop-oriented.

### Desktop

Use:

* sidebar where appropriate
* multi-column layouts
* dashboard grids
* larger analytics views

### Tablet

Reduce:

* column count
* spacing
* sidebar width where necessary

### Mobile

Prioritize:

* single-column layouts
* readable cards
* accessible controls
* compact navigation
* horizontally scrollable data where appropriate

Do not simply shrink desktop layouts.

---

# Animation

Animations must be purposeful.

Use subtle transitions for:

* navigation
* hover states
* dropdowns
* dialogs
* focus-state changes
* progress indicators

Avoid:

* constant moving backgrounds
* excessive particle effects
* unnecessary page transitions
* distracting looping animations

KIKO is a focus product; animation must never undermine that goal.

---

# Icons

Use:

**Lucide React**

Icons should be stroke-based and visually consistent.

Preferred sizing:

| Context                | Size      |
| ---------------------- | --------- |
| Inline icon            | `h-4 w-4` |
| Button icon            | `h-4 w-4` |
| Standard UI icon       | `h-5 w-5` |
| Prominent feature icon | `h-6 w-6` |

Icons should communicate meaning rather than act as decoration.

Do not mix multiple icon libraries.

Do not use emojis as substitutes for functional interface icons.

---

# Accessibility

The UI must remain usable for users with different accessibility needs.

Requirements include:

* sufficient text/background contrast
* visible keyboard focus states
* semantic buttons and links
* labels for form controls
* meaningful alt text for informative images
* status information not communicated through color alone
* accessible interactive controls

Do not remove focus outlines without replacing them with an equivalent accessible focus treatment.

---

# UI Consistency Rules

Every new page/component must answer:

* Which existing layout pattern does it use?
* Which color tokens does it use?
* Which typography level does it use?
* Which radius scale does it use?
* Which existing component can be reused?
* How does it behave on smaller screens?
* What happens during loading?
* What happens when there is no data?
* What happens when the operation fails?

If the answer requires a new global visual decision, update `ui-context.md` before implementing it.

---

# Visual Anti-Patterns

Do not introduce:

* hardcoded colors
* random gradients
* excessive neon colors
* inconsistent card styles
* inconsistent border radii
* multiple icon libraries
* unnecessary glassmorphism
* excessive shadows
* decorative charts with no analytical purpose
* full-screen distractions without specification
* unrelated visual redesigns during feature implementation
* UI patterns that contradict the focus-oriented nature of KIKO AI

---

# UI Source of Truth

This document is the authoritative source for KIKO AI's visual system.

When implementing UI:

**Read `ui-context.md` → Reuse existing patterns → Use defined tokens → Implement → Verify responsiveness and consistency**

If a required visual decision is not defined here, do not silently invent a project-wide pattern.

Record the decision and update this document before applying the new pattern broadly.
