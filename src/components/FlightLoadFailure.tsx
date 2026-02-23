import PageLayout from "./PageLayout";

function FlightLoadFailure() {
  return (
    <PageLayout>
      <div className="flex flex-col items-center justify-center py-32 text-gray-500">
        <p className="text-lg">Failed to load flight data.</p>
        <p className="mt-1 text-sm">Please try refreshing the page.</p>
      </div>
    </PageLayout>
  );
}

export default FlightLoadFailure;
