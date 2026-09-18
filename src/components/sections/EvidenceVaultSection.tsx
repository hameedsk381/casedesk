'use client';

import React from 'react';
import SectionHeading from '@/components/ui/SectionHeading';
import AnimateOnScroll from '@/components/ui/AnimateOnScroll';
import Badge from '@/components/ui/Badge';
import {
  FileText,
  Image,
  Video,
  Mic,
  MessageSquare,
  StickyNote,
  Lock,
  Eye,
} from 'lucide-react';

const categories = [
  { icon: <FileText size={16} />, label: 'Documents', count: 4 },
  { icon: <Image size={16} />, label: 'Photos', count: 7 },
  { icon: <Video size={16} />, label: 'Videos', count: 2 },
  { icon: <Mic size={16} />, label: 'Audio', count: 3 },
  { icon: <MessageSquare size={16} />, label: 'Messages', count: 12 },
  { icon: <StickyNote size={16} />, label: 'Notes', count: 5 },
];

const files = [
  { name: 'Complaint.pdf', type: 'PDF', size: '245 KB', icon: <FileText size={18} />, color: 'text-destructive' },
  { name: 'Medical_Record.pdf', type: 'PDF', size: '1.2 MB', icon: <FileText size={18} />, color: 'text-destructive' },
  { name: 'Interview.mp4', type: 'Video', size: '48 MB', icon: <Video size={18} />, color: 'text-primary' },
  { name: 'Hospital_Photo.jpg', type: 'Image', size: '3.1 MB', icon: <Image size={18} />, color: 'text-success' },
];

export default function EvidenceVaultSection() {
  return (
    <section className="py-20 lg:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <AnimateOnScroll>
          <SectionHeading
            eyebrow="Evidence Vault"
            headline={
              <>
                Everything the case needs.
                <br />
                <span className="text-muted-foreground">In one place.</span>
              </>
            }
          />
        </AnimateOnScroll>

        <div className="mt-14 max-w-4xl mx-auto">
          <AnimateOnScroll delay={100}>
            <div className="bg-white rounded-xl border border-surface-3 shadow-sm overflow-hidden">
              {/* Toolbar */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-surface-3 bg-surface/40">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-primary">Evidence</h3>
                  <Badge variant="neutral">33 items</Badge>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Lock size={10} /> Controlled Access
                  </span>
                </div>
              </div>

              {/* Categories */}
              <div className="flex flex-wrap gap-2 px-5 py-3 border-b border-surface-3">
                {categories.map((cat, i) => (
                  <button
                    key={cat.label}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      i === 0
                        ? 'bg-primary text-white'
                        : 'text-muted-foreground hover:bg-surface hover:text-primary'
                    }`}
                  >
                    {cat.icon}
                    {cat.label}
                    <span className={`ml-0.5 ${i === 0 ? 'text-white/70' : 'text-muted-foreground'}`}>
                      {cat.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* File list */}
              <div className="divide-y divide-surface-3">
                {files.map((file) => (
                  <div
                    key={file.name}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-surface/30 transition-colors cursor-pointer group"
                  >
                    <div className={`w-9 h-9 rounded-lg bg-background border border-surface-3 flex items-center justify-center ${file.color}`}>
                      {file.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-primary block truncate">{file.name}</span>
                      <span className="text-[11px] text-muted-foreground">{file.type} · {file.size}</span>
                    </div>
                    <Eye size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))}
              </div>
            </div>
          </AnimateOnScroll>
        </div>
      </div>
    </section>
  );
}
