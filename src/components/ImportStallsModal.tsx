import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  X,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Sparkles,
  Layers,
  ArrowRight,
  RefreshCw,
  FolderOpen
} from 'lucide-react';
import { Stall } from '../types';
import { parseStallsCsv } from '../utils/csvStallParser';

interface ImportStallsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportStalls: (stalls: Stall[], mode: 'replace' | 'append') => Promise<void> | void;
  existingStallsCount: number;
}

export const ImportStallsModal: React.FC<ImportStallsModalProps> = ({
  isOpen,
  onClose,
  onImportStalls,
  existingStallsCount
}) => {
  const [csvContent, setCsvContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [isLoadingPreset, setIsLoadingPreset] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Configuration options
  const [consolidateBooths, setConsolidateBooths] = useState<boolean>(true);
  const [toTitleCase, setToTitleCase] = useState<boolean>(true);
  const [importMode, setImportMode] = useState<'replace' | 'append'>('replace');
  const [defaultCategory, setDefaultCategory] = useState<string>('General Books & Fiction');

  // Parsed preview
  const [parsedStalls, setParsedStalls] = useState<Stall[]>([]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Re-parse whenever options or CSV content change
  useEffect(() => {
    if (!csvContent) {
      setParsedStalls([]);
      return;
    }
    try {
      const stalls = parseStallsCsv(csvContent, {
        consolidateBooths,
        toTitleCase,
        defaultCategory
      });
      setParsedStalls(stalls);
      setErrorMsg(stalls.length === 0 ? 'No valid stall entries detected in this CSV.' : '');
    } catch (err: any) {
      setErrorMsg('Failed to parse CSV file: ' + (err?.message || 'Invalid format'));
      setParsedStalls([]);
    }
  }, [csvContent, consolidateBooths, toTitleCase, defaultCategory]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setErrorMsg('');

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvContent(text || '');
    };
    reader.onerror = () => {
      setErrorMsg('Error reading uploaded file.');
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setErrorMsg('');

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvContent(text || '');
    };
    reader.readAsText(file);
  };

  // Quick preset loader: loads the CIBF 2026 CSV bundled in public/
  const handleLoadOfficialCibfCsv = async () => {
    setIsLoadingPreset(true);
    setErrorMsg('');
    try {
      const baseUrl = import.meta.env.BASE_URL;
      const res = await fetch(`${baseUrl}cibf_2026_stalls.csv`);
      if (!res.ok) {
        throw new Error('Failed to load cibf_2026_stalls.csv');
      }
      const text = await res.text();
      setFileName('CIBF_2026_booth_exhibitors_English_only.csv');
      setCsvContent(text);
    } catch {
      setErrorMsg('Failed to load official preset CSV. Please choose the file from Downloads.');
    } finally {
      setIsLoadingPreset(false);
    }
  };

  const handleExecuteImport = async () => {
    if (parsedStalls.length === 0) return;
    setIsSubmitting(true);
    try {
      await onImportStalls(parsedStalls, importMode);
      onClose();
    } catch (err: any) {
      setErrorMsg('Failed to save imported stalls: ' + (err?.message || 'Server error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const uniqueHallsCount = new Set(parsedStalls.map((s) => s.hall)).size;

  return (
    <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-2xl w-full p-6 sm:p-7 text-white shadow-2xl relative flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#F37021] to-[#EA580C] text-white flex items-center justify-center shadow-lg shadow-orange-500/20 flex-shrink-0">
              <Upload className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                <span>Import Fair Stalls</span>
                <span className="text-[10px] bg-[#F37021]/20 text-[#F37021] font-bold px-2 py-0.5 rounded-full border border-[#F37021]/30">
                  CSV Batch Importer
                </span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Bulk upload exhibitors from CIBF 2026 booth roster or custom spreadsheets.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto space-y-5 py-4 pr-1 scrollbar-thin">
          {/* File Upload Zone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all ${
              fileName
                ? 'border-emerald-500/50 bg-emerald-950/10'
                : 'border-zinc-700 hover:border-[#F37021] bg-zinc-950/60'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv,text/csv"
              onChange={handleFileUpload}
              className="hidden"
            />

            {fileName ? (
              <div className="flex items-center justify-between gap-3 text-left">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{fileName}</p>
                    <p className="text-[11px] text-emerald-400 font-semibold">
                      {parsedStalls.length} exhibitors parsed successfully
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-200 cursor-pointer flex-shrink-0"
                >
                  Change File
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-zinc-800 text-zinc-400 flex items-center justify-center mx-auto">
                  <FileSpreadsheet className="w-6 h-6 text-[#F37021]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-200">
                    Drag and drop your CSV file here, or{' '}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[#F37021] hover:underline font-extrabold cursor-pointer"
                    >
                      browse files
                    </button>
                  </p>
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Accepts <code className="text-zinc-400 font-mono">booth_code, exhibitor_name</code> format
                  </p>
                </div>

                {/* Instant Preset Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    disabled={isLoadingPreset}
                    onClick={handleLoadOfficialCibfCsv}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-orange-500/20 to-amber-500/20 hover:from-orange-500/30 hover:to-amber-500/30 text-[#F37021] border border-orange-500/30 text-xs font-bold transition-all cursor-pointer shadow-sm disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isLoadingPreset ? 'Loading CSV...' : '⚡ Load Official CIBF 2026 CSV (395 Booths)'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Error Notice */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Import Configuration Settings */}
          <div className="space-y-4 bg-zinc-950/60 p-4 rounded-2xl border border-zinc-800">
            <h3 className="text-xs font-black text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#F37021]" />
              <span>Import Preferences & Organization</span>
            </h3>

            {/* Booth Consolidating */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <label
                className={`p-3 rounded-xl border flex flex-col justify-between cursor-pointer transition-all ${
                  consolidateBooths
                    ? 'border-[#F37021] bg-[#F37021]/10 text-white'
                    : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black text-white">Smart Grouping (Recommended)</span>
                  <input
                    type="radio"
                    name="consolidateBooths"
                    checked={consolidateBooths}
                    onChange={() => setConsolidateBooths(true)}
                    className="accent-[#F37021]"
                  />
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Groups consecutive booths for the same publisher (e.g. A1, A2, A3 into <span className="text-orange-300 font-mono">A1 - A3</span>).
                </p>
              </label>

              <label
                className={`p-3 rounded-xl border flex flex-col justify-between cursor-pointer transition-all ${
                  !consolidateBooths
                    ? 'border-[#F37021] bg-[#F37021]/10 text-white'
                    : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black text-white">Individual Booths (1-to-1)</span>
                  <input
                    type="radio"
                    name="consolidateBooths"
                    checked={!consolidateBooths}
                    onChange={() => setConsolidateBooths(false)}
                    className="accent-[#F37021]"
                  />
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Imports each row as an individual stall (creates exactly 395 entries).
                </p>
              </label>
            </div>

            {/* Replace vs Append */}
            <div className="pt-2 border-t border-zinc-800/80">
              <label className="block text-xs font-bold text-zinc-300 mb-2">
                Database Handling Mode
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <label
                  className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    importMode === 'replace'
                      ? 'border-orange-500 bg-orange-500/10 text-white'
                      : 'border-zinc-800 bg-zinc-900/60 text-zinc-400'
                  }`}
                >
                  <div>
                    <span className="text-xs font-black block">Replace Existing Stalls</span>
                    <span className="text-[10px] text-zinc-400">
                      Replaces all {existingStallsCount} current stalls with the new import
                    </span>
                  </div>
                  <input
                    type="radio"
                    name="importMode"
                    value="replace"
                    checked={importMode === 'replace'}
                    onChange={() => setImportMode('replace')}
                    className="accent-[#F37021]"
                  />
                </label>

                <label
                  className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    importMode === 'append'
                      ? 'border-orange-500 bg-orange-500/10 text-white'
                      : 'border-zinc-800 bg-zinc-900/60 text-zinc-400'
                  }`}
                >
                  <div>
                    <span className="text-xs font-black block">Append to Existing</span>
                    <span className="text-[10px] text-zinc-400">
                      Keeps {existingStallsCount} existing stalls and merges new entries
                    </span>
                  </div>
                  <input
                    type="radio"
                    name="importMode"
                    value="append"
                    checked={importMode === 'append'}
                    onChange={() => setImportMode('append')}
                    className="accent-[#F37021]"
                  />
                </label>
              </div>
            </div>

            {/* Formatting checkboxes */}
            <div className="flex flex-wrap items-center gap-4 pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-zinc-300">
                <input
                  type="checkbox"
                  checked={toTitleCase}
                  onChange={(e) => setToTitleCase(e.target.checked)}
                  className="rounded text-[#F37021] focus:ring-[#F37021] accent-[#F37021]"
                />
                <span>Auto Title-Case (e.g. SADEEPA BOOKSHOP → Sadeepa Bookshop)</span>
              </label>
            </div>
          </div>

          {/* Live Preview Section */}
          {parsedStalls.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-zinc-300">
                  Preview ({parsedStalls.length} Stalls across {uniqueHallsCount} Halls)
                </span>
                <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Ready to Import</span>
                </span>
              </div>

              <div className="max-h-48 overflow-y-auto border border-zinc-800 rounded-xl bg-zinc-950/80 scrollbar-thin">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-zinc-900/90 text-[10px] font-black uppercase text-zinc-400 sticky top-0 border-b border-zinc-800">
                    <tr>
                      <th className="p-2.5">Publisher / Stall</th>
                      <th className="p-2.5">Hall</th>
                      <th className="p-2.5">Stall Number</th>
                      <th className="p-2.5">Category</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 font-medium">
                    {parsedStalls.slice(0, 8).map((stall, idx) => (
                      <tr key={idx} className="hover:bg-zinc-900/40">
                        <td className="p-2.5 font-bold text-white truncate max-w-[160px]">
                          {stall.name}
                        </td>
                        <td className="p-2.5 text-zinc-300 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-[10px] font-bold border border-zinc-700">
                            {stall.hall}
                          </span>
                        </td>
                        <td className="p-2.5 text-[#F37021] font-mono font-bold whitespace-nowrap">
                          {stall.stallNumber}
                        </td>
                        <td className="p-2.5 text-zinc-400 truncate max-w-[140px]">
                          {stall.category}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedStalls.length > 8 && (
                <p className="text-[11px] text-zinc-500 text-right">
                  + {parsedStalls.length - 8} more stalls will be imported
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-zinc-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={parsedStalls.length === 0 || isSubmitting}
            onClick={handleExecuteImport}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#F37021] to-[#EA580C] hover:from-[#EA580C] hover:to-[#C2410C] text-white font-black text-xs transition-all shadow-md shadow-orange-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Importing Stalls...</span>
              </>
            ) : (
              <>
                <span>Import {parsedStalls.length > 0 ? `${parsedStalls.length} Stalls` : 'Stalls'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
