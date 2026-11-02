import Markdown from "./Markdown";
import Tip from "./Tip";

/**
 * A trophy's one-line summary, with its full description in a tooltip so the
 * rules can be read without leaving the page. Pass a trophy already resolved
 * for the season, so the right version's description shows.
 */
const TrophySummary = ({
  summary,
  description,
}: {
  summary: string;
  description: string;
}) => (
  <Tip
    wide
    tip={
      <Markdown className="[&_a]:text-white [&_strong]:text-white">
        {description}
      </Markdown>
    }
    className="text-left"
  >
    {summary}
  </Tip>
);

export default TrophySummary;
