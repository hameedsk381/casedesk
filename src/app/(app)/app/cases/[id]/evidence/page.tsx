'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Upload,
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  Download,
  Trash2,
  ExternalLink,
  Plus,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FolderOpen,
} from 'lucide-react';

const FILTER_TABS = ['ALL', 'DOCUMENT', 'IMAGE', 'VIDEO', 'AUDIO'];

export default function CaseEvidencePage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params.id as string;

  const [evidenceList, setEvidenceList] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchEvidence = async () => {
    try {
      const res = await fetch(`/api/cases/${caseId}`);
      const data = await res.json();
      setEvidenceList(data.evidence || []);
    } catch (err) {
      console.error('Failed to fetch evidence:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvidence();
  }, [caseId]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      if (description) formData.append('description', description);

      const res = await fetch(`/api/cases/${caseId}/evidence`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      setSelectedFile(null);
      setDescription('');
      setShowUploadModal(false);
      fetchEvidence();
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (evidenceId: string) => {
    if (!confirm('Are you sure you want to delete this evidence file from local storage?')) return;

    try {
      await fetch(`/api/evidence/${evidenceId}`, { method: 'DELETE' });
      setEvidenceList((prev) => prev.filter((e) => e.id !== evidenceId));
      router.refresh();
    } catch (err) {
      console.error('Failed to delete evidence:', err);
    }
  };

  const filteredEvidence = evidenceList.filter((e) => {
    if (activeTab === 'ALL') return true;
    return e.type === activeTab;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'IMAGE':
        return <ImageIcon size={20} className="text-teal" />;
      case 'VIDEO':
        return <Video size={20} className="text-electric-blue" />;
      case 'AUDIO':
        return <Music size={20} className="text-coral" />;
      default:
        return <FileText size={20} className="text-navy" />;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-border-light p-12 flex justify-center">
        <Loader2 size={24} className="animate-spin text-electric-blue" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Evidence Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-navy">Evidence Vault</h2>
          <p className="text-xs text-slate mt-0.5">
            Encrypted local filesystem storage for documents, photos, audio notes, and video proof.
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="py-2.5 px-4 bg-navy hover:bg-navy/90 text-white font-semibold rounded-xl text-xs shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <Upload size={14} />
          <span>Upload Evidence</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 border-b border-border-light pb-2 overflow-x-auto">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === tab
                ? 'bg-navy text-white'
                : 'text-slate-500 hover:text-navy hover:bg-slate-100'
            }`}
          >
            {tab === 'ALL' ? 'All Files' : `${tab.charAt(0) + tab.slice(1).toLowerCase()}s`}
          </button>
        ))}
      </div>

      {/* Evidence Cards Grid */}
      {filteredEvidence.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-border-light text-center">
          <FolderOpen size={32} className="mx-auto text-slate-300 mb-2" />
          <h3 className="text-sm font-bold text-navy">No files in this category</h3>
          <p className="text-xs text-slate mt-1 max-w-sm mx-auto">
            Upload official government petitions, photos, hospital slips, or witness audio to corroborate case claims.
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {filteredEvidence.map((item) => (
            <div
              key={item.id}
              className="bg-white p-5 rounded-2xl border border-border-light shadow-xs flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-off-white border border-border-light flex items-center justify-center shrink-0">
                    {getTypeIcon(item.type)}
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wider">
                    {item.type}
                  </span>
                </div>

                <h3 className="text-xs font-bold text-navy break-all line-clamp-1 group-hover:text-electric-blue transition-colors">
                  {item.name}
                </h3>
                <p className="mt-1.5 text-xs text-slate line-clamp-2 leading-relaxed">
                  {item.description || 'No description provided.'}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-border-light/60 flex items-center justify-between text-[11px] text-slate-500">
                <span>{(item.size / 1024).toFixed(1)} KB</span>
                <div className="flex items-center gap-2">
                  <a
                    href={`/api/evidence/${item.id}/download`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 text-slate-600 hover:text-navy hover:bg-slate-100 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                    title="View / Download"
                  >
                    <Download size={13} />
                    <span>Download</span>
                  </a>

                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 text-slate-500 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                    title="Delete file"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/40 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-border-light p-6 space-y-4">
            <h3 className="text-base font-bold text-navy">Upload Evidence to Vault</h3>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle size={15} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleUpload} className="space-y-4">
              <div className="p-6 border-2 border-dashed border-border-light rounded-2xl text-center space-y-2 bg-off-white/30">
                <Upload size={24} className="mx-auto text-slate-500" />
                <div>
                  <label className="text-xs font-bold text-electric-blue hover:underline cursor-pointer">
                    Click to select file from your device
                    <input
                      type="file"
                      required
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Documents (PDF, XLSX), Images (JPG, PNG), Video (MP4), or Audio (MP3, WAV)
                  </p>
                </div>
                {selectedFile && (
                  <div className="text-xs font-semibold text-navy bg-white py-1 px-3 rounded-lg border border-border-light inline-block mt-2">
                    Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1.5">
                  File Description / Context
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Hospital admission record Bed 14 with doctor prescription timestamp."
                  className="w-full p-3 bg-off-white/40 border border-border-light rounded-xl text-xs text-navy focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border-light">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-navy cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !selectedFile}
                  className="px-4 py-2 bg-navy text-white text-xs font-semibold rounded-xl cursor-pointer disabled:opacity-50"
                >
                  {uploading ? 'Uploading...' : 'Save to Vault'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
