import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/router";

const firstYear = 2007;

const Season = ({ season }: { season: number }) => {
  const router = useRouter();
  const currentYear = new Date().getFullYear();

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-label="Previous season"
        className="p-1.5 rounded-lg hover:bg-cambridge-light hover:text-cambridge-dark disabled:opacity-30 transition-colors"
        disabled={season === firstYear}
        onClick={() =>
          router.replace({ query: { ...router.query, season: season - 1 } })
        }
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
        onClick={() =>
          router.replace({ query: { ...router.query, season: season + 1 } })
        }
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
};

export default Season;
