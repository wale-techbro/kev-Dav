import type { Source } from "../types/chat";

interface Props {
  sources: Source[];
}

export function Sources({ sources }: Props) {
  if (!sources.length) return null;

  return (
    <section className="sources">
      <h3>Sources</h3>

      <div className="source-list">
        {sources.map((source, index) => (
          <article className="source" key={`${source.title}-${index}`}>
            <strong>
              {source.title || source.document || "Source"}
            </strong>

            {source.page !== undefined && (
              <span>Page {source.page}</span>
            )}

            {source.section && (
              <span>{source.section}</span>
            )}

            {source.url && (
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open source
              </a>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}