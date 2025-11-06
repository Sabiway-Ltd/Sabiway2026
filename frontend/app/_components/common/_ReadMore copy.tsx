// app/_components/common/ReadMore.tsx

import Link from "next/link";


import { useState } from "react";

const ReadMoreText = ({ content, maxLength = 120 }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!content) return null;

  const formatText = (text) => {
    // Detect links and hashtags
    const regex =
      /(\bhttps?:\/\/[^\s]+)|(#\w+)/g;

    return text.split(regex).map((part, i) => {
      if (!part) return null;

      // Handle links
      if (part.match(/^https:\/\/sabiway2025\.vercel\.app/)) {
        const path = part.replace("https://sabiway2025.vercel.app", "");
        return (
          <Link
            key={i}
            href={path}
            className="text-blue-500 hover:underline break-all"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </Link>
        );
      }

      // Handle hashtags
      if (part.startsWith("#")) {
        return (
          <span key={i} className="text-blue-500">
            {part}
          </span>
        );
      }

      // Normal text
      return <span key={i}>{part}</span>;
    });
  };

  // Shorten text if not expanded
  const displayText = isExpanded
    ? content
    : content.substring(0, maxLength) +
      (content.length > maxLength ? "..." : "");

  return (
    <div className="mt-3 text-gray-800 text-sm break-words break-all whitespace-pre-wrap">
      {formatText(displayText)}
      {content.length > maxLength && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="ml-1 text-blue-500 font-medium hover:underline"
        >
          {isExpanded ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
};

export default ReadMoreText;
