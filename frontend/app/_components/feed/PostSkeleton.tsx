// frontend/app/_components/feed/PostSkeleton.tsx

export default function PostSkeleton() {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm animate-pulse border border-gray-200">
      {/* Top: Profile */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-gray-200"></div>
        <div className="space-y-2 flex-1">
          <div className="w-32 h-3 bg-gray-200 rounded"></div>
          <div className="w-20 h-2 bg-gray-200 rounded"></div>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-2 mb-4">
        <div className="w-full h-3 bg-gray-200 rounded"></div>
        <div className="w-5/6 h-3 bg-gray-200 rounded"></div>
        <div className="w-3/4 h-3 bg-gray-200 rounded"></div>
      </div>

      {/* Image placeholder */}
      <div className="w-full h-48 bg-gray-200 rounded mb-4"></div>

      {/* Footer actions */}
      <div className="flex justify-between mt-2">
        <div className="w-12 h-3 bg-gray-200 rounded"></div>
        <div className="w-12 h-3 bg-gray-200 rounded"></div>
        <div className="w-12 h-3 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
}
