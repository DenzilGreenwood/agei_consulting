import fs from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, FileType } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Props {
  params: {
    slug: string;
  };
}

// Generate static params so these pages can be prerendered
export function generateStaticParams() {
  const docsDir = path.join(process.cwd(), 'public/docs/build_docs'); try {
    const files = fs.readdirSync(docsDir).filter(f => f.endsWith('.md'));
    return files.map(file => ({
      slug: file.replace(/\.md$/, ''),
    }));
  } catch {
    return [];
  }
}

export default function DocPage({ params }: Props) {
  const { slug } = params;
  const filePath = path.join(process.cwd(), 'public/docs/build_docs', `${slug}.md`);

  if (!fs.existsSync(filePath)) {
    notFound();
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const title = slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl min-h-[calc(100vh-4rem)]">

      {/* Breadcrumb / Navigation */}
      <div className="mb-8 flex items-center">
        <Link href="/docs" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group">
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Back to Documentation
        </Link>
      </div>

      {/* Doc Header */}
      <div className="mb-10 pb-6 border-b border-border">
        <h1 className="text-3xl md:text-5xl font-extrabold text-foreground tracking-tight mb-4">{title}</h1>
        <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground">
          <span className="flex items-center gap-1"><FileType className="h-3 w-3" /> {slug}.md</span>
        </div>
      </div>

      {/* Markdown Content rendered via react-markdown */}
      <article className="prose prose-sm md:prose-base dark:prose-invert prose-slate max-w-none 
                          prose-headings:text-foreground prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                          prose-code:text-primary prose-code:bg-primary/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
                          prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-pre:text-muted-foreground
                          prose-blockquote:border-l-primary prose-blockquote:bg-muted/50 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-lg
                          prose-strong:text-foreground prose-th:bg-muted prose-th:p-2 prose-td:p-2 prose-table:border-collapse">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {content}
        </ReactMarkdown>
      </article>

    </div>
  );
}
