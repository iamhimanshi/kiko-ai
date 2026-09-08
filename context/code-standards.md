# KIKO AI — Code Standards

## 1. Purpose

This document defines the coding standards for KIKO AI.

The goal is to keep the project:

* Consistent
* Readable
* Maintainable
* Testable
* Secure
* Easy to extend
* Easy for team members to understand
* Safe for AI-assisted development

These standards apply to:

* Frontend
* Backend
* Database
* Chrome extension
* AI/RAG services
* Tests
* Configuration
* Documentation

---

# 2. General Principles

## 2.1 Prefer Simple Solutions

Use the simplest implementation that correctly solves the problem.

Do not introduce:

* unnecessary abstractions,
* unnecessary libraries,
* unnecessary services,
* unnecessary design patterns.

Complexity must have a clear reason.

---

## 2.2 Reuse Before Rebuilding

Before implementing a new feature:

1. Search the existing codebase.
2. Identify existing related functionality.
3. Reuse it if appropriate.
4. Refactor it if necessary.
5. Only create new functionality when existing code cannot reasonably support the requirement.

This is especially important for:

* AI services
* RAG logic
* session handling
* analytics
* API clients
* reusable UI components
* authentication

---

## 2.3 One Responsibility per Module

Files should have clear responsibilities.

For example:

```text
routers/
    API request handling

services/
    application/business operations

engines/
    deterministic calculations/classification

models/
    database models

schemas/
    request/response validation

core/
    configuration/security/database infrastructure
```

Avoid placing business logic directly inside routers or React page components.

---

## 2.4 Avoid Premature Abstraction

Do not create abstractions merely because similar code appears twice.

Create an abstraction when:

* behaviour is genuinely shared,
* duplication is becoming difficult to maintain,
* or the architecture explicitly requires it.

---

# 3. Frontend Standards

## 3.1 Technology

The frontend uses:

* React
* Vite
* JavaScript
* Tailwind CSS
* React Router
* Axios
* Lucide React

Do not introduce another UI framework without an explicit architecture decision.

---

# 4. React Component Standards

## 4.1 Functional Components

Use functional React components.

Prefer:

```jsx
function MetricCard({ title, value }) {
  return (
    <div>
      <h3>{title}</h3>
      <p>{value}</p>
    </div>
  );
}
```

Avoid unnecessary class components.

---

## 4.2 Component Responsibility

A component should have one clear purpose.

Good examples:

```text
MetricCard
FocusRing
FocusStatus
SessionTimer
DistractionAlert
WebsiteActivity
```

Avoid creating components that contain the entire application's business logic.

---

## 4.3 Pages vs Components

Pages should coordinate page-level functionality.

Reusable UI should live in components.

For example:

```text
pages/
    Dashboard.jsx

components/
    MetricCard.jsx
    SessionCard.jsx
    FocusRing.jsx
```

Do not duplicate the same UI across multiple pages.

---

# 5. React State Management

Use the simplest appropriate state mechanism.

### Local UI state

Use:

```js
useState
```

for component-local state.

### Derived values

Prefer:

```js
useMemo
```

only when there is a meaningful performance or computation reason.

### Side effects

Use:

```js
useEffect
```

only for actual side effects.

Avoid using `useEffect` to implement ordinary derived state.

### Shared state

Use existing context or the project's chosen state-management approach when multiple components genuinely need shared state.

Do not introduce global state for data that can remain local.

---

# 6. API Communication

Frontend API calls should go through the existing service layer.

Prefer:

```text
pages/components
        ↓
API service
        ↓
FastAPI endpoint
```

Avoid scattering raw Axios calls throughout UI components.

Existing service modules include concepts such as:

```text
authApi.js
sessionsApi.js
documentsApi.js
assistantApi.js
```

Continue this pattern.

---

# 7. Frontend Error Handling

Every user-facing API operation should consider:

* Loading
* Success
* Empty
* Error

Example states:

```text
Loading...
No sessions yet
Unable to load sessions
Session loaded
```

Do not silently swallow API errors.

---

# 8. Frontend Naming

Use:

### Components

PascalCase:

```text
MetricCard.jsx
FocusRing.jsx
SessionReport.jsx
```

### Functions

camelCase:

```js
startSession()
calculateFocusScore()
loadSessions()
```

### Variables

camelCase:

```js
focusScore
sessionData
distractionTime
```

### Constants

UPPER_SNAKE_CASE when appropriate:

```js
MAX_SESSION_DURATION
DEFAULT_POLL_INTERVAL
```

---

# 9. UI Styling Standards

Use the UI context document as the visual source of truth.

Do not introduce random colors.

Avoid:

```jsx
<div className="bg-[#123456]">
```

when an established design token should be used.

Use semantic design tokens/classes instead.

The same semantic meaning must use the same visual treatment.

For example:

* Focused → success
* Warning → warning
* Error → error
* Informational → info

---

# 10. UI Consistency

Maintain consistency in:

* spacing
* typography
* border radius
* buttons
* cards
* forms
* alerts
* status indicators
* navigation
* loading states

Do not create a completely different visual style for individual pages.

---

# 11. Frontend Security

Never place secrets in frontend source code.

Never hardcode:

* API keys
* AI provider keys
* database credentials
* JWT secrets
* private tokens

Frontend environment variables must contain only values that are safe to expose to the browser.

Sensitive API credentials belong on the backend.

---

# 12. Backend Standards

## 12.1 Technology

Backend uses:

* Python
* FastAPI
* SQLAlchemy
* PostgreSQL
* JWT
* bcrypt

---

# 13. FastAPI Layering

Use the following structure:

```text
Router
   ↓
Service
   ↓
Engine / Repository / Database
```

Where appropriate.

### Router

Responsible for:

* HTTP request handling
* dependency injection
* authentication dependency
* request validation
* response formatting

### Service

Responsible for:

* business operations
* coordinating multiple components
* application workflows

### Engine

Responsible for:

* deterministic calculations
* classification
* analytics
* focus/relevance logic

### Model

Responsible for:

* database representation

### Schema

Responsible for:

* request/response validation

---

# 14. Router Standards

Routers should remain thin.

Avoid putting large business algorithms inside:

```text
routers/*.py
```

Prefer:

```python
result = session_service.end_session(...)
```

rather than implementing the entire session-processing workflow inside the endpoint.

---

# 15. Python Naming Standards

Use `snake_case` for:

* variables
* functions
* modules
* database fields

Example:

```python
focus_score
session_id
calculate_focus_score()
session_service.py
```

Use `PascalCase` for classes:

```python
class SessionService:
    ...
```

Use `UPPER_SNAKE_CASE` for constants:

```python
DEFAULT_WARNING_THRESHOLD = 10
```

---

# 16. Python Type Hints

Use type hints for new backend code wherever practical.

Example:

```python
def calculate_focus_score(
    focused_seconds: int,
    distracted_seconds: int,
) -> float:
    ...
```

Type hints should improve readability and tooling.

---

# 17. FastAPI Validation

Validate external input using FastAPI/Pydantic schemas.

Do not trust:

* frontend input
* extension input
* uploaded document metadata
* query parameters
* request bodies

Validation belongs at the application boundary.

---

# 18. API Design Standards

Use predictable REST-style endpoints.

Examples:

```text
POST   /api/sessions
GET    /api/sessions
GET    /api/sessions/{session_id}
POST   /api/sessions/{session_id}/activity
POST   /api/sessions/{session_id}/end
GET    /api/sessions/{session_id}/report
```

Use HTTP methods according to the operation.

---

# 19. API Response Standards

Responses should be predictable and easy for the frontend to consume.

Do not return unrelated fields simply because they are available internally.

Use explicit response schemas where appropriate.

---

# 20. HTTP Error Handling

Use meaningful HTTP status codes.

Examples:

```text
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
422 Validation Error
500 Internal Server Error
```

Do not expose internal stack traces or sensitive implementation details to users.

---

# 21. Authentication & Authorization

Authenticated endpoints must verify:

1. User identity
2. Authentication validity
3. Resource ownership where applicable

A user must not be able to access another user's:

* sessions
* reports
* documents
* study data

Never rely on the frontend to enforce authorization.

Authorization must be enforced by the backend.

---

# 22. Database Standards

## 22.1 Database

PostgreSQL is the authoritative application database.

MongoDB must not remain as a second competing application database after migration.

---

# 23. SQLAlchemy Standards

Database access should be performed through SQLAlchemy.

Avoid raw SQL unless there is a clear technical reason.

Database operations should remain separate from frontend logic and HTTP handling.

---

# 24. Database Models

Models should represent persistent entities clearly.

Likely core entities include:

```text
User
Document
StudySession
Activity
DistractionEvent
SessionReport
```

Additional entities may be introduced when justified by the architecture.

Do not create database tables for temporary UI state.

---

# 25. Database Relationships

Relationships should be explicit.

Example conceptual structure:

```text
User
 ├── Sessions
 │     ├── Activities
 │     ├── Distraction Events
 │     └── Report
 │
 └── Documents
```

Ownership should be enforceable at the database/application level.

---

# 26. Database Migrations

Database schema changes must be tracked through migrations.

Do not rely on manually changing production/database tables.

Migration files should be:

* ordered
* descriptive
* reviewed
* tested

---

# 27. Transaction Handling

Operations that modify multiple related records should consider transaction boundaries.

If a multi-step operation fails, the system should avoid leaving partially updated data wherever practical.

---

# 28. Chrome Extension Standards

## 28.1 Technology

The extension uses:

* Chrome Manifest V3
* Service worker
* Chrome APIs
* Backend APIs

---

# 29. Extension Responsibilities

The extension should:

* Monitor browser activity required by KIKO
* Determine the active tab
* Track relevant timing information
* Detect session state
* Aggregate activity
* Communicate with the backend
* Display intervention/status information where required

It should not become a second backend.

---

# 30. Extension Data Collection

Collect only signals required for KIKO's functionality.

Potential signals include:

* Domain
* URL/page information where necessary
* Page title
* Active-tab duration
* Tab switches
* Idle periods
* Interaction/activity signals

Avoid unnecessary collection.

---

# 31. Extension Event Aggregation

Do not send every browser event individually to the backend.

Prefer:

```text
Browser events
      ↓
Local aggregation
      ↓
Periodic activity payload
      ↓
Backend
```

This reduces:

* network traffic
* backend load
* database writes
* unnecessary data collection

---

# 32. Extension Reliability

The extension should tolerate:

* backend temporarily unavailable
* no active KIKO session
* browser tab changes
* service worker lifecycle events
* session ending
* invalid session state

It should fail gracefully rather than breaking the browsing experience.

---

# 33. MindGuard Standards

MindGuard V1 must remain deterministic and explainable.

The first implementation should use explicit rules.

For example:

```text
Study-related website
+ low tab switching
+ active interaction
+ low idle time
→ likely focused
```

and:

```text
Unrelated website
+ repeated tab switching
+ prolonged inactivity
→ likely distracted
```

Rules should be:

* documented
* testable
* easy to modify
* independent from UI code

---

# 34. MindGuard False-Positive Handling

MindGuard should avoid immediately treating every unusual activity as distraction.

Where practical:

* use sustained signals
* use study-goal context
* avoid triggering repeated notifications
* allow the user to return to study
* allow breaks

The system should guide rather than aggressively punish.

---

# 35. Analytics Standards

Analytics calculations should be deterministic whenever possible.

Examples:

```text
Focus Score
= Focused Time / (Focused Time + Distracted Time)
```

Analytics should be generated from stored session/activity data rather than manually entered frontend values.

The backend analytics engine is the source of truth.

---

# 36. AI Standards

## 36.1 AI Provider Abstraction

Application code should not directly depend on a provider-specific SDK throughout the codebase.

Prefer:

```text
Application Feature
       ↓
AI Service
       ↓
Provider Adapter
       ↓
Groq
```

This allows the provider to be changed later.

---

# 37. Groq Usage

Groq is the primary AI provider for the current project.

AI functionality should account for:

* API failures
* rate limits
* malformed responses
* timeouts
* unavailable models

