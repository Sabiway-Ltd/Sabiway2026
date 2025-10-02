// app/_components/feed/Aside.tsx

"use client";

import Image from "next/image";

export default function Aside() {
  const topics = ["#TechInLagos", "#TechInLagos"];

  const contributors = [
    {
      id: 1,
      name: "Aisha K.",
      bio: "Lorem ipsumnmhs shdlednn.....",
      avatar: "https://i.pravatar.cc/150?img=11",
    },
    {
      id: 2,
      name: "Chukwudi O.",
      bio: "Lorem ipsumnmhs shdlednn.....",
      avatar: "https://i.pravatar.cc/150?img=12",
    },
    {
      id: 3,
      name: "Ngozi E.",
      bio: "Lorem ipsumnmhs shdlednn.....",
      avatar: "https://i.pravatar.cc/150?img=13",
    },
  ];

  return (
    <aside className="w-full md:w-80 bg-[#F9FAFB] p-4 rounded-lg">
      {/* Trending Topics */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Trending Topics</h2>
        <div className="flex flex-wrap gap-2">
          {topics.map((topic, idx) => (
            <span
              key={idx}
              className="px-4 py-2 bg-white border rounded-md text-sm font-medium text-gray-700 shadow-sm"
            >
              {topic}
            </span>
          ))}
        </div>
      </div>

      {/* Top Contributors */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Top Contributors</h2>
        <div className="space-y-3">
          {contributors.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-sm"
            >
              <div className="relative w-10 h-10">
                <Image
                  src={c.avatar}
                  alt={c.name}
                  fill
                  className="rounded-full object-cover"
                />
              </div>
              <div>
                <p className="text-sm font-semibold">{c.name}</p>
                <p className="text-xs text-gray-500">{c.bio}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
