'use client';

import React, { useState } from 'react';
import {
  X,
  MessageSquare,
  Mic,
  FileUp,
  PenTool,
  Upload,
  Loader2,
  Send,
  Sparkles,
} from 'lucide-react';

interface AddIntakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddIntakeModal({ isOpen, onClose, onSuccess }: AddIntakeModalProps) {
  const [activeTab, setActiveTab] = useState<'text' | 'audio' | 'file' | 'manual'>('text');
  const [sourceType, setSourceType] = useState('WHATSAPP');
  const [senderName, setSenderName] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [language, setLanguage] = useState('English');
  const [rawText, setRawText] = useState('');
  const [transcription, setTranscription] = useState('');
  const [attachments, setAttachments] = useState<any[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderName.trim() || (!rawText.trim() && !transcription.trim())) {
      setError('Please provide the complainant sender name and report message.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceType: activeTab === 'audio' ? 'VOICE' : sourceType,
          senderName,
          senderPhone,
          senderEmail,
          preferredLanguage: language,
          rawText: rawText || (transcription ? `[Voice Note]: ${transcription}` : ''),
          transcription: activeTab === 'audio' ? transcription : undefined,
          attachments,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to ingest intake report');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-border-light overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-border-light flex items-center justify-between bg-off-white/40">
          <div>
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-electric-blue/10 text-electric-blue text-[10px] font-bold uppercase tracking-wider mb-1">
              <Sparkles size={11} />
              <span>Intelligent Ingestion</span>
            </div>
            <h3 className="text-lg font-black text-navy">Add Incoming Citizen Report</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:text-navy cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Ingestion Mode Tabs */}
        <div className="px-6 pt-4 border-b border-border-light flex items-center gap-2 bg-off-white/20">
          <button
            type="button"
            onClick={() => {
              setActiveTab('text');
              setSourceType('WHATSAPP');
            }}
            className={`pb-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'text'
                ? 'border-navy text-navy'
                : 'border-transparent text-slate-500 hover:text-navy'
            }`}
          >
            <MessageSquare size={14} />
            <span>Paste Message</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('audio');
              setSourceType('VOICE');
            }}
            className={`pb-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'audio'
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-slate-500 hover:text-navy'
            }`}
          >
            <Mic size={14} />
            <span>Upload Audio</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('file');
              setSourceType('EMAIL');
            }}
            className={`pb-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'file'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-navy'
            }`}
          >
            <FileUp size={14} />
            <span>Upload Files</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('manual');
              setSourceType('MANUAL');
            }}
            className={`pb-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'manual'
                ? 'border-navy text-navy'
                : 'border-transparent text-slate-500 hover:text-navy'
            }`}
          >
            <PenTool size={14} />
            <span>Manual Entry</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs overflow-y-auto max-h-[70vh]">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-navy uppercase tracking-wider mb-1.5">
                Channel / Source
              </label>
              <select
                value={sourceType}
                onChange={(e) => setSourceType(e.target.value)}
                className="w-full p-2.5 bg-off-white border border-border-light rounded-xl font-semibold text-navy focus:outline-none"
              >
                <option value="WHATSAPP">WhatsApp</option>
                <option value="INSTAGRAM">Instagram DM</option>
                <option value="EMAIL">Email Grievance</option>
                <option value="VOICE">Voice Note / Hotline</option>
                <option value="WEB_FORM">Web Portal</option>
                <option value="MANUAL">Manual / Walk-in</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-navy uppercase tracking-wider mb-1.5">
                Primary Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full p-2.5 bg-off-white border border-border-light rounded-xl font-semibold text-navy focus:outline-none"
              >
                <option value="English">English</option>
                <option value="Telugu">Telugu (తెలుగు)</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-navy uppercase tracking-wider mb-1.5">
                Complainant Name
              </label>
              <input
                type="text"
                required
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="e.g. Ramesh Kumar"
                className="w-full p-2.5 bg-off-white border border-border-light rounded-xl font-semibold text-navy focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-navy uppercase tracking-wider mb-1.5">
                Phone Number / Handle
              </label>
              <input
                type="text"
                value={senderPhone}
                onChange={(e) => setSenderPhone(e.target.value)}
                placeholder="+91 98480 12345"
                className="w-full p-2.5 bg-off-white border border-border-light rounded-xl font-semibold text-navy focus:outline-none"
              />
            </div>
          </div>

          {/* Tab Specific Content */}
          {activeTab === 'audio' && (
            <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-3">
              <div className="text-center space-y-1">
                <label className="text-xs font-bold text-purple-900 cursor-pointer hover:underline">
                  Select Audio Recording (.mp3, .m4a, .ogg)
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        setTranscription(
                          `[Mock Transcription of ${f.name} (01:45)]: Complainant reported that tap water in Anandapet has been contaminated with sewage for 5 days resulting in illness.`
                        );
                        setAttachments([
                          {
                            fileName: f.name,
                            filePath: `audio/${f.name}`,
                            mimeType: f.type || 'audio/mp4',
                            size: f.size,
                            type: 'AUDIO',
                          },
                        ]);
                      }
                    }}
                    className="hidden"
                  />
                </label>
                <p className="text-[11px] text-purple-700/80">
                  Audio will be stored and automatically transcribed.
                </p>
              </div>

              {transcription && (
                <div>
                  <label className="block font-bold text-purple-900 uppercase tracking-wider mb-1">
                    Transcript Preview
                  </label>
                  <textarea
                    rows={3}
                    value={transcription}
                    onChange={(e) => setTranscription(e.target.value)}
                    className="w-full p-2.5 bg-white border border-purple-200 rounded-xl text-xs text-navy focus:outline-none"
                  />
                </div>
              )}
            </div>
          )}

          {activeTab === 'file' && (
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-center space-y-2">
              <label className="text-xs font-bold text-emerald-900 cursor-pointer hover:underline">
                Choose Document / PDF / Image (.pdf, .jpg, .png)
                <input
                  type="file"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setAttachments([
                        {
                          fileName: f.name,
                          filePath: `evidence/${f.name}`,
                          mimeType: f.type || 'application/pdf',
                          size: f.size,
                          type: 'DOCUMENT',
                        },
                      ]);
                      setRawText(
                        `Attached petition document: ${f.name}. Complainant requests inquiry into municipal land encroachment survey no 241.`
                      );
                    }
                  }}
                  className="hidden"
                />
              </label>
              <p className="text-[11px] text-emerald-700/80">
                File will be attached and made available for case evidence.
              </p>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-bold text-navy uppercase tracking-wider">
                Raw Citizen Report Text
              </label>
              <button
                type="button"
                onClick={() => {
                  setSenderName('K. Venkateswarlu');
                  setSenderPhone('+91 98480 34112');
                  setLanguage('Telugu');
                  setRawText(
                    'నమస్కారం సార్, తెనాలి ఆర్టీసీ బస్టాండ్ సమీపంలో డ్రైనేజీ లీక్ అయ్యి రోడ్డుపై మురుగునీరు ప్రవహిస్తోంది. మునిసిపల్ అధికారులకు 3 సార్లు ఫిర్యాదు చేసినా పట్టించుకోలేదు. పిల్లలు అనారోగ్యం పాలవుతున్నారు.'
                  );
                }}
                className="text-[11px] font-bold text-electric-blue hover:underline cursor-pointer"
              >
                Fill Sample Telugu Report
              </button>
            </div>
            <textarea
              rows={4}
              required={activeTab !== 'audio' || !transcription}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste the raw grievance text as received from the complainant..."
              className="w-full p-3 bg-off-white border border-border-light rounded-xl font-normal text-navy text-xs focus:outline-none focus:ring-2 focus:ring-electric-blue/30 leading-relaxed"
            />
          </div>

          <div className="pt-3 border-t border-border-light flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-navy cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-navy hover:bg-navy/90 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Ingesting & Triaging...</span>
                </>
              ) : (
                <>
                  <Send size={14} />
                  <span>Ingest & Run AI Triage</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
