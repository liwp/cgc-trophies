import ReactMarkdown, { type Components } from "react-markdown";

// Tailwind resets element styles, so give the elements descriptions use theirs back.
const components: Components = {
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  strong: ({ children }) => (
    <strong className="font-semibold text-gray-700">{children}</strong>
  ),
  ul: ({ children }) => (
    <ul className="mb-2 list-disc pl-5 last:mb-0">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-2 list-decimal pl-5 last:mb-0">{children}</ol>
  ),
  a: ({ children, href }) => (
    <a
      href={href}
      className="text-cambridge hover:text-cambridge-dark underline"
      target="_blank"
      rel="noreferrer"
    >
      {children}
    </a>
  ),
};

/** Renders a trophy description, written in Markdown in trophies.config.ts. */
const Markdown = ({
  children,
  className = "",
}: {
  children: string;
  className?: string;
}) => (
  <div className={className}>
    <ReactMarkdown components={components}>{children}</ReactMarkdown>
  </div>
);

export default Markdown;
