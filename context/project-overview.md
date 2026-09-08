# KIKO AI — Project Overview

## 1. Project Identity

**Project Name:** KIKO AI

**Meaning:**
**KIKO — Kickstart Your Focus Era with AI**

**Project Type:**
AI-powered intelligent study and productivity companion.

**Primary Goal:**
Help students learn effectively, maintain focus during study sessions, detect digital distractions, and understand their study behaviour through actionable analytics and AI-generated insights.

---

## 2. One-Line Product Description

KIKO AI is an intelligent study companion that combines AI-powered learning assistance, browser-based focus monitoring, distraction detection, smart interventions, and study analytics into one integrated platform.

---

## 3. Problem Statement

Students increasingly depend on the internet and digital devices for studying. While online resources provide enormous learning opportunities, the same environment also creates constant distractions.

Traditional productivity tools generally solve only one part of the problem:

* Website blockers restrict access without understanding context.
* Pomodoro timers track time but do not understand behaviour.
* AI study tools help students learn but do not monitor focus.
* Productivity dashboards show statistics but do not actively help students improve.
* Manual study tracking provides limited behavioural insight.

A student may therefore have multiple disconnected tools for learning, focus, time management, and productivity analysis.

KIKO AI aims to bring these capabilities together.

---

## 4. Proposed Solution

KIKO AI combines two major dimensions of studying:

### Learning

The AI Study Assistant helps students work with their study material by providing:

* Document upload
* Text extraction
* Summarization
* Important points
* Flashcards
* Quizzes
* MCQs
* Explanations
* AI tutoring
* Context-aware questions using the student's material

### Focus

MindGuard AI works during a study session to:

* Monitor browser activity through the Chrome extension
* Identify the currently active website/page
* Track time spent
* Observe tab switching and idle behaviour
* Determine whether activity appears relevant or distracting
* Provide smart interventions when distraction is detected
* Record behavioural data for later analysis

The objective is not simply to block websites.

The objective is to understand **whether the student's current digital activity supports the study goal**.

---

## 5. Product Vision

KIKO AI is designed around the following continuous study loop:

**Plan → Learn → Focus → Detect → Intervene → Analyze → Improve**

The long-term vision is for KIKO to become an intelligent study companion that understands a student's study context and helps them improve their learning and productivity over time.

KIKO should progressively move from simply reporting behaviour toward providing meaningful, personalized guidance.

---

## 6. Target Users

### Primary Users

Students who:

* Study using laptops or desktop computers
* Frequently use online resources
* Prepare for examinations
* Learn from PDFs, notes, presentations, and online tutorials
* Struggle with digital distractions
* Want measurable productivity feedback
* Want AI assistance while studying

### Example User

A student preparing for a DSA examination starts a 60-minute session with the goal:

> "Study Linked Lists and solve 5 practice problems."

During the session:

* A Linked List tutorial on YouTube is considered relevant.
* A documentation page related to Linked Lists is considered relevant.
* Frequent switching between unrelated websites is detected.
* Instagram or entertainment content is classified as distracting.
* KIKO provides an appropriate intervention.
* At the end of the session, KIKO calculates focus and distraction statistics.
* AI generates observations and recommendations.
* The student can then use the AI Study Assistant to summarize their notes, generate flashcards, or practice with a quiz.

This represents the intended integrated KIKO experience.

---

# 7. Core Product Modules

## 7.1 AI Study Assistant

The AI Study Assistant provides learning support using uploaded study material.

### Core capabilities

* Upload study documents
* Extract text
* Process and chunk content
* Generate embeddings
* Store/search document vectors
* Retrieve relevant context
* Generate AI responses
* Summarize material
* Generate important points
* Generate flashcards
* Generate quizzes
* Explain MCQ answers
* Answer questions through an AI tutor

### Technology direction

* Python
* FastAPI
* Groq as the primary AI provider
* Sentence Transformers
* FAISS
* RAG architecture

The AI provider is accessed through an AI service abstraction rather than being tightly coupled to individual application features.

---

## 7.2 MindGuard AI Focus Coach

MindGuard is KIKO's focus-monitoring and distraction-detection component.

It operates during an active study session.

### Responsibilities

* Receive browser activity information
* Associate activity with the active study session
* Evaluate relevance
* Track distraction events
* Maintain the current focus state
* Trigger intervention decisions

