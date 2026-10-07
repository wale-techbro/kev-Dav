# Torilo Academy AI Student Assistant

## Phase 1 Implementation Plan: Group 1

**Group:** Knowledge Base + RAG  
**Repository:** `torilo-ai-student-assistant`  
**Phase:** Foundation and first retrieval handoff  
**Status:** Implementation specification; the code in this document is a plan and must be copied into the assigned project files during implementation.

This plan is based on `Project_Implementation_Roadmap.md` and `Torilo-capstone-project.md`. It covers only Group 1 work. It does not implement LangGraph, prompts, database tools, FastAPI, frontend behavior, or production deployment.

## 1. Phase 1 Goal

Build a small, testable RAG subsystem that transforms approved academy documents into searchable chunks and exposes one stable handoff function:

```python
retrieve_documents(query: str) -> dict[str, list]
```

The required result shape is:

```python
{
	"context": [
		{
			"content": "...",
			"metadata": {
				"document": "attendance_policy.pdf",
				"title": "Torilo Academy Attendance Policy",
				"section": "Attendance Requirements",
				"page": 3,
				"source_type": "policy"
			},
			"score": 0.91
		}
	],
	"sources": [
		{
			"document": "attendance_policy.pdf",
			"title": "Torilo Academy Attendance Policy",
			"section": "Attendance Requirements",
			"page": 3,
			"source_type": "policy",
			"score": 0.91
		}
	]
}
```

The implementation must never create academy facts. It may index only files that are present in `knowledge_base/` and marked `approved: true` in `knowledge_base/index.json`.

## 2. Ownership and File Map

### Godspower Nduka: Knowledge Base Lead

Owns:

```text
knowledge_base/policies/
knowledge_base/student/
knowledge_base/courses/
knowledge_base/support/
knowledge_base/index.json
```

Responsibilities:

* Obtain approved documents or clearly label synthetic development documents.
* Keep the four category directories and filenames stable.
* Maintain `index.json` as the source-of-truth registry.
* Confirm every indexed path is inside `knowledge_base/`.
* Never commit private student data, credentials, or unapproved academy claims.

### Miss Greatness: Document Processing Engineer

Owns:

```text
backend/rag/document_loader.py
backend/rag/text_extractor.py
backend/rag/cleaner.py
```

Responsibilities:

* Discover indexed documents.
* Extract text from PDF, DOCX, TXT, and Markdown files.
* Preserve page numbers when the source format provides them.
* Preserve document identity and headings.
* Return explicit, actionable errors for unsupported or unreadable files.

### Mr. Patrick Olalekan Akinsete: Chunking and Metadata Engineer

Owns:

```text
backend/rag/chunker.py
backend/rag/metadata.py
backend/rag/document_schema.py
```

Responsibilities:

* Define the stable document and chunk models.
* Split cleaned text without losing source metadata.
* Preserve title, category, section, page, and source type.
* Keep chunk IDs deterministic for repeatable ingestion.

### Mr. Bright: Embeddings and Retrieval Engineer

Owns:

```text
backend/rag/embeddings.py
backend/rag/vector_store.py
backend/rag/retriever.py
backend/rag/rag_pipeline.py
backend/rag/ingestion.py
```

Responsibilities:

* Provide an embedding interface independent of a vendor.
* Provide a replaceable vector-store interface.
* Implement ingestion and retrieval orchestration.
* Return ranked chunks and source metadata.
* Make no-answer behavior explicit when the evidence is insufficient.

## 3. Required Phase 1 Deliverables

```text
[ ] knowledge_base/index.json is valid and reviewed.
[ ] Approved documents are present, or missing documents are recorded clearly.
[ ] Document, chunk, metadata, embedding, and retrieval contracts are typed.
[ ] TXT/MD ingestion works without external services.
[ ] PDF/DOCX extraction is supported through optional dependencies.
[ ] Development retrieval works with deterministic local embeddings.
[ ] Vector storage can be replaced without changing the retriever API.
[ ] `retrieve_documents(query)` returns context and sources.
[ ] Empty, unknown, and unsafe queries do not produce invented academy facts.
[ ] Re-ingestion produces stable chunk IDs and no duplicate records.
[ ] Group 1 handoff notes are ready for Group 2.
```

## 4. Knowledge Base Contract

The Phase 1 registry should use this shape. Do not add real or synthetic policy content here unless it has been approved by the Knowledge Base Lead.

### `knowledge_base/index.json`

```json
[
  {
	"document": "policies/attendance_policy.pdf",
	"title": "Torilo Academy Attendance Policy",
	"category": "policies",
	"source_type": "policy",
	"approved": true
  },
  {
	"document": "policies/payment_policy.pdf",
	"title": "Torilo Academy Payment Policy",
	"category": "policies",
	"source_type": "policy",
	"approved": true
  },
  {
	"document": "policies/refund_policy.pdf",
	"title": "Torilo Academy Refund Policy",
	"category": "policies",
	"source_type": "policy",
	"approved": true
  },
  {
	"document": "policies/assessment_policy.pdf",
	"title": "Torilo Academy Assessment Policy",
	"category": "policies",
	"source_type": "policy",
	"approved": true
  },
  {
	"document": "student/student_handbook.pdf",
	"title": "Torilo Academy Student Handbook",
	"category": "student",
	"source_type": "handbook",
	"approved": true
  },
  {
	"document": "student/conduct_policy.pdf",
	"title": "Torilo Academy Conduct Policy",
	"category": "student",
	"source_type": "policy",
	"approved": true
  },
  {
	"document": "courses/course_information.pdf",
	"title": "Torilo Academy Course Information",
	"category": "courses",
	"source_type": "course_information",
	"approved": true
  },
  {
	"document": "support/faq.pdf",
	"title": "Torilo Academy Frequently Asked Questions",
	"category": "support",
	"source_type": "faq",
	"approved": true
  },
  {
	"document": "support/support_procedures.pdf",
	"title": "Torilo Academy Support Procedures",
	"category": "support",
	"source_type": "support_procedure",
	"approved": true
  }
]
```

