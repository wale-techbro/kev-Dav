# Torilo Academy AI Student Assistant

## Phase 4 Implementation Plan: Group 4

**Group:** Frontend + Testing + Deployment  
**Repository:** `torilo-ai-student-assistant`  
**Branch:** `feature/frontend` for UI/integration work; coordinate test/deployment files with Group 4 lead  
**Phase:** Student-facing React/Vite interface  
**Status:** Implementation specification. Code blocks are reference implementations for the assigned frontend files; they are not applied to project source files by this plan.

This plan follows `torilo-ai-student-assistant/Torilo-capstone-project.md`, `Project_Implementation_Roadmap.md`, and the Group 3 API contract. It covers Group 4 only, with this installment focused on the React/Vite frontend paths requested. It does not modify backend business logic, database models/tools, LangGraph/RAG internals, or the original planning documents.

## 1. Goal and Non-Goals

Build a responsive, accessible chat interface that sends student messages to the FastAPI backend and renders only the backend's answer and citation sources. The frontend must not create or simulate assistant answers.

Required endpoint:

```http
POST /api/chat
Content-Type: application/json
```

Request:

```json
{
	"message": "What is the attendance policy?",
	"conversation_id": "optional-existing-id"
}
```

Response:

```json
{
	"answer": "Answer supplied by the backend assistant.",
	"sources": [],
	"conversation_id": "backend-issued-or-existing-id"
}
```

Scope includes the requested source paths:

```text
frontend/src/App.jsx
frontend/src/main.jsx
frontend/src/components/
frontend/src/pages/
frontend/src/services/
frontend/src/hooks/
frontend/src/utils/
frontend/src/styles/
```

### Explicit non-goals

* No mock response, prefilled assistant message, hard-coded policy, or local AI behavior.
* No changes to FastAPI, Group 2 orchestration, Group 1 RAG, or Group 3 database/business logic.
* No credentials, API tokens, or backend secrets in browser code.
* No persistence of student message history to local storage by default.
* No fabricated source cards when the server returns an empty source list.
* No changes to root/other groups' code to work around an API contract mismatch; coordinate the mismatch with the owning group.

## 2. Group 4 Ownership and Member Assignments

### Mr. David Olawale: Frontend Lead

Owns:

```text
frontend/src/App.jsx
frontend/src/components/ChatWindow.jsx
frontend/src/components/Message.jsx
frontend/src/components/InputBox.jsx
frontend/src/components/SourceCard.jsx
frontend/src/pages/Chat.jsx
frontend/src/pages/NotFound.jsx
```

Responsibilities:

* Own the chat layout and component composition.
* Keep the interface focused on student questions and backend-provided answers.
* Review responsive layout, keyboard navigation, and visual consistency.
* Coordinate API behavior with Oreoluwa and final branch review with Victor.

### Mr. Oreoluwa: Frontend/API Integration and UX

Owns:

```text
frontend/src/services/api.js
frontend/src/services/chatService.js
frontend/src/hooks/useChat.js
frontend/src/utils/formatResponse.js
frontend/src/utils/constants.js
frontend/src/components/SourceDisplay.jsx
frontend/src/components/Loading.jsx
frontend/src/components/ErrorMessage.jsx
frontend/src/components/Header.jsx
```

Responsibilities:

* Match the Phase 3 `/api/chat` request/response contract exactly.
* Manage conversation ID returned by the backend.
* Implement loading, network/API error, retry, and source-display states.
* Do not convert failed requests into assistant messages.

### Mr. Victor Oghenewiere: Testing and Deployment Lead

Owns the Group 4 coordination for:

```text
tests/
docker/
docs/testing.md
docs/deployment.md
```

Responsibilities for this frontend phase:

* Review and integrate frontend tests in the shared test strategy.
* Verify the production/development API base URL and deployment proxy contract.
* Run and record the frontend production build.
* Coordinate the Group 4 pull request into `develop` with the authorized lead.

The code examples in this plan only modify `frontend/src/`. Package/config/test/deployment files are shared or separately owned surfaces; coordinate before changing them.

## 3. UI and Data Flow

```text
Student types a question
	-> InputBox submits plain text
	-> useChat adds the user turn and enters loading state
	-> chatService calls POST /api/chat
	-> FastAPI returns answer, sources, conversation_id
	-> useChat appends the actual backend answer and updates conversation ID
	-> Message and SourceDisplay render backend-provided content
```

On request failure:

```text
API/network error -> preserve existing conversation -> show ErrorMessage
								 -> do not append an assistant answer -> allow retry
```

Initial page state must not include a fake assistant greeting. An empty conversation is an empty conversation. The header may identify the product, and the empty-state prompt may suggest example question categories only if they are clearly user prompts and not claims about available academy policy.

## 4. Frontend File Map

