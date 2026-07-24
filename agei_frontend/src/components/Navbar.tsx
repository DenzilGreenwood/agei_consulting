import Link from "next/link";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center px-4">
        <div className="flex w-full justify-between items-center">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-blue-500 to-emerald-500 text-transparent bg-clip-text">
              CognitiveInsight.ai
            </span>
          </Link>
          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium">
            <Link href="/why-governance-fails" className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
              Why Governance Fails
            </Link>
            <Link href="/services" className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
              Solutions
            </Link>
            <Link href="/methodology" className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
              Methodology
            </Link>
            <Link href="/advisory" className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
              Advisory
            </Link>
            <Link href="/diagnostic" className="bg-[var(--accent)] text-[var(--background)] hover:opacity-90 transition-opacity px-4 py-2 rounded-md font-semibold">
              Assurance Diagnostic
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