If the PDF files are not yet available, use an empty array instead of inventing content. Do not create fake PDFs as part of this phase. A registry entry must not be considered usable unless its file exists.

## 5. Shared Data Contracts

The following code is the contract all four members must follow. The canonical implementation belongs in `backend/rag/document_schema.py` and `backend/rag/metadata.py`.

### `backend/rag/document_schema.py`

```python
"""Typed models shared by document processing and retrieval."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass(frozen=True, slots=True)
class DocumentMetadata:
	"""Source information that must survive every RAG pipeline stage."""

	document: str
	title: str
	category: str
	source_type: str
	section: str | None = None
	page: int | None = None
	approved: bool = False

	def as_dict(self) -> dict[str, Any]:
		return {
			"document": self.document,
			"title": self.title,
			"category": self.category,
			"source_type": self.source_type,
			"section": self.section,
			"page": self.page,
			"approved": self.approved,
		}


@dataclass(frozen=True, slots=True)
class ExtractedPage:
	"""Text extracted from one logical source page."""

	text: str
	page: int | None = None


@dataclass(frozen=True, slots=True)
class LoadedDocument:
	"""A registry-approved document before text extraction."""

	path: str
	metadata: DocumentMetadata


@dataclass(frozen=True, slots=True)
class CleanDocument:
	"""Clean text with source metadata preserved."""

	text: str
	metadata: DocumentMetadata


@dataclass(frozen=True, slots=True)
class DocumentChunk:
	"""The unit indexed and returned by the vector store."""

	id: str
	content: str
	metadata: DocumentMetadata
	embedding: tuple[float, ...] = field(default_factory=tuple)

	def as_context(self, score: float | None = None) -> dict[str, Any]:
		result: dict[str, Any] = {
			"id": self.id,
			"content": self.content,
			"metadata": self.metadata.as_dict(),
		}
		if score is not None:
			result["score"] = score
		return result
```

### `backend/rag/metadata.py`

```python
"""Metadata validation and normalization for approved knowledge sources."""

from __future__ import annotations

from pathlib import Path
from typing import Any

from backend.rag.document_schema import DocumentMetadata


VALID_CATEGORIES = {"policies", "student", "courses", "support"}


def metadata_from_registry(entry: dict[str, Any]) -> DocumentMetadata:
	required = ("document", "title", "category", "source_type", "approved")
	missing = [key for key in required if key not in entry]
	if missing:
		raise ValueError(f"Knowledge-base entry is missing fields: {', '.join(missing)}")

	category = str(entry["category"])
	if category not in VALID_CATEGORIES:
		raise ValueError(f"Unsupported knowledge-base category: {category}")
	if not isinstance(entry["approved"], bool):
		raise ValueError("Knowledge-base field 'approved' must be boolean")

	return DocumentMetadata(
		document=str(Path(str(entry["document"]))),
		title=str(entry["title"]),
		category=category,
		source_type=str(entry["source_type"]),
		approved=entry["approved"],
	)


def validate_metadata(metadata: DocumentMetadata) -> None:
	if not metadata.document:
		raise ValueError("Document name cannot be empty")
	if not metadata.title:
		raise ValueError("Document title cannot be empty")
	if metadata.category not in VALID_CATEGORIES:
		raise ValueError(f"Unsupported category: {metadata.category}")
	if not metadata.approved:
		raise ValueError(f"Document is not approved: {metadata.document}")
```

## 6. Member 2 Code: Document Loading and Processing

### `backend/rag/document_loader.py`

```python
"""Discover approved knowledge-base files from the registry."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from backend.rag.document_schema import LoadedDocument
from backend.rag.metadata import metadata_from_registry, validate_metadata


SUPPORTED_EXTENSIONS = {".pdf", ".docx", ".txt", ".md"}


def load_registry(index_path: Path) -> list[dict[str, Any]]:
	"""Load and validate the JSON registry without reading document content."""
	try:
		value = json.loads(index_path.read_text(encoding="utf-8"))
	except FileNotFoundError as exc:
		raise FileNotFoundError(f"Knowledge-base index not found: {index_path}") from exc
	except json.JSONDecodeError as exc:
		raise ValueError(f"Invalid knowledge-base index JSON: {index_path}") from exc
	if not isinstance(value, list):
		raise ValueError("Knowledge-base index must contain a JSON array")
	return value


def load_documents(
	knowledge_base_dir: Path,
	index_path: Path | None = None,
) -> list[LoadedDocument]:
	"""Return existing, approved, supported documents from the registry."""
	index_path = index_path or knowledge_base_dir / "index.json"
	documents: list[LoadedDocument] = []
	root = knowledge_base_dir.resolve()

	for entry in load_registry(index_path):
		metadata = metadata_from_registry(entry)
		validate_metadata(metadata)
		path = (root / metadata.document).resolve()
		if root not in path.parents:
			raise ValueError(f"Registry path escapes knowledge base: {metadata.document}")
		if path.suffix.lower() not in SUPPORTED_EXTENSIONS:
			raise ValueError(f"Unsupported document type: {path.suffix}")
		if not path.is_file():
			raise FileNotFoundError(f"Indexed document does not exist: {path}")
		documents.append(LoadedDocument(path=str(path), metadata=metadata))
	return documents
```

