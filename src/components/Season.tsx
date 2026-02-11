import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/router";

// There is one flight in the previous season, so we think 2007 is the first
// proper season that the ladder has data for.
const firstYear = 2007;

const Season = ({ season }: { season: number }) => {
  const router = useRouter();
  const currentYear = new Date().getFullYear();

  return (
    <div className="flex flex-row items-center gap-4">
      <button
        aria-label="Previous season"
        className="p-2 rounded hover:bg-gray-100 disabled:opacity-40"
        disabled={season === firstYear}
        onClick={() =>
          router.replace({
            query: { ...router.query, season: season - 1 },
          })
        }
      >
        <ChevronLeft size={20} />
      </button>
      <span>{season}</span>
      <button
        aria-label="Next season"
        className="p-2 rounded hover:bg-gray-100 disabled:opacity-40"
        disabled={season === currentYear}
        onClick={() =>
          router.replace({
            query: { ...router.query, season: season + 1 },
          })
        }
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
};

export default Season;