### Phase 1 approach

MindGuard V1 uses a **rule-based detection engine**.

Examples of signals include:

* Website category/relevance
* Page title
* Study goal
* Tab switching frequency
* Active interaction
* Idle time
* Duration on a website

The first implementation should establish a reliable baseline before introducing machine-learning-based prediction.

### Future direction

A lightweight ML-based focus classifier may later replace or augment the rule-based engine.

---

## 7.3 Chrome Extension

The Chrome extension acts as KIKO's browser-side monitoring component.

It is responsible for collecting relevant browser activity during an active study session.

### Monitored signals

Depending on browser permissions and implementation:

* Active tab
* Website/domain
* Page title
* Time spent
* Tab switching
* Idle time
* Interaction/activity signals

The extension periodically aggregates activity instead of sending every individual browser event to the backend.

### Architecture

The extension communicates with the KIKO backend.

It does not directly access the PostgreSQL database.

### Technology

* Chrome Manifest V3
* Service worker
* Chrome browser APIs
* Backend API communication

---

## 7.4 Smart Study Session

The Study Session provides the central context connecting KIKO's features.

A session contains information such as:

* Subject
* Study goal
* Duration
* Tasks
* Start time
* End time
* Session status

Once the session starts:

**Study Session → Chrome Extension → MindGuard → Analytics**

The session therefore becomes the primary unit for measuring and understanding study behaviour.

---

## 7.5 Smart Intervention

KIKO does not immediately block a website whenever potentially distracting behaviour occurs.

Instead, intervention should escalate according to the severity and persistence of distraction.

### Example intervention levels

**Focused**

No intervention.

**Mild distraction**

Provide a gentle reminder.

**Repeated distraction**

Suggest returning to the study goal or taking a short break.

**High/repeated distraction**

Provide a stronger warning or optional restriction where appropriate.

Possible actions include:

* Return to Study
* Take a Break
* Reminder notification
* Stronger warning
* Optional content/site restriction

The guiding principle is:

**Guide first, restrict only when necessary.**

---

## 7.6 Dashboard

The dashboard provides a quick overview of the student's study activity.

### Key metrics

* Today's Study Time
* Focus Score
* Distraction Time
* Sessions Completed

### Additional information

* Recent sessions
* Subject
* Study goal
* Duration
* Focus performance
* Start Study Session CTA

The dashboard is intended to answer:

> "How am I doing today?"

---

## 7.7 Analytics & Reports

KIKO records session behaviour and converts it into understandable productivity information.

### Session metrics

* Total duration
* Focused time
* Distraction time
* Active time
* Focus score
* Longest uninterrupted focus period
* Number of distraction events
* Websites visited

### Visual analysis

The session report may include:

* Focus timeline
* Website activity
* Distraction events
* Focus/distraction breakdown
* Session summary

### Behavioural observations

The system should identify useful patterns where sufficient data exists.

For example:

* Frequent distractions after a certain duration
* High tab-switching periods
* Websites associated with repeated distraction
* Strong focus periods
* Most productive study periods

---

## 7.8 AI Session Insights

After a session ends, structured session information can be passed to the AI service.

The AI generates:

* Observations
* Behavioural summary
* Personalized recommendations
* Suggestions for improving future sessions

The AI should receive structured session data rather than raw browser-event streams wherever possible.

AI insights are supplementary to deterministic analytics; the core metrics remain calculated by KIKO's analytics engine.

---

## 7.9 Security Layer

Security is a cross-cutting component of KIKO AI.

The platform is designed to use:

* JWT authentication
* Password hashing using bcrypt
* Authenticated API access
* User/session ownership checks
* Environment variables for secrets
* HTTPS in production
* Appropriate protection for sensitive report data

Sensitive information should not be unnecessarily exposed to the frontend, extension, or AI provider.

---

## 7.10 Blockchain Integrity Verification — Future

Blockchain is **not part of the core Review 1 implementation**.

The future concept is to provide integrity verification for finalized study reports.

The proposed approach is:

**Report → SHA-256 Hash → Blockchain Record**

Only the necessary verification information should be stored on-chain.

The blockchain should not be used to store:

* Browser history
* Raw study activity
* Personal study documents
* Sensitive user information

A future implementation may use Polygon Amoy and a Solidity smart contract.

---

## 7.11 AI Study Planner — Future