### `backend/rag/text_extractor.py`

```python
"""Extract page-aware text from supported document formats."""

from __future__ import annotations

from pathlib import Path

from backend.rag.document_schema import ExtractedPage, LoadedDocument


def extract_text(document: LoadedDocument) -> list[ExtractedPage]:
	"""Extract text while preserving page boundaries where available."""
	path = Path(document.path)
	suffix = path.suffix.lower()
	if suffix in {".txt", ".md"}:
		return [ExtractedPage(text=path.read_text(encoding="utf-8"), page=1)]
	if suffix == ".pdf":
		return _extract_pdf(path)
	if suffix == ".docx":
		return _extract_docx(path)
	raise ValueError(f"Unsupported document type: {suffix}")


def _extract_pdf(path: Path) -> list[ExtractedPage]:
	try:
		from pypdf import PdfReader
	except ImportError as exc:
		raise RuntimeError("PDF support requires the 'pypdf' package") from exc
	reader = PdfReader(str(path))
	return [
		ExtractedPage(text=page.extract_text() or "", page=number)
		for number, page in enumerate(reader.pages, start=1)
	]


def _extract_docx(path: Path) -> list[ExtractedPage]:
	try:
		from docx import Document
	except ImportError as exc:
		raise RuntimeError("DOCX support requires the 'python-docx' package") from exc
	document = Document(str(path))
	text = "\n".join(paragraph.text for paragraph in document.paragraphs)
	return [ExtractedPage(text=text, page=1)]
```

### `backend/rag/cleaner.py`

```python
"""Normalize extracted document text without removing policy meaning."""

from __future__ import annotations

import re

from backend.rag.document_schema import CleanDocument, DocumentMetadata, ExtractedPage


def clean_text(text: str) -> str:
	"""Normalize whitespace and remove blank lines, preserving headings and words."""
	text = text.replace("\u00a0", " ").replace("\r\n", "\n")
	text = re.sub(r"[ \t]+", " ", text)
	text = re.sub(r"\n{3,}", "\n\n", text)
	return "\n".join(line.strip() for line in text.splitlines()).strip()


def clean_pages(
	pages: list[ExtractedPage],
	metadata: DocumentMetadata,
) -> list[CleanDocument]:
	"""Create one clean document per non-empty extracted page."""
	cleaned: list[CleanDocument] = []
	for page in pages:
		text = clean_text(page.text)
		if text:
			page_metadata = DocumentMetadata(
				document=metadata.document,
				title=metadata.title,
				category=metadata.category,
				source_type=metadata.source_type,
				section=metadata.section,
				page=page.page,
				approved=metadata.approved,
			)
			cleaned.append(CleanDocument(text=text, metadata=page_metadata))
	return cleaned
```

## 7. Member 3 Code: Chunking and Metadata

### `backend/rag/chunker.py`

```python
"""Split clean documents into deterministic, metadata-preserving chunks."""

from __future__ import annotations

import hashlib

from backend.rag.document_schema import CleanDocument, DocumentChunk


def chunk_document(
	document: CleanDocument,
	chunk_size: int = 800,
	overlap: int = 120,
) -> list[DocumentChunk]:
	"""Create character-window chunks with stable IDs."""
	if chunk_size <= 0:
		raise ValueError("chunk_size must be positive")
	if overlap < 0 or overlap >= chunk_size:
		raise ValueError("overlap must be >= 0 and smaller than chunk_size")

	chunks: list[DocumentChunk] = []
	start = 0
	while start < len(document.text):
		end = min(start + chunk_size, len(document.text))
		content = document.text[start:end].strip()
		if content:
			raw_id = f"{document.metadata.document}:{document.metadata.page}:{start}:{content}"
			chunk_id = hashlib.sha256(raw_id.encode("utf-8")).hexdigest()[:24]
			chunks.append(
				DocumentChunk(
					id=chunk_id,
					content=content,
					metadata=document.metadata,
				)
			)
		if end == len(document.text):
			break
		start = end - overlap
	return chunks


def chunk_documents(
	documents: list[CleanDocument],
	chunk_size: int = 800,
	overlap: int = 120,
) -> list[DocumentChunk]:
	return [
		chunk
		for document in documents
		for chunk in chunk_document(document, chunk_size, overlap)
	]
```

Section detection may be added after the first retrieval test. Until then, `section` may remain `None`; never infer a section from unsupported content.

## 8. Member 4 Code: Embeddings, Vector Store, Retrieval, and Pipeline

### `backend/rag/embeddings.py`

```python
"""Embedding interfaces and a deterministic local development embedder."""

from __future__ import annotations

import hashlib
import math
import re
from collections.abc import Sequence


class EmbeddingProvider:
	"""Provider contract used by ingestion and retrieval."""

	def embed(self, text: str) -> tuple[float, ...]:
		raise NotImplementedError

	def embed_many(self, texts: Sequence[str]) -> list[tuple[float, ...]]:
		return [self.embed(text) for text in texts]


class DeterministicHashEmbedder(EmbeddingProvider):
	"""Offline baseline embedder for tests and local development only."""

	def __init__(self, dimensions: int = 128) -> None:
		if dimensions <= 0:
			raise ValueError("dimensions must be positive")
		self.dimensions = dimensions

	def embed(self, text: str) -> tuple[float, ...]:
		vector = [0.0] * self.dimensions
		tokens = re.findall(r"[a-z0-9]+", text.lower())
		for token in tokens:
			digest = hashlib.sha256(token.encode("utf-8")).digest()
			index = int.from_bytes(digest[:4], "big") % self.dimensions
			vector[index] += 1.0
		magnitude = math.sqrt(sum(value * value for value in vector))
		return tuple(value / magnitude for value in vector) if magnitude else tuple(vector)
```

