'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';

interface AuditFinding {
  dimension: 'blooms' | 'topics' | 'command_words' | 'marks';
  status: 'passed' | 'flagged';
  description: string;
  citation?: string;
}

interface AuditResult {
  overall_score: number;
  status: 'passed' | 'flagged';
  findings: AuditFinding[];
}

interface AuditResultsDisplayProps {
  assessmentId: string;
  initialStatus?: string;
}

export const AuditResultsDisplay: React.FC<AuditResultsDisplayProps> = ({ assessmentId, initialStatus }) => {
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(initialStatus || 'not_audited');

  const fetchAuditResult = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/assessments/${assessmentId}/audit`);
      const data = await response.json();
      setAuditResult(data);
      setStatus(data.status);
    } catch (error) {
      console.error('Failed to fetch audit result:', error);
    } finally {
      setLoading(false);
    }
  };

  const triggerAudit = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/assessments/${assessmentId}/audit`, { method: 'POST' });
      const data = await response.json();
      setAuditResult(data);
      setStatus(data.status);
    } catch (error) {
      console.error('Failed to trigger audit:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status !== 'not_audited') {
      fetchAuditResult();
    }
  }, [assessmentId, status]);

  if (status === 'not_audited') {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Assessment Audit</CardTitle>
          <CardDescription>This assessment has not been audited against the curriculum schema yet.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={triggerAudit} disabled={loading}>
            {loading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : 'Run Audit Now'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (loading && !auditResult) return <div>Loading audit results...</div>;

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle>Audit Results</CardTitle>
          <CardDescription>Overall Score: {auditResult?.overall_score.toFixed(0)}%</CardDescription>
        </div>
        <Badge variant={status === 'passed' ? 'default' : 'destructive'}>
          {status.toUpperCase()}
        </Badge>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-4">
          {auditResult?.findings.map((finding, index) => (
            <div key={index} className="flex items-start space-x-3 border-b pb-3 last:border-0">
              {finding.status === 'passed' ? (
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
              )}
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none capitalize">{finding.dimension.replace('_', ' ')}</p>
                <p className="text-sm text-muted-foreground">{finding.description}</p>
                {finding.citation && (
                  <p className="text-xs text-blue-600 italic">{finding.citation}</p>
                )}
              </div>
            </div>
          ))}
        </div>
        <Button variant="outline" className="mt-4 w-full" onClick={triggerAudit} disabled={loading}>
          {loading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : 'Re-run Audit'}
        </Button>
      </CardContent>
    </Card>
  );
};
