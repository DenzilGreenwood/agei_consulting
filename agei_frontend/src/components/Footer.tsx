import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card py-12">
      <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
        <div className="mb-4 md:mb-0">
          <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-blue-500 to-emerald-500 text-transparent bg-clip-text">CognitiveInsight.ai</span>
          <p className="mt-1">Enterprise AI Governance & Cryptographic Assurance</p>
        </div>
        <div className="text-left md:text-right mt-4 md:mt-0">
          <div>&copy; {new Date().getFullYear()} CognitiveInsight.ai. All rights reserved.</div>
          <div className="mt-1.5 text-xs opacity-75 max-w-sm md:ml-auto">
            Code blueprints and documentation provided on this site are licensed under the <Link href="/license" className="underline hover:text-primary transition-colors">Business Source License 1.1</Link> (BUSL-1.1).
          </div>
        </div>
      </div>
    </footer>
  );
}
