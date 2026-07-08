import React, { useState, useMemo } from 'react';
import { SequenceType, ORF } from '../types';
import { findORFs, CODON_TABLE, AA_NAMES, translateFrame } from '../utils/bioUtils';
import { Search, Copy, Check, Info, FileText, ArrowUpDown, ChevronRight, Activity, HelpCircle } from 'lucide-react';

interface TranslationOrfFinderProps {
  sequence: string;
  detectedType: SequenceType;
  minOrfLength: number;
  setMinOrfLength: (len: number) => void;
  onHighlightRegion: (start: number, end: number, label: string, color: string, sourceType: 'orf') => void;
}

export const TranslationOrfFinder: React.FC<TranslationOrfFinderProps> = ({
  sequence,
  detectedType,
  minOrfLength,
  setMinOrfLength,
  onHighlightRegion,
}) => {
  // Local state for codon lookup
  const [codonInput, setCodonInput] = useState<string>('ATG');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedOrf, setSelectedOrf] = useState<ORF | null>(null);
  const [selectedFrame, setSelectedFrame] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const isNucleic = detectedType === 'DNA' || detectedType === 'RNA';

  // Ensure we work with DNA representation for finding ORFs
  const dnaRepresentation = useMemo(() => {
    if (detectedType === 'RNA') {
      return sequence.replace(/U/g, 'T');
    }
    return sequence;
  }, [sequence, detectedType]);

  // Find ORFs
  const allOrfs = useMemo(() => {
    if (!isNucleic || !dnaRepresentation) return [];
    return findORFs(dnaRepresentation, minOrfLength);
  }, [dnaRepresentation, isNucleic, minOrfLength]);

  // Filter ORFs based on search term
  const filteredOrfs = useMemo(() => {
    return allOrfs.filter(orf => {
      const searchLower = searchTerm.toLowerCase();
      return (
        orf.id.toLowerCase().includes(searchLower) ||
        `cadre ${orf.frame > 0 ? '+' : ''}${orf.frame}`.toLowerCase().includes(searchLower) ||
        orf.lengthBp.toString().includes(searchTerm) ||
        orf.lengthAa.toString().includes(searchTerm)
      );
    });
  }, [allOrfs, searchTerm]);

  // Translate specific frame for the visualizer
  const frameTranslation = useMemo(() => {
    if (!isNucleic || !sequence) return [];
    
    // We will align nucleotides with amino acids for the selected frame
    const arr: { codon: string; aa: string; pos: number }[] = [];
    const standardSeq = detectedType === 'RNA' ? sequence : sequence; // Keep as is to match input bases
    const offset = Math.abs(selectedFrame) - 1;

    let targetSeq = standardSeq;
    if (selectedFrame < 0) {
      // For reverse frames, work with reverse complement
      const complements: Record<string, string> = {
        'A': 'T', 'T': 'A', 'C': 'G', 'G': 'C', 'N': 'N',
        'U': 'A', 'R': 'Y', 'Y': 'R', 'S': 'S', 'W': 'W'
      };
      targetSeq = standardSeq.split('').reverse().map(b => complements[b] || b).join('');
    }

    for (let i = offset; i <= targetSeq.length - 3; i += 3) {
      const codon = targetSeq.substring(i, i + 3);
      const aa = CODON_TABLE[codon.replace(/T/g, 'U')] || '?';
      arr.push({ codon, aa, pos: i + 1 });
    }

    return arr;
  }, [sequence, detectedType, selectedFrame, isNucleic]);

  // Decoded codon data
  const decodedCodon = useMemo(() => {
    const clean = codonInput.trim().toUpperCase();
    if (clean.length !== 3) return null;
    const aa = CODON_TABLE[clean.replace(/T/g, 'U')];
    if (!aa) return null;
    const details = AA_NAMES[aa];
    return {
      aa,
      ...details
    };
  }, [codonInput]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSelectOrf = (orf: ORF) => {
    setSelectedOrf(orf);
    // Highlight on linear map and sequencer
    onHighlightRegion(
      orf.start,
      orf.end,
      `ORF ${orf.frame > 0 ? '+' : ''}${orf.frame} (${orf.lengthAa} aa)`,
      orf.frame > 0 ? '#10B981' : '#F59E0B',
      'orf'
    );
  };

  if (!isNucleic) {
    return (
      <div id="orf-disabled-container" className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-400 flex flex-col items-center justify-center gap-4">
        <HelpCircle className="w-12 h-12 text-slate-300 stroke-1" />
        <div>
          <p className="font-semibold text-slate-700">Traduction & Recherche d'ORFs Non Applicables</p>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-2">
            La séquence détectée est une protéine (séquence d'acides aminés). La traduction de codons et l'identification des cadres de lecture ouverts (ORFs) ne s'appliquent qu'aux nucléotides d'ADN ou d'ARN.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div id="translation-orf-finder-container" className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      
      {/* 1. ORF Finder Table (Spans 2 cols) */}
      <div className="xl:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-800">
              Cadres de Lecture Ouverts Détectés (ORFs)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Régions potentielles codant pour des protéines, commençant par ATG et finissant par un STOP.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Length slider */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
              <span className="text-xs font-semibold text-slate-600">Longueur min :</span>
              <input
                id="min-orf-length-slider"
                type="range"
                min="10"
                max="150"
                step="5"
                value={minOrfLength}
                onChange={(e) => setMinOrfLength(parseInt(e.target.value, 10))}
                className="w-20 accent-emerald-600"
              />
              <span className="text-xs font-bold text-emerald-600 font-mono w-14 text-right">
                {minOrfLength} aa
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                id="orf-search-input"
                type="text"
                placeholder="Filtrer ORFs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 w-36"
              />
            </div>
          </div>
        </div>

        {/* ORF Table */}
        <div className="border border-slate-100 rounded-xl overflow-hidden max-h-[280px] overflow-y-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-600 font-bold sticky top-0">
                <th className="p-3">Cadre</th>
                <th className="p-3">Coordonnées (Brin direct)</th>
                <th className="p-3">Longueur (bp / aa)</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredOrfs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-400">
                    Aucun ORF correspondant aux critères. Ajustez la longueur minimale.
                  </td>
                </tr>
              ) : (
                filteredOrfs.map((orf) => {
                  const isSelected = selectedOrf?.id === orf.id;
                  const isDirect = orf.frame > 0;
                  return (
                    <tr
                      id={`orf-row-${orf.id}`}
                      key={orf.id}
                      className={`hover:bg-slate-50 transition-colors cursor-pointer ${
                        isSelected ? 'bg-emerald-50/50 hover:bg-emerald-50' : ''
                      }`}
                      onClick={() => handleSelectOrf(orf)}
                    >
                      <td className="p-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md font-mono font-bold text-[10px] ${
                            isDirect
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {isDirect ? '+' : ''}
                          {orf.frame}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-slate-600">
                        {orf.start.toLocaleString()} .. {orf.end.toLocaleString()}
                        <span className="text-[10px] text-slate-400 ml-1.5">
                          ({isDirect ? 'Brin Sens' : 'Brin Antisens'})
                        </span>
                      </td>
                      <td className="p-3 font-mono text-slate-700">
                        {orf.lengthBp} bp <span className="text-slate-400">/</span>{' '}
                        <span className="font-bold text-slate-800">{orf.lengthAa} aa</span>
                      </td>
                      <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-1.5">
                          <button
                            id={`btn-select-orf-${orf.id}`}
                            onClick={() => handleSelectOrf(orf)}
                            className="px-2.5 py-1 text-[11px] font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                          >
                            Sélectionner
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Selected ORF Details Section */}
        {selectedOrf && (
          <div id="selected-orf-details" className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <h4 className="text-xs font-bold text-slate-800">
                  Détail de l'ORF sélectionnée (Cadre {selectedOrf.frame > 0 ? '+' : ''}
                  {selectedOrf.frame})
                </h4>
                <span className="text-[10px] text-slate-500 font-mono">
                  Pos: {selectedOrf.start} à {selectedOrf.end}
                </span>
              </div>
              <button
                id="btn-close-orf-details"
                onClick={() => setSelectedOrf(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-medium cursor-pointer"
              >
                Masquer
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* DNA Seq */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">ADN Codant ({selectedOrf.lengthBp} bp)</span>
                  <button
                    id="btn-copy-orf-dna"
                    onClick={() => handleCopy(selectedOrf.dnaSeq, 'dna')}
                    className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
                  >
                    {copiedId === 'dna' ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-500" /> Copié
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" /> Copier ADN
                      </>
                    )}
                  </button>
                </div>
                <div className="p-2 bg-white border border-slate-200 rounded-lg max-h-[80px] overflow-y-auto text-[10px] font-mono text-slate-600 break-all leading-normal select-all">
                  {selectedOrf.dnaSeq}
                </div>
              </div>

              {/* Protein Seq */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Traduction Peptidique ({selectedOrf.lengthAa} aa)</span>
                  <button
                    id="btn-copy-orf-protein"
                    onClick={() => handleCopy(selectedOrf.proteinSeq, 'prot')}
                    className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
                  >
                    {copiedId === 'prot' ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-500" /> Copié
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" /> Copier Protéine
                      </>
                    )}
                  </button>
                </div>
                <div className="p-2 bg-white border border-slate-200 rounded-lg max-h-[80px] overflow-y-auto text-[10px] font-mono text-slate-600 break-all leading-normal select-all">
                  {selectedOrf.proteinSeq}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Right Column (Codon lookup + Frame Translation view) */}
      <div className="flex flex-col gap-6">
        
        {/* Codon quick lookup */}
        <div id="codon-lookup-card" className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 flex flex-col gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Décodeur Rapide de Codon</h3>
            <p className="text-xs text-slate-500 mt-0.5">Saisissez un codon de 3 lettres pour voir son acide aminé.</p>
          </div>

          <div className="flex items-center gap-3">
              <input
                id="input-codon-lookup"
                type="text"
                maxLength={3}
                value={codonInput}
                onChange={(e) => setCodonInput(e.target.value.toUpperCase())}
                placeholder="ex: ATG"
                className="w-20 p-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-center font-mono font-bold text-sm tracking-widest text-slate-700"
              />
            <div className="text-xs text-slate-400">
              Prend en charge T ou U
            </div>
          </div>

          {decodedCodon ? (
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col gap-2 text-xs">
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5">
                <span className="font-bold text-slate-500">Acide Aminé :</span>
                <span className="font-mono font-bold text-blue-600 text-sm">
                  {decodedCodon.full} ({decodedCodon.short} / {decodedCodon.aa})
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-500">Propriété :</span>
                <span className="font-semibold text-slate-700">{decodedCodon.property}</span>
              </div>
            </div>
          ) : (
            <div className="text-xs text-rose-500 bg-rose-50 p-2.5 rounded-xl border border-rose-100">
              Entrez un triplet valide (ex: AUG, TTA, GGC...)
            </div>
          )}
        </div>

        {/* 6-Frame theoretical visualizer */}
        <div id="frame-visualizer-card" className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 flex flex-col gap-4 flex-1">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Alignement de Traduction</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Visualisez les codons et la séquence peptidique par cadre.</p>
            </div>
            
            {/* Frame chooser */}
            <select
              id="select-active-frame"
              value={selectedFrame}
              onChange={(e) => setSelectedFrame(parseInt(e.target.value, 10))}
              className="p-1 px-2 text-xs font-bold border border-slate-200 rounded-lg text-slate-700 outline-none cursor-pointer bg-white"
            >
              <option value={1}>Cadre Direct +1</option>
              <option value={2}>Cadre Direct +2</option>
              <option value={3}>Cadre Direct +3</option>
              <option value={-1}>Cadre Compl. -1</option>
              <option value={-2}>Cadre Compl. -2</option>
              <option value={-3}>Cadre Compl. -3</option>
            </select>
          </div>

          {/* Alignment visualization */}
          <div className="border border-slate-100 rounded-xl bg-slate-950 p-3 flex flex-col gap-1.5 flex-1 max-h-[220px] overflow-y-auto font-mono text-[11px]">
            {frameTranslation.length === 0 ? (
              <div className="text-center text-slate-500 py-8">
                Séquence trop courte pour la traduction.
              </div>
            ) : (
              <div className="flex flex-wrap gap-x-2 gap-y-3.5 leading-none">
                {frameTranslation.slice(0, 100).map((item, idx) => {
                  const isStart = item.aa === 'M';
                  const isStop = item.aa === '*';
                  return (
                    <div key={idx} className="flex flex-col items-center gap-1.5">
                      {/* Nucleotides */}
                      <span className="text-slate-400 font-bold">{item.codon}</span>
                      {/* Translated peptide */}
                      <span
                        className={`text-center font-extrabold w-6 py-0.5 rounded-sm ${
                          isStart
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : isStop
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
                            : 'text-slate-200'
                        }`}
                        title={AA_NAMES[item.aa]?.full || 'Inconnu'}
                      >
                        {item.aa}
                      </span>
                    </div>
                  );
                })}
                {frameTranslation.length > 100 && (
                  <div className="text-[10px] text-slate-500 self-end italic pl-1">
                    (+ {frameTranslation.length - 100} codons supplémentaires...)
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="text-[10px] text-slate-400 flex gap-4 mt-0.5">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded bg-emerald-500/20 border border-emerald-500/40"></span> START (M)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded bg-rose-500/20 border border-rose-500/40"></span> STOP (*)
            </span>
          </div>
        </div>

      </div>

    </div>
  );
};
