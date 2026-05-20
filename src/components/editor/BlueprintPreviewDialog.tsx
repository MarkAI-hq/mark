'use client';

import { useEffect, useRef, useState } from 'react';
import { Download, X, ArrowRight, FileText, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BlueprintPreviewDialogProps {
  open:           boolean;
  originalHtml:   string;
  revisedHtml:    string;
  onDownload:     () => void;
  onClose:        () => void;
  isDownloading?: boolean;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitIntoParagraphs(html: string): string[] {
  return html
    .split(/<\/p>/i)
    .map(chunk => chunk.replace(/<[^>]+>/g, '').trim())
    .filter(Boolean);
}

function DocumentPanel({
  title,
  icon,
  accent,
  paragraphs,
  badge,
}: {
  title:      string;
  icon:       React.ReactNode;
  accent:     string;
  paragraphs: string[];
  badge?:     string;
}) {
  return (
    <div className="flex flex-col flex-1 min-w-0 h-full">
      {/* Panel header */}
      <div
        className="flex items-center justify-between px-5 py-3 border-b shrink-0"
        style={{ background: accent + '18' }}
      >
        <div className="flex items-center gap-2">
          <span style={{ color: accent }}>{icon}</span>
          <span className="text-sm font-semibold" style={{ color: accent }}>{title}</span>
        </div>
        {badge && (
          <span
            className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
            style={{ background: accent + '22', color: accent }}
          >
            {badge}
          </span>
        )}
      </div>

      {/* Panel content */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
        {paragraphs.map((p, i) => (
          <p
            key={i}
            className="text-sm leading-relaxed text-foreground/80 border-b border-border/30 pb-4 last:border-0 last:pb-0"
          >
            {p}
          </p>
        ))}
      </div>
    </div>
  );
}

export function BlueprintPreviewDialog({
  open,
  originalHtml,
  revisedHtml,
  onDownload,
  onClose,
  isDownloading = false,
}: BlueprintPreviewDialogProps) {
  const [visible, setVisible] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [open]);

  if (!open) return null;

  const originalParagraphs = splitIntoParagraphs(originalHtml);
  const revisedParagraphs  = splitIntoParagraphs(revisedHtml);

  return (
    <div
      ref={overlayRef}
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300',
        visible ? 'opacity-100' : 'opacity-0',
      )}
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div
        className={cn(
          'flex flex-col w-full bg-background rounded-2xl shadow-2xl border border-border overflow-hidden transition-all duration-300',
          visible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4',
        )}
        style={{ maxWidth: '960px', height: '86vh' }}
      >

        {/* ── Header ── */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b shrink-0"
          style={{ background: 'linear-gradient(to right, #f5edda, #fffdf8)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center w-8 h-8 rounded-lg"
              style={{ background: '#c9a84c22' }}
            >
              <Sparkles className="w-4 h-4" style={{ color: '#c9a84c' }} />
            </div>
            <div>
              <h2 className="text-sm font-bold" style={{ color: '#7a6230' }}>Blueprint Preview</h2>
              <p className="text-[11px] text-muted-foreground">Review changes before downloading</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* ── Column labels ── */}
        <div className="grid grid-cols-[1fr_auto_1fr] shrink-0 border-b bg-muted/20">
          <div className="px-5 py-2 flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-medium">Original Assessment</span>
          </div>
          <div className="flex items-center justify-center w-10 border-x border-border bg-muted/30">
            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <div className="px-5 py-2 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5" style={{ color: '#c9a84c' }} />
            <span className="text-xs font-medium" style={{ color: '#7a6230' }}>Redesigned Blueprint</span>
          </div>
        </div>

        {/* ── Side by side panels ── */}
        <div className="flex-1 grid grid-cols-[1fr_auto_1fr] overflow-hidden min-h-0">

          {/* Left — Original */}
          <div className="overflow-y-auto px-5 py-5 space-y-4 border-r border-border">
            {originalParagraphs.map((p, i) => (
              <p
                key={i}
                className="text-sm leading-relaxed text-muted-foreground border-b border-border/30 pb-4 last:border-0 last:pb-0"
              >
                {p}
              </p>
            ))}
          </div>

          {/* Divider */}
          <div className="w-10 bg-muted/20 border-x border-border flex flex-col items-center pt-6 gap-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="w-1 h-1 rounded-full"
                style={{ background: '#c9a84c', opacity: 0.3 + (i % 3) * 0.2 }}
              />
            ))}
          </div>

          {/* Right — Revised */}
          <div className="overflow-y-auto px-5 py-5 space-y-4">
            {revisedParagraphs.map((p, i) => {
              const isNew = !originalParagraphs.some(op =>
                op.slice(0, 40) === p.slice(0, 40)
              );
              return (
                <p
                  key={i}
                  className={cn(
                    'text-sm leading-relaxed border-b border-border/30 pb-4 last:border-0 last:pb-0 transition-colors',
                    isNew
                      ? 'text-foreground font-medium'
                      : 'text-foreground/80',
                  )}
                  style={isNew ? {
                    borderLeft: '2px solid #c9a84c',
                    paddingLeft: '10px',
                    marginLeft: '-12px',
                  } : {}}
                >
                  {p}
                </p>
              );
            })}
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-4 border-t shrink-0 flex items-center justify-between bg-muted/10">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div
              className="w-2.5 h-2.5 rounded-sm border-l-2"
              style={{ borderColor: '#c9a84c' }}
            />
            <span>Gold bar = new or modified content</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Back to Editor
            </Button>
            <Button
              size="sm"
              disabled={isDownloading}
              onClick={onDownload}
              className="gap-2 border-0 text-white"
              style={{ background: isDownloading ? '#a8893d' : '#c9a84c' }}
            >
              {isDownloading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  Download Blueprint
                </>
              )}
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}