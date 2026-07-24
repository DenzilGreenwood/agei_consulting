export default function Footer() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--card)] py-12">
      <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center text-sm text-[var(--muted-foreground)]">
        <div className="mb-4 md:mb-0">
          <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-blue-500 to-emerald-500 text-transparent bg-clip-text">CognitiveInsight.ai</span>
          <p className="mt-1">Enterprise AI Governance & Cryptographic Assurance</p>
        </div>
        <div>
          &copy; {new Date().getFullYear()} CognitiveInsight.ai. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
