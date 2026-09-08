# AI Workflow Rules

## Approach

Build KIKO AI using a **spec-driven, incremental development workflow**.

The AI coding agent is the implementation engine, not the product architect. Product requirements, architecture, scope, system boundaries, UI decisions, coding standards, and unresolved decisions must come from the project's context files and approved specifications.

Before making implementation changes:

1. Read the relevant context files.
2. Read the specification for the current implementation unit.
3. Read `progress-tracker.md` to understand the current project state.
4. Verify the requested change is within the defined scope.
5. Implement only the current unit.
6. Verify the implementation against its specification.
7. Update the progress tracker before moving to another unit.

Do not infer new product behavior when the context files or specification do not define it.

The primary development sequence is:

**Understand → Specify → Implement → Verify → Record → Continue**

KIKO AI must be developed as one integrated system. However, individual implementation units must remain small enough to reason about, test, and verify independently.

---

## Scoping Rules

### 1. Work on one feature unit at a time

Implement only the unit specified in the current specification file.

Do not start unrelated features because they appear useful or because their implementation is nearby in the codebase.

For example:

* Do not implement blockchain while implementing session analytics.
* Do not redesign the entire dashboard while fixing session data.
* Do not introduce ML-based focus prediction while implementing MindGuard V1.
* Do not modify the AI Study Assistant while fixing an unrelated extension issue.

### 2. Prefer small, verifiable increments

Break complex functionality into small implementation steps.

Each step should produce a clear result that can be verified independently.

For example, MindGuard should be developed progressively:

1. Capture browser activity.
2. Send aggregated activity to the backend.
3. Classify activity using the rule-based relevance engine.
4. Record distraction events.
5. Trigger intervention.
6. Display the resulting state.

Do not attempt to implement the entire MindGuard system in one speculative change.

### 3. Respect system boundaries

Do not combine unrelated system boundaries in one implementation unit.

KIKO AI has several major boundaries:

* React frontend
* FastAPI backend
* PostgreSQL database
* Chrome extension
* AI services
* Analytics and focus engines
* Security/authentication

A unit may require coordination between boundaries when that coordination is explicitly part of the specification, but do not silently expand the scope.

### 4. Do not rewrite working systems unnecessarily

When existing code already satisfies the specification, reuse it.

Prefer:

* extending existing services,
* refactoring isolated code,
* migrating existing functionality,
* improving existing components,

over replacing the entire implementation.

Do not rebuild KIKO AI from scratch unless explicitly instructed.

### 5. Preserve existing behavior

When modifying an existing feature, preserve unrelated behavior.

Before changing a shared component, service, router, engine, or API:

* understand its current consumers,
* identify dependencies,
* determine whether the change affects existing functionality,
* make the smallest safe change.

---

## When to Split Work

Split an implementation step whenever it combines multiple independent concerns.

### Split when it combines:

* frontend UI changes and unrelated backend changes
* database schema changes and unrelated UI redesign
* multiple unrelated API routes
* Chrome extension monitoring and unrelated AI assistant functionality
* authentication changes and unrelated analytics changes
* data-model changes and unrelated visual changes
* multiple independent features
* behavior that is not clearly defined in the context files
* implementation and architectural decisions that have not yet been approved

### Split when verification becomes difficult

If a change cannot be tested or verified end-to-end within a focused development session, reduce the scope.

For example, instead of:

> "Build the complete study session system."

split it into appropriate units such as:

* create session data model and API
* create session setup UI
* implement session start/end lifecycle
* implement timer and active-session state
* connect the extension to the active session

The exact decomposition must follow the approved build plan and specifications.

### Do not split artificially

Do not create extremely small units that have no meaningful standalone result.

If two changes:

* always need to be implemented together,
* have no useful standalone state,
* belong to the same system boundary,
* and can be verified together,

they may be combined into one unit.

---

## Handling Missing Requirements

### 1. Do not invent product behavior

If a feature is not defined by:

* `project-overview.md`
* `architecture.md`
* `ui-context.md`
* `code-standards.md`
* `ai-workflow-rules.md`
* the relevant specification
* an explicitly approved project decision

do not invent the behavior.

Do not assume what the user "probably wants."

### 2. Resolve ambiguity before implementation

When a requirement is ambiguous, stop implementation of the affected part.

Identify the ambiguity clearly.

Examples:

* What counts as a distraction?
* Should a warning appear immediately or only after sustained distraction?
* Should a user be able to disable an intervention?
* What data should be retained after a study session?
* Should an AI-generated insight be saved permanently?
* What happens if the AI provider is unavailable?

Resolve the decision in the appropriate context/specification file before implementing behavior that depends on it.

### 3. Record unresolved decisions

If a requirement is missing and cannot be resolved immediately, add it to:

`context/progress-tracker.md`

under:

`## Open Questions`

Do not silently choose an implementation.

### 4. Do not use implementation convenience as a product decision

Do not choose behavior merely because it is easier to code.

Technical convenience must not override the defined KIKO AI product behavior.

---

## Protected Files and Areas

Do not modify protected files or third-party internals unless explicitly instructed.