An advanced AI study planner is planned as a future capability.

Potential functionality includes:

* Exam preparation plans
* Topic prioritization
* Daily study schedules
* Progress-aware planning
* Adaptive recommendations

It is intentionally outside the Review 1 core scope.

---

# 8. Core Product Flow

The intended KIKO experience is:

```text
Landing Page
      ↓
Dashboard
      ↓
Start Study Session
      ↓
Define Study Goal
      ↓
Start Session
      ↓
Chrome Extension Activates
      ↓
Browser Activity Monitoring
      ↓
MindGuard Relevance Detection
      ↓
Smart Intervention if Required
      ↓
Continue Studying
      ↓
End Session
      ↓
Session Analytics
      ↓
Study Analysis Report
      ↓
AI Session Insights
      ↓
AI Study Assistant
```

The important architectural principle is that these are not independent features.

They form one continuous study workflow.

---

# 9. Review 1 Scope

Review 1 focuses on demonstrating the core KIKO experience.

## Must-Have Features

### 1. Landing Page

Demonstrate:

* KIKO identity
* Problem
* Solution
* Learn
* Focus
* Analyze
* Main CTA

### 2. Dashboard

Demonstrate:

* Study metrics
* Focus score
* Distraction time
* Completed sessions
* Recent sessions
* Start Study Session

### 3. Study Session

Demonstrate:

* Subject
* Goal
* Duration
* Tasks
* Session timer
* Start/end lifecycle

### 4. Chrome Extension

Demonstrate:

* Extension activation
* Active session detection
* Browser activity monitoring
* Activity communication with backend

### 5. MindGuard

Demonstrate:

* Relevant activity
* Distracting activity
* Rule-based classification
* Distraction events
* Focus state

### 6. Smart Intervention

Demonstrate:

* Gentle distraction warning
* Return to Study
* Take a Break
* Escalation for repeated distraction

### 7. Session Analytics

Demonstrate:

* Focused time
* Distraction time
* Focus score
* Websites visited
* Distraction events
* Focus timeline
* Longest focus period

### 8. AI Study Assistant

Demonstrate:

* Upload notes/PDF
* Summary
* Flashcards
* Quiz
* AI tutor

### 9. AI Session Insights

Demonstrate:

* Session data sent to AI service
* AI-generated observations
* Recommendations

---

# 10. Review 1 Demonstration Scenario

The recommended demonstration scenario is:

### Step 1 — Landing

Introduce KIKO as an AI-powered study companion.

### Step 2 — Dashboard

Show the student's current productivity overview.

### Step 3 — Start Session

Create a DSA session:

**Subject:** Data Structures & Algorithms

**Goal:** Study Linked Lists and solve practice problems.

**Duration:** 60 minutes.

### Step 4 — Focus Monitoring

Start the session.

The Chrome extension activates automatically.

### Step 5 — Relevant Activity

Open a Linked List tutorial or documentation.

MindGuard recognizes the activity as relevant to the study goal.

No warning is shown.

### Step 6 — Distraction

Open unrelated entertainment/social content.

MindGuard identifies the behaviour as potentially distracting.

KIKO displays an intervention.

### Step 7 — Return to Study

Return to the study material.

Focus state recovers.

### Step 8 — End Session

End the study session.

### Step 9 — Report

KIKO displays:

* Study duration
* Focused time
* Distraction time
* Focus score
* Website activity
* Distraction events
* Focus timeline

### Step 10 — AI Insight

KIKO generates observations and recommendations based on the session.

### Step 11 — Learning Assistance

Open the AI Study Assistant.

Upload Linked List notes.

Generate:

* Summary
* Flashcards
* Quiz
* AI tutor responses

This demonstrates that KIKO combines **learning + focus + analysis** rather than providing isolated utilities.

---

# 11. Product Differentiation

KIKO's primary differentiation is **context-aware productivity assistance**.

Traditional website blocking asks:

> "Is this website blocked?"

KIKO aims to ask:

> "Is this activity relevant to what the student is currently trying to study?"

For example, YouTube can contain both:

* A useful DSA lecture
* Completely unrelated entertainment

A simple website blocker may treat both identically.

KIKO uses the study goal, page information, activity behaviour, and session context to make a more meaningful relevance decision.

This does not mean KIKO can perfectly understand intent in Phase 1.

Instead, Phase 1 establishes a rule-based contextual baseline that can later evolve into ML-based detection.

---

# 12. Success Criteria

KIKO's Phase 1 implementation should be considered successful when the complete core flow works reliably:

```text
Start Session
      ↓
Extension Detects Session
      ↓
Browser Activity Collected
      ↓
MindGuard Classifies Activity
      ↓
Intervention Triggered When Needed
      ↓
Activity Stored
      ↓
Session Ends
      ↓
Analytics Calculated
      ↓
Report Generated
      ↓
AI Insight Generated
      ↓
AI Study Assistant Used
```

The system should also satisfy:

* Reliable session lifecycle
* Consistent frontend/backend communication
* PostgreSQL as the authoritative database
* Authenticated and ownership-aware APIs
* Stable extension communication
* Deterministic Phase 1 focus calculations
* Graceful AI failures
* Consistent UI
* No secrets committed to Git
* Testable core services
* Clear documentation

---

# 13. Constraints

The following constraints apply to the current project direction.

### Technology

* Frontend: React + Vite
* Styling: Tailwind CSS
* Backend: Python + FastAPI
* Database: PostgreSQL
* Database runtime: Docker
* ORM: SQLAlchemy
* Browser extension: Chrome Manifest V3
* AI provider: Groq primary
* Vector search: FAISS
* Embeddings: Sentence Transformers

### API Cost

KIKO should use free-tier or free-access APIs wherever possible.

### AI Architecture

Application features should use the AI service abstraction instead of directly depending on a specific provider.

### Focus Detection

Review 1 uses rule-based MindGuard detection.

### Product Scope

Only features required for the Review 1 demonstration should receive implementation priority.

### Platform

Desktop/browser-based experience is the primary target for the current phase.

---

# 14. Explicit Non-Goals for Review 1

The following should not become blockers for the first review:

* ML-based focus prediction
* Advanced personalization
* Full AI study planner
* Blockchain implementation
* Advanced encryption architecture
* Mobile application
* Institution/admin dashboard
* Cross-browser support
* Complex recommendation engine
* Production-scale infrastructure
* Large-scale distributed processing

These may be discussed under future scope.

---

# 15. Future Product Direction

After the Review 1 baseline is stable, KIKO can evolve toward:

### Intelligent Focus Prediction

Replace or augment rule-based detection with lightweight ML models.

### Adaptive Interventions

Learn which intervention style works best for a student.

### Personalized Study Planning

Generate and continuously adapt study plans.

### Long-Term Behaviour Analysis

Identify patterns across multiple sessions and weeks.

### Integrity Verification

Use blockchain-based hashes to verify finalized reports.

### Broader Platform Support

Potentially support additional browsers and platforms.

### Advanced Personalization

Adapt study recommendations according to:

* Study history
* Focus patterns
* Subject difficulty
* Session performance
* Learning progress

---

# 16. Product Principles

KIKO should follow these principles throughout development.

### 1. Learning and Focus Must Work Together

The AI assistant and focus coach should feel like parts of the same product.

### 2. Context Before Restriction

KIKO should understand the study context before deciding that behaviour is distracting.

### 3. Guide Before Blocking

Intervention should begin with guidance and escalate only when necessary.

### 4. Data Should Explain Behaviour

Analytics should help students understand their study habits, not merely display numbers.

### 5. AI Should Add Intelligence, Not Replace Deterministic Logic

Core metrics and rules should remain reliable and explainable.

### 6. Privacy Matters

Browser activity and study data should be collected only for the intended productivity functionality and handled securely.

### 7. Build Incrementally

The system should establish a reliable Phase 1 foundation before introducing advanced ML, blockchain, and personalization.

---

# 17. Final Product Definition

KIKO AI is not intended to be just:

* an AI chatbot,
* a website blocker,
* a Pomodoro timer,
* a study dashboard,
* or a document summarizer.

It is intended to be an integrated **AI study and focus companion**.

Its core loop is:

**Learn → Focus → Detect → Intervene → Analyze → Improve**

The Review 1 implementation establishes this foundation through a working combination of:

**AI Study Assistant + Study Sessions + Chrome Extension + MindGuard + Smart Intervention + Analytics + AI Insights.**

Advanced intelligence and verification capabilities can then be layered onto this foundation without changing the core product direction.

