'use client';

import React, { useEffect, useState, useRef } from 'react';
import mermaid from 'mermaid';
import { useTheme } from 'next-themes';

mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
});

interface MermaidProps {
  chart: string;
}

export function Mermaid({ chart }: MermaidProps) {
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [id] = useState(() => `mermaid-${Math.random().toString(36).substring(2, 9)}`);

  useEffect(() => {
    const renderChart = async () => {
      try {
        setError(null);
        if (chart) {
          // mermaid.render returns an object with svg string
          const { svg: renderedSvg } = await mermaid.render(id, chart);
          setSvg(renderedSvg);
        }
      } catch (err: any) {
        console.error('Mermaid rendering failed', err);
        setError(err?.message || 'Failed to render diagram');
      }
    };

    renderChart();
  }, [chart, id]);

  if (error) {
    return (
      <div className="border border-red-500/50 bg-red-500/10 p-4 rounded-md text-red-500 font-mono text-sm overflow-x-auto whitespace-pre">
        <p className="font-bold mb-2">Mermaid Syntax Error:</p>
        {error}
      </div>
    );
  }

  return (
    <div 
      className="mermaid-container flex justify-center my-8 overflow-x-auto" 
      ref={containerRef}
      dangerouslySetInnerHTML={{ __html: svg }} 
    />
  );
}
