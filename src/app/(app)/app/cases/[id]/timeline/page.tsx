import React from 'react';
import { notFound } from 'next/navigation';
import { getCaseById } from '@/lib/cases/service';
import { Clock, Plus, Calendar } from 'lucide-react';

export default async function CaseTimelinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const caseRecord = (await getCaseById(id)) as any;

  if (!caseRecord) {
    notFound();
  }

  const events = caseRecord.events;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-primary">Chronological Case Timeline</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Audit history of citizen interactions, documentary uploads, right-of-reply notices, and status changes.
          </p>
        </div>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-surface-3 shadow-xs">
        {events.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            No events recorded yet.
          </div>
        ) : (
          <div className="relative pl-6 border-l-2 border-surface-3 space-y-8">
            {events.map((ev: any, index: number) => (
              <div key={ev.id} className="relative group">
                {/* Node dot */}
                <span className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white bg-primary ring-4 ring-primary/10" />

                <div>
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="text-xs font-bold text-primary">{ev.title}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 uppercase tracking-wider">
                      {ev.type.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[11px] text-slate-500 ml-auto">
                      {new Date(ev.eventDate).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  {ev.description && (
                    <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                      {ev.description}
                    </p>
                  )}

                  {ev.createdBy && (
                    <div className="mt-2 text-[10px] text-slate-500">
                      Logged by {ev.createdBy.name}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
