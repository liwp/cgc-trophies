import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { getTrophyNav } from "../lib/trophyNav";

/** Back to all trophies, plus links to the previous and next trophy. */
const TrophyNavBar = ({
  trophyId,
  season,
}: {
  trophyId: string;
  season: number;
}) => {
  const { prev, next } = getTrophyNav(trophyId);

  return (
    <div className="flex items-center justify-between">
      <Link
        to={`/?season=${season}`}
        className="inline-flex items-center gap-1 text-cambridge hover:text-cambridge-dark transition-colors"
      >
        <ArrowLeft size={16} /> <span>All Trophies</span>
      </Link>
      <div className="flex items-center gap-3 text-sm">
        {prev ? (
          <Link
            to={`/trophy/${prev.id}?season=${season}`}
            className="inline-flex items-center gap-1 text-gray-500 hover:text-cambridge transition-colors"
          >
            <ChevronLeft size={16} /> {prev.name}
          </Link>
        ) : (
          <span />
        )}
        {prev && next && <span className="text-gray-300">|</span>}
        {next ? (
          <Link
            to={`/trophy/${next.id}?season=${season}`}
            className="inline-flex items-center gap-1 text-gray-500 hover:text-cambridge transition-colors"
          >
            {next.name} <ChevronRight size={16} />
          </Link>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
};

export default TrophyNavBar;
