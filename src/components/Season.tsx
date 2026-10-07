import { ChevronLeft, ChevronRight } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { clampSeason, FIRST_SEASON, latestSeason } from "../lib/season";

const buttonClass =
  "p-1.5 rounded-lg hover:bg-cambridge-light hover:text-cambridge-dark disabled:opacity-30 transition-colors";

/** Previous/next season buttons around the season; steps stay in range. */
export const SeasonPicker = ({
  season,
  onChange,
}: {
  season: number;
  onChange: (season: number) => void;
}) => (
  <div className="flex items-center gap-2">
    <button
      type="button"
      aria-label="Previous season"
      className={buttonClass}
      disabled={season <= FIRST_SEASON}
      onClick={() => onChange(clampSeason(season - 1))}
    >
      <ChevronLeft size={18} />
    </button>
    <span className="text-lg font-semibold text-gray-900 tabular-nums min-w-[4ch] text-center">
      {season}
    </span>
    <button
      type="button"
      aria-label="Next season"
      className={buttonClass}
      disabled={season >= latestSeason()}
      onClick={() => onChange(clampSeason(season + 1))}
    >
      <ChevronRight size={18} />
    </button>
  </div>
);

/** The season picker bound to the page's ?season= query parameter. */
const Season = ({ season }: { season: number }) => {
  const [, setSearchParams] = useSearchParams();

  const goToSeason = (year: number) =>
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("season", String(year));
        return next;
      },
      { replace: true },
    );

  return <SeasonPicker season={season} onChange={goToSeason} />;
};

export default Season;