| File | Owner | Responsibility |
| --- | --- | --- |
| `src/main.jsx` | David Olawale | React root and global stylesheet imports |
| `src/App.jsx` | David Olawale | Page-level root rendering |
| `src/components/Header.jsx` | Oreoluwa | Product header |
| `src/components/ChatWindow.jsx` | David Olawale | Transcript list and scroll behavior |
| `src/components/Message.jsx` | David Olawale | User/assistant message presentation |
| `src/components/InputBox.jsx` | David Olawale | Accessible input and submit action |
| `src/components/SourceCard.jsx` | David Olawale | One backend-provided citation |
| `src/components/SourceDisplay.jsx` | Oreoluwa | Empty/list source rendering |
| `src/components/Loading.jsx` | Oreoluwa | Loading status |
| `src/components/ErrorMessage.jsx` | Oreoluwa | Non-fabricated network/API error and retry affordance |
| `src/pages/Chat.jsx` | David Olawale | Main page wiring UI to `useChat` |
| `src/pages/NotFound.jsx` | David Olawale | Unknown route fallback |
| `src/services/api.js` | Oreoluwa | HTTP client and response validation |
| `src/services/chatService.js` | Oreoluwa | Chat endpoint request/response adapter |
| `src/hooks/useChat.js` | Oreoluwa | Messages, loading, error, ID, send/retry state |
| `src/utils/formatResponse.js` | Oreoluwa | Safe normalization of backend answer/sources |
| `src/utils/constants.js` | Oreoluwa | API defaults and UI limits |
| `src/styles/index.css` | Oreoluwa | Reset, tokens, global focus and typography |
| `src/styles/chat.css` | David Olawale | Chat layout, transcript, messages, input, mobile rules |

## 5. API Configuration and Constants

### `frontend/src/utils/constants.js`

Use Vite's public environment variable. It is public browser configuration, not a secret. The backend API base URL defaults to `http://localhost:8000` in local development and must be set to the deployed API origin in deployment configuration.

```javascript
export const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000")
	.replace(/\/+$/, "");

export const CHAT_ENDPOINT = `${API_BASE_URL}/api/chat`;
export const MAX_MESSAGE_LENGTH = 8000;
export const CONVERSATION_ID_STORAGE_KEY = "torilo-chat-conversation-id";
```

Do not place `DATABASE_URL`, `OPENAI_API_KEY`, vector-store credentials, or any server secret in a `VITE_*` variable. Vite embeds public `VITE_*` values in built assets.

## 6. HTTP Client: `frontend/src/services/api.js`

```javascript
import { CHAT_ENDPOINT } from "../utils/constants";

export class ApiError extends Error {
	constructor(message, status = 0, code = "API_ERROR") {
		super(message);
		this.name = "ApiError";
		this.status = status;
		this.code = code;
	}
}

async function readJsonResponse(response) {
	const contentType = response.headers.get("content-type") || "";
	if (!contentType.toLowerCase().includes("application/json")) {
		throw new ApiError("The assistant service returned an invalid response.", response.status);
	}
	try {
		return await response.json();
	} catch {
		throw new ApiError("The assistant service returned an invalid response.", response.status);
	}
}

export async function postChat(payload, { signal } = {}) {
	let response;
	try {
		response = await fetch(CHAT_ENDPOINT, {
			method: "POST",
			headers: { "Content-Type": "application/json", Accept: "application/json" },
			body: JSON.stringify(payload),
			signal,
		});
	} catch (error) {
		if (error?.name === "AbortError") throw error;
		throw new ApiError("Could not reach the assistant service. Check the connection and try again.", 0, "NETWORK_ERROR");
	}

	const body = await readJsonResponse(response);
	if (!response.ok) {
		const message = typeof body?.detail === "string"
			? body.detail
			: "The assistant service could not complete the request.";
		throw new ApiError(message, response.status, "HTTP_ERROR");
	}
	return body;
}
```

The client displays safe `detail` strings returned by the API. The backend must ensure those details are non-sensitive. Never display HTML returned by the server as markup.

## 7. Chat Service: `frontend/src/services/chatService.js`

```javascript
import { postChat } from "./api";
import { normalizeChatResponse } from "../utils/formatResponse";

export async function sendChatMessage(message, conversationId, options = {}) {
	const payload = { message };
	if (conversationId) payload.conversation_id = conversationId;
	const response = await postChat(payload, options);
	return normalizeChatResponse(response);
}
```

On the first turn the conversation ID may be omitted. Every subsequent turn sends the last non-empty `conversation_id` returned by the server.

## 8. Response Validation: `frontend/src/utils/formatResponse.js`

```javascript
function normalizeSource(value) {
	if (!value || typeof value !== "object" || Array.isArray(value)) return null;
	const source = {
		title: typeof value.title === "string" ? value.title.trim() : "",
		document: typeof value.document === "string" ? value.document.trim() : "",
		section: typeof value.section === "string" ? value.section.trim() : "",
		page: Number.isInteger(value.page) && value.page > 0 ? value.page : null,
		source_type: typeof value.source_type === "string" ? value.source_type.trim() : "",
	};
	if (!source.title && !source.document) return null;
	return source;
}

export function normalizeChatResponse(value) {
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		throw new Error("The assistant service returned an invalid response.");
	}
	if (typeof value.answer !== "string" || !value.answer.trim()) {
		throw new Error("The assistant service returned an invalid response.");
	}
	if (!Array.isArray(value.sources) || typeof value.conversation_id !== "string" || !value.conversation_id.trim()) {
		throw new Error("The assistant service returned an invalid response.");
	}
	return {
		answer: value.answer.trim(),
		sources: value.sources.map(normalizeSource).filter(Boolean),
		conversationId: value.conversation_id.trim(),
	};
}
```

Only render citation-safe fields. Do not render retrieval scores, embeddings, internal approval flags, raw chunk content, or arbitrary server object properties. The answer is displayed as text, not interpreted as HTML.

## 9. Conversation Hook: `frontend/src/hooks/useChat.js`

This hook owns transient transcript state and conversation ID. A user turn is added immediately; the assistant turn is added only after a valid backend response. If a request fails, the user turn stays visible and the error state offers retry. The hook never invents or locally generates an assistant answer.