The application must not assume every AI request succeeds.

---

# 38. AI Output Validation

Do not blindly trust AI-generated output.

When structured output is required:

* request a predictable format
* validate the response
* handle malformed output
* provide fallback behaviour

AI output should not directly modify critical database state without validation.

---

# 39. RAG Standards

The RAG pipeline should follow:

```text
Document
   ↓
Text Extraction
   ↓
Chunking
   ↓
Embeddings
   ↓
FAISS
   ↓
Relevant Retrieval
   ↓
Prompt Context
   ↓
AI Response
```

The system should retrieve relevant context rather than sending an entire large document to the model whenever unnecessary.

---

# 40. Document Processing

Uploaded documents must be validated.

Consider:

* file type
* file size
* extraction success
* empty documents
* malformed files
* unsupported formats

Temporary processing files should not become permanent application data unless explicitly required.

---

# 41. AI Prompt Standards

Prompts should be:

* clear
* task-specific
* context-aware
* concise
* maintainable

Avoid embedding large duplicated prompts across multiple files.

Reusable prompt templates may be centralized where appropriate.

---

# 42. AI Study Assistant Behaviour

The AI Study Assistant should prioritize the user's uploaded study context when the user asks material-specific questions.

It should not fabricate information when the retrieved material does not support an answer.

Where appropriate, the assistant should distinguish:

* information from uploaded material
* general explanation
* uncertainty

---

# 43. AI Session Insights

AI session insights should receive structured analytics such as:

```text
Session duration
Focused time
Distraction time
Focus score
Distraction count
Longest focus period
Major distraction categories
```

Do not send unnecessary raw browser history to the AI provider.

The deterministic analytics engine remains the source of truth.

---

# 44. Security Standards

Never commit:

* API keys
* database passwords
* JWT secrets
* private tokens
* `.env` files containing real credentials

Use:

```text
.env
.env.example
```

The `.env.example` file may contain placeholders.

---

# 45. Password Security

Passwords must never be stored as plaintext.

Use secure password hashing such as bcrypt.

Never log:

* plaintext passwords
* password hashes
* authentication tokens

---

# 46. Logging Standards

Logs should help debugging without exposing sensitive information.

Good:

```text
Session 123 ended successfully
```

Bad:

```text
User password: ...
JWT token: ...
Groq API key: ...
```

Avoid logging unnecessary browser activity or personal information.

---

# 47. File Storage Standards

Uploaded documents and generated artifacts should be handled separately from source code.

Do not commit:

* uploaded PDFs
* user-generated documents
* temporary extraction files
* generated embeddings
* runtime logs

unless a specific repository requirement exists.

---

# 48. Environment Standards

Required environment variables should be documented in:

```text
.env.example
```

Configuration should be loaded through the backend configuration layer.

Do not scatter environment-variable reads throughout business logic.

---

# 49. Testing Standards

Testing should prioritize core business logic.

Important test areas:

### Authentication

* Signup
* Login
* Invalid credentials
* Protected endpoints

### Sessions

* Create session
* Start session
* Active session
* Activity ingestion
* End session
* Report generation

### MindGuard

* Relevant activity
* Distracting activity
* Sustained distraction
* Intervention threshold
* Focus state

### Analytics

* Focus time
* Distraction time
* Focus score
* Longest focus period

### AI

* Successful provider response
* Provider failure
* Invalid response
* RAG retrieval behaviour

### Documents

* Valid upload
* Invalid file
* Extraction failure
* Empty document

---

# 50. Test Philosophy

Tests should focus on behaviour rather than implementation details.

Prefer:

```text
Given a session with 40 minutes focused
and 10 minutes distracted,
the focus score should be 0.8.
```

rather than testing private implementation details.

---

# 51. Error Handling Philosophy

Errors should be:

* detected
* logged appropriately
* returned with meaningful API responses
* represented clearly in the frontend

Do not silently ignore failures.

For non-critical AI functionality, graceful degradation is preferred.

For example:

```text
AI insight unavailable
Core session analytics are still available.
```

---

# 52. Git Standards

