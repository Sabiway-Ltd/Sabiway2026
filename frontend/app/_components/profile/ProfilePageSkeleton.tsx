"use client";

export default function ProfilePageSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="max-w-3xl mx-auto pb-5 md:px-4 px-2">
        {/* Profile Header */}
        <div className="flex flex-col items-center gap-4 mb-8 relative">

          {/* Profile Picture */}
          <div className="relative w-[100px] h-[100px]">
            <div className="w-24 h-24 rounded-full bg-gray-300" />
          </div>

          {/* Profile Info */}
          <div className="text-center">
            <div className="h-5 w-32 bg-gray-300 rounded-md mx-auto mb-2" />
            <div className="h-4 w-20 bg-gray-200 rounded-md mx-auto" />
          </div>

          {/* Job + Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-3">
            <div className="h-4 w-28 bg-gray-200 rounded-md" />
            <div className="h-8 w-24 bg-gray-300 rounded-md" />
            <div className="h-8 w-10 bg-gray-300 rounded-md" />
          </div>

          {/* Stats */}
          <div className="flex justify-around text-center w-full mt-4">
            <div>
              <div className="h-5 w-8 bg-gray-300 rounded-md mx-auto mb-1" />
              <div className="h-3 w-12 bg-gray-200 rounded-md mx-auto" />
            </div>
            <div>
              <div className="h-5 w-8 bg-gray-300 rounded-md mx-auto mb-1" />
              <div className="h-3 w-12 bg-gray-200 rounded-md mx-auto" />
            </div>
            <div>
              <div className="h-5 w-8 bg-gray-300 rounded-md mx-auto mb-1" />
              <div className="h-3 w-12 bg-gray-200 rounded-md mx-auto" />
            </div>
          </div>
        </div>

        {/* Posts Section */}
        <h2 className="font-semibold text-lg mb-3 text-center border-b pb-2">
          <div className="h-5 w-20 bg-gray-200 rounded-md mx-auto" />
        </h2>

        {/* Post skeleton cards */}
        <div className="space-y-6 mt-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border p-4 rounded-lg bg-white shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gray-300 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 w-28 bg-gray-300 rounded-md mb-1" />
                  <div className="h-3 w-20 bg-gray-200 rounded-md" />
                </div>
              </div>

              <div className="h-20 w-full bg-gray-200 rounded-md mb-3" />

              <div className="flex gap-4">
                <div className="h-4 w-10 bg-gray-300 rounded-md" />
                <div className="h-4 w-10 bg-gray-300 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
