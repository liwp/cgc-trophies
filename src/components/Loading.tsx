function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-500" />
      <div className="mt-2">Loading flight data...</div>
    </div>
  );
}

export default Loading;