Use meaningful commit messages.

Examples:

```text
feat: add PostgreSQL session models
feat: integrate MindGuard activity pipeline
fix: correct session report calculation
refactor: move AI provider logic into service layer
test: add focus score tests
docs: update extension architecture
```

Avoid:

```text
update
changes
final
final2
new
working
```

---

# 53. Pull Request Standards

A meaningful change should explain:

* What changed
* Why it changed
* Files/modules affected
* Testing performed
* Any known limitations

Avoid mixing unrelated changes in one change set.

---

# 54. File and Folder Hygiene

Do not commit generated environments or caches.

Examples:

```text
venv/
node_modules/
__pycache__/
*.pyc
.env
```

These should be covered by `.gitignore`.

The repository should contain source and project configuration, not local runtime environments.

---

# 55. Documentation Standards

Documentation must reflect actual implementation.

If code changes:

* architecture documentation may need updating
* API documentation may need updating
* progress tracker may need updating
* README may need updating

Do not document planned functionality as implemented functionality.

---

# 56. AI-Assisted Coding Standards

When using AI coding assistance:

1. Read the relevant context documents first.
2. Understand existing code.
3. Identify the correct module.
4. Make the smallest reasonable change.
5. Do not rewrite unrelated files.
6. Run relevant tests.
7. Inspect the result.
8. Update documentation if architecture changed.
9. Record meaningful progress.

AI-generated code must be treated as code requiring review.

---

# 57. Change Scope Rule

A feature implementation should not unexpectedly modify unrelated parts of the system.

For example:

A MindGuard change should not casually rewrite:

* authentication
* dashboard UI
* document processing
* database infrastructure

unless the change genuinely requires it.

---

# 58. Dependency Standards

Before adding a dependency:

1. Check whether the project already has an equivalent.
2. Check whether the feature can be implemented using existing tools.
3. Consider bundle/runtime cost.
4. Consider maintenance.
5. Confirm the dependency fits the architecture.

Do not add dependencies simply for convenience.

---

# 59. Performance Standards

Phase 1 prioritizes correctness and reliability over premature optimization.

However:

* avoid unnecessary API requests
* aggregate extension events
* avoid repeated database queries
* avoid unnecessary React renders
* avoid sending entire documents to AI models
* avoid storing redundant data

Optimize based on an identified problem.

---

# 60. Privacy Standards

KIKO handles potentially sensitive behavioural information.

The system should follow data-minimization principles.

Collect only information necessary for:

* session monitoring
* distraction detection
* analytics
* intended KIKO functionality

Do not collect unrelated personal information.

Do not send unnecessary browser activity to third-party AI services.

---

# 61. Code Review Checklist

Before considering a change complete:

### Architecture

* [ ] Correct module/layer used
* [ ] No unnecessary dependency
* [ ] No duplicated business logic
* [ ] Existing functionality reused where appropriate

### Backend

* [ ] Input validated
* [ ] Authentication checked
* [ ] Ownership checked
* [ ] Errors handled
* [ ] Database operations safe

### Frontend

* [ ] Loading state handled
* [ ] Error state handled
* [ ] Empty state handled
* [ ] UI follows design system
* [ ] API calls use service layer

### Extension

* [ ] Permissions are justified
* [ ] Activity is aggregated
* [ ] Backend failures handled
* [ ] Session lifecycle handled

### AI

* [ ] Provider accessed through AI service layer
* [ ] AI failure handled
* [ ] Output validated
* [ ] Sensitive data minimized

### Testing

* [ ] Relevant tests added/updated
* [ ] Manual flow verified where necessary

### Documentation

* [ ] Progress tracker updated
* [ ] Architecture updated if required

---

# 62. Definition of Code Quality

KIKO code should be considered good quality when it is:

**Readable + Modular + Reusable + Testable + Secure + Consistent**

The goal is not to produce the largest or most sophisticated implementation.

The goal is to build a stable foundation that can support future KIKO capabilities such as:

* ML-based focus prediction
* adaptive interventions
* advanced personalization
* AI study planning
* blockchain integrity verification

without requiring another major architectural rewrite.
