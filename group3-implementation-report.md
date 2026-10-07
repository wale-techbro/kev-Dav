# Group 3 Backend Implementation Report

**Project:** Torilo AI Student Assistant  
**Scope:** Group 3 — PostgreSQL database, database tools, and FastAPI integration  
**Branch:** `group3/backend-integration`  
**Commit:** `390ea5e` — `feat(group3): implement database tools and chat API`  
**Commit status:** Pushed to `origin/group3/backend-integration`  
**Report date:** 2026-10-06

## 1. Executive summary

Group 3's backend implementation was completed according to the Phase 3 plan. The change adds a SQLAlchemy persistence layer for PostgreSQL, synthetic development seed fixtures, five read-only database tools, and a dependency-injected FastAPI API. The chat endpoint delegates to the assistant runner contract and validates its result; it does not create a fake or fallback assistant answer.

The implementation commit contains 23 files: 21 backend files and two dependency manifests. The frontend, Group 1 RAG source, and Group 2 AI/agent source files were not included in the commit.

## 2. Scope and requirements addressed

The implementation followed the Group 3 boundaries in the phase plan:

- Support PostgreSQL entities: students, courses, instructors, classes, and enrollments.
- Require database connection configuration from `DATABASE_URL`; do not embed credentials in Python source.
- Expose `get_available_courses()`, `get_course_details(course_id)`, `get_course_instructor(course_id)`, `get_active_classes()`, and `search_courses(query)` as injected database tools.
- Implement `POST /api/chat` with the request and response contract in the plan and delegate to `run_student_assistant(message, conversation_id)`.
- Include readiness and public course-catalogue endpoints described in the plan.
- Keep unauthenticated student-record lookup unavailable.
- Do not modify frontend files or Group 1/2 implementation files.

## 3. Implementation steps

### Step 1 — Reviewed the implementation specifications

Read `Project_Implementation_Roadmap.md`, `Torilo-capstone-project.md`, and `Phase3_Implementation_Plan.md`. The Phase 3 plan was used as the detailed implementation specification, particularly its entity relationships, tool return shapes, application lifecycle, error handling, and Group 1/2 API contracts.

### Step 2 — Inspected the existing project state

The Group 3 modules were placeholders, the PostgreSQL `schema.sql` used an older set of columns, dependency manifests had no runtime packages, and the shared API/database tests were placeholders. The Group 2 graph code was also placeholder code and did not yet provide the assistant functions needed for a live production integration. No frontend or Group 1/2 files were modified to work around that missing handoff.

### Step 3 — Implemented models and PostgreSQL schema

Added SQLAlchemy 2.x models and updated the SQL schema to cover the five required entities, their relationships, foreign keys, uniqueness rules, status and date checks, and query indexes. Model object serialization is avoided by having tools explicitly construct plain dictionaries.

### Step 4 — Added environment-based database setup and seed data

Implemented explicit engine and session-factory constructors. The database URL comes from `DATABASE_URL`, and PostgreSQL URL aliases are normalized to the psycopg SQLAlchemy driver. No global engine is created merely by importing the database package or API module.

Added synthetic `.invalid`-domain fixture records and an idempotent, transactional seed operation. The seeding utility merges records in foreign-key order and is explicitly for local development/test databases, not a migration mechanism or a production seed process.

### Step 5 — Implemented the read-only assistant tools

Added factories that receive a SQLAlchemy session factory and return callables with the exact no-session signatures the assistant is expected to consume. Queries use short-lived sessions, return JSON-friendly data, order and bound results where appropriate, and do not return student records or email addresses.

### Step 6 — Implemented FastAPI schemas, injection, and routes

Added Pydantic request/response models, app-state dependency accessors, a FastAPI application factory, and API routes. The app is configurable with injected assistant runner, tool mapping, session factory, and optional assistant initializer. Production engine creation occurs during application lifespan rather than module import.

`POST /api/chat` validates the request, calls the injected assistant runner once, validates the returned answer/sources/conversation ID, and returns the assistant result. Malformed results fail with a gateway error; there is no fabricated success response. Errors returned to clients avoid database exception text, secrets, and stack traces.

### Step 7 — Added dependencies, validated, and pushed

Declared runtime and development dependencies in the requirements files. Installed those packages in the workspace Python environment for verification, compiled the Group 3 modules, linted them, ran focused SQLite-backed smoke checks, and validated the current PostgreSQL DDL in a temporary schema transaction that was rolled back. Then committed and pushed the Group 3 file set to the existing Group 3 branch.

## 4. Database design and decisions

### Tables and relationships

| Model/table | Purpose and main relationships |
|---|---|
| `Instructor` / `instructors` | Instructor identity and active flag; an instructor can be associated with multiple courses/classes. |
| `Student` / `students` | Student identity and active flag; student records are private and are not exposed by the unauthenticated tool/API surface. |
| `Course` / `courses` | Course catalogue record, duration, level, active flag, optional instructor. A course has classes and enrollments. |
| `Class` / `classes` | A dated class occurrence associated with a course and optionally an instructor; status is constrained. |
| `Enrollment` / `enrollments` | Student-to-course association with optional class, status, and enrolled timestamp. A student/course pair is unique. |

### Database choices

- **SQLAlchemy 2.x synchronous sessions:** synchronous routes fit the synchronous assistant runner and database driver used by the plan. No blocking synchronous database work is placed in an `async def` route.
- **Environment-only connection URL:** `DATABASE_URL` is required at engine-construction time; there are no credentials embedded in the new Python implementation.
- **Explicit lifecycle:** application creation/import does not connect to PostgreSQL. The engine is created on lifespan startup and disposed during shutdown.
- **Schema versus migrations:** `schema.sql` is the reviewed PostgreSQL reference DDL. `Base.metadata.create_all()` is only used by the explicit local seed entry point and isolated tests; it is not represented as production migration tooling.
- **Synthetic fixtures:** sample names and `.invalid` emails clearly mark non-real records. The single sample class is planned rather than active, so fixtures do not claim a real live schedule.
- **Privacy:** student tools currently return an empty mapping. A conversation ID is not treated as authentication.

## 5. Database tools

`build_database_tools(session_factory)` composes the five tool callables for Group 2 without making a database connection during import.

| Tool | Behavior and result |
|---|---|
| `get_available_courses()` | Lists active courses, ordered by name and ID. Each result includes a stable string `course_id`, course name, description, level, duration, and optional instructor name. |
| `get_course_details(course_id)` | Returns one active course record, or `None` for malformed, missing, inactive, or non-positive IDs. |
| `get_course_instructor(course_id)` | Returns active-course instructor data as a plain dictionary, or `None` if there is no matching active course/instructor. |
| `get_active_classes()` | Lists only explicitly active classes whose course is active, with associated names, timestamps, location, and status. Timestamps are ISO formatted. |
| `search_courses(query)` | Performs bounded, case-insensitive substring matching on active course names. Blank/overlong inputs return an empty list; result count is capped at 20. The caller supplies a concise course phrase, not an entire natural-language question. |

The assistant-facing tools do not return student email or student rows. All database reads are issued through SQLAlchemy expressions rather than interpolated SQL strings.

## 6. HTTP API

### `POST /api/chat`

Request:

```json
{
  "message": "Who teaches the Python course?",
  "conversation_id": "optional-client-conversation-id"
}
```

`message` is required, whitespace is trimmed, and the accepted length is 1–8,000 characters. `conversation_id` is optional, trimmed, and limited to 128 characters. Extra request fields are rejected. An empty conversation ID becomes `null` before delegation.

The route delegates to the configured runner using the contract:

```python
run_student_assistant(message, conversation_id)
```

The runner must return a mapping with a non-empty `answer`, a list of source dictionaries, and a non-empty `conversation_id`. Response:

```json
{
  "answer": "Answer returned by the configured assistant.",
  "sources": [],
  "conversation_id": "conversation-id-from-assistant"
}
```

The API does not supply the answer text itself, query the database directly to answer chat questions, or substitute a default if the assistant is not configured.

### Other routes

- `GET /api/health` executes `SELECT 1` and returns `{"status":"healthy","database":"healthy"}` when PostgreSQL is reachable. It is a readiness check, not a liveness-only probe.
- `GET /api/courses` returns validated active course records via the injected `get_available_courses` tool.
- `GET /api/courses/{course_id}` returns one validated active course or 404 if absent/inactive.
- FastAPI exposes generated OpenAPI documentation at `/docs` and `/openapi.json` when running in development.

### Dependency injection and error behavior

The route dependencies access services from the application state and can be overridden in tests. `create_app(...)` accepts an assistant runner, database tools, a session factory, an optional assistant initializer, and CORS origins.

The API returns safe errors: invalid requests are 422; unavailable assistant/data dependencies are 503; malformed assistant output is 502; missing courses are 404; unexpected exceptions receive a generic 500 response. Database and unexpected failures are logged as generic event names without raw exception details.

## 7. Files implemented in the pushed commit

### `backend/database/`

| File | Work performed |
|---|---|
| [backend/database/database.py](../backend/database/database.py) | Added required-`DATABASE_URL` engine construction, PostgreSQL URL normalization, session-factory creation, and a closing session generator. |
| [backend/database/models.py](../backend/database/models.py) | Added `Base`, `Instructor`, `Student`, `Course`, `Class`, and `Enrollment` SQLAlchemy models, typed columns/relationships, constraints, and indexes. |
| [backend/database/schema.sql](../backend/database/schema.sql) | Replaced the previous schema with matching PostgreSQL DDL for the five models, foreign keys, checks, uniqueness constraints, and indexes. |
| [backend/database/seed.py](../backend/database/seed.py) | Added JSON fixture validation, timezone-aware datetime parsing, foreign-key-ordered idempotent merging, rollback behavior, and a local development CLI entry point. |
| [backend/database/seed_data/students.json](../backend/database/seed_data/students.json) | Added one synthetic student fixture using an `.invalid` email. |
| [backend/database/seed_data/courses.json](../backend/database/seed_data/courses.json) | Added two synthetic active-course fixtures linked to instructors. |
| [backend/database/seed_data/instructors.json](../backend/database/seed_data/instructors.json) | Added two synthetic instructor fixtures using `.invalid` emails. |
| [backend/database/seed_data/classes.json](../backend/database/seed_data/classes.json) | Added one synthetic planned class; this does not create a fake active class. |
| [backend/database/seed_data/enrollments.json](../backend/database/seed_data/enrollments.json) | Added a synthetic enrollment linked to the sample student, course, and class. |

The `backend/database/__init__.py` and migrations marker already existed and required no change.

### `backend/tools/`

| File | Work performed |
|---|---|
| [backend/tools/__init__.py](../backend/tools/__init__.py) | Added `build_database_tools(session_factory)` composition for the stable Group 2 allowlist. |
| [backend/tools/course_tools.py](../backend/tools/course_tools.py) | Added active-course listing and course-detail tool factories plus explicit public dictionary formatting. |
| [backend/tools/instructor_tools.py](../backend/tools/instructor_tools.py) | Added active-course instructor lookup factory. |
| [backend/tools/class_tools.py](../backend/tools/class_tools.py) | Added active-class lookup and ISO timestamp serialization. |
| [backend/tools/search_tools.py](../backend/tools/search_tools.py) | Added bounded case-insensitive course-name search with active-only filtering and a 20-result maximum. |
| [backend/tools/student_tools.py](../backend/tools/student_tools.py) | Explicitly disabled student-record tools until authorization is designed and approved. |

### `backend/api/`

| File | Work performed |
|---|---|
| [backend/api/main.py](../backend/api/main.py) | Added injectable FastAPI app factory, delayed engine/session setup, app lifespan cleanup, CORS from configured frontend origins, route registration, and production service initialization hook. |
| [backend/api/routes.py](../backend/api/routes.py) | Added chat delegation/response validation and active course list/detail routes. |
| [backend/api/schemas.py](../backend/api/schemas.py) | Added Pydantic request, response, source, health, error, and course schemas with bounds and extra-field policy. |
| [backend/api/dependencies.py](../backend/api/dependencies.py) | Added injectable accessors for assistant runner, tool map, session factory, and request-scoped DB sessions. |
| [backend/api/errors.py](../backend/api/errors.py) | Added safe validation/database/unexpected error handlers with generic public responses. |
| [backend/api/health.py](../backend/api/health.py) | Added PostgreSQL readiness check route. |

