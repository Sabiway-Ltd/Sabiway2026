export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="fixed left-3 top-3 z-[100] -translate-y-24 rounded-[var(--sabi-radius-md)] bg-[var(--sabi-primary-strong)] px-4 py-3 text-sm font-black text-[var(--sabi-text-inverse)] shadow-[var(--sabi-shadow-md)] transition-transform focus:translate-y-0 motion-reduce:transition-none"
    >
      Skip to main content
    </a>
  );
}
