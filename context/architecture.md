# Architecture Context

## System Overview

KIKO AI is a full-stack AI-powered study companion designed to help students **learn, stay focused, detect distractions, and understand their study behavior**.

The system consists of a React web application, a Chrome extension for browser activity monitoring, a FastAPI backend, PostgreSQL for persistent data, AI services for learning assistance and session insights, and dedicated focus/relevance/analytics engines.

The primary system flow is:

**React Web App + Chrome Extension → FastAPI Backend → PostgreSQL / AI / Analytics Engines → Results → React Web App + Extension**

The architecture separates presentation, browser monitoring, API/business logic, AI processing, analytics, and persistent storage so that each responsibility remains independently maintainable.

---

# Stack

| Layer               | Technology                               | Role                                                      |
| ------------------- | ---------------------------------------- | --------------------------------------------------------- |
| Frontend Framework  | React + Vite                             | Web application and user interface                        |
| Frontend Language   | JavaScript                               | Frontend application logic                                |
| Styling             | Tailwind CSS                             | Responsive UI styling                                     |
| Routing             | React Router                             | Client-side page navigation                               |
| HTTP Client         | Axios                                    | Communication between frontend/extension and backend APIs |
| Backend Framework   | Python + FastAPI                         | REST API and backend application                          |
| Backend ORM         | SQLAlchemy                               | Database models and persistence abstraction               |
| Database            | PostgreSQL                               | Authoritative persistent application database             |
| Database Runtime    | Docker                                   | Consistent local PostgreSQL environment                   |
| Authentication      | JWT                                      | Stateless user authentication                             |
| Password Security   | bcrypt                                   | Secure password hashing                                   |
| AI Provider         | Groq API                                 | Primary generative AI provider                            |
| AI Abstraction      | KIKO AI Service Layer                    | Provider-independent AI access                            |
| Embeddings          | Sentence Transformers                    | Convert study material into vector representations        |
| Vector Search       | FAISS                                    | Semantic retrieval for RAG-based study assistance         |
| Document Processing | Python document/PDF processing libraries | Extract text from uploaded study material                 |
| Browser Extension   | Chrome Extension Manifest V3             | Browser activity monitoring and MindGuard interaction     |
| Browser APIs        | Chrome Extension APIs                    | Tabs, storage, alarms and browser activity access         |
| Version Control     | Git + GitHub                             | Source control and collaboration                          |
| Containerization    | Docker / Docker Compose                  | Local infrastructure management                           |

---

# System Boundaries

Each major directory and subsystem owns a defined responsibility.

## `frontend/`

Owns the KIKO AI web application interface.

Responsibilities include:

* Landing page
* Dashboard
* Study session setup
* Active study session interface
* Session report
* AI Study Assistant interface
* Authentication pages
* Navigation
* UI state
* API consumption
* User-facing loading, success, and error states

The frontend must not directly access PostgreSQL, AI providers, or internal backend services.

All persistent application data must be accessed through the backend API.

---

## `backend/`

Owns the application's server-side logic and API boundary.

Responsibilities include:

* REST APIs
* authentication
* authorization
* request validation
* business logic
* session lifecycle
* activity ingestion
* document processing orchestration
* AI service integration
* focus/relevance processing
* analytics processing
* report generation
* database interaction

The backend is responsible for coordinating the application's major services.

---

## `backend/app/core/`

Owns application-wide infrastructure and configuration.

Responsibilities include:

* environment configuration
* database connection setup
* authentication/security configuration
* application-wide infrastructure

Core modules must not contain feature-specific business logic.

---

## `backend/app/models/`

Owns persistent database models.

Responsibilities include:

* user model
* study session model
* browser activity data
* distraction events
* reports
* documents and document metadata
* other approved persistent entities

Models define the database representation of application data.

---

## `backend/app/schemas/`

Owns API request and response schemas.

Responsibilities include:

* request validation
* response serialization
* typed API contracts
* validation rules at API boundaries

Schemas should not contain large business-logic implementations.

---

## `backend/app/routers/`

Owns API route definitions.

Responsibilities include:

* receiving HTTP requests
* validating inputs through schemas
* enforcing authentication/access requirements
* calling appropriate services
* returning defined response schemas

Routers should remain thin.

Business logic belongs in services or dedicated engines.

---

## `backend/app/services/`

Owns application-level business workflows.

Examples include:

* authentication service
* session service
* document service
* assistant service
* RAG service
* AI service

Services coordinate multiple operations while keeping route handlers focused.

---

## `backend/app/engines/`

Owns specialized computation and decision logic.

Major engines include:

### Focus Engine

Responsible for determining focus state and calculating focus-related behavior according to the approved rules.

