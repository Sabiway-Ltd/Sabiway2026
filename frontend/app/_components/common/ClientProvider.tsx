// app/_components/common/ClientProvider.tsx
"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

export default function ClientProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <>
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
          <div className="h-12 w-12 border-4 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {children}
    </>
  );
}
