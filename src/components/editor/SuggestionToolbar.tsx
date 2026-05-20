'use client';

import { CheckCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { SuggestionRecord } from './types';

interface SuggestionToolbarProps {
  suggestions: SuggestionRecord[];
  onAcceptAll: () => void;
  onRejectAll: () => void;
}

export function SuggestionToolbar({
  suggestions,
  onAcceptAll,
  onRejectAll,
}: SuggestionToolbarProps) {
  const pending = suggestions.filter((s) => s.status === 'pending');
  const accepted = suggestions.filter((s) => s.status === 'accepted');
  const rejected = suggestions.filter((s) => s.status === 'rejected');

  if (pending.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/40 rounded-lg text-sm text-muted-foreground">
        <CheckCheck className="w-4 h-4 text-emerald-600" />
        <span>All suggestions resolved</span>
        {accepted.length > 0 && (
          <Badge variant="outline" className="text-emerald-700 border-emerald-300 bg-emerald-50 text-xs">
            {accepted.length} accepted
          </Badge>
        )}
        {rejected.length > 0 && (
          <Badge variant="outline" className="text-destructive border-destructive/30 text-xs">
            {rejected.length} rejected
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between px-3 py-2 bg-muted/40 rounded-lg border border-border">
      <div className="flex items-center gap-2 text-sm">
        <Badge variant="secondary" className="font-mono tabular-nums">
          {pending.length}
        </Badge>
        <span className="text-muted-foreground">
          suggestion{pending.length !== 1 ? 's' : ''} pending
        </span>
        {accepted.length > 0 && (
          <span className="text-xs text-emerald-600">{accepted.length} accepted</span>
        )}
        {rejected.length > 0 && (
          <span className="text-xs text-destructive">{rejected.length} rejected</span>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={onRejectAll}
          className="h-8 gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
        >
          <X className="w-3.5 h-3.5" />
          Reject all
        </Button>
        <Button
          size="sm"
          onClick={onAcceptAll}
          className="h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <CheckCheck className="w-3.5 h-3.5" />
          Accept all
        </Button>
      </div>
    </div>
  );
}