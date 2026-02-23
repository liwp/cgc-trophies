import Link from "next/link";
import PageLayout from "./PageLayout";

function UnknownTrophy({ trophyId }: { trophyId: string }) {
  return (
    <PageLayout>
      <div className="py-16 text-center">
        <p className="text-gray-700">
          Unknown trophy: <em className="text-cambridge-dark">{trophyId}</em>
        </p>
        <p className="mt-2">
          <Link
            href="/"
            className="text-cambridge hover:text-cambridge-dark transition-colors"
          >
            Return to the main page
          </Link>
        </p>
      </div>
    </PageLayout>
  );
}

export default UnknownTrophy;
