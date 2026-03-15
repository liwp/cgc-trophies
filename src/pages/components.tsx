import dynamic from "next/dynamic";
import { useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Flight, LadderResult, ScoredFlight } from "../types";
import Tooltip from "../components/Tooltip";
import Stats from "../components/Stats";
import Loading from "../components/Loading";
import FlightLoadFailure from "../components/FlightLoadFailure";
import UnknownTrophy from "../components/UnknownTrophy";
import {
  ResultsList,
  LadderResultsList,
} from "./trophy/[trophyId]";

// ---------------------------------------------------------------------------
// Dummy data
// ---------------------------------------------------------------------------

function makeFlight(overrides: {
  id?: string;
  pilot?: string;
  taskDistanceKm: number;
  isCompleted?: boolean;
  isDeclared?: boolean;
  scoringDistanceKm?: number;
  heightLoss?: number;
  start?: string;
  finish?: string;
  turnpoints?: string[];
}): Flight {
  const {
    id = "000000",
    pilot = "Smith, John",
    taskDistanceKm,
    isCompleted = true,
    isDeclared = true,
    scoringDistanceKm = taskDistanceKm * 0.95,
    heightLoss = 0,
    start = "GRL",
    finish = "GRL",
    turnpoints = ["DID", "BUC"],
  } = overrides;
  return {
    id,
    date: new Date("2024-07-15"),
    pilot,
    glider: { type: "ASG 29", handicap: 108, registration: "G-ABCD" },
    ladders: ["open"],
    task: {
      claimType: "C",
      isCompleted,
      isDeclared,
      crossCountryPoints: scoringDistanceKm * 1.1,
      taskDistanceKm,
      scoringDistanceKm,
      taskAchievement: isCompleted ? "100%" : "75%",
      handicappedDistanceKm: scoringDistanceKm * 1.08,
      handicappedSpeedKph: 85.3,
      launchSite: "Gransden Lodge",
      start,
      finish,
      turnpoints,
      heightLoss,
    },
  };
}

function makeScoredFlight(overrides: {
  id?: string;
  pilot?: string;
  taskDistanceKm: number;
  scoreValue?: number;
  scoreUnit?: string;
  heightLoss?: number;
  start?: string;
  finish?: string;
  turnpoints?: string[];
}): ScoredFlight {
  const {
    scoreValue,
    scoreUnit = "km",
    ...flightOverrides
  } = overrides;
  const flight = makeFlight(flightOverrides);
  return {
    ...flight,
    score: {
      value: scoreValue ?? flight.task.handicappedDistanceKm,
      unit: scoreUnit,
    },
  };
}

const DUMMY_FLIGHTS: Flight[] = [
  makeFlight({ taskDistanceKm: 250, pilot: "Adams, Alice" }),
  makeFlight({ taskDistanceKm: 260, pilot: "Brown, Bob", isCompleted: false }),
  makeFlight({ taskDistanceKm: 320, pilot: "Clark, Chris" }),
  makeFlight({ taskDistanceKm: 340, pilot: "Davis, Diana", isDeclared: false }),
  makeFlight({ taskDistanceKm: 350, pilot: "Evans, Ed" }),
  makeFlight({
    taskDistanceKm: 360,
    pilot: "Foster, Fiona",
    isCompleted: false,
  }),
  makeFlight({ taskDistanceKm: 420, pilot: "Green, Gary" }),
  makeFlight({ taskDistanceKm: 450, pilot: "Hill, Helen" }),
  makeFlight({ taskDistanceKm: 480, pilot: "Ives, Ian", isCompleted: false }),
  makeFlight({ taskDistanceKm: 510, pilot: "Jones, Jane" }),
  makeFlight({ taskDistanceKm: 520, pilot: "King, Keith", isCompleted: false }),
  makeFlight({ taskDistanceKm: 780, pilot: "Lane, Laura" }),
];

const SCORED_FLIGHTS: ScoredFlight[] = [
  makeScoredFlight({
    id: "115630",
    pilot: "Baker, Peter",
    taskDistanceKm: 315,
    heightLoss: 1000,
    start: "GRL",
    finish: "GRL",
    turnpoints: ["DID", "BUC"],
  }),
  makeScoredFlight({
    id: "115627",
    pilot: "Theil, Robert",
    taskDistanceKm: 315,
    heightLoss: 1000,
    start: "GRL",
    finish: "GRL",
    turnpoints: ["DID", "BUC"],
  }),
  makeScoredFlight({
    id: "115872",
    pilot: "Atkin, Phil",
    taskDistanceKm: 306,
    heightLoss: 1000,
    start: "GRL",
    finish: "GRL",
    turnpoints: ["DID", "BUC"],
  }),
  makeScoredFlight({
    id: "100004",
    pilot: "Hill, Helen",
    taskDistanceKm: 450,
    start: "GRL",
    finish: "GRL",
    turnpoints: ["DID"],
  }),
];

