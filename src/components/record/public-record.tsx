"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ProofOfLearningRecord from "./proof-of-learning-record";

// Thin wrapper — fetches from public API and passes to the shared record component
export default function PublicRecord() {
  const params = useParams();
  const studentId = params.studentId as string;
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Inject public API override so ProofOfLearningRecord fetches from public endpoint
    (window as unknown as Record<string, unknown>).__MIRROR_RECORD_PUBLIC__ = true;
    setReady(true);
  }, []);

  if (!ready) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Public header */}
      <div className="border-b border-border bg-card px-6 py-3 flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
          <span className="text-xs font-bold text-primary-foreground">M</span>
        </div>
        <span className="text-sm font-semibold text-foreground">Mirror</span>
        <span className="text-xs text-muted-foreground ml-auto">Verified proof of learning</span>
      </div>
      <ProofOfLearningRecord isPublic />
    </div>
  );
}