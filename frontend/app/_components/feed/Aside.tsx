"use client";

export default function Aside() {
  // 🔹 Dummy trending hashtags
  const trendingHashtags = [
    { tag: "NextJS", use_count: 120 },
    { tag: "React", use_count: 95 },
    { tag: "OpenSource", use_count: 80 },
    { tag: "WebDev", use_count: 70 },
  ];

  // 🔹 Dummy top contributors
  const topContributors = [
    {
      user_id: "1",
      full_name: "Jane Doe",
      username: "@janedoe",
      profile_picture: "https://i.pravatar.cc/100?img=1",
    },
    {
      user_id: "2",
      full_name: "John Smith",
      username: "@johnsmith",
      profile_picture: "https://i.pravatar.cc/100?img=2",
    },
    {
      user_id: "3",
      full_name: "Amaka Johnson",
      username: "@amaka",
      profile_picture: "https://i.pravatar.cc/100?img=3",
    },
  ];

  return (
    <aside className="w-full md:w-80 bg-[#F9FAFB] p-4 rounded-lg">
      {/* Trending Topics */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Trending Topics</h2>
        <div className="flex flex-wrap gap-2">
          {trendingHashtags.length > 0 ? (
            trendingHashtags.map((tag, idx) => (
              <button
                key={idx}
                className={`px-4 py-2 border rounded-md text-sm font-medium shadow-sm transition bg-white text-gray-700 hover:bg-gray-100`}
              >
                #{tag.tag} ({tag.use_count})
              </button>
            ))
          ) : (
            <span className="text-gray-400 text-sm">No trending topics</span>
          )}
        </div>
      </div>

      {/* Top Contributors */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Top Contributors</h2>
        <div className="space-y-3">
          {topContributors.length > 0 ? (
            topContributors.map((c) => (
              <div
                key={c.user_id}
                className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-sm"
              >
                <div className="w-10 h-10">
                  <img
                    src={c.profile_picture}
                    alt={c.full_name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold">{c.full_name}</p>
                  <p className="text-xs text-gray-500">{c.username}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-400 text-sm">No contributors yet</p>
          )}
        </div>
      </div>
    </aside>
  );
}
