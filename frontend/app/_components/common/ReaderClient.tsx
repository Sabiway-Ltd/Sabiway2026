// app/_components/common/ReaderClient.tsx

"use client";

import { useState, useEffect } from "react";
import { Worker, Viewer, SpecialZoomLevel } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";

interface ReaderClientProps {
  file: string;
}

export default function ReaderClient({ file }: ReaderClientProps) {
  const [height, setHeight] = useState(0);

  // Fixes infinite rerendering by locking the container height
  useEffect(() => {
    const handleResize = () => {
      setHeight(window.innerHeight);
    };

    handleResize(); // initial set
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!file) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-600 text-xl">No book selected</p>
      </div>
    );
  }

  return (
    <div
      className="w-full bg-gray-50 dark:bg-gray-900"
      style={{ height: height - 90 }}   // FIXED HEIGHT → prevents Viewer from re-rendering infinitely
    >
      <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
        <Viewer
          fileUrl={file}
          defaultScale={SpecialZoomLevel.PageWidth}
          renderLoader={() => (
            <div className="flex items-center justify-center h-full">
              <div className="w-10 h-10 animate-spin rounded-full border-4 border-t-[#008753] border-gray-300"></div>
            </div>
          )}
        />
      </Worker>
    </div>
  );
}