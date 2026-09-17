import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCaseById } from '@/lib/cases/service';
import {
  Sparkles,
  CheckCircle2,
  HelpCircle,
  AlertTriangle,
  ArrowRight,
  FileText,
  ShieldCheck,
  Send,
  Share2,
} from 'lucide-react';

export default async function CaseOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const caseRecord = (await getCaseById(id)) as any;

  if (!caseRecord) {
    notFound();
  }

  const verifiedItems = caseRecord.verificationItems.filter((v: any) => v.status === 'VERIFIED');
  const pendingVerifications = caseRecord.verificationItems.filter((v: any) => v.status !== 'VERIFIED');
  const unverifiedClaims = caseRecord.claims.filter((c: any) => c.status !== 'SUPPORTED');
  const supportedClaims = caseRecord.claims.filter((c: any) => c.status === 'SUPPORTED');

  return (
    <div className="space-y-6">
      {/* AI Summary Banner */}
      <div className="bg-white p-6 rounded-2xl border border-surface-3 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-primary" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-primary">
              Executive Case Summary
            </h2>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
            AI Generated — Review Required
          </span>
        </div>

        <p className="text-sm text-primary leading-relaxed font-medium">
          {caseRecord.summary}
        </p>

        {caseRecord.aiPriorityReason && (
          <div className="pt-2 text-xs text-slate-500 border-t border-surface-3/60">
            <strong className="text-primary">Priority Assessment:</strong> {caseRecord.aiPriorityReason}
          </div>
        )}
      </div>

      {/* What Was Reported (Raw Source Intake) */}
      <div className="bg-white p-6 rounded-2xl border border-surface-3 shadow-xs space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          What Was Reported (Raw Intake)
        </h3>

        <div className="p-4 bg-background/70 rounded-xl border border-surface-3 font-mono text-xs text-primary leading-relaxed whitespace-pre-wrap">
          {caseRecord.sourceText || 'No raw source message recorded.'}
        </div>

        {caseRecord.sources?.[0] && (
          <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-2">
            <span>
              Intake Channel:{' '}
              <strong className="text-primary">{caseRecord.sourceType}</strong>
            </span>
            <span>
              Preferred Language:{' '}
              <strong className="text-primary">{caseRecord.sources[0].preferredLanguage}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Two Column Grid: What We Know vs What Remains Unverified */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Left: What We Know (Verified) */}
        <div className="bg-white p-6 rounded-2xl border border-surface-3 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-surface-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-success" />
              <h3 className="text-sm font-bold text-primary">What We Know (Verified)</h3>
            </div>
            <span className="text-xs font-bold text-success px-2 py-0.5 rounded bg-success/10">
              {verifiedItems.length} Corroborated
            </span>
          </div>

          {verifiedItems.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">
              No facts verified yet. Check the Verification tab to begin corroboration.
            </p>
          ) : (
            <div className="space-y-2.5">
              {verifiedItems.map((item: any) => (
                <div key={item.id} className="text-xs space-y-1">
                  <div className="flex items-start gap-2">
                    <span className="text-success font-bold mt-0.5">✓</span>
                    <span className="font-semibold text-primary leading-snug">{item.statement}</span>
                  </div>
                  {item.notes && (
                    <div className="text-[11px] text-slate-500 pl-4">{item.notes}</div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="pt-2">
            <Link
              href={`/app/cases/${caseRecord.id}/investigation`}
              className="text-xs font-bold text-success hover:underline flex items-center gap-1"
            >
              <span>View Verification Checklist</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        {/* Right: What Remains Unverified */}
        <div className="bg-white p-6 rounded-2xl border border-surface-3 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-surface-3">
            <div className="flex items-center gap-2">
              <HelpCircle size={16} className="text-amber-600" />
              <h3 className="text-sm font-bold text-primary">What Remains Unverified</h3>
            </div>
            <span className="text-xs font-bold text-amber-700 px-2 py-0.5 rounded bg-amber-100">
              {unverifiedClaims.length} Claims
            </span>
          </div>

          {unverifiedClaims.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">
              All listed claims have supporting evidence on record.
            </p>
          ) : (
            <div className="space-y-2.5">
              {unverifiedClaims.map((claim: any) => (
                <div key={claim.id} className="text-xs space-y-1">
                  <div className="flex items-start gap-2">
                    <span className="text-amber-600 font-bold mt-0.5">○</span>
                    <span className="font-semibold text-primary leading-snug">{claim.text}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 pl-4">
                    Status: <span className="font-semibold">{claim.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pt-2">
            <Link
              href={`/app/cases/${caseRecord.id}/claims`}
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
            >
              <span>Manage Claims & Statements</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </div>

      {/* Recommended Next Operational Steps */}
      <div className="bg-white p-6 rounded-2xl border border-surface-3 shadow-xs space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Recommended Next Editorial Steps
        </h3>

        <div className="grid sm:grid-cols-3 gap-4">
          <Link
            href={`/app/cases/${caseRecord.id}/evidence`}
            className="p-4 rounded-xl bg-background/60 border border-surface-3 hover:border-primary transition-colors group"
          >
            <div className="text-xs font-bold text-primary group-hover:text-primary transition-colors mb-1">
              1. Upload Primary Evidence
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Deposit OP tickets, photos, video recordings, or official petitions into the vault.
            </p>
          </Link>

          <Link
            href={`/app/cases/${caseRecord.id}/contacts`}
            className="p-4 rounded-xl bg-background/60 border border-surface-3 hover:border-warning transition-colors group"
          >
            <div className="text-xs font-bold text-primary group-hover:text-warning transition-colors mb-1">
              2. Request Right of Reply
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Issue written inquiries to concerned authorities and set statutory response deadlines.
            </p>
          </Link>

          <Link
            href={`/app/cases/${caseRecord.id}/content`}
            className="p-4 rounded-xl bg-background/60 border border-surface-3 hover:border-success transition-colors group"
          >
            <div className="text-xs font-bold text-primary group-hover:text-success transition-colors mb-1">
              3. Draft Content Dossier
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Generate Instagram Reels, YouTube scripts, or carousels with automated safety checks.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