When the team selects a hosted embedding model, add another `EmbeddingProvider` implementation. Do not change the retriever or vector-store contract and do not hard-code API credentials.

### `backend/rag/vector_store.py`

```python
"""Replaceable vector-store contracts with an in-memory development backend."""

from __future__ import annotations

import math
from dataclasses import dataclass

from backend.rag.document_schema import DocumentChunk


@dataclass(frozen=True, slots=True)
class SearchResult:
	chunk: DocumentChunk
	score: float


class VectorStore:
	def upsert(self, chunks: list[DocumentChunk]) -> None:
		raise NotImplementedError

	def search(self, query_vector: tuple[float, ...], top_k: int = 5) -> list[SearchResult]:
		raise NotImplementedError


class InMemoryVectorStore(VectorStore):
	"""Small deterministic store for tests and local Phase 1 development."""

	def __init__(self) -> None:
		self._chunks: dict[str, DocumentChunk] = {}

	def upsert(self, chunks: list[DocumentChunk]) -> None:
		self._chunks.update({chunk.id: chunk for chunk in chunks})

	def search(self, query_vector: tuple[float, ...], top_k: int = 5) -> list[SearchResult]:
		if top_k <= 0:
			return []
		results = [
			SearchResult(chunk=chunk, score=_cosine(query_vector, chunk.embedding))
			for chunk in self._chunks.values()
		]
		return sorted(results, key=lambda result: result.score, reverse=True)[:top_k]


def _cosine(left: tuple[float, ...], right: tuple[float, ...]) -> float:
	if len(left) != len(right):
		raise ValueError("Embedding dimensions do not match")
	numerator = sum(a * b for a, b in zip(left, right))
	left_norm = math.sqrt(sum(value * value for value in left))
	right_norm = math.sqrt(sum(value * value for value in right))
	if not left_norm or not right_norm:
		return 0.0
	return numerator / (left_norm * right_norm)
```

### `backend/rag/retriever.py`

```python
"""Rank approved document chunks and format the Group 2 handoff."""

from __future__ import annotations

from backend.rag.embeddings import EmbeddingProvider
from backend.rag.vector_store import VectorStore


class Retriever:
	def __init__(
		self,
		embedding_provider: EmbeddingProvider,
		vector_store: VectorStore,
		top_k: int = 5,
		min_score: float = 0.05,
	) -> None:
		self.embedding_provider = embedding_provider
		self.vector_store = vector_store
		self.top_k = top_k
		self.min_score = min_score

	def retrieve_documents(self, query: str) -> dict[str, list]:
		"""Return evidence only; answer generation belongs to Group 2."""
		if not query or not query.strip():
			return {"context": [], "sources": []}
		query_vector = self.embedding_provider.embed(query.strip())
		matches = [
			result
			for result in self.vector_store.search(query_vector, self.top_k)
			if result.score >= self.min_score and result.chunk.metadata.approved
		]
		context = [result.chunk.as_context(result.score) for result in matches]
		sources = [
			{
				**result.chunk.metadata.as_dict(),
				"score": result.score,
			}
			for result in matches
		]
		return {"context": context, "sources": sources}


def retrieve_documents(query: str, retriever: Retriever) -> dict[str, list]:
	"""Functional handoff helper matching the roadmap's required interface."""
	return retriever.retrieve_documents(query)
```

### `backend/rag/rag_pipeline.py`

```python
"""Compose document processing, embedding, indexing, and retrieval."""

from __future__ import annotations

from pathlib import Path

from backend.rag.chunker import chunk_documents
from backend.rag.cleaner import clean_pages
from backend.rag.document_loader import load_documents
from backend.rag.embeddings import EmbeddingProvider
from backend.rag.retriever import Retriever
from backend.rag.text_extractor import extract_text
from backend.rag.vector_store import VectorStore


def build_retriever(
	knowledge_base_dir: Path,
	embedding_provider: EmbeddingProvider,
	vector_store: VectorStore,
	chunk_size: int = 800,
	overlap: int = 120,
) -> Retriever:
	loaded = load_documents(knowledge_base_dir)
	clean_documents = [
		clean_document
		for document in loaded
		for clean_document in clean_pages(extract_text(document), document.metadata)
	]
	chunks = chunk_documents(clean_documents, chunk_size, overlap)
	embedded_chunks = [
		type(chunk)(
			id=chunk.id,
			content=chunk.content,
			metadata=chunk.metadata,
			embedding=embedding_provider.embed(chunk.content),
		)
		for chunk in chunks
	]
	vector_store.upsert(embedded_chunks)
	return Retriever(embedding_provider, vector_store)
```

### `backend/rag/ingestion.py`

```python
"""Command-facing ingestion entry point."""

from __future__ import annotations

from pathlib import Path

from backend.rag.embeddings import DeterministicHashEmbedder
from backend.rag.rag_pipeline import build_retriever
from backend.rag.vector_store import InMemoryVectorStore


def ingest_documents(knowledge_base_dir: Path):
	"""Index the approved knowledge base into a local development store."""
	return build_retriever(
		knowledge_base_dir=knowledge_base_dir,
		embedding_provider=DeterministicHashEmbedder(),
		vector_store=InMemoryVectorStore(),
	)


if __name__ == "__main__":
	root = Path(__file__).resolve().parents[2] / "knowledge_base"
	retriever = ingest_documents(root)
	print(f"Knowledge base indexed. Ready with top_k={retriever.top_k}.")
```

