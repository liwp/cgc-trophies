import PageLayout from "./PageLayout";

function Loading() {
  return (
    <PageLayout>
      <div className="flex flex-col items-center justify-center py-32">
        <div
          className="h-10 w-10 animate-spin rounded-full"
          style={{
            border: "4px solid #e5e7eb",
            borderTopColor: "#6cb4c4",
          }}
        />
        <div className="mt-2 text-gray-500">Loading flight data...</div>
      </div>
    </PageLayout>
  );
}

export default Loading;
