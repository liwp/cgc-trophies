import { ArrowLeft, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

import CONFIG from "trophies-config";
import records from "../../records.config";
import PageLayout from "../components/PageLayout";
import Th from "../components/Th";
import { flightDetailsUrl } from "../lib/links";
import { formatRecordValue } from "../lib/records";
import type { RecordCategory } from "../types";

/** ISO date (yyyy-mm-dd) as dd/mm/yyyy, without any timezone conversion. */
const formatDate = (iso: string) => iso.split("-").reverse().join("/");

const ukRecordText = (category: RecordCategory) => {
  const { ukRecord } = category;
  if (!ukRecord) return "";
  const lists = ukRecord.lists.join(", ");
  return ukRecord.status === "former" ? `Former: ${lists}` : lists;
};

const RecordRow = ({ category }: { category: RecordCategory }) => {
  const { record } = category;
  const achieved = formatRecordValue(category);
  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3 font-medium text-gray-900">{category.label}</td>
      <td className="px-4 py-3 whitespace-nowrap">
        {record?.flightId ? (
          <a
            href={flightDetailsUrl(record.flightId)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-cambridge hover:text-cambridge-dark transition-colors"
          >
            {achieved} <ExternalLink size={14} />
          </a>
        ) : record ? (
          <span className="text-gray-700">{achieved}</span>
        ) : (
          <span className="text-gray-400 italic">{achieved}</span>
        )}
      </td>
      <td className="px-4 py-3 text-gray-700">{record?.pilot}</td>
      <td className="px-4 py-3 text-gray-700">
        {record?.turnpoints
          .map((tp) => (typeof tp === "string" ? tp : tp.name))
          .join(" – ")}
      </td>
      <td className="px-4 py-3 text-gray-700">{record?.glider}</td>
      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
        {record ? formatDate(record.date) : ""}
      </td>
      <td className="px-4 py-3 text-gray-500">{ukRecordText(category)}</td>
    </tr>
  );
};

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
      <div className="rounded-xl border border-gray-200 bg-white overflow-x-auto">
        <table className="w-full table-auto border-collapse">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <Th>Task</Th>
              <Th>Achieved</Th>
              <Th>Pilot</Th>
              <Th>Route</Th>
              <Th>Glider</Th>
              <Th>Date</Th>
              <Th>UK record</Th>
            </tr>
          </thead>
          <tbody>
            {records.map((category) => (
              <RecordRow key={category.id} category={category} />
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-gray-500">
        Records are for flights launched from Gransden Lodge and flown under BGA
        Ladder rules. Speeds are actual (not handicapped).
      </p>
    </div>
  </PageLayout>
);

export default RecordsPage;
