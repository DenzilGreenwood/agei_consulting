import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center px-4">
        <div className="flex w-full justify-between items-center">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-blue-500 to-emerald-500 text-transparent bg-clip-text">
              CognitiveInsight.ai
            </span>
          </Link>
          <div className="flex items-center space-x-4">
            <nav className="hidden md:flex items-center space-x-8 text-sm font-medium">
              <Link href="/why-governance-fails" className="text-muted-foreground hover:text-foreground transition-colors">
                Why Governance Fails
              </Link>
              <Link href="/services" className="text-muted-foreground hover:text-foreground transition-colors">
                Solutions
              </Link>
              <Link href="/methodology" className="text-muted-foreground hover:text-foreground transition-colors">
                Methodology
              </Link>
              <Link href="/pricing-and-outcomes" className="text-muted-foreground hover:text-foreground transition-colors">
                Pricing and Outcomes
              </Link>
              <Link href="/example" className="text-muted-foreground hover:text-foreground transition-colors">
                Example
              </Link>
              <Link href="/shadow-ai" className="text-muted-foreground hover:text-foreground transition-colors">
                Shadow AI
              </Link>
              <Link href="/docs" className="text-muted-foreground hover:text-foreground transition-colors font-semibold">
                Docs
              </Link>
              <Link href="/diagnostic" className="bg-primary text-primary-foreground hover:opacity-90 transition-opacity px-4 py-2 rounded-md font-semibold">
                Assurance Diagnostic
              </Link>
            </nav>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}