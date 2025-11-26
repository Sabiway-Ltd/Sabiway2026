"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

export default function ClientProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [loading, setLoading] = useState(true); // start as true for initial page load
  const [prevPath, setPrevPath] = useState(pathname);

  // Detect route changes
  useEffect(() => {
    if (pathname !== prevPath) {
      setLoading(true); // show loader on route change
      setPrevPath(pathname);
    }
  }, [pathname, prevPath]);

  // Hide loader after component mounts / page renders
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 200); // small delay for smoothness
    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <>
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-gray-300/20">
          <div className="relative flex flex-col items-center">
            <div className="h-12 w-12 border-4 border-gray-300 border-t-[#008753] rounded-full animate-spin" />
            <p className="mt-3 text-gray-700 text-sm font-medium">Loading...</p>
          </div>
        </div>
      )}
      {children}
    </>
  );
}