### Relevance Engine

Responsible for classifying browser activity as relevant or distracting according to the MindGuard rules.

### Analytics Engine

Responsible for converting raw activity/session information into meaningful productivity metrics.

The engines should remain independent of HTTP-specific concerns.

---

## `backend/app/utils/`

Contains shared backend utilities and dependency helpers.

Utilities must remain generic and should not become a dumping ground for feature-specific business logic.

---

## `extension/`

Owns all Chrome browser monitoring and browser-side MindGuard behavior.

Responsibilities include:

* Manifest V3 configuration
* active tab detection
* website/page information collection
* activity aggregation
* tab-switch tracking
* idle detection
* communication with the backend
* active session discovery
* browser-side intervention behavior
* extension popup/status UI

The extension must not contain the application's primary database or business state.

The backend remains the authoritative source for study-session state.

---

## `docs/`

Contains project documentation that explains architecture, planning, implementation decisions, and review material.

Documentation must remain consistent with the actual approved architecture.

---

## `context/`

Contains the six-file AI development context system and implementation specifications.

Expected structure:

```text
context/
├── project-overview.md
├── architecture.md
├── code-standards.md
├── ai-workflow-rules.md
├── ui-context.md
├── progress-tracker.md
└── specs/
```

These files guide AI-assisted development and are not application runtime modules.

---

# Storage Model

## PostgreSQL

**PostgreSQL is the authoritative application database.**

It stores structured application data such as:

* users
* authentication-related user information
* study sessions
* session goals
* subjects
* session tasks
* browser activity summaries
* website activity metadata required by the product
* distraction events
* focus metrics
* session reports
* document metadata
* relationships between users, sessions, documents, and reports
* AI-generated structured insights where persistence is explicitly required

PostgreSQL runs through Docker for local development.

There must not be two competing primary application databases.

The previous MongoDB implementation in the prototype is not part of the final architecture.

---

## File Storage

Uploaded study materials and other large artifacts should be stored in file storage rather than directly inside PostgreSQL.

Examples include:

* uploaded PDFs
* uploaded documents
* other supported study-material files
* large generated artifacts where applicable

PostgreSQL stores the metadata and references required to manage those files.

The exact production file-storage provider is a separate implementation decision and must not be invented during unrelated units.

---

## Vector Storage

FAISS is used for semantic retrieval of study material when implementing the RAG-based AI Study Assistant.

Vector representations are derived from processed study material.

The vector index must remain associated with the correct document/material context.

The exact persistence mechanism for FAISS indexes must follow the relevant implementation specification.

---

## Cache

No separate cache is required for the Phase 1 architecture unless a specific performance requirement introduces one.

Do not add Redis or another caching system speculatively.

---

# Data Ownership

The backend owns authoritative application state.

The following principles apply:

* The frontend is not authoritative for session state.
* The Chrome extension is not authoritative for session state.
* The browser does not directly modify PostgreSQL.
* AI providers are not authoritative data stores.
* Analytics are derived from recorded session/activity information.
* The backend validates and processes data before persistence.

---

# Authentication and Access Model

## Authentication

KIKO AI uses JWT-based authentication.

The authentication flow is:

1. User registers.
2. Password is securely hashed using bcrypt.
3. User signs in.
4. Backend validates credentials.
5. Backend issues a JWT.
6. Client uses the JWT when accessing protected APIs.
7. Backend validates the token before processing protected requests.

Passwords must never be stored in plaintext.

---

## Ownership

User-owned resources must be associated with the authenticated user.

Examples include:

* study sessions
* session reports
* uploaded study materials
* AI learning data
* user-specific analytics

A user must not be able to access or mutate another user's private resources by changing an identifier in an API request.

---

## Access Control

Protected mutations must verify:

1. Authentication
2. Resource existence
3. Resource ownership or explicitly permitted access

Authorization must happen on the backend.

Frontend route protection is a usability/security layer, not a replacement for backend authorization.

---

# Study Session Architecture

A study session is the central unit connecting KIKO's learning and focus features.

A session contains information such as:

* user
* subject
* study goal
* planned duration
* tasks
* start time
* end time
* session state
* browser activity
* distraction events
* focus metrics
* final report
* AI-generated session insights

The session lifecycle is:

**Created → Active → Ended → Analyzed → Report Available**

The exact allowed state transitions must be enforced by the backend.

The Chrome extension associates browser activity with the currently active session.

---

# Chrome Extension Architecture

The Chrome extension uses **Manifest V3**.

Its high-level structure is:

```text
extension/
├── manifest.json
├── background/
│   └── service-worker.js
└── popup/
    ├── popup.html
    └── popup.js
```