The final vector store may be Chroma, pgvector, Qdrant, or another approved provider. That choice belongs in the implementation task, not in the Group 1-to-Group 2 interface.

## 9. Import and Package Rules

Use repository-root imports consistently:

```python
from backend.rag.document_schema import DocumentChunk
```

Do not use a mixture of `rag.*` and `backend.rag.*`. Group 1 should not import from `backend.agents`, `backend.ai`, `backend.api`, `backend.database`, or `backend.tools`.

`backend/rag/__init__.py` should remain lightweight:

```python
"""Retrieval-augmented generation package."""
```

Avoid importing optional PDF/DOCX dependencies at module import time. Import them inside the extractor functions so TXT/MD tests can run in a minimal environment.

## 10. Tests to Add During Phase 1

The existing test files are owned by Group 4, so coordinate before editing them. Group 1 should provide tests or a test patch for the following cases. The tests may live temporarily in a Group 1 branch or be handed to Group 4 for integration.

### Required test cases

```python
"""Unit tests for the Group 1 RAG pipeline."""

from __future__ import annotations

import json
import math
from pathlib import Path

import pytest

from backend.rag.chunker import chunk_document
from backend.rag.cleaner import clean_text
from backend.rag.document_loader import load_documents
from backend.rag.document_schema import CleanDocument, DocumentChunk, DocumentMetadata
from backend.rag.embeddings import DeterministicHashEmbedder
from backend.rag.rag_pipeline import build_retriever
from backend.rag.retriever import Retriever
from backend.rag.vector_store import InMemoryVectorStore


@pytest.fixture
def knowledge_base(tmp_path: Path) -> Path:
	"""Create one synthetic approved document without academy claims."""
	policies = tmp_path / "policies"
	policies.mkdir()
	(policies / "attendance_policy.txt").write_text(
		"Attendance Requirements\n\n"
		"Students should consult the approved attendance policy for current requirements.",
		encoding="utf-8",
	)
	(tmp_path / "index.json").write_text(
		json.dumps(
			[
				{
					"document": "policies/attendance_policy.txt",
					"title": "Test Attendance Policy",
					"category": "policies",
					"source_type": "policy",
					"approved": True,
				}
			]
		),
		encoding="utf-8",
	)
	return tmp_path


@pytest.fixture
def approved_metadata() -> DocumentMetadata:
	return DocumentMetadata(
		document="policies/attendance_policy.txt",
		title="Test Attendance Policy",
		category="policies",
		source_type="policy",
		page=1,
		approved=True,
	)


def test_clean_text_normalizes_whitespace() -> None:
	assert clean_text("  Heading\r\n\r\n\r\n  body   text  ") == "Heading\n\nbody text"


def test_chunk_ids_are_deterministic(approved_metadata: DocumentMetadata) -> None:
	document = CleanDocument("A repeated test document.", approved_metadata)
	first = chunk_document(document, chunk_size=10, overlap=2)
	second = chunk_document(document, chunk_size=10, overlap=2)
	assert [chunk.id for chunk in first] == [chunk.id for chunk in second]


def test_chunk_metadata_preserves_document_and_page(
	approved_metadata: DocumentMetadata,
) -> None:
	chunks = chunk_document(CleanDocument("Policy text.", approved_metadata))
	assert chunks[0].metadata.document == "policies/attendance_policy.txt"
	assert chunks[0].metadata.page == 1
	assert chunks[0].metadata.source_type == "policy"


def test_loader_rejects_path_outside_knowledge_base(tmp_path: Path) -> None:
	outside_file = tmp_path / "outside.txt"
	outside_file.write_text("outside", encoding="utf-8")
	knowledge_base = tmp_path / "knowledge_base"
	knowledge_base.mkdir()
	(knowledge_base / "index.json").write_text(
		json.dumps(
			[
				{
					"document": "../outside.txt",
					"title": "Invalid document",
					"category": "policies",
					"source_type": "policy",
					"approved": True,
				}
			]
		),
		encoding="utf-8",
	)
	with pytest.raises(ValueError, match="escapes knowledge base"):
		load_documents(knowledge_base)


def test_loader_rejects_missing_indexed_file(knowledge_base: Path) -> None:
	(knowledge_base / "policies" / "attendance_policy.txt").unlink()
	with pytest.raises(FileNotFoundError, match="does not exist"):
		load_documents(knowledge_base)


def test_hash_embedder_returns_unit_length_vectors() -> None:
	vector = DeterministicHashEmbedder(dimensions=64).embed("attendance policy")
	assert len(vector) == 64
	assert math.isclose(math.sqrt(sum(value * value for value in vector)), 1.0)


def test_vector_store_ranks_similar_chunks_first(
	approved_metadata: DocumentMetadata,
) -> None:
	embedder = DeterministicHashEmbedder()
	matching = DocumentChunk("matching", "attendance policy", approved_metadata, embedder.embed("attendance policy"))
	unrelated = DocumentChunk("unrelated", "course timetable", approved_metadata, embedder.embed("course timetable"))
	store = InMemoryVectorStore()
	store.upsert([unrelated, matching])
	results = store.search(embedder.embed("attendance policy"), top_k=2)
	assert results[0].chunk.id == "matching"


def test_retriever_returns_context_and_sources(knowledge_base: Path) -> None:
	embedder = DeterministicHashEmbedder()
	retriever = build_retriever(knowledge_base, embedder, InMemoryVectorStore())
	result = retriever.retrieve_documents("attendance policy")
	assert set(result) == {"context", "sources"}
	assert result["context"]
	assert result["sources"]
	assert result["context"][0]["metadata"]["document"] == "policies/attendance_policy.txt"


def test_retriever_returns_empty_result_for_blank_query(
	approved_metadata: DocumentMetadata,
) -> None:
	embedder = DeterministicHashEmbedder()
	store = InMemoryVectorStore()
	store.upsert(
		[
			DocumentChunk(
				"chunk-1",
				"some text",
				approved_metadata,
				embedder.embed("some text"),
			)
		]
	)
	result = Retriever(embedder, store).retrieve_documents("   ")
	assert result == {"context": [], "sources": []}


def test_retriever_never_returns_unapproved_chunks(
	approved_metadata: DocumentMetadata,
) -> None:
	unapproved_metadata = DocumentMetadata(
		document=approved_metadata.document,
		title=approved_metadata.title,
		category=approved_metadata.category,
		source_type=approved_metadata.source_type,
		page=approved_metadata.page,
		approved=False,
	)
	embedder = DeterministicHashEmbedder()
	store = InMemoryVectorStore()
	store.upsert(
		[
			DocumentChunk(
				"unapproved",
				"attendance policy",
				unapproved_metadata,
				embedder.embed("attendance policy"),
			)
		]
	)
	result = Retriever(embedder, store).retrieve_documents("attendance policy")
	assert result == {"context": [], "sources": []}


def test_reingestion_does_not_duplicate_chunk_ids(knowledge_base: Path) -> None:
	embedder = DeterministicHashEmbedder()
	store = InMemoryVectorStore()
	build_retriever(knowledge_base, embedder, store)
	build_retriever(knowledge_base, embedder, store)
	results = store.search(embedder.embed("attendance policy"), top_k=100)
	chunk_ids = [result.chunk.id for result in results]
	assert len(chunk_ids) == len(set(chunk_ids))
```

Save this exact reference as `tests/test_rag.py` when Group 1 submits its test contribution. The test file uses only the planned TXT/MD and in-memory interfaces, so it must run without PDF, DOCX, embedding-provider, or vector-database credentials.

### Suggested test fixture

Use a temporary directory containing one approved text document and an index file. Do not depend on real academy PDFs for unit tests. PDF and DOCX tests should be optional integration tests guarded by the relevant dependency.

Example fixture data:

```json
[
  {
	"document": "policies/attendance_policy.txt",
	"title": "Test Attendance Policy",
	"category": "policies",
	"source_type": "policy",
	"approved": true
  }
]
```

Example text:

```text
Attendance Requirements

Students should consult the approved attendance policy for current requirements.
```

Do not use a test sentence to claim a real Torilo policy. It is only a synthetic fixture.

## 11. Dependency Guidance

Phase 1 should use the smallest dependency set that supports the required document formats, tests, and code quality checks. The deterministic embedder, cosine similarity, chunking, metadata models, and in-memory vector store use only the Python standard library.

### Required runtime libraries

The following libraries are required for the Phase 1 implementation:

| Library | Purpose | Used by |
| --- | --- | --- |
| `pypdf` | Extract text and page numbers from PDF documents | `text_extractor.py` |
| `python-docx` | Extract text from DOCX documents | `text_extractor.py` |
| `pytest` | Execute the Phase 1 RAG test suite | `tests/test_rag.py` |
| `ruff` | Lint and check Python source quality | Group 1 validation |
 
### `requirements.txt`

Add these runtime document-processing dependencies to the repository file:

```text
# Phase 1 document extraction
pypdf>=5.0,<7.0
python-docx>=1.1,<2.0
```

The Phase 1 runtime does not require LangChain, LangGraph, NumPy, a hosted embedding SDK, or a vector-database client. Those belong to later architecture decisions and must not be added only because the overall capstone will eventually use an LLM or production vector store.

### `requirements-dev.txt`

The development file should include runtime dependencies and the tools required to run and validate Phase 1:

```text
-r requirements.txt

# Phase 1 tests and quality checks
pytest>=8.0,<9.0
ruff>=0.9,<1.0
```

`pytest` is required because Section 10 provides `tests/test_rag.py`. `ruff` is required for a consistent lint check before the `feature/rag` pull request. No test should require network access, API keys, a PostgreSQL connection, or a production vector store.

### Installation commands

Run these commands from the repository root after activating the project's Python virtual environment:

```powershell
python -m pip install --upgrade pip
python -m pip install -r requirements-dev.txt
```

Verify the libraries are available:

```powershell
python -c "import docx, pypdf, pytest; print('Phase 1 dependencies available')"
python -m pytest --version
ruff --version
```

Run the Phase 1 checks:

```powershell
python -m pytest tests/test_rag.py -q
ruff check backend/rag scripts/ingest_documents.py tests/test_rag.py
python -m compileall backend/rag scripts/ingest_documents.py
```

If the team uses a Linux shell, the equivalent commands are:

```bash
python3 -m pip install --upgrade pip
python3 -m pip install -r requirements-dev.txt
python3 -m pytest tests/test_rag.py -q
ruff check backend/rag scripts/ingest_documents.py tests/test_rag.py
python3 -m compileall backend/rag scripts/ingest_documents.py
```

### Deferred dependencies

Do not add these libraries to the Phase 1 requirement files yet:

```text
Hosted embedding provider SDKs
LangChain or LangGraph
Chroma, Qdrant, or another vector-store client
NumPy or a machine-learning framework
PostgreSQL or SQLAlchemy clients
```

The final embedding provider and vector store must be selected by the integration council. When selected, add their adapters without changing the public `Retriever` and `VectorStore` interfaces.