```javascript
import { useEffect, useRef, useState } from "react";

import { ApiError } from "../services/api";
import { sendChatMessage } from "../services/chatService";
import {
	CONVERSATION_ID_STORAGE_KEY,
	MAX_MESSAGE_LENGTH,
} from "../utils/constants";

function createMessage(role, content, extra = {}) {
	return {
		id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`,
		role,
		content,
		...extra,
	};
}

function readSavedConversationId() {
	try {
		return window.sessionStorage.getItem(CONVERSATION_ID_STORAGE_KEY) || "";
	} catch {
		return "";
	}
}

export function useChat({ service = sendChatMessage } = {}) {
	const [messages, setMessages] = useState([]);
	const [conversationId, setConversationId] = useState(readSavedConversationId);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [pendingMessage, setPendingMessage] = useState("");
	const activeRequest = useRef(false);

	useEffect(() => {
		try {
			if (conversationId) {
				window.sessionStorage.setItem(CONVERSATION_ID_STORAGE_KEY, conversationId);
			} else {
				window.sessionStorage.removeItem(CONVERSATION_ID_STORAGE_KEY);
			}
		} catch {
			// Session storage may be disabled; in-memory chat remains usable.
		}
	}, [conversationId]);

	async function submitMessage(rawMessage) {
		const message = typeof rawMessage === "string" ? rawMessage.trim() : "";
		if (!message || message.length > MAX_MESSAGE_LENGTH || activeRequest.current) return false;

		activeRequest.current = true;
		setError("");
		setPendingMessage(message);
		setMessages((current) => [...current, createMessage("user", message)]);
		setLoading(true);
		try {
			const result = await service(message, conversationId || null);
			setConversationId(result.conversationId);
			setMessages((current) => [
				...current,
				createMessage("assistant", result.answer, { sources: result.sources }),
			]);
			setPendingMessage("");
			return true;
		} catch (requestError) {
			const safeMessage = requestError instanceof ApiError
				? requestError.message
				: "The assistant could not process this request. Please try again.";
			setError(safeMessage);
			return false;
		} finally {
			activeRequest.current = false;
			setLoading(false);
		}
	}

	async function retryLastMessage() {
		if (!pendingMessage || loading) return false;
		// Remove the failed user bubble before retrying so it is not duplicated.
		setMessages((current) => current.slice(0, -1));
		return submitMessage(pendingMessage);
	}

	function startNewConversation() {
		if (loading) return;
		setMessages([]);
		setConversationId("");
		setPendingMessage("");
		setError("");
	}

	return {
		messages,
		conversationId,
		loading,
		error,
		submitMessage,
		retryLastMessage,
		startNewConversation,
	};
}
```

Implementation note: the app stores only the opaque conversation ID in `sessionStorage`, not chat content. If product privacy requirements prohibit even that, remove session storage and keep the ID in React state; subsequent turns in that tab still work.

## 10. Header: `frontend/src/components/Header.jsx`

```jsx
export default function Header({ onNewConversation, disabled = false }) {
	return (
		<header className="app-header">
			<a className="brand" href="/" aria-label="Torilo Academy Assistant home">
				<span className="brand-mark" aria-hidden="true">T</span>
				<span className="brand-name">Torilo Academy</span>
				<span className="brand-product">Student Assistant</span>
			</a>
			<button
				className="secondary-button"
				type="button"
				onClick={onNewConversation}
				disabled={disabled}
			>
				New conversation
			</button>
		</header>
	);
}
```

The heading identifies the interface without asserting that any policy/course details are available. The new conversation action clears the local transcript and conversation ID; it does not delete server-side records unless the backend later defines such an endpoint.

## 11. Message Component: `frontend/src/components/Message.jsx`

```jsx
import SourceDisplay from "./SourceDisplay";

export default function Message({ message }) {
	const isUser = message.role === "user";
	return (
		<article className={`message message-${isUser ? "user" : "assistant"}`}>
			<div className="message-meta">
				<span className="message-role">{isUser ? "You" : "Torilo Assistant"}</span>
			</div>
			<div className="message-body">{message.content}</div>
			{!isUser && <SourceDisplay sources={message.sources || []} />}
		</article>
	);
}
```

Rendering a React string as a child escapes markup. Do not use `dangerouslySetInnerHTML` for model/backend answers.

## 12. Source Card: `frontend/src/components/SourceCard.jsx`

```jsx
export default function SourceCard({ source }) {
	const title = source.title || source.document;
	const pageLabel = source.page ? `Page ${source.page}` : "";
	const details = [source.section, pageLabel].filter(Boolean).join(" · ");

	return (
		<li className="source-card">
			<span className="source-indicator" aria-hidden="true" />
			<span className="source-copy">
				<span className="source-title">{title}</span>
				{details && <span className="source-details">{details}</span>}
				{source.document && source.title && source.document !== source.title && (
					<span className="source-document">{source.document}</span>
				)}
			</span>
		</li>
	);
}
```

Do not turn a source path into a clickable URL unless the backend later provides a verified, authorized URL. Display citations as plain text in this phase.

## 13. Source List: `frontend/src/components/SourceDisplay.jsx`

```jsx
import SourceCard from "./SourceCard";