Additional content scripts or modules may be introduced only when required by an approved specification.

## Service Worker

The background service worker is responsible for:

* monitoring active tabs
* tracking relevant browser state
* managing periodic activity collection
* discovering/maintaining the active KIKO session
* sending aggregated activity to the backend
* coordinating intervention state

## Popup

The popup provides lightweight extension controls/status such as:

* session status
* active study session information
* focus state
* relevant extension actions

The popup is not the primary KIKO application interface.

---

# Browser Activity Model

MindGuard requires browser signals that help determine whether the student is studying or becoming distracted.

Relevant signals may include:

* active website
* page title
* time spent
* tab switches
* idle time
* interaction activity
* YouTube video/page title when applicable

Activity should be aggregated periodically rather than sending every low-level browser event individually.

The system should collect only information required for the defined MindGuard functionality.

---

# MindGuard Architecture

MindGuard is KIKO AI's focus-monitoring and intervention subsystem.

## Phase 1 Detection

MindGuard V1 uses a **rule-based detection engine**.

It evaluates browser/activity signals and classifies activity into states such as:

* focused
* relevant
* mildly distracted
* distracted

The system should consider the student's current study goal when evaluating relevance.

Examples:

* An educational website relevant to the current subject may be classified as relevant.
* A YouTube tutorial whose title matches the current study topic may be considered relevant.
* Entertainment content may be classified as distracting.
* Unrelated social-media browsing may be classified as distracting.

The precise classification rules must be defined in the relevant feature specification.

---

# Smart Intervention Architecture

Intervention is triggered by the MindGuard state and configured thresholds.

The intervention philosophy is:

**Guide first, restrict only when necessary.**

The system should progress from lightweight interventions toward stronger interventions when repeated distraction is detected.

Example progression:

**Focused → No intervention**

**Mild distraction → Gentle reminder**

**Repeated distraction → Stronger warning / break suggestion**

**High/repeated distraction → Optional stronger intervention**

Intervention behavior must remain within the scope defined by the current specification.

The system must not silently introduce aggressive website blocking or surveillance behavior.

---

# Analytics Architecture

Analytics are derived from study-session and browser-activity data.

The analytics engine calculates metrics such as:

* total study duration
* focused time
* distraction time
* active time
* focus score
* longest uninterrupted focus period
* number of distraction events
* website activity
* session trends

A basic Phase 1 focus score may be represented as:

**Focus Score = Focused Time / (Focused Time + Distracted Time) × 100**

The final calculation must use the exact approved implementation specification.

Analytics should be derived from stored activity/session information rather than independently maintained conflicting values.

---

# Study Analysis Report

At the end of a session, KIKO AI produces a session analysis report containing relevant metrics such as:

* session duration
* focused time
* distraction time
* focus score
* websites visited
* distraction events
* focus timeline
* longest uninterrupted focus period
* notable behavior patterns

The report is generated from session/activity data processed by the backend analytics system.

---

# AI Architecture

KIKO AI uses an abstraction layer between application features and AI providers.

Conceptually:

```text
KIKO Feature
     ↓
AI Service Layer
     ↓
Groq Provider
     ↓
Groq API
```

Optional future provider support may follow:

```text
AI Service Layer
      ├── Groq Provider
      └── Optional Gemini Provider
```

Application features should not directly couple themselves to provider-specific implementation details.

---

# AI Feature Responsibilities

## Groq

Groq is the primary generative AI provider for Phase 1 features such as:

* summarization
* flashcard generation
* quiz generation
* AI tutoring
* study assistance
* session insights

The AI service layer handles provider communication.

---

## RAG System

The AI Study Assistant uses a retrieval-augmented architecture.

High-level flow:

```text
Study Material
      ↓
Text Extraction
      ↓
Chunking
      ↓
Embeddings
      ↓
FAISS Vector Search
      ↓
Relevant Context
      ↓
AI Model
      ↓
Grounded Response
```

The system should retrieve relevant content from the student's uploaded study material before generating context-dependent answers.

---

# AI Session Insights

After a study session ends:

1. Backend calculates structured session metrics.
2. Relevant session information is prepared for the AI service.
3. Groq receives the structured session context.
4. AI generates observations and recommendations.
5. KIKO displays the resulting insights to the user.
6. If persistence is required by the feature specification, the structured insight is stored with the session/report.

AI-generated content must not be treated as raw browser telemetry.

---

# Background Processing

Long-running or potentially expensive AI/document operations must not unnecessarily block normal HTTP request handling.

Where background processing is required, use the architecture defined by the relevant specification.

Do not introduce a task queue, worker framework, or message broker without an approved requirement.

