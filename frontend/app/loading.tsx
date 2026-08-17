export default function Loading() {
  return (
    <main className="flex min-h-[50vh] w-full items-center justify-center p-6" aria-busy="true" aria-live="polite">
      <div className="flex items-center gap-3 text-muted-foreground">
        <span
          className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-primary motion-reduce:animate-none"
          aria-hidden="true"
        />
        <span className="text-sm font-medium">Loading SabiWay…</span>
      </div>
    </main>
  );
}
