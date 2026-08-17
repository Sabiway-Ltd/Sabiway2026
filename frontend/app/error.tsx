"use client";

import { useEffect } from "react";
import Button from "./_components/common/Button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-start justify-center gap-4 px-6 py-12" role="alert">
      <p className="text-sm font-semibold text-primary">SabiWay</p>
      <h1 className="text-2xl font-bold tracking-tight">Something went wrong</h1>
      <p className="text-muted-foreground">
        Your action has not been submitted again automatically. Try reopening this part of SabiWay.
      </p>
      <Button variant="primary" onClick={reset}>Try again</Button>
    </main>
  );
}