Phase 1 should avoid unnecessary infrastructure complexity.

---

# API Architecture

The FastAPI backend exposes REST endpoints grouped by responsibility.

Current major API domains include:

```text
/api/auth/*
/api/sessions/*
/api/assistant/*
/api/documents/*
/api/dashboard/*
```

The exact endpoint contracts are defined by their corresponding feature specifications.

API flow:

```text
Client
  ↓
Router
  ↓
Schema Validation
  ↓
Authentication / Authorization
  ↓
Service
  ↓
Engine / Repository / AI Layer
  ↓
PostgreSQL or External Service
  ↓
Response Schema
  ↓
Client
```

Route handlers should remain thin and should not become repositories for business logic.

---

# Security Architecture

Security is applied across the system.

Core security requirements include:

* JWT authentication
* bcrypt password hashing
* backend authorization
* ownership validation
* HTTPS in production
* environment-based secret configuration
* restricted browser extension permissions
* controlled access to uploaded documents
* appropriate validation of uploaded files
* protection of sensitive application data

Security architecture must not expose private study or browser information unnecessarily.

---

# Blockchain Integrity Verification

Blockchain is a future/advanced component and is **not required for Phase 1 / Review 1**.

When implemented in a later phase, blockchain should be used for **integrity verification**, not as the primary storage mechanism for browser history or study data.

The intended conceptual flow is:

```text
Study Report
     ↓
SHA-256 Hash
     ↓
Blockchain Transaction
     ↓
Integrity Record
```

Only the minimum information required for verification should be written on-chain.

The intended future platform is compatible with a test network such as Polygon Amoy and a Solidity smart contract, subject to a future implementation specification.

Do not implement blockchain functionality as part of an unrelated Phase 1 unit.

---

# Deployment Architecture

The development environment uses Docker for PostgreSQL and related infrastructure.

The application consists of:

```text
React/Vite Frontend
        ↓
FastAPI Backend
        ↓
PostgreSQL
```

and:

```text
Chrome Extension
        ↓
FastAPI Backend
```

AI services are accessed externally through the configured AI provider.

Production deployment details are to be defined when deployment becomes an active implementation unit.

Do not introduce production infrastructure prematurely.

---

# Architectural Invariants

The following rules must never be violated.

### 1. PostgreSQL is the authoritative application database

The final system must not maintain MongoDB and PostgreSQL as competing primary databases.

### 2. Frontend never directly accesses the database

React must communicate with application data through defined backend APIs.

### 3. Chrome extension never directly accesses PostgreSQL

The extension communicates with the backend API.

### 4. Authentication is enforced at protected backend boundaries

A frontend route guard alone is never considered sufficient authorization.

### 5. Ownership must be verified before private resource mutation or access

A valid JWT does not automatically grant access to another user's resource.

### 6. Route handlers remain thin

Business logic belongs in services and specialized engines rather than large FastAPI route handlers.

### 7. AI provider details remain behind the AI service abstraction

Feature code should not be tightly coupled to provider-specific implementation when the abstraction is available.

### 8. MindGuard V1 remains rule-based

The Phase 1 implementation must not falsely represent rule-based detection as trained ML prediction.

### 9. Browser monitoring must remain within defined product scope

The extension must collect only the activity signals required by the approved MindGuard functionality.

### 10. Analytics must derive from authoritative session/activity data

The system must avoid maintaining contradictory versions of focus/distraction metrics.

### 11. Large files must not be stored directly in PostgreSQL unless explicitly required

File storage is used for large uploaded/generated artifacts, while PostgreSQL stores metadata and references.

### 12. Secrets must not be committed to source control

API keys, JWT secrets, database credentials, and other sensitive configuration must be supplied through environment configuration.

### 13. Context documentation must remain synchronized with architecture

If an implementation intentionally changes an architectural decision, the relevant context document must be updated before continuing development.

### 14. Phase scope must be respected

Future features must not be implemented inside Phase 1 units unless explicitly moved into scope.

### 15. No system boundary may silently assume responsibility belonging to another boundary

For example:

* frontend must not implement backend authorization,
* extension must not become the authoritative session database,
* routers must not become the analytics engine,
* AI providers must not become the application data store.

---

# Architectural Decision Principles

When a new technical decision is required:

1. Prefer the existing approved stack.
2. Prefer reuse over introducing another dependency.
3. Prefer the simplest architecture that satisfies the requirement.
4. Avoid speculative infrastructure.
5. Keep system boundaries explicit.
6. Record decisions that affect architecture or persistent data.
7. Update the appropriate context file before implementation continues.

The architecture should evolve deliberately rather than through accidental changes made during feature implementation.