export default function SourceDisplay({ sources = [] }) {
	if (!Array.isArray(sources) || sources.length === 0) return null;
	return (
		<section className="source-display" aria-label="Sources">
			<h3 className="source-heading">Sources</h3>
			<ul className="source-list">
				{sources.map((source, index) => (
					<SourceCard
						key={`${source.document || source.title || "source"}-${source.page || ""}-${index}`}
						source={source}
					/>
				))}
			</ul>
		</section>
	);
}
```

An empty source array renders no source block; never make up a source label.

## 14. Loading State: `frontend/src/components/Loading.jsx`

```jsx
export default function Loading() {
	return (
		<div className="loading-status" role="status" aria-live="polite">
			<span className="loading-indicator" aria-hidden="true" />
			<span>Checking approved information…</span>
		</div>
	);
}
```

This describes the request state, not a promise that the backend will find an answer.

## 15. Error State: `frontend/src/components/ErrorMessage.jsx`

```jsx
export default function ErrorMessage({ message, onRetry, retryDisabled = false }) {
	if (!message) return null;
	return (
		<div className="error-message" role="alert">
			<p>{message}</p>
			{onRetry && (
				<button type="button" className="text-button" onClick={onRetry} disabled={retryDisabled}>
					Retry
				</button>
			)}
		</div>
	);
}
```

This component displays a safe API/network failure. It must not render an assistant message, source list, or invented answer for a failed request.

## 16. Input Component: `frontend/src/components/InputBox.jsx`

```jsx
import { useState } from "react";

import { MAX_MESSAGE_LENGTH } from "../utils/constants";

export default function InputBox({ onSubmit, loading = false }) {
	const [value, setValue] = useState("");
	const trimmed = value.trim();
	const canSend = trimmed.length > 0 && trimmed.length <= MAX_MESSAGE_LENGTH && !loading;

	function handleSubmit(event) {
		event.preventDefault();
		if (!canSend) return;
		onSubmit(trimmed);
		setValue("");
	}

	function handleKeyDown(event) {
		if (event.key === "Enter" && !event.shiftKey) {
			event.preventDefault();
			event.currentTarget.form?.requestSubmit();
		}
	}

	return (
		<form className="input-form" onSubmit={handleSubmit}>
			<label className="visually-hidden" htmlFor="chat-message">Ask a question</label>
			<textarea
				id="chat-message"
				name="message"
				value={value}
				onChange={(event) => setValue(event.target.value)}
				onKeyDown={handleKeyDown}
				placeholder="Ask a question about Torilo Academy"
				maxLength={MAX_MESSAGE_LENGTH}
				rows={1}
				disabled={loading}
				aria-describedby="input-hint input-count"
			/>
			<div className="input-footer">
				<span id="input-hint">Enter to send · Shift+Enter for a new line</span>
				<span id="input-count" aria-live="polite">{value.length}/{MAX_MESSAGE_LENGTH}</span>
				<button className="send-button" type="submit" disabled={!canSend} aria-label="Send message">
					<span aria-hidden="true">Send</span>
				</button>
			</div>
		</form>
	);
}
```

The composer prevents blank messages, enforces the API's 8,000-character maximum, submits on Enter, supports Shift+Enter, and disables while a request is pending.

## 17. Chat Transcript: `frontend/src/components/ChatWindow.jsx`

```jsx
import { useEffect, useRef } from "react";

import Loading from "./Loading";
import Message from "./Message";

export default function ChatWindow({ messages, loading }) {
	const bottomRef = useRef(null);

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
	}, [messages, loading]);

	return (
		<section className="chat-window" aria-label="Conversation">
			{messages.length === 0 ? (
				<div className="empty-state">
					<p className="empty-kicker">Student support</p>
					<h1>What would you like to know?</h1>
					<p>Ask a question. Answers and sources will come from the assistant service.</p>
				</div>
			) : (
				<div className="message-list" aria-live="polite" aria-relevant="additions text">
					{messages.map((message) => <Message key={message.id} message={message} />)}
				</div>
			)}
			{loading && <Loading />}
			<div ref={bottomRef} />
		</section>
	);
}
```

The empty state contains no assistant answer. It explains that replies come from the service and never asserts that a requested policy or record exists.

## 18. Main Chat Page: `frontend/src/pages/Chat.jsx`

```jsx
import ChatWindow from "../components/ChatWindow";
import ErrorMessage from "../components/ErrorMessage";
import Header from "../components/Header";
import InputBox from "../components/InputBox";
import { useChat } from "../hooks/useChat";

export default function Chat() {
	const {
		messages,
		loading,
		error,
		submitMessage,
		retryLastMessage,
		startNewConversation,
	} = useChat();

	return (
		<main className="app-shell">
			<Header onNewConversation={startNewConversation} disabled={loading} />
			<div className="chat-layout">
				<ChatWindow messages={messages} loading={loading} />
				<div className="composer-area">
					<ErrorMessage message={error} onRetry={retryLastMessage} retryDisabled={loading} />
					<InputBox onSubmit={submitMessage} loading={loading} />
					<p className="privacy-note">For official decisions, refer to the academy’s approved information.</p>
				</div>
			</div>
		</main>
	);
}
```

The note is a user-facing limitation reminder, not a fabricated answer. If the product team prefers less explanatory copy, remove it without changing behavior.

## 19. Not Found Page: `frontend/src/pages/NotFound.jsx`

```jsx
export default function NotFound() {
	return (
		<main className="not-found">
			<p className="empty-kicker">404</p>
			<h1>Page not found</h1>
			<a href="/">Return to the assistant</a>
		</main>
	);
}
```

## 20. Root Component: `frontend/src/App.jsx`

The app currently needs only a single chat page. Avoid adding a routing library until multiple real routes are required.

```jsx
import Chat from "./pages/Chat";
import NotFound from "./pages/NotFound";