The deterministic embedder is for local development and tests. It is not an evaluation-quality semantic embedding model and must not be presented as the final production retrieval solution.

## 12. Execution Order

1. Mr. Godspower confirms the registry schema, document names, approval status, and document availability.
2. Mr. Patrick and Miss Greatness agree on `DocumentMetadata`, `ExtractedPage`, `CleanDocument`, and `DocumentChunk` before coding separately.
3. Miss Greatness implements loading, extraction, and cleaning against the shared contracts.
4. Mr. Patrick implements metadata validation and deterministic chunking.
5. Mr. Bright implements the local embedder, in-memory vector store, retriever, and pipeline.
6. Group 1 runs TXT/MD tests first, then optional PDF/DOCX integration tests.
7. Group 1 records the chosen production embedding and vector-store adapters without changing the public retriever contract.
8. Group 1 hands Group 2 a working retriever instance and the interface contract below.

## 13. Group 1 to Group 2 Handoff Contract

Group 2 must be able to call:

```python
result = retriever.retrieve_documents("What happens if I miss a class?")
```

or:

```python
result = retrieve_documents(
	"What happens if I miss a class?",
	retriever,
)
```

The result must always contain both keys:

```python
{
	"context": list[dict],
	"sources": list[dict],
}
```

Rules:

* `context` contains retrieved text and complete metadata.
* `sources` contains citation-ready metadata only.
* Results are ranked highest score first.
* Results below the configured threshold are omitted.
* Blank queries return empty lists.
* No result is an evidence failure, not permission to guess.
* Every returned source must have `approved: true` internally.
* Retrieval does not call an LLM and does not generate an answer.

## 14. Acceptance Checks

Run from the repository root:

```powershell
python -m pytest tests -q
python -m compileall backend/rag
python -m scripts.ingest_documents
```

If Group 1 tests are temporarily located outside the shared test suite, run their path explicitly. The ingestion command must fail clearly when an indexed document is missing; silently ignoring missing policy files would make the system appear grounded when it is not.

Manual checks:

```python
result = retriever.retrieve_documents("What happens if I miss a class?")
assert set(result) == {"context", "sources"}
assert len(result["context"]) == len(result["sources"])

unknown = retriever.retrieve_documents("Does the academy provide accommodation in Abuja?")
assert set(unknown) == {"context", "sources"}
```

The unknown-question assertion should verify shape and evidence behavior, not force a fabricated answer. Whether the threshold yields no results depends on the approved documents and the selected embedding provider.

## 15. Handoff Report Template

Before merging Group 1 work, attach this report to the team pull request:

```text
Implemented files:
- ...

Approved documents indexed:
- ...

Documents intentionally unavailable:
- ...

Embedding implementation:
- Development:
- Production adapter status:

Vector-store implementation:
- Development:
- Production adapter status:

Retrieval contract:
- Function:
- Input:
- Output:
- Empty-result behavior:

Tests run:
- Command:
- Result:

Known limitations:
- ...

Required action from Group 2:
- Consume `context` and `sources` only.
- Do not generate an answer when no approved evidence is returned.
```

## 16. Definition of Done for Group 1

Group 1 is complete for Phase 1 when the assigned files implement the contracts in this document, the knowledge-base registry is reviewed, retrieval is reproducible in local development, source metadata survives end to end, and the handoff report is complete. No Group 1 member should modify the original roadmap or this plan to hide missing documents, failed extraction, weak retrieval, or unavailable production services.

## 17. Group 1 File Completeness Audit

The roadmap assigns the following Group 1 paths. The implementation guidance in this plan now covers every assigned source path:

| Roadmap path | Owner | Coverage in this plan |
| --- | --- | --- |
| `knowledge_base/policies/` | Godspower Nduka | Registry contract and document availability rules |
| `knowledge_base/student/` | Godspower Nduka | Registry contract and document availability rules |
| `knowledge_base/courses/` | Godspower Nduka | Registry contract and document availability rules |
| `knowledge_base/support/` | Godspower Nduka | Registry contract and document availability rules |
| `knowledge_base/index.json` | Godspower Nduka | JSON contract and approval/path rules |
| `backend/rag/__init__.py` | Group 1 | Lightweight package implementation below |
| `backend/rag/document_loader.py` | Miss Greatness | Complete code listing |
| `backend/rag/text_extractor.py` | Miss Greatness | Complete code listing |
| `backend/rag/cleaner.py` | Miss Greatness | Complete code listing |
| `backend/rag/chunker.py` | Mr. Patrick Olalekan Akinsete | Complete code listing |
| `backend/rag/metadata.py` | Mr. Patrick Olalekan Akinsete | Complete code listing |
| `backend/rag/document_schema.py` | Mr. Patrick Olalekan Akinsete | Complete code listing |
| `backend/rag/embeddings.py` | Mr. Bright | Complete code listing |
| `backend/rag/vector_store.py` | Mr. Bright | Complete code listing |
| `backend/rag/retriever.py` | Mr. Bright | Complete code listing |
| `backend/rag/rag_pipeline.py` | Mr. Bright | Complete code listing |
| `backend/rag/ingestion.py` | Mr. Bright | Complete code listing |

### `backend/rag/__init__.py`

This package initializer should remain intentionally small and must not import optional PDF/DOCX libraries or initialize a vector store:

```python
"""Retrieval-augmented generation package."""
```

### Repository-level integration file

The roadmap places `scripts/ingest_documents.py` outside the Group 1 ownership map, but this plan's acceptance command references it. The script must therefore be implemented by Group 1 or coordinated with the integration lead. Use this minimal adapter rather than duplicating pipeline logic:

#### `scripts/ingest_documents.py`