const LADDER_RESULTS: LadderResult[] = [
  {
    key: "Lane, Laura",
    totalScore: 4200,
    totalDistance: 1560,
    pilots: ["Lane, Laura"],
    flights: [
      makeFlight({ id: "100001", pilot: "Lane, Laura", taskDistanceKm: 780 }),
      makeFlight({ id: "100005", pilot: "Lane, Laura", taskDistanceKm: 520 }),
      makeFlight({ id: "100006", pilot: "Lane, Laura", taskDistanceKm: 260 }),
    ],
  },
  {
    key: "King, Keith",
    totalScore: 3100,
    totalDistance: 1200,
    pilots: ["King, Keith"],
    flights: [
      makeFlight({ id: "100002", pilot: "King, Keith", taskDistanceKm: 520 }),
      makeFlight({ id: "100007", pilot: "King, Keith", taskDistanceKm: 410 }),
      makeFlight({ id: "100008", pilot: "King, Keith", taskDistanceKm: 270 }),
    ],
  },
  {
    key: "Jones, Jane",
    totalScore: 2800,
    totalDistance: 1050,
    pilots: ["Jones, Jane"],
    flights: [
      makeFlight({ id: "100003", pilot: "Jones, Jane", taskDistanceKm: 510 }),
      makeFlight({ id: "100009", pilot: "Jones, Jane", taskDistanceKm: 350 }),
    ],
  },
];

