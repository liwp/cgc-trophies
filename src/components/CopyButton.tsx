import { Check, Copy } from "lucide-react";
import { type MouseEvent, useState } from "react";
import { copyDataToClipboard } from "../lib/trophyCopyData";
import Tooltip from "./Tooltip";

/** Copies tab-separated rows to the clipboard, for pasting into a spreadsheet. */
const CopyButton = ({ data }: { data: string[][] }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = (e: MouseEvent) => {
    e.stopPropagation();
    copyDataToClipboard(data).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <Tooltip text={copied ? "Copied!" : "Copy for spreadsheet"} align="right">
      <button
        type="button"
        aria-label="Copy to clipboard"
        className={`p-1 rounded hover:bg-gray-100 ${copied ? "text-green-600" : "text-gray-400"}`}
        onClick={handleCopy}
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
      </button>
    </Tooltip>
  );
};

export default CopyButton;