```python
"""Run Group 1 knowledge-base ingestion for local development."""

from __future__ import annotations

from pathlib import Path

from backend.rag.ingestion import ingest_documents


def main() -> None:
	repository_root = Path(__file__).resolve().parents[1]
	retriever = ingest_documents(repository_root / "knowledge_base")
	print(f"Knowledge base indexed. Ready with top_k={retriever.top_k}.")


if __name__ == "__main__":
	main()
```

This script is only a command adapter. The RAG behavior remains in `backend/rag/`.

### Shared files that require coordination

These files are relevant to Group 1 verification but are not assigned as primary Group 1 ownership in the roadmap:

```text
tests/test_rag.py
requirements.txt
requirements-dev.txt
pyproject.toml
```

Group 1 should submit changes to these files through the integration lead or a pull request review. Do not overwrite another group's work. At minimum, communicate the optional `pypdf` and `python-docx` dependencies and provide the RAG test cases listed in Section 10.

## 18. Git Onboarding and Branch Workflow

The repository uses this branch structure:

```text
main
│
└── develop
	 │
	 ├── feature/rag
	 ├── feature/langgraph
	 ├── feature/database
	 ├── feature/frontend
	 └── feature/testing
```

### Branch permissions

* `main` is the protected release branch.
* `develop` is the protected integration branch.
* Group 1 works only on `feature/rag` for Phase 1 RAG changes.
* Group 1 members must not push directly to `develop` or `main`.
* Only the Group 1 lead, Godspower Nduka, may push the approved Group 1 merge or perform the Group 1 merge into `develop`, subject to the team's repository permissions and review rules.
* If the hosting platform restricts direct merge permissions, the Group 1 lead opens the pull request and an authorized maintainer completes the merge.
* Do not force-push shared branches. Use a pull request to merge `feature/rag` into `develop`.


### First-time onboarding for every team member

```powershell
git clone https://github.com/Torilo-Academy-Capstone-Project/torilo-ai-student-assistant
Set-Location torilo-ai-student-assistant
git remote -v
git fetch origin --prune
git switch develop
git pull --ff-only origin develop
```



Configure the contributor identity if it has not already been configured on the machine:

```powershell
git config user.name "Your Name"
git config user.email "your-email@example.com"
```

Do not put GitHub passwords, personal access tokens, API keys, or `.env` values in the repository or in this plan. Git authentication should be handled by Git Credential Manager, SSH keys, or the organization's approved credential method.

### Group 1 lead: create and publish `feature/rag`

Run once from an up-to-date local `develop` branch:

```powershell
git fetch origin --prune
git switch develop
git pull --ff-only origin develop
git switch -c feature/rag
git push --set-upstream origin feature/rag
```

If `feature/rag` already exists on the remote, do not recreate it:

```powershell
git fetch origin --prune
git switch feature/rag
git pull --ff-only origin feature/rag
```

### Group 1 contributors: work on `feature/rag`

After the lead has published the branch, each contributor should use:

```powershell
git fetch origin --prune
git switch feature/rag
git pull --ff-only origin feature/rag
```

Before editing:

```powershell
git status
git branch --show-current
```

The current branch must be `feature/rag`. Commit only Group 1 work:

```powershell
git add backend/rag knowledge_base scripts/ingest_documents.py
git commit -m "feat(rag): implement document retrieval pipeline"
git push origin feature/rag
```

If the contributor is not authorized to push the shared feature branch, create a personal feature branch from `feature/rag`, push it, and open a pull request into `feature/rag`:

```powershell
git switch feature/rag
git pull --ff-only origin feature/rag
git switch -c feature/rag-your-name
git push --set-upstream origin feature/rag-your-name
```

Do not push that personal branch directly to `develop`.

### Daily synchronization

Before beginning work:

```powershell
git fetch origin --prune
git switch feature/rag
git pull --ff-only origin feature/rag
```

If Git reports local changes, stop and inspect them before pulling:

```powershell
git status
git diff
```

Do not use `git reset --hard` to discard another contributor's work. Resolve, commit, or temporarily stash only changes you understand.

### Commit and push workflow

```powershell
git status
git diff --check
git add <specific-group-1-files>
git commit -m "feat(rag): describe the focused change"
git push origin feature/rag
```

Use focused commits such as:

```text
feat(rag): add document metadata contracts
feat(rag): add page-aware text extraction
feat(rag): add deterministic local retrieval store
test(rag): cover approved document retrieval
docs(rag): document Group 2 handoff contract
```

### Group 1 lead: open the integration pull request

After review and tests pass:

```powershell
git fetch origin --prune
git switch feature/rag
git pull --ff-only origin feature/rag
git diff --check
git push origin feature/rag
```

Open a pull request with:

```text
base: develop
compare: feature/rag
```

The pull request description should include the Section 15 handoff report, tests run, documents indexed, unavailable documents, and known limitations. Only the Group 1 lead should request or authorize the Group 1 merge into `develop`; never bypass review by pushing directly to `develop`.

### Updating a local branch after the pull request is merged

For the next phase or after another group merges into `develop`:

```powershell
git fetch origin --prune
git switch develop
git pull --ff-only origin develop
```

Keep the old feature branch for historical review until the team agrees it can be deleted. If the remote branch is intentionally deleted after merge, clean up locally with:

```powershell
git branch -d feature/rag
git fetch origin --prune
```

### Emergency rule

If a contributor accidentally checks out `develop` or `main`, do not push. Run:

```powershell
git branch --show-current
git switch feature/rag
```

If a push is rejected, do not force-push. Fetch the remote branch, inspect the divergence, and contact the Group 1 lead.
