import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { Fragment, useState } from "react";
import { Link } from "react-router-dom";

import CONFIG from "trophies-config";
import records from "../../records.config";
import PageLayout from "../components/PageLayout";
import Th from "../components/Th";
import Tip from "../components/Tip";
import { flightDetailsUrl } from "../lib/links";
import {
  formatClubRecordValue,
  groupCategories,
  recordHistory,
  routeTooltip,
  turnpointLabel,
  turnpointText,
  ukRecordTooltip,
} from "../lib/recordDisplay";
import type { ClubRecord, RecordCategory } from "../types";

/** ISO date (yyyy-mm-dd) as dd/mm/yyyy, without any timezone conversion. */
const formatDate = (iso: string) => iso.split("-").reverse().join("/");

const UkBadge = ({ category }: { category: RecordCategory }) => {
  const tip = ukRecordTooltip(category);
  if (!tip) return null;
  const colour =
    category.ukRecord?.status === "current" ? "bg-blue-800" : "bg-gray-400";
  return (
    <Tip
      tip={tip}
      className={`rounded px-1 text-[10px] leading-4 font-bold text-white ${colour}`}
    >
      UK
    </Tip>
  );
};

/** The task code with its UK badge, centred on the code's text. */
const TaskCode = ({ category }: { category: RecordCategory }) => (
  <span className="inline-flex items-center gap-1.5">
    <Tip tip={category.label} className="font-semibold text-gray-900">
      {category.code}
    </Tip>
    <UkBadge category={category} />
  </span>
);

/** A route's turnpoint codes, with their names in one tooltip. */
const Route = ({ record }: { record: ClubRecord }) => (
  <Tip tip={routeTooltip(record.turnpoints)} className="font-mono">
    {record.turnpoints.map((tp, i) => {
      const label = turnpointLabel(tp);
      return (
        <Fragment key={label.code}>
          {i > 0 && " – "}
          <span className={label.removed === undefined ? "" : "text-gray-400"}>
            {turnpointText(label)}
          </span>
        </Fragment>
      );
    })}
  </Tip>
);

const RecordValue = ({
  category,
  record,
}: {
  category: RecordCategory;
  record: ClubRecord | null;
}) => {
  if (!record) return <span className="text-gray-400 italic">No claim</span>;
  const value = formatClubRecordValue(category.rule, record);
  return record.flightId ? (
    <a
      href={flightDetailsUrl(record.flightId)}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-cambridge hover:text-cambridge-dark transition-colors"
    >
      {value} <ExternalLink size={12} />
    </a>
  ) : (
    <span>{value}</span>
  );
};

const HistoryToggle = ({
  open,
  onToggle,
}: {
  open: boolean;
  onToggle: () => void;
}) => (
  <button
    type="button"
    aria-expanded={open}
    aria-label={open ? "Hide earlier records" : "Show earlier records"}
    onClick={onToggle}
    className="text-gray-400 hover:text-gray-600"
  >
    {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
  </button>
);

const History = ({ category }: { category: RecordCategory }) => (
  <ul
    aria-label={`Earlier ${category.code} records`}
    className="flex flex-col gap-1 text-xs text-gray-500"
  >
    {recordHistory(category).map((r) => (
      <li key={r.date}>
        {formatDate(r.date)} · {r.pilot} ·{" "}
        <RecordValue category={category} record={r} /> · {r.glider}
      </li>
    ))}
  </ul>
);

const RecordRow = ({ category }: { category: RecordCategory }) => {
  const [open, setOpen] = useState(false);
  const { record } = category;
  const hasHistory = category.superseded.length > 0;
  return (
    <>
      <tr className="border-t border-gray-100 align-top">
        <td className="py-3 pl-3">
          {hasHistory && (
            <HistoryToggle open={open} onToggle={() => setOpen((o) => !o)} />
          )}
        </td>
        <td className="px-4 py-3">
          <TaskCode category={category} />
          {record && record.turnpoints.length > 0 && (
            <div className="text-xs text-gray-500 whitespace-nowrap">
              <Route record={record} />
            </div>
          )}
        </td>
        <td className="px-4 py-3">
          <div className="font-medium text-gray-900">{record?.pilot}</div>
          <div className="text-xs text-gray-500">{record?.glider}</div>
        </td>
        <td className="px-4 py-3 whitespace-nowrap">
          <div className="font-semibold">
            <RecordValue category={category} record={record} />
          </div>
          <div className="text-xs text-gray-500">
            {record && formatDate(record.date)}
          </div>
        </td>
      </tr>
      {open && (
        <tr>
          <td />
          <td colSpan={3} className="px-4 pb-3">
            <History category={category} />
          </td>
        </tr>
      )}
    </>
  );
};

const RecordCard = ({ category }: { category: RecordCategory }) => {
  const [open, setOpen] = useState(false);
  const { record } = category;
  const hasHistory = category.superseded.length > 0;
  return (
    <li className="flex flex-col gap-0.5 border-t border-gray-100 px-3 py-2.5 first:border-t-0">
      <div className="flex items-baseline justify-between gap-2">
        <span className="inline-flex items-center gap-1">
          {hasHistory && (
            <HistoryToggle open={open} onToggle={() => setOpen((o) => !o)} />
          )}
          <TaskCode category={category} />
        </span>
        <span className="font-semibold whitespace-nowrap">
          <RecordValue category={category} record={record} />
        </span>
      </div>
      {record && (
        <>
          <div className="flex items-baseline justify-between gap-2 text-sm">
            <span className="text-gray-900">{record.pilot}</span>
            <span className="text-xs text-gray-500">
              {formatDate(record.date)}
            </span>
          </div>
          <div className="text-xs text-gray-500">
            {record.turnpoints.length > 0 && (
              <>
                <Route record={record} /> ·{" "}
              </>
            )}
            {record.glider}
          </div>
        </>
      )}
      {open && (
        <div className="pt-1">
          <History category={category} />
        </div>
      )}
    </li>
  );
};

const RecordGroup = ({
  heading,
  categories,
}: {
  heading: string;
  categories: RecordCategory[];
}) => (
  <section className="flex flex-col gap-2">
    <h2 className="text-lg font-semibold text-gray-800">{heading}</h2>
    <div className="rounded-xl border border-gray-200 bg-white">
      <table className="hidden w-full table-fixed border-collapse sm:table">
        <thead>
          <tr className="bg-gray-50">
            <th className="w-8 rounded-tl-xl" />
            <Th compact width="w-[38%]">
              Task
            </Th>
            <Th compact width="w-[30%]">
              Pilot
            </Th>
            <Th compact>Record</Th>
          </tr>
        </thead>
        <tbody>
          {categories.map((category) => (
            <RecordRow key={category.id} category={category} />
          ))}
        </tbody>
      </table>
      <ul className="sm:hidden">
        {categories.map((category) => (
          <RecordCard key={category.id} category={category} />
        ))}
      </ul>
    </div>
  </section>
);

const RecordsPage = () => (
  <PageLayout>
    <div className="flex flex-col gap-6">
      <Link
        to="/"
        className="inline-flex items-center gap-1 self-start text-cambridge hover:text-cambridge-dark transition-colors"
      >
        <ArrowLeft size={16} /> <span>All Trophies</span>
      </Link>
      <h1 className="text-2xl font-bold text-gray-900">
        {CONFIG.club.shortName} Club Records
      </h1>
      {groupCategories(records).map(({ heading, categories }) => (
        <RecordGroup key={heading} heading={heading} categories={categories} />
      ))}
      <p className="text-sm text-gray-500">
        Records are for flights launched from Gransden Lodge and flown under BGA
        Ladder rules. Speeds are actual (not handicapped).
      </p>
    </div>
  </PageLayout>
);

export default RecordsPage;