export default function App() {
	return window.location.pathname === "/" ? <Chat /> : <NotFound />;
}
```

## 21. Browser Entry: `frontend/src/main.jsx`

```jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App";
import "./styles/index.css";
import "./styles/chat.css";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Missing #root mount element");

createRoot(rootElement).render(
	<StrictMode>
		<App />
	</StrictMode>,
);
```

The existing `frontend/index.html` already loads `/src/main.jsx`; keep it unless the frontend lead has a specific metadata/accessibility update to coordinate.

## 22. Global Styles: `frontend/src/styles/index.css`

```css
@import url("https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@500;600;700;800&display=swap");

:root {
	font-family: "DM Sans", "Segoe UI", sans-serif;
	color: #192723;
	background: #f2f5f1;
	font-synthesis: none;
	text-rendering: optimizeLegibility;
	--ink: #192723;
	--muted: #65736d;
	--line: #d8e0da;
	--surface: #ffffff;
	--surface-soft: #f7f9f6;
	--green: #176b50;
	--green-dark: #10543e;
	--green-pale: #e3f1e8;
	--coral: #b94f3b;
	--coral-pale: #fff0eb;
	--focus: #d28c31;
	--shadow: 0 18px 55px rgb(29 51 42 / 8%);
}

* { box-sizing: border-box; }

html { min-width: 320px; min-height: 100%; }

body {
	min-width: 320px;
	min-height: 100vh;
	margin: 0;
	background:
		radial-gradient(ellipse at 12% 8%, rgb(216 231 216 / 70%), transparent 35rem),
		linear-gradient(145deg, #f1f5ef 0%, #f6f5ef 52%, #eef3f3 100%);
}

button, textarea { font: inherit; }
button { color: inherit; }
button:focus-visible, a:focus-visible, textarea:focus-visible {
	outline: 3px solid var(--focus);
	outline-offset: 3px;
}

a { color: var(--green-dark); }

h1, h2, h3, p { margin-top: 0; }

.visually-hidden {
	position: absolute;
	width: 1px;
	height: 1px;
	overflow: hidden;
	clip: rect(0, 0, 0, 0);
	white-space: nowrap;
	clip-path: inset(50%);
}

@media (prefers-reduced-motion: reduce) {
	*, *::before, *::after {
		scroll-behavior: auto !important;
		animation-duration: 0.01ms !important;
		animation-iteration-count: 1 !important;
		transition-duration: 0.01ms !important;
	}
}
```

The font import is optional and requires network access; if offline builds or self-hosting are preferred, remove the import and provide approved local font assets. The fallback remains usable.

## 23. Chat Styles: `frontend/src/styles/chat.css`

```css
#root { min-height: 100vh; }

.app-shell {
	width: min(100% - 40px, 1160px);
	min-height: 100vh;
	margin: 0 auto;
	padding: 22px 0 28px;
	display: flex;
	flex-direction: column;
}

.app-header {
	min-height: 64px;
	display: flex;
	align-items: center;
	justify-content: space-between;
	border-bottom: 1px solid rgb(25 39 35 / 12%);
}

.brand { display: flex; align-items: center; gap: 11px; text-decoration: none; color: var(--ink); }
.brand-mark {
	width: 38px;
	aspect-ratio: 1;
	display: grid;
	place-items: center;
	border-radius: 11px;
	background: var(--green);
	color: white;
	font: 800 20px "Manrope", sans-serif;
}
.brand-name { font: 800 15px "Manrope", sans-serif; }
.brand-product { padding-left: 11px; border-left: 1px solid var(--line); color: var(--muted); font-size: 13px; }

.secondary-button, .send-button, .text-button {
	border: 0;
	cursor: pointer;
}
.secondary-button {
	min-height: 40px;
	padding: 0 14px;
	border: 1px solid var(--line);
	border-radius: 7px;
	background: rgb(255 255 255 / 72%);
	color: var(--ink);
	font-size: 13px;
	font-weight: 700;
}
.secondary-button:hover:not(:disabled) { border-color: var(--green); background: white; }
.secondary-button:disabled, .send-button:disabled, .text-button:disabled { cursor: not-allowed; opacity: .55; }

.chat-layout {
	width: min(100%, 900px);
	min-height: 0;
	flex: 1;
	margin: 28px auto 0;
	display: flex;
	flex-direction: column;
}

.chat-window {
	min-height: 300px;
	flex: 1;
	overflow-y: auto;
	padding: 28px clamp(16px, 5vw, 62px);
	border: 1px solid rgb(216 224 218 / 80%);
	border-bottom: 0;
	border-radius: 10px 10px 0 0;
	background: rgb(255 255 255 / 88%);
	box-shadow: var(--shadow);
}

.empty-state {
	min-height: 320px;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	text-align: center;
	animation: appear .42s ease-out both;
}
.empty-kicker { margin-bottom: 12px; color: var(--green); font-size: 12px; font-weight: 800; text-transform: uppercase; }
.empty-state h1, .not-found h1 {
	max-width: 600px;
	margin-bottom: 12px;
	font: 800 clamp(25px, 4vw, 38px) "Manrope", sans-serif;
}
.empty-state > p:last-child { max-width: 440px; margin-bottom: 0; color: var(--muted); line-height: 1.6; }

.message-list { display: flex; flex-direction: column; gap: 27px; }
.message { max-width: min(100%, 700px); animation: appear .25s ease-out both; }
.message-user { align-self: flex-end; width: min(88%, 640px); }
.message-assistant { align-self: flex-start; width: 100%; }
.message-meta { margin-bottom: 7px; color: var(--muted); font-size: 12px; font-weight: 700; }
.message-body {
	overflow-wrap: anywhere;
	white-space: pre-wrap;
	line-height: 1.65;
}
.message-user .message-body {
	padding: 13px 16px;
	border-radius: 10px 10px 2px 10px;
	background: var(--green-pale);
}
.message-assistant .message-body { padding: 2px 0; }

.source-display { margin-top: 17px; padding-top: 13px; border-top: 1px solid var(--line); }
.source-heading { margin-bottom: 9px; color: var(--muted); font-size: 11px; font-weight: 800; text-transform: uppercase; }
.source-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 230px), 1fr)); gap: 8px; padding: 0; margin: 0; list-style: none; }
.source-card {
	min-width: 0;
	display: flex;
	gap: 9px;
	padding: 10px 11px;
	border: 1px solid var(--line);
	border-radius: 6px;
	background: var(--surface-soft);
}
.source-indicator { width: 4px; flex: 0 0 4px; border-radius: 2px; background: var(--green); }
.source-copy { min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.source-title, .source-details, .source-document { overflow-wrap: anywhere; }
.source-title { font-size: 12px; font-weight: 800; }
.source-details, .source-document { color: var(--muted); font-size: 11px; }

.loading-status { display: flex; align-items: center; gap: 10px; padding: 14px 0; color: var(--muted); font-size: 13px; }
.loading-indicator {
	width: 15px;
	aspect-ratio: 1;
	border: 2px solid #cddbd1;
	border-top-color: var(--green);
	border-radius: 50%;
	animation: spin .8s linear infinite;
}

.composer-area {
	padding: 14px 18px 11px;
	border: 1px solid rgb(216 224 218 / 80%);
	border-top: 1px solid var(--line);
	border-radius: 0 0 10px 10px;
	background: white;
	box-shadow: var(--shadow);
}
.input-form { padding: 10px 12px 8px; border: 1px solid #cbd7ce; border-radius: 7px; background: white; }
.input-form:focus-within { border-color: var(--green); box-shadow: 0 0 0 2px rgb(23 107 80 / 12%); }
.input-form textarea {
	width: 100%;
	min-height: 42px;
	max-height: 180px;
	resize: vertical;
	border: 0;
	outline: 0;
	color: var(--ink);
	line-height: 1.5;
}
.input-form textarea::placeholder { color: #78847e; }
.input-form textarea:disabled { background: white; }
.input-footer { display: flex; align-items: center; gap: 12px; color: var(--muted); font-size: 11px; }
.input-footer > span:first-child { flex: 1; }
.send-button { min-width: 74px; height: 36px; padding: 0 13px; border-radius: 5px; background: var(--green); color: white; font-size: 12px; font-weight: 800; }
.send-button:hover:not(:disabled) { background: var(--green-dark); }
.privacy-note { margin: 9px 3px 0; color: var(--muted); font-size: 10px; line-height: 1.5; }

.error-message { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 10px; padding: 10px 12px; border-left: 3px solid var(--coral); border-radius: 3px; background: var(--coral-pale); color: #713224; font-size: 13px; }
.error-message p { margin: 0; line-height: 1.5; }
.text-button { padding: 7px 10px; border-radius: 4px; background: transparent; color: #713224; font-size: 12px; font-weight: 800; text-decoration: underline; }

.not-found { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px; text-align: center; }
.not-found a { font-weight: 700; }

@keyframes spin { to { transform: rotate(360deg); } }
@keyframes appear { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }

@media (min-height: 900px) {
	.app-shell { padding-top: 32px; }
	.chat-layout { margin-top: 42px; }
	.chat-window { padding-top: 38px; }
}

@media (max-width: 640px) {
	.app-shell { width: min(100% - 20px, 1160px); min-height: 100svh; padding: 8px 0 12px; }
	.app-header { min-height: 56px; }
	.brand { gap: 8px; }
	.brand-mark { width: 32px; border-radius: 9px; font-size: 17px; }
	.brand-name { font-size: 12px; }
	.brand-product { padding-left: 8px; font-size: 11px; }
	.secondary-button { min-height: 36px; padding: 0 9px; font-size: 11px; }
	.chat-layout { margin-top: 12px; }
	.chat-window { min-height: 260px; padding: 20px 15px; }
	.empty-state { min-height: 270px; }
	.empty-state h1 { font-size: 27px; }
	.message-list { gap: 21px; }
	.message-user { width: 94%; }
	.source-list { grid-template-columns: 1fr; }
	.composer-area { padding: 10px 9px 8px; }
	.input-form { padding: 8px; }
	.input-footer { gap: 7px; font-size: 10px; }
	.send-button { min-width: 62px; height: 34px; padding: 0 8px; }
	.privacy-note { font-size: 9px; }
}
```

## 24. Accessibility and Interaction Requirements

```text
[ ] All interactive controls are keyboard operable.
[ ] Textarea has a visible or programmatic label.
[ ] Focus indicator is visible for keyboard users.
[ ] Loading state uses role=status and polite announcement.
[ ] Request/API failure uses role=alert.
[ ] Send/new-chat controls have readable accessible names.
[ ] Text meets readable contrast against backgrounds.
[ ] UI remains usable at 320px wide and 200% browser zoom.
[ ] Reduced-motion preference disables decorative animation.
[ ] Backend answer is rendered as text, never HTML.
```

Do not make status depend on color alone. Keep button geometry stable while labels and disabled states change.

## 25. File Implementation Coverage Audit

The roadmap's Group 4 frontend assignments and the requested `frontend/src/` structure are covered in this plan:

```text
src/main.jsx
src/App.jsx
src/components/ChatWindow.jsx
src/components/Message.jsx
src/components/InputBox.jsx
src/components/SourceCard.jsx
src/components/SourceDisplay.jsx
src/components/Loading.jsx
src/components/ErrorMessage.jsx
src/components/Header.jsx
src/pages/Chat.jsx
src/pages/NotFound.jsx
src/services/api.js
src/services/chatService.js
src/hooks/useChat.js
src/utils/formatResponse.js
src/utils/constants.js
src/styles/index.css
src/styles/chat.css
```

`frontend/package.json`, `package-lock.json`, `vite.config.js`, `index.html`, and `public/favicon.svg` already establish the Vite app shell and are not rewritten by this plan. If package scripts, plugins, root HTML metadata, or deployment behavior need changes, David coordinates with Victor and reviews the exact diff first.

## 26. Frontend Test Plan and Group 4 Coordination

Victor owns shared test-suite integration. The following cases should be covered in frontend tests, using the test libraries already selected by Group 4 or coordinating package additions before editing `package.json`:

```text
Service tests:
- sends POST /api/chat with message and conversation_id when available
- omits conversation_id on a new conversation
- rejects non-JSON, non-2xx, and malformed payloads
- maps network failures to a readable error

Hook/page tests:
- user message appears before request completion
- backend answer appears only after a valid successful response
- conversation_id from response is sent on the next request
- request failure shows retry and does not create assistant answer
- retry reuses the failed message without duplicating the user bubble
- new conversation clears local transcript and ID
- concurrent submission is prevented while pending

Component tests:
- loading uses an announced status
- errors use role=alert
- sources render title/document/section/page only when provided
- empty sources do not produce invented source content
- input blocks blank and oversized messages and supports Enter/Shift+Enter
- answer content renders as text, not executable HTML

Build checks:
- npm run build succeeds
- built app can be previewed and makes requests to configured API base
```

### Example test outline

Use the team's existing React test stack; do not install a second test framework. Pseudocode for the API integration scenario:

```javascript
it("sends the returned conversation ID with the next turn", async () => {
	// Mock only the HTTP boundary, not an assistant response in application code.
	// First POST returns a backend-shaped response with conversation_id.
	// Second POST must carry that exact ID.
});

it("does not add an assistant message when the API rejects", async () => {
	// Reject the HTTP request, assert the user turn remains and an alert is visible.
	// Assert no assistant message was appended.
});
```

Network mocks are test infrastructure only; production code must always call the FastAPI endpoint.

## 27. Environment and API Setup

Add a local frontend variable in `frontend/.env.local` (untracked) or the team's approved environment mechanism:

```env
VITE_API_URL=http://localhost:8000
```

The backend's `FRONTEND_URL` controls CORS; local development commonly uses:

```env
FRONTEND_URL=http://localhost:5173
```

These values are origins, not credentials. `VITE_API_URL` is compiled into the browser bundle and must never contain a secret. In deployments where frontend and backend share an origin, configure the API base/proxy with Victor rather than hard-coding a production host in source.

## 28. Run the Frontend Development Server

From repository root:

```powershell
Set-Location frontend
npm install
npm run dev
```

The Vite server normally prints a local URL such as `http://localhost:5173/`. Keep the backend running separately at the configured API origin. Frontend requests will not work if FastAPI is stopped, CORS does not include the frontend origin, or `VITE_API_URL` points elsewhere; show the error state rather than substituting fake data.

## 29. Build and Preview the Frontend

### Production build

From the `frontend/` directory:

```powershell
npm run build
```

Vite writes the production bundle to `frontend/dist/`. A successful build confirms compile/bundle validity; it does not prove that the backend is reachable or that the API contract is correct.

### Preview the production bundle

```powershell
npm run preview
```

Open the URL printed by Vite. Verify the configured API base is the intended one for that build and run the manual checklist below. Environment values used with Vite are normally embedded at build time; rebuild after changing `VITE_API_URL`.

### Manual smoke checklist

```text
[ ] Page loads at desktop and narrow mobile viewport.
[ ] Initial state contains no fabricated assistant greeting.
[ ] Submit a real question; Network panel shows POST /api/chat.
[ ] Request JSON contains message and the current conversation_id when set.
[ ] Response answer is rendered verbatim as text.
[ ] Returned conversation_id is sent on the next turn.
[ ] Returned sources display only provided title/document/section/page.
[ ] Empty source list shows no source cards.
[ ] Network/API failure displays an error and retry; no fake answer appears.
[ ] New conversation clears transcript and sends no previous ID.
[ ] Enter sends; Shift+Enter inserts a newline.
[ ] Keyboard focus, screen-reader status and reduced motion behave correctly.
```

## 30. Group 4 Git Onboarding and Branch Workflow

The group feature branch is `feature/frontend`. Contributors use personal branches based on it when working in parallel. Group 4 does not push directly to `develop` or `main`; only the Group 4 lead, Mr. David Olawale, may authorize/perform the Group 4 integration PR merge, subject to repository protections and review policy. Victor coordinates build/test evidence and deployment readiness.

```text
main
└── develop
		├── feature/rag
		├── feature/langgraph
		├── feature/database
		├── feature/frontend  <-- Group 4 UI/integration
		└── feature/testing   <-- coordinate with Victor if separate
```

Clone and update:

```powershell
git clone https://github.com/Torilo-Academy-Capstone-Project/torilo-ai-student-assistant.git
Set-Location torilo-ai-student-assistant
git fetch origin --prune
git switch develop
git pull --ff-only origin develop
```

David creates/publishes `feature/frontend` once if it does not already exist:

```powershell
git switch develop
git pull --ff-only origin develop
git switch -c feature/frontend
git push --set-upstream origin feature/frontend
```

Contributors create their own branch:

```powershell
git fetch origin --prune
git switch feature/frontend
git pull --ff-only origin feature/frontend
git switch -c feature/frontend-your-name
git push --set-upstream origin feature/frontend-your-name
```

Stage only agreed frontend files:

```powershell
git status
git diff --check
git add frontend/src
git commit -m "feat(frontend): build backend-connected student chat"
git push
```

Open an individual PR into `feature/frontend`. The final reviewed PR direction is:

```text
base: develop
compare: feature/frontend
```

Only David leads/authorizes the merge to `develop`; if direct merge permission is unavailable, he requests an authorized maintainer to merge. Do not force-push shared branches or push frontend work to `main`.

## 31. Pull Request Checklist

```text
[ ] Changed files are limited to frontend/src/ unless shared changes were approved.
[ ] No fake AI answer, sample policy, fake source, or local assistant fallback exists.
[ ] Every assistant response is produced by POST /api/chat.
[ ] Request and response keys match the Phase 3 API contract.
[ ] Server-issued conversation_id is reused on later turns.
[ ] Empty/invalid API response is shown as an error, not an answer.
[ ] Source list uses only backend-provided citation fields.
[ ] Answers render as text; no dangerouslySetInnerHTML or arbitrary HTML.
[ ] Loading, error, retry, empty, and new-conversation states are covered.
[ ] Responsive layout, keyboard use, focus visibility, and reduced motion are checked.
[ ] VITE_API_URL has no secrets and defaults to local development API.
[ ] npm run build passes and output is recorded.
[ ] Frontend tests pass or coordinated test gaps are noted.
[ ] No Group 1/2/3 backend source files were changed.
[ ] PR has screenshots or manual smoke-check notes where required by team.
[ ] feature/frontend PR is reviewed and integrated to develop by David/authorized maintainer.
```

## 32. Group 4 Frontend Handoff Report

```text
Frontend lead:
- Mr. David Olawale

API integration owner:
- Mr. Oreoluwa

Frontend files implemented:
- ...

API contract:
- URL:
- Request fields:
- Response fields:
- VITE_API_URL configuration:

Conversation behavior:
- Initial ID behavior:
- Subsequent ID behavior:
- New conversation behavior:

States verified:
- Empty:
- Loading:
- Error/retry:
- Sources:
- Mobile/responsive:

Checks:
- npm install:
- npm run build:
- frontend tests:
- manual smoke test:

Known limitations / owners:
- ...
```

## 33. Definition of Done

```text
[ ] All requested frontend/src files have implementations consistent with local patterns.
[ ] Chat uses only the real FastAPI POST /api/chat endpoint for assistant responses.
[ ] No fake assistant text or fabricated source is shown in any state.
[ ] User/assistant messages render with clear roles and readable text.
[ ] Loading, error, retry, empty, and new conversation are implemented.
[ ] Conversation ID is passed through the backend lifecycle.
[ ] Backend-provided sources are displayed safely; missing sources remain absent.
[ ] Layout works at mobile and desktop widths and supports keyboard/screen reader use.
[ ] npm run build succeeds.
[ ] Group 4 tests/manual smoke checks are recorded.
[ ] No backend business logic or other group's implementation files were modified.
[ ] feature/frontend changes have a reviewed handoff to develop led by David/authorized maintainer.
```

## 34. Frontend Run and Build Summary

From repository root:

```powershell
Set-Location frontend
npm install
npm run dev
```

For the production bundle:

```powershell
npm run build
```

To serve that built bundle locally:

```powershell
npm run preview
```

The production build is `frontend/dist/`. Configure `VITE_API_URL` before building and ensure the FastAPI service allows the frontend origin through CORS. The frontend never supplies a mock answer if the backend is unavailable.

## 35. Docker and Deployment Integration Boundary

Victor owns the actual Docker, nginx, and deployment implementation. Keep the browser/API networking contract consistent with this frontend:

```text
Browser -> same-origin /api/chat proxy -> FastAPI
```

or set `VITE_API_URL` to a publicly reachable backend origin. Do not set it to a Docker service hostname such as `http://backend:8000`; that name is normally resolvable only between containers, not by the student's browser. If nginx proxies `/api` on the same origin, the frontend should use a coordinated same-origin API base and the Vite/deployment configuration must preserve that path.

Victor's deployment handoff must verify:

```text
[ ] frontend image runs `npm run build` and serves frontend/dist/.
[ ] browser requests reach the Group 3 POST /api/chat route.
[ ] nginx proxy or public API origin works from the browser network.
[ ] backend CORS allows only the configured deployed frontend origin when cross-origin.
[ ] VITE_API_URL is configured before build and contains no secrets.
[ ] no backend container hostname is exposed as a browser-only URL.
[ ] production build has been smoke-tested with the deployed API contract.
```

This plan provides the frontend build and API integration contract; it does not replace Victor's Docker/deployment implementation or docs.