`backend/api/__init__.py` already existed and required no change.

### Dependency manifests

| File | Work performed |
|---|---|
| [requirements.txt](../requirements.txt) | Declared FastAPI, Uvicorn, SQLAlchemy 2.x, psycopg 3, Pydantic 2, and python-dotenv runtime dependencies. |
| [requirements-dev.txt](../requirements-dev.txt) | Declared httpx, pytest, and Ruff development/test dependencies. |

## 8. Verification performed

The following checks were performed after implementation:

1. **Python compilation:** `python -m compileall -q backend/database backend/tools backend/api` completed successfully.
2. **Lint:** `ruff check backend/database backend/tools backend/api` passed with “All checks passed!”. The first lint runs found import ordering/style issues; these were corrected and lint rerun.
3. **Editor diagnostics:** no errors were reported for the changed database, tool, or API directories; Python syntax validation found no syntax errors.
4. **Tool/API smoke checks:** executed against an isolated in-memory SQLite database. Verified active-course filtering, detail lookup including malformed IDs, instructor lookup, active-class filtering, bounded search, chat delegation and return payload, request validation, readiness response, course list/detail and 404 behavior, and malformed assistant response rejection.
5. **Seed idempotency:** seeded the isolated SQLite database twice and verified the same row counts remained: 2 instructors, 1 student, 2 courses, 1 class, and 1 enrollment.
6. **PostgreSQL DDL check:** executed the new schema in a temporary PostgreSQL schema inside a transaction, confirmed that all five tables were created, then rolled the transaction back. No persistent test schema was left by this check.
7. **Whitespace check:** `git diff --check` passed.
8. **Repository pytest command:** `pytest -q` reported “no tests ran” and exit code 5 because the current shared test files are placeholders. Therefore, this report does not claim that a repository pytest suite passed.

The focused API checks emitted a Starlette deprecation notice regarding using `httpx` with the currently installed `TestClient`. The checks themselves passed. This notice is dependency/tooling compatibility information, not an API assertion failure.

## 9. Group 2 integration status and known limitation

The pushed Group 3 code expects the Group 2 public interface `run_student_assistant(message, conversation_id)` and its startup configuration (`configure_assistant`). During implementation, `backend/agents/graph.py` and related Group 2 modules remained placeholders; a search found no implementation of those symbols. To respect the request to implement Group 3 only, those files were not edited.

As a result:

- The app can be constructed and tested with injected services without production credentials or a Group 2 implementation.
- Production startup with the default composition still depends on Group 2 implementing the runner/configuration and the combined RAG/LLM setup succeeding.
- A missing assistant is surfaced as service unavailability; no mock or synthetic final assistant response is generated.

The PostgreSQL DDL was validated against the local PostgreSQL container, but the smoke tests for the API and ORM/tools used SQLite. This was intentional to keep the focused checks isolated and repeatable. PostgreSQL migrations and production deployment configuration remain outside the Group 3 code changes.

## 10. Commit, push, and workspace status

The implementation commit is:

```text
390ea5e feat(group3): implement database tools and chat API
```

It was pushed to:

```text
origin/group3/backend-integration
```

At the last status check, the branch was aligned with its remote tracking branch. The local working tree also had unrelated changes that were not included in the commit: a deleted `Torilo-capstone-project.md`, modifications to `docker-compose.yml` and `docker/docker-compose.dev.yml`, and an untracked oddly named root file (`e tools and chat API`). These local changes are outside the Group 3 implementation commit and should be reviewed separately; do not discard them without confirming their purpose.

## 11. Overall result

The Group 3 deliverables for PostgreSQL schema/models, synthetic seeding, safe database tools, and dependency-injected FastAPI routes have been implemented, verified with focused checks, committed, and pushed. The main handoff needed to make production chat operational is completion/configuration of Group 2's real assistant runner and its RAG/LLM integrations. Group 4 should add durable automated tests for the database and API contracts as part of its test-suite ownership.
