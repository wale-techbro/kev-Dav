# Torilo AI Student Assistant — Frontend

React/Vite student-facing chat interface for the Torilo Academy AI Student Assistant.

## Run locally

```bash
npm install
npm run dev
```

Set `VITE_API_URL` to the FastAPI origin when it is not `http://localhost:8000`.

The browser calls `POST /api/chat` with `message` and, when available, `conversation_id`. It renders only the backend-provided `answer` and safe citation fields from `sources`.

No model/API secrets belong in `VITE_*` variables.