### Protected areas

* Third-party package source code
* Generated library internals
* `node_modules/`
* Python virtual-environment files such as `backend/venv/`
* Python cache directories such as `__pycache__/`
* generated build output such as `dist/`
* generated package-lock changes unrelated to an intentional dependency update

Do not commit environment-specific or generated directories.

### Existing project structure

Do not arbitrarily move or rename major project directories.

The main boundaries are:

* `frontend/`
* `backend/`
* `extension/`
* `docs/`
* `context/`

If restructuring is necessary, document the architectural reason and update the relevant context documentation.

### Shared components

Do not make broad changes to shared components merely to satisfy one feature.

If a feature requires a shared component change, verify all known consumers before modifying it.

---

## Keeping Documentation in Sync

Documentation is part of the system.

Update the relevant context file whenever implementation changes a documented decision.

### Update `architecture.md` when:

* system boundaries change
* technologies change
* database/storage decisions change
* authentication architecture changes
* API/service responsibilities change
* AI provider architecture changes
* background processing architecture changes
* important invariants change

### Update `ui-context.md` when:

* theme decisions change
* design tokens change
* typography changes
* layout patterns change
* component-library conventions change
* icon conventions change

### Update `code-standards.md` when:

* project-wide coding conventions change
* folder responsibilities change
* API conventions change
* validation conventions change
* styling conventions change

### Update `project-overview.md` when:

* product scope changes
* major features are added or removed
* core user flow changes
* success criteria change

### Update `ai-workflow-rules.md` when:

* development workflow rules change
* implementation constraints change
* verification rules change

### Always update `progress-tracker.md` when:

* a meaningful implementation unit starts
* a meaningful implementation unit is completed
* an architectural decision is made
* an open question is resolved
* an important blocker is discovered
* the next implementation unit changes

Do not allow documentation to describe an architecture or behavior that the codebase intentionally no longer follows.

---

## Working With the Existing KIKO AI Codebase

Before modifying an existing implementation:

1. Inspect the relevant files.
2. Understand the current implementation.
3. Identify reusable services, routers, components, engines, and utilities.
4. Compare the current implementation with the approved architecture.
5. Identify inconsistencies.
6. Fix only the inconsistencies relevant to the current unit.

Do not assume that the existing implementation is automatically correct.

Do not assume that the existing implementation must automatically be discarded.

The current KIKO AI codebase is a prototype foundation. Reuse valid work and refactor where necessary to bring it into alignment with the approved architecture.

### Database migration rule

The approved KIKO AI architecture uses:

**PostgreSQL running in Docker.**

Existing MongoDB-based implementation may be encountered during migration.

Do not maintain two competing primary databases.

When implementing the PostgreSQL migration:

* PostgreSQL becomes the authoritative application database.
* Existing MongoDB dependencies should be removed when their replacement is verified.
* Do not introduce new MongoDB-dependent functionality.
* Update affected models, services, routers, configuration, documentation, and tests as required by the migration specification.

Do not perform the complete migration while implementing an unrelated feature unless the current specification explicitly requires it.

---

## AI Development Rules

### 1. Reuse the existing AI Study Buddy work

The existing AI Study Buddy implementation provides reusable functionality for:

* document processing
* summarization
* flashcards
* quizzes
* AI tutoring
* RAG-related functionality

Do not duplicate the same AI logic in KIKO AI if it can be cleanly reused.

Integration should follow the approved KIKO AI architecture.

### 2. Use the AI service abstraction

Application features should depend on the KIKO AI AI-service abstraction rather than directly coupling every feature to a provider.

The current primary provider is:

**Groq**

Gemini may be used as an optional fallback only when explicitly supported by the architecture and implementation specification.

Do not introduce another AI provider without an approved architectural decision.

### 3. Do not claim ML functionality before it exists

MindGuard V1 uses rule-based focus/distraction detection.

Do not describe or implement it as a trained ML focus-prediction system.

Future ML-based focus prediction is outside the current Phase 1 implementation unless explicitly moved into scope.

### 4. Handle AI failure gracefully

AI functionality must not cause the entire application to fail when an AI provider is unavailable.

Where specified, provide an appropriate fallback or error state.

Never hide an AI failure by silently returning fabricated AI output.

---

## Chrome Extension Development Rules

The extension is a first-class KIKO AI system boundary.

When modifying the extension:

* preserve Manifest V3 compatibility,
* keep permissions limited to what the feature requires,
* avoid unnecessary browser permissions,
* aggregate browser activity rather than transmitting every low-level event individually unless explicitly required,
* associate activity with the correct study session,
* avoid collecting unnecessary information,
* follow the defined privacy and security model.

Do not introduce new monitoring signals unless they are required by the relevant specification.

Do not implement unrestricted browsing surveillance as a substitute for the defined MindGuard behavior.

---

## API Development Rules

For FastAPI changes:

1. Validate request input.
2. Authenticate the request when required.
3. Verify ownership/access where required.
4. Perform business logic through the appropriate service/engine.
5. Persist data through the appropriate data layer.
6. Return the defined response schema.

