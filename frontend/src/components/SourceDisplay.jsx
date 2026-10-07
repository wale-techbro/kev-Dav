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
