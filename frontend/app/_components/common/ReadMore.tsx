import { useState } from "react";

const ReadMoreText = ({ content, maxLength = 120 }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!content) return null;

  // If content length is less than limit, show it all
  if (content.length <= maxLength) {
    return <p className="text-gray-800 text-sm">{content}</p>;
  }

  const displayText = isExpanded ? content : content.substring(0, maxLength) + "...";

  return (
    <div className="mt-3 text-gray-800 text-sm">
      {displayText}
      <button
        onClick={(e) => {
            e.preventDefault()        // Stop the Link from navigating
            e.stopPropagation()       // Stop the click from bubbling up
            setIsExpanded(!isExpanded)
        }}
        className="ml-1 text-blue-500 font-medium hover:underline"
        >
        {isExpanded ? "Show less" : "Read more"}
    </button>
    </div>
  );
};

export default ReadMoreText;
