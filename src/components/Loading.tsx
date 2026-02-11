function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div
        className="h-10 w-10 animate-spin rounded-full"
        style={{
          border: "4px solid #e5e7eb",
          borderTopColor: "#3b82f6",
        }}
      />
      <div className="mt-2">Loading flight data...</div>
    </div>
  );
}

export default Loading;