Do not place large business-logic blocks directly inside route handlers when a service or engine is responsible for that behavior.

Do not introduce an API route without a defined purpose.

Do not change an existing response contract without updating its consumers and the relevant specification.

---

## Database Change Rules

Database changes must be deliberate.

Before modifying the schema:

1. Identify affected entities.
2. Identify relationships.
3. Identify existing consumers.
4. Define the migration.
5. Update the relevant models.
6. Update services and APIs.
7. Test affected behavior.

Do not store large generated artifacts directly in PostgreSQL when the architecture defines file storage for them.

Do not add database fields merely because they may be useful in the future.

Every persistent field should have a current product or technical purpose.

---

## Frontend Development Rules

The frontend must follow the approved KIKO AI UI context.

When implementing a page:

* reuse existing shared components where appropriate,
* use defined design tokens,
* follow established layout patterns,
* keep components focused,
* keep API communication in the appropriate service layer,
* avoid embedding large business-logic blocks inside presentation components.

Do not redesign unrelated pages while implementing one feature.

Do not introduce a new visual pattern when an existing KIKO pattern already solves the problem.

---

## Verification Before Moving to the Next Unit

Before declaring a unit complete:

1. The implementation matches the specification.
2. The requested behavior works within the defined scope.
3. Existing related functionality still works.
4. No defined architecture invariant has been violated.
5. No unrelated feature was introduced.
6. Required API/database interactions work correctly.
7. Frontend behavior works without unexpected console errors.
8. Extension behavior works when the unit involves the extension.
9. AI failures are handled according to the specification when the unit involves AI.
10. Relevant tests pass.
11. `npm run build` passes for the frontend.
12. Backend validation/tests pass where applicable.
13. No unnecessary generated/environment files were added.
14. `context/progress-tracker.md` reflects the current state.
15. Any newly discovered architectural or product decision has been documented.

### Minimum frontend verification

Run:

`npm run build`

A unit must not be considered complete if the frontend build fails.

### Minimum backend verification

For backend units:

* start the FastAPI application,
* verify affected endpoints,
* verify database interaction where applicable,
* run relevant automated tests,
* check application logs for unexpected errors.

### Extension verification

For extension units:

* load the extension in Chrome using the development workflow,
* verify service-worker behavior,
* verify affected permissions,
* verify communication with the backend,
* verify the behavior against an active KIKO study session.

---

## Completion Rules

A feature is not complete merely because the code was written.

A unit is complete only when:

**Implemented + Integrated + Verified + Documented**

The AI coding agent must not mark a unit complete based solely on compilation or file creation.

If verification reveals a problem:

1. Identify the specific failure.
2. Determine whether it is within the current unit.
3. Fix only the relevant issue.
4. Re-run verification.
5. Update the progress tracker.

If the failure requires a decision outside the current scope, stop and record it under `Open Questions` rather than inventing a solution.

---

## Change Discipline

Every implementation change must answer:

* What specification requires this?
* Which system boundary owns it?
* What existing behavior could it affect?
* How will it be verified?
* Does documentation need updating?

If these questions cannot be answered clearly, do not proceed with a broad implementation.

Prefer the smallest change that satisfies the specification.

Avoid speculative abstractions, unnecessary dependencies, premature optimization, and future-proofing that is not required by the current architecture.

---

## Phase and Scope Discipline

KIKO AI is being developed incrementally.

### Phase 1 / Review 1 priority

The implementation priority is:

1. Landing Page
2. Dashboard
3. Study Session
4. Chrome Extension
5. MindGuard V1
6. Session Analytics
7. AI Session Insights
8. AI Study Assistant

The final Phase 1 experience should demonstrate one connected flow:

**Landing → Dashboard → Study Session → Browser Monitoring → MindGuard Detection → Smart Intervention → End Session → Analytics Report → AI Insight → AI Study Assistant**

### Do not prematurely implement Phase 2 features

Unless explicitly moved into the current specification, do not implement:

* ML-based focus prediction
* blockchain implementation
* advanced encryption architecture
* full AI study planner
* mobile application
* institution dashboard
* advanced personalization
* cross-browser support
* complex recommendation engine

Future-scope features may be documented but must not consume implementation scope for the current unit.

---

## Session Resume Rules

At the beginning of every development session:

1. Read the root project instructions/entry point.
2. Read the six context files.
3. Read the current build plan.
4. Read the relevant feature specification.
5. Read `progress-tracker.md`.
6. Inspect the current implementation before making assumptions.
7. Continue from the documented state.
Do not restart completed work unless explicitly instructed.
Do not assume that an earlier conversation is still available.
The context files and progress tracker are the authoritative project memory.
---

## Final Rule
**Do not guess when the project specification can decide.**

Build only what KIKO AI has defined.
Work in small units.
Respect system boundaries.
Reuse working code.
Document meaningful decisions.
Verify every unit.
Keep the architecture and implementation synchronized.
When requirements are unclear, stop and resolve them rather than silently inventing behavior.b
**The goal is not to generate the most code. The goal is to build the correct KIKO AI system, one verified unit at a time.**
