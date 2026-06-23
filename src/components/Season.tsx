import { ChevronLeft, ChevronRight } from "lucide-react";
import { useSearchParams } from "react-router-dom";

const firstYear = 2007;

const Season = ({ season }: { season: number }) => {
  const [, setSearchParams] = useSearchParams();
  const currentYear = new Date().getFullYear();

  const goToSeason = (year: number) =>
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("season", String(year));
        return next;
      },
      { replace: true },
    );

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-label="Previous season"
        className="p-1.5 rounded-lg hover:bg-cambridge-light hover:text-cambridge-dark disabled:opacity-30 transition-colors"
        disabled={season === firstYear}
        onClick={() => goToSeason(season - 1)}
      >
        <ChevronLeft size={18} />
      </button>
      <span className="text-lg font-semibold text-gray-900 tabular-nums min-w-[4ch] text-center">
        {season}
      </span>
      <button
        type="button"
        aria-label="Next season"
        className="p-1.5 rounded-lg hover:bg-cambridge-light hover:text-cambridge-dark disabled:opacity-30 transition-colors"
        disabled={season === currentYear}
        onClick={() => goToSeason(season + 1)}
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
};

export default Season;
