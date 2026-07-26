import Link from 'next/link';
import { BookOpen, FileJson, FileCode2, Database, ShieldCheck, ChevronRight, LayoutGrid } from 'lucide-react';

export const metadata = {
  title: 'Documentation Hub | AGEI',
  description: 'Technical blueprints and design specifications for AGEI.',
};

export default function DocsLandingPage() {
  const docSections = [
    {
      title: "Event Payload Specification",
      description: "The canonical Developer Reference for implementing event logging and cryptographic receipt generation within the AGEI.",
      href: "/docs/payload-specification",
      icon: <FileJson className="h-8 w-8 text-primary" />,
      color: "from-blue-500/20 to-cyan-500/10",
      status: "Ready"
    },
    {
      title: "Python Implementation Guide",
      description: "Learn how to translate raw operational events into cryptographically bound, relational database records using Python.",
      href: "/docs/python-implementation",
      icon: <FileCode2 className="h-8 w-8 text-primary" />,
      color: "from-emerald-500/20 to-green-500/10",
      status: "Ready"
    },
    {
      title: "Database Security & Schema",
      description: "Detailed breakdown of database indices, schema structure, and Row-Level Security (RLS) policies for multi-tenant isolation.",
      href: "/docs/database-schema",
      icon: <Database className="h-8 w-8 text-primary" />,
      color: "from-purple-500/20 to-indigo-500/10",
      status: "Ready"
    }
  ];

  return (
    <div className="container mx-auto px-4 py-16 max-w-6xl min-h-[calc(100vh-4rem)]">
      
      {/* Hero Section */}
      <div className="flex flex-col items-center text-center mb-16 space-y-4">
        <div className="bg-primary/10 p-4 rounded-full mb-2">
          <BookOpen className="h-12 w-12 text-primary" />
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-foreground tracking-tight">
          AGEI Engineering Hub
        </h1>
        <p className="text-muted-foreground text-xl max-w-2xl leading-relaxed">
          Technical blueprints, system architectures, and component specifications that power the AI Governance Evidence Infrastructure.
        </p>
      </div>

      {/* Docs Grid */}
      <div className="mb-12">
        <div className="flex items-center gap-2 mb-6 pb-2 border-b border-border">
          <LayoutGrid className="h-6 w-6 text-foreground" />
          <h2 className="text-2xl font-bold">Core Documentation</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {docSections.map((section, idx) => (
            <Link 
              key={idx} 
              href={section.href}
              className={`group relative flex flex-col h-full bg-card border border-border rounded-2xl p-6 overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-primary/50 ${section.status === 'Coming Soon' ? 'opacity-70 pointer-events-none' : ''}`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${section.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
              
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-6">
                  <div className="p-3 bg-background rounded-xl shadow-sm border border-border">
                    {section.icon}
                  </div>
                  {section.status === 'Coming Soon' && (
                    <span className="bg-muted text-muted-foreground text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                      Coming Soon
                    </span>
                  )}
                </div>
                
                <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
                  {section.title}
                </h3>
                
                <p className="text-muted-foreground text-sm leading-relaxed mb-6 flex-grow">
                  {section.description}
                </p>
                
                {section.status !== 'Coming Soon' && (
                  <div className="flex items-center text-primary text-sm font-semibold mt-auto opacity-80 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                    Read Documentation <ChevronRight className="h-4 w-4 ml-1" />
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Additional Resources */}
      <div className="mt-24 pt-12 border-t border-border grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2 mb-4">
            <ShieldCheck className="h-6 w-6 text-primary" />
            The "Proof, Not Logs" Invariant
          </h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Traditional enterprise setups rely on flat, mutable text logs that are vulnerable to administrative tampering. Under our paradigm, every critical AI lifecycle transition is captured as a cryptographically signed, immutable Receipt.
          </p>
        </div>
      </div>

    </div>
  );
}
