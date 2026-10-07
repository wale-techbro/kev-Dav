# Group 4 Frontend, Testing & Deployment Implementation Report

**Project:** Torilo AI Student Assistant  
**Scope:** Group 4 — Frontend, Testing, Evaluation & Deployment  
**Branch:** `group4/frontend-integration`  
**Target branch:** `develop`  
**Commit:** `b274b510` — merged Group 4 frontend integration  
**Commit status:** Merged into `develop`  
**Pull request:** #1 — `feat(group4): rebuild frontend against capstone specification`  
**Report date:** 2026-10-07

## 1. Executive summary

Group 4's Phase 4 frontend implementation has been completed and merged into the shared `develop` branch.

The implementation replaces the previous frontend placeholders/vibe-coded implementation with a React/Vite student-facing chat interface based on the Phase 4 implementation specification. The frontend is designed to consume the shared backend contract rather than generate, simulate, or fabricate assistant responses.

The implementation provides:

- A complete student-facing chat interface.
- Backend integration through `POST /api/chat`.
- Conversation ID handling.
- Loading, error and retry states.
- Safe rendering of backend-provided sources.
- Responsive and accessible UI components.
- Input validation and an 8,000-character message limit.
- Session-scoped conversation ID storage.
- Public frontend API configuration through `VITE_API_URL`.
- Basic frontend documentation and environment configuration.

The implementation changed 21 files, adding 518 lines and removing 19 lines. The Group 4 frontend PR was merged into `develop` as commit `b274b510`.

The original vibe-coded frontend was preserved separately in:

`backup/group5-vibecoded-frontend`

The current report distinguishes between completed frontend work and deployment/testing work that still requires validation against the integrated backend and deployment environment.

## 2. Scope and requirements addressed

The implementation follows the Group 4 boundaries defined for Phase 4:

- Build the user-facing student application.
- Connect the frontend to the backend API.
- Display backend-generated answers and citation sources.
- Provide loading and error states.
- Handle unsupported/failed requests without fabricating assistant responses.
- Maintain conversation IDs for follow-up requests.
- Support responsive and accessible interaction.
- Prepare the application for production deployment.
- Establish the frontend testing and evaluation structure.
- Keep backend business logic, database logic, RAG internals and LangGraph logic outside the frontend implementation.

The frontend does not create its own AI answer. It sends the student's message to the backend and renders the validated response returned by the assistant service.

## 3. Implementation steps

### Step 1 — Reviewed the Phase 4 implementation specification

The Group 4 implementation was based on the Phase 4 frontend plan and the broader capstone requirements.

The required frontend flow is:

```text
Student
   ↓
InputBox
   ↓
useChat
   ↓
POST /api/chat
   ↓
FastAPI backend
   ↓
Assistant / RAG / Database / Tools
   ↓
answer + sources + conversation_id
   ↓
useChat
   ↓
ChatWindow
```

The frontend is intentionally kept separate from backend reasoning, retrieval and database logic.

### Step 2 — Inspected the existing frontend

The original frontend contained placeholder files and a separate vibe-coded implementation.

Rather than modifying the backend or other groups' components to accommodate the frontend, the Group 4 branch was rebuilt around the agreed API contract.

The previous vibe-coded work was preserved in a backup branch:

```text
backup/group5-vibecoded-frontend
```

This preserves the original work while keeping the Group 4 implementation clean and reviewable.

### Step 3 — Implemented the React/Vite application shell

The application entry point was implemented through:

- `frontend/src/main.jsx`
- `frontend/src/App.jsx`
- `frontend/src/pages/Chat.jsx`
- `frontend/src/pages/NotFound.jsx`

The application mounts React through the Vite entry point and provides the chat page at `/`.

Unknown routes receive a dedicated not-found page.

### Step 4 — Implemented the chat components

The following components were implemented:

| Component | Responsibility |
|---|---|
| `Header.jsx` | Product identity and new-conversation control |
| `ChatWindow.jsx` | Conversation display and automatic scroll |
| `Message.jsx` | User/assistant message rendering |
| `InputBox.jsx` | Student message entry and submission |
| `Loading.jsx` | Assistant request loading state |
| `ErrorMessage.jsx` | Safe request failure and retry state |
| `SourceDisplay.jsx` | Source collection rendering |
| `SourceCard.jsx` | Individual citation/source display |

The components are intentionally small and composable so the UI can be tested independently.

### Step 5 — Implemented API integration

The frontend communicates with the backend through a dedicated service layer.

The browser sends:

```http
POST /api/chat
```

with:

```json
{
  "message": "What is the attendance policy?",
  "conversation_id": "optional-conversation-id"
}
```

The frontend expects the backend to return:

```json
{
  "answer": "Answer returned by the assistant.",
  "sources": [],
  "conversation_id": "conversation-id"
}
```

The frontend does not supply a fallback assistant answer when the API fails.

### Step 6 — Implemented conversation state

`useChat.js` owns the main chat state:

- transcript
- loading state
- error state
- conversation ID
- pending message
- retry behavior

The conversation ID is stored only in browser `sessionStorage`.

The transcript is not persisted to `localStorage` by default.

Starting a new conversation clears the current transcript and conversation ID.

### Step 7 — Implemented validation and safe source rendering

The frontend validates the response before displaying it.

Source rendering is restricted to citation-safe fields such as:

- title
- document
- section
- page
- source type

The UI does not intentionally expose:

- embeddings
- retrieval scores
- raw retrieval chunks
- internal flags
- backend implementation metadata

Assistant content is rendered as plain text rather than injected HTML.

### Step 8 — Implemented input and accessibility behavior

The chat input supports:

- Enter to send.
- Shift+Enter for a new line.
- Empty-message prevention.
- 8,000-character maximum.
- Disabled submission while a request is active.
- Accessible labels.
- Live status updates.
- Keyboard-friendly controls.
- Error alerts.
- Reduced dependence on visual-only indicators.

### Step 9 — Added public environment configuration

The frontend includes:

```text
frontend/.env.example
```

with:

```text
VITE_API_URL=http://localhost:8000
```

`VITE_*` variables are treated as public browser configuration.

No database credentials, LLM API keys, vector database credentials or other backend secrets belong in the frontend environment.

### Step 10 — Added frontend documentation

The frontend now contains a dedicated README explaining:

- what the frontend is
- how to install dependencies
- how to run the development server
- how to configure the API URL
- the expected `/api/chat` interaction
- the restriction against placing secrets in `VITE_*` variables

## 4. Frontend architecture

### Application structure

```text
frontend/
├── .env.example
├── README.md
├── index.html
├── package.json
├── vite.config.js
└── src/
    ├── App.jsx
    ├── main.jsx
    ├── components/
    │   ├── ChatWindow.jsx
    │   ├── ErrorMessage.jsx
    │   ├── Header.jsx
    │   ├── InputBox.jsx
    │   ├── Loading.jsx
    │   ├── Message.jsx
    │   ├── SourceCard.jsx
    │   └── SourceDisplay.jsx
    ├── hooks/
    │   └── useChat.js
    ├── pages/
    │   ├── Chat.jsx
    │   └── NotFound.jsx
    ├── services/
    │   ├── api.js
    │   └── chatService.js
    ├── styles/
    │   ├── chat.css
    │   └── index.css
    └── utils/
        ├── constants.js
        └── formatResponse.js
```

## 5. API contract

### `POST /api/chat`

The frontend uses the shared chat contract.

#### Request

```json
{
  "message": "Who teaches the Python course?",
  "conversation_id": "optional-client-conversation-id"
}
```

#### Response

```json
{
  "answer": "Answer returned by the configured assistant.",
  "sources": [],
  "conversation_id": "conversation-id-from-assistant"
}
```

The backend remains responsible for:

- question routing
- RAG
- database/tool use
- conversation reasoning
- LLM generation
- grounded answers
- source generation
- unknown-question handling
- prompt-injection handling

Group 4 only consumes and presents the resulting API response.

## 6. Error-handling behavior

The frontend follows the required failure behavior.

### Successful request

```text
User message
      ↓
Show user message
      ↓
Loading state
      ↓
Backend response
      ↓
Show assistant answer
      ↓
Show sources if provided
```

### Failed request

```text
User message
      ↓
Show user message
      ↓
Loading state
      ↓
Request fails
      ↓
Show error
      ↓
Do NOT create assistant message
      ↓
Allow retry
```

This prevents an API failure from being represented as a fabricated assistant answer.

## 7. Conversation behavior

A conversation ID is supplied to the backend when available.

The first request may omit the conversation ID:

```json
{
  "message": "What courses are available?"
}
```

The backend returns a conversation ID.

Subsequent requests use that ID:

```json
{
  "message": "Who teaches that course?",
  "conversation_id": "returned-id"
}
```

This allows follow-up questions to be associated with the same backend conversation.

Selecting **New conversation** clears the frontend transcript and session conversation ID.

## 8. Security and privacy decisions

The frontend does not contain:

- database passwords
- PostgreSQL URLs
- OpenAI/API provider secrets
- vector database credentials
- server-side authentication secrets
- private backend configuration

Only public browser configuration may be placed in `VITE_*` variables.

The frontend also avoids rendering raw backend HTML and does not expose internal retrieval metadata.

The conversation ID is treated as an opaque identifier and is not treated as an authentication credential.

## 9. Testing and evaluation plan

Group 4 owns application-level testing and evaluation.

The planned evaluation categories are:

1. Direct questions.
2. Paraphrased questions.
3. Follow-up questions.
4. Database questions.
5. Unknown questions.
6. Prompt-injection attempts.

The evaluation should record:

- total questions
- correct responses
- incorrect responses
- appropriate unknown responses
- retrieval accuracy
- hallucinations
- average response time

No final evaluation percentages or accuracy claims are made in this report until the integrated application has actually been tested.

## 10. Current verification status

### Completed

- Frontend source implementation completed.
- React/Vite application structure implemented.
- API service layer implemented.
- Chat state management implemented.
- Conversation ID handling implemented.
- Loading/error/retry states implemented.
- Source rendering implemented.
- Accessibility-oriented UI behavior implemented.
- Environment example added.
- Frontend README added.
- Group 4 branch pushed.
- Group 4 pull request reviewed.
- Pull request merged into `develop`.

### Not yet claimed as complete

The following require execution against the integrated application/deployment environment:

- `npm install` verification in the deployment environment.
- `npm run build` verification.
- End-to-end browser testing.
- Live `/api/chat` integration test.
- RAG/source display test with real Group 1 output.
- Database/tool question test with real Group 3 output.
- Follow-up conversation test with real Group 2 conversation handling.
- Unknown-question behavior test.
- Prompt-injection test.
- Production deployment verification.
- Production API/frontend connectivity.
- Response-time measurement.
- Final evaluation metrics.

This distinction is intentional: the capstone requires actual testing evidence rather than invented results.

## 11. Deployment responsibility

Group 4 owns deployment preparation and deployment validation.

The intended deployment flow is:

```text
GitHub
   ↓
develop
   ↓
Production frontend build
   ↓
React/Vite deployment
   ↓
VITE_API_URL
   ↓
FastAPI backend
   ↓
Group 1 RAG + Group 2 AI + Group 3 database/tools
```

The frontend is ready to receive the production API origin through `VITE_API_URL`.

### Deployment configuration still required

- Production API URL.
- Frontend hosting configuration.
- Production build verification.
- Backend CORS origin configuration.
- Environment variable configuration.
- Health/readiness verification.
- End-to-end production smoke test.
- Deployment documentation.
- Optional Docker/Compose deployment path where required by the final hosting environment.

The repository's current `docker-compose.yml` still requires completion for a full containerized deployment.

## 12. Git workflow

The Group 4 implementation was developed on:

```text
group4/frontend-integration
```

The original vibe-coded implementation was preserved on:

```text
backup/group5-vibecoded-frontend
```

The Group 4 pull request was:

```text
#1
feat(group4): rebuild frontend against capstone specification
```

Target:

```text
develop
```

Merged commit:

```text
b274b510
```

The `main` branch was not used as the working branch for the Group 4 implementation.

## 13. Files implemented

### Frontend application

| File | Work performed |
|---|---|
| `frontend/src/App.jsx` | Added application routing between chat and not-found views. |
| `frontend/src/main.jsx` | Added React/Vite application entry point. |
| `frontend/src/pages/Chat.jsx` | Composed the main student chat experience. |
| `frontend/src/pages/NotFound.jsx` | Added unknown-route handling. |

### UI components

| File | Work performed |
|---|---|
| `frontend/src/components/Header.jsx` | Added product header and new-conversation control. |
| `frontend/src/components/ChatWindow.jsx` | Added conversation display and automatic scrolling. |
| `frontend/src/components/Message.jsx` | Added user and assistant message rendering. |
| `frontend/src/components/InputBox.jsx` | Added validated chat input and keyboard submission. |
| `frontend/src/components/Loading.jsx` | Added accessible loading state. |
| `frontend/src/components/ErrorMessage.jsx` | Added error and retry UI. |
| `frontend/src/components/SourceDisplay.jsx` | Added conditional source collection rendering. |
| `frontend/src/components/SourceCard.jsx` | Added safe citation/source cards. |

### State and services

| File | Work performed |
|---|---|
| `frontend/src/hooks/useChat.js` | Added transcript, loading, errors, conversation ID and retry behavior. |
| `frontend/src/services/api.js` | Added API request handling and safe API errors. |
| `frontend/src/services/chatService.js` | Added chat request/response normalization. |
| `frontend/src/utils/constants.js` | Added frontend limits and configuration constants. |
| `frontend/src/utils/formatResponse.js` | Added response/source normalization. |

### Styling and configuration

| File | Work performed |
|---|---|
| `frontend/src/styles/index.css` | Added application-level styling. |
| `frontend/src/styles/chat.css` | Added chat-specific responsive styling. |
| `frontend/.env.example` | Added public API configuration example. |
| `frontend/README.md` | Added frontend setup and integration documentation. |

## 14. Known integration dependency

Group 4 depends on the other groups completing their respective handoffs.

The frontend does not replace missing backend functionality.

For production operation, the integrated system requires:

```text
Group 1
RAG + retrieval + source information
        ↓
Group 2
AI reasoning + LangGraph + conversation handling
        ↓
Group 3
FastAPI + PostgreSQL + database tools
        ↓
Group 4
Frontend + testing + deployment
```

The frontend is therefore considered **integration-ready**, but the complete system is only production-ready after the backend assistant runner, RAG, database and deployment environment have been connected and tested together.

## 15. Final Group 4 status

### Frontend

**Status: IMPLEMENTED**

The student-facing React/Vite interface has been rebuilt against the Phase 4 specification and merged into `develop`.

### API integration

**Status: IMPLEMENTED / INTEGRATION PENDING**

The frontend consumes the agreed `POST /api/chat` contract. Live verification depends on the integrated backend.

### Testing

**Status: TEST PLAN READY / EXECUTION PENDING**

The required evaluation categories and application failure states are defined. Final metrics must come from actual integrated testing.

### Deployment

**Status: PREPARATION / EXECUTION PENDING**

The frontend has production API configuration support, but final hosting, environment configuration, production build verification and end-to-end deployment checks remain.

## 16. Overall result

Group 4 has completed the core Phase 4 frontend implementation and integrated it into the shared `develop` branch.

The frontend now provides a functional foundation for the final Torilo AI Student Assistant system: students can enter questions, the application can send them to the backend, backend responses can be rendered with sources, conversation IDs can be maintained, and failures can be surfaced without fabricating assistant responses.

The remaining Group 4 work is the final integration cycle:

```text
Build
  ↓
Connect backend
  ↓
Run evaluation dataset
  ↓
Fix integration defects
  ↓
Production build
  ↓
Deploy
  ↓
End-to-end smoke test
  ↓
Document final results
```

Final accuracy, hallucination, retrieval and response-time metrics should only be added after the integrated application has been tested.