const SYNDICATE_RESULTS: LadderResult[] = [
  {
    key: "G-ABCD",
    totalScore: 3500,
    totalDistance: 1300,
    pilots: ["Lane, Laura", "King, Keith"],
    flights: [
      makeFlight({ id: "100001", pilot: "Lane, Laura", taskDistanceKm: 780 }),
      makeFlight({ id: "100002", pilot: "King, Keith", taskDistanceKm: 520 }),
    ],
  },
  {
    key: "G-EFGH",
    totalScore: 2100,
    totalDistance: 860,
    pilots: ["Jones, Jane", "Hill, Helen"],
    flights: [
      makeFlight({ id: "100003", pilot: "Jones, Jane", taskDistanceKm: 510 }),
      makeFlight({ id: "100004", pilot: "Hill, Helen", taskDistanceKm: 350 }),
    ],
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const Section = ({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description: string;
  children: ReactNode;
}) => (
  <section id={id} className="rounded-lg border border-gray-200 scroll-mt-4">
    <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 rounded-t-lg">
      <h2 className="font-semibold">{title}</h2>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
    <div className="p-4">{children}</div>
  </section>
);

function ToggleGroup({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-gray-500">{label}</span>
      <div className="flex rounded border border-gray-200">
        {options.map((opt) => (
          <button
            key={opt}
            className={`px-2 py-0.5 text-xs ${
              value === opt ? "bg-gray-900 text-white" : "hover:bg-gray-100"
            }`}
            onClick={() => onChange(opt)}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Showcase sections
// ---------------------------------------------------------------------------

const TooltipShowcase = () => {
  const [text, setText] = useState("Tooltip text");
  const [side, setSide] = useState<"top" | "bottom">("top");
  const [align, setAlign] = useState<"center" | "left" | "right">("center");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">Text</span>
          <input
            className="rounded border border-gray-200 px-2 py-0.5 text-sm"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>
        <ToggleGroup
          label="Side"
          value={side}
          options={["top", "bottom"]}
          onChange={setSide as (v: string) => void}
        />
        <ToggleGroup
          label="Align"
          value={align}
          options={["center", "left", "right"]}
          onChange={setAlign as (v: string) => void}
        />
      </div>

      <div className="flex justify-center py-8">
        <Tooltip text={text} side={side} align={align}>
          <span className="rounded border border-dashed border-gray-400 px-3 py-1 text-sm">
            Hover me
          </span>
        </Tooltip>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium text-gray-500">
          All combinations
        </h3>
        <div className="grid grid-cols-3 gap-4">
          {(["left", "center", "right"] as const).map((a) =>
            (["top", "bottom"] as const).map((s) => (
              <div key={`${s}-${a}`} className="flex justify-center py-6">
                <Tooltip text={`${s} / ${a}`} side={s} align={a}>
                  <span className="rounded bg-gray-100 px-2 py-0.5 text-xs">
                    {s} / {a}
                  </span>
                </Tooltip>
              </div>
            )),
          )}
        </div>
      </div>
    </div>
  );
};

const SeasonShowcase = () => {
  const [season, setSeason] = useState(2024);
  const currentYear = new Date().getFullYear();

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">
        This is a local-state replica — the real Season component uses
        router.replace().
      </p>
      <div className="flex flex-row items-center gap-4">
        <button
          aria-label="Previous season"
          className="rounded p-2 hover:bg-gray-100 disabled:opacity-40"
          disabled={season === 2007}
          onClick={() => setSeason((s) => s - 1)}
        >
          <ChevronLeft size={20} />
        </button>
        <span>{season}</span>
        <button
          aria-label="Next season"
          className="rounded p-2 hover:bg-gray-100 disabled:opacity-40"
          disabled={season === currentYear}
          onClick={() => setSeason((s) => s + 1)}
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};

const StatsShowcase = () => (
  <div className="overflow-x-auto">
    <Stats flights={DUMMY_FLIGHTS} season={2024} />
  </div>
);

const LoadingShowcase = () => {
  const [show, setShow] = useState(false);

  return (
    <div className="space-y-3">
      <button
        className="rounded border border-gray-200 px-3 py-1 text-sm hover:bg-gray-100"
        onClick={() => setShow((s) => !s)}
      >
        {show ? "Hide" : "Show"}
      </button>
      {show && (
        <div className="relative h-48 overflow-hidden rounded border border-gray-200 [&>div]:min-h-48 [&>div]:h-48">
          <Loading />
        </div>
      )}
    </div>
  );
};

const UnknownTrophyShowcase = () => {
  const [trophyId, setTrophyId] = useState("mystery-cup");

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-500">Trophy ID</span>
        <input
          className="rounded border border-gray-200 px-2 py-0.5 text-sm"
          value={trophyId}
          onChange={(e) => setTrophyId(e.target.value)}
        />
      </div>
      <div className="rounded border border-gray-200 p-3">
        <UnknownTrophy trophyId={trophyId} />
      </div>
    </div>
  );
};

const FlightResultsShowcase = () => (
  <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
    <ResultsList results={SCORED_FLIGHTS} season={2024} trophy="Example Trophy" />
  </div>
);

const LadderResultsShowcase = () => {
  const [mode, setMode] = useState<"pilot" | "syndicate">("pilot");

  return (
    <div className="space-y-4">
      <ToggleGroup
        label="Group by"
        value={mode}
        options={["pilot", "syndicate"]}
        onChange={setMode as (v: string) => void}
      />
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        {mode === "pilot" ? (
          <LadderResultsList
            results={LADDER_RESULTS}
            season={2024}
            trophy="Example Ladder"
            isSyndicate={false}
          />
        ) : (
          <LadderResultsList
            results={SYNDICATE_RESULTS}
            season={2024}
            trophy="Example Syndicate"
            isSyndicate={true}
          />
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const SECTIONS = [
  { id: "tooltip", title: "Tooltip" },
  { id: "season", title: "Season" },
  { id: "stats", title: "Stats" },
  { id: "flight-results", title: "Flight Results" },
  { id: "ladder-results", title: "Ladder Results" },
  { id: "loading", title: "Loading" },
  { id: "flight-load-failure", title: "FlightLoadFailure" },
  { id: "unknown-trophy", title: "UnknownTrophy" },
];

function ComponentsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 p-8">
      <h1 className="text-2xl font-bold">Components</h1>

      <nav className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
        {SECTIONS.map(({ id, title }) => (
          <a key={id} href={`#${id}`} className="text-blue-600 hover:underline">
            {title}
          </a>
        ))}
      </nav>

      <Section
        id="tooltip"
        title="Tooltip"
        description="CSS-only tooltip with side and align props"
      >
        <TooltipShowcase />
      </Section>

      <Section
        id="season"
        title="Season"
        description="Season navigation with prev/next year buttons"
      >
        <SeasonShowcase />
      </Section>

      <Section
        id="stats"
        title="Stats"
        description="Flight statistics dashboard by distance category"
      >
        <StatsShowcase />
      </Section>

      <Section
        id="flight-results"
        title="Flight Results"
        description="Scored flight results table with one-per-pilot toggle, copy button, and links"
      >
        <FlightResultsShowcase />
      </Section>

      <Section
        id="ladder-results"
        title="Ladder Results"
        description="Ladder trophy results with expandable flight details. Toggle between pilot and syndicate grouping."
      >
        <LadderResultsShowcase />
      </Section>

      <Section
        id="loading"
        title="Loading"
        description="Full-screen loading spinner (shown in a constrained box)"
      >
        <LoadingShowcase />
      </Section>

      <Section
        id="flight-load-failure"
        title="FlightLoadFailure"
        description="Error message for failed data loads"
      >
        <FlightLoadFailure />
      </Section>

      <Section
        id="unknown-trophy"
        title="UnknownTrophy"
        description="404-style page for unknown trophy IDs"
      >
        <UnknownTrophyShowcase />
      </Section>
    </div>
  );
}

export default dynamic(() => Promise.resolve(ComponentsPage), { ssr: false });
