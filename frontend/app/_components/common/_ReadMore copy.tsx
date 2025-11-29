"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const ReadMoreText = ({ content, maxLength = 120 }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const router = useRouter();

  if (!content) return null;

  const formatText = (text) => {
    // Detect links and hashtags
    const regex = /(\bhttps?:\/\/[^\s]+)|(#\w+)/g;

    return text.split(regex).map((part, i) => {
      if (!part) return null;

      // Handle internal sabiway links
      if (part.match(/^https:\/\/www\.sabiway\.com/)) {
        const path = part.replace("https://www.sabiway.com", "");
        return (
          <a href={path}
            key={i}
            // onClick={(e) => {
            //   e.preventDefault();
            //   e.stopPropagation();
            //   router.push(path);
            // }}
            className="text-[#008753] hover:underline break-all"
          >
            {part}
          </a>
        );
      }

      // Handle hashtags safely (no <a> inside <a>)
      if (part.startsWith("#")) {
        const tag = part.slice(1);
        return (
          <span
            key={i}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              router.push(`/hashtag/${encodeURIComponent(tag)}`);
            }}
            className="text-[#008753] font-medium hover:underline cursor-pointer"
          >
            {part}
          </span>
        );
      }

      // Normal text
      return <span key={i}>{part}</span>;
    });
  };

  const displayText = isExpanded
    ? content
    : content.substring(0, maxLength) +
      (content.length > maxLength ? "..." : "");

  return (
    <div className="mt-3 text-gray-800 text-sm break-words  whitespace-pre-wrap">
      {formatText(displayText)}
      {content.length > maxLength && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="ml-1 text-[#008753] font-medium hover:underline"
        >
          {isExpanded ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
};

export default ReadMoreText;
