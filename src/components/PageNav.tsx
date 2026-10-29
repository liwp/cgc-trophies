import { ChartColumn, House, Settings, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import Tooltip from "./Tooltip";

type Page = "home" | "stats" | "records" | "admin";

const linkClass =
  "p-2 rounded-lg text-gray-400 hover:text-cambridge hover:bg-cambridge-light transition-colors";

/** Icon links to the site's other pages, keeping the season where it applies. */
const PageNav = ({ current, season }: { current: Page; season: number }) => {
  const pages: { page: Page; label: string; to: string; icon: typeof House }[] =
    [
      {
        page: "home",
        label: "Trophies",
        to: `/?season=${season}`,
        icon: House,
      },
      {
        page: "stats",
        label: "Season stats",
        to: `/stats?season=${season}`,
        icon: ChartColumn,
      },
      { page: "records", label: "Club records", to: "/records", icon: Trophy },
      {
        page: "admin",
        label: "Admin view",
        to: `/admin?season=${season}`,
        icon: Settings,
      },
    ];
  return (
    <>
      {pages
        .filter(({ page }) => page !== current)
        .map(({ page, label, to, icon: Icon }) => (
          <Tooltip key={page} text={label} asLabel>
            <Link to={to} className={linkClass}>
              <Icon size={18} />
            </Link>
          </Tooltip>
        ))}
    </>
  );
};

export default PageNav;
