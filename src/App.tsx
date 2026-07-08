import React, { useState, useMemo } from 'react';
import { SequenceType, HighlightRegion, MotifMatch } from './types';
import { parseAndCleanSequence, detectSequenceType, findORFs } from './utils/bioUtils';
import { BIOLOGICAL_EXAMPLES } from './data/examples';
import { SequenceInput } from './components/SequenceInput';
import { DashboardStats } from './components/DashboardStats';
import { TranslationOrfFinder } from './components/TranslationOrfFinder';
import { MotifFinder } from './components/MotifFinder';
import { LinearMap } from './components/LinearMap';
import { VisualSequencer } from './components/VisualSequencer';
import { BarChart3, Binary, Search, GraduationCap, Github } from 'lucide-react';

export default function App() {
  // Initialize with the first biological sample (Insuline Humaine) for a rich first-load experience
  const [rawInput, setRawInput] = useState<string>(BIOLOGICAL_EXAMPLES[0].sequence);
  const [windowSize, setWindowSize] = useState<number>(50);
  const [minOrfLength, setMinOrfLength] = useState<number>(30);
  const [activeTab, setActiveTab] = useState<'import' | 'stats' | 'translation' | 'motifs'>('import');
  
  // Highlighting region linked to interactive click actions
  const [highlightedRegion, setHighlightedRegion] = useState<HighlightRegion | null>(null);
  
  // Track found motifs to pass down to map
  const [motifMatches, setMotifMatches] = useState<MotifMatch[]>([]);

  // Compute parsed sequence metrics reactively
  const { sequence, format, header } = useMemo(() => {
    return parseAndCleanSequence(rawInput);
  }, [rawInput]);

  const detectedType = useMemo(() => {
    return detectSequenceType(sequence);
  }, [sequence]);

  // Find ORFs to share with LinearMap
  const orfs = useMemo(() => {
    if ((detectedType !== 'DNA' && detectedType !== 'RNA') || !sequence) return [];
    const dnaSeq = detectedType === 'RNA' ? sequence.replace(/U/g, 'T') : sequence;
    return findORFs(dnaSeq, minOrfLength);
  }, [sequence, detectedType, minOrfLength]);

  const handleClear = () => {
    setRawInput('');
    setHighlightedRegion(null);
    setMotifMatches([]);
  };

  const handleHighlightRegion = (
    start: number,
    end: number,
    label: string,
    color: string,
    sourceType: 'orf' | 'motif' | 'selection'
  ) => {
    setHighlightedRegion({
      start,
      end,
      label,
      color,
      sourceType,
    });
  };

  const handleClearHighlight = () => {
    setHighlightedRegion(null);
  };

  // Find currently loaded example
  const activeExample = useMemo(() => {
    return BIOLOGICAL_EXAMPLES.find(
      (ex) => rawInput.includes(ex.sequence) || ex.sequence.includes(sequence)
    );
  }, [rawInput, sequence]);

  const sequenceName = useMemo(() => {
    if (!sequence) return "Aucune séquence chargée";
    return activeExample ? activeExample.name : (header ? header : "Séquence personnalisée");
  }, [sequence, activeExample, header]);

  // Compute GC% globally for the top panel
  const gcContentPercent = useMemo(() => {
    if (!sequence || (detectedType !== 'DNA' && detectedType !== 'RNA')) return null;
    const gAndC = (sequence.match(/[GCgc]/g) || []).length;
    return ((gAndC / sequence.length) * 100).toFixed(1);
  }, [sequence, detectedType]);

  const TABS = [
    { id: 'import', label: '📄 1. SÉQUENCE & IMPORT' },
    { id: 'stats', label: '📈 2. COMPOSITION & PROFIL GC' },
    { id: 'translation', label: '🧬 3. TRADUCTION & ORFS' },
    { id: 'motifs', label: '🔍 4. SITES & MOTIFS' },
  ] as const;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col selection:bg-blue-100 selection:text-blue-900">
      
      {/* 1. Header Area - Dark themed as shown in the screenshot */}
      <header className="bg-slate-900 text-white py-3.5 px-6 shadow-sm shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Blue Icon box with 'B' inside */}
            <div className="w-7 h-7 bg-blue-600 rounded flex items-center justify-center text-white font-black text-xs shadow-xs select-none">
              B
            </div>
            <div className="flex items-baseline gap-2">
              <h1 className="text-sm font-black tracking-wider uppercase font-display text-white">
                BIOANALYSTE <span className="text-blue-500">PRO</span>
              </h1>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider hidden sm:inline border-l border-slate-700 pl-2">
                LABORATOIRE MOLÉCULAIRE AUTONOME • v2.4.0
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3 self-end md:self-auto">
            <span className="flex items-center gap-1.5 text-[10px] text-slate-300 bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700/50 font-bold tracking-wider uppercase">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              GH Pages: Prêt pour Déploiement
            </span>
            <div className="flex items-center gap-2 text-[10px] font-extrabold">
              <span className="bg-slate-800 text-white px-2 py-1 rounded border border-slate-700">ES</span>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Main Content Body */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 flex flex-col gap-6">
        
        {/* Active Sequence Panel (SÉQUENCE ACTIVE) */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col gap-1 min-w-0">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              SÉQUENCE ACTIVE
            </span>
            <h2 className="text-sm md:text-base font-extrabold text-slate-800 tracking-tight truncate">
              {sequenceName}
            </h2>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* TYPE BOX */}
            <div className="border border-slate-100 rounded-lg bg-slate-50/50 p-2.5 min-w-[70px] text-center flex flex-col gap-0.5 shadow-2xs">
              <span className="text-[9px] font-extrabold text-slate-400 tracking-wider uppercase">
                TYPE
              </span>
              <span className="text-xs font-black text-slate-700">
                {!sequence ? '-' : detectedType === 'DNA' ? 'ADN' : detectedType === 'RNA' ? 'ARN' : 'PROTÉINE'}
              </span>
            </div>

            {/* TAILLE BOX */}
            <div className="border border-slate-100 rounded-lg bg-slate-50/50 p-2.5 min-w-[70px] text-center flex flex-col gap-0.5 shadow-2xs">
              <span className="text-[9px] font-extrabold text-slate-400 tracking-wider uppercase">
                TAILLE
              </span>
              <span className="text-xs font-black text-slate-700">
                {!sequence ? '-' : `${sequence.length.toLocaleString()} ${detectedType === 'PROTEIN' ? 'aa' : 'pb'}`}
              </span>
            </div>

            {/* TAXU GC BOX */}
            <div className="border border-slate-100 rounded-lg bg-slate-50/50 p-2.5 min-w-[70px] text-center flex flex-col gap-0.5 shadow-2xs">
              <span className="text-[9px] font-extrabold text-slate-400 tracking-wider uppercase">
                TAUX GC
              </span>
              <span className="text-xs font-black text-blue-600">
                {gcContentPercent ? `${gcContentPercent}%` : '-'}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Bar precisely styled to match screenshot */}
        <div className="flex border-b border-slate-200 overflow-x-auto gap-2">
          {TABS.map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                id={`tab-${tab.id}`}
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 text-[10px] md:text-xs font-black tracking-wider uppercase border-b-2 transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? 'border-blue-600 text-blue-600 bg-blue-50/5'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Workspace Display Area */}
        <div className="transition-all duration-300">
          {activeTab === 'import' && (
            <SequenceInput
              rawInput={rawInput}
              setRawInput={setRawInput}
              sequence={sequence}
              detectedType={detectedType}
              format={format}
              header={header}
              onClear={handleClear}
            />
          )}

          {activeTab === 'stats' && (
            sequence ? (
              <DashboardStats
                sequence={sequence}
                detectedType={detectedType}
                windowSize={windowSize}
                setWindowSize={setWindowSize}
              />
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500 shadow-xs">
                Veuillez d'abord charger ou saisir une séquence biologique dans l'onglet d'importation.
              </div>
            )
          )}

          {activeTab === 'translation' && (
            sequence ? (
              <TranslationOrfFinder
                sequence={sequence}
                detectedType={detectedType}
                minOrfLength={minOrfLength}
                setMinOrfLength={setMinOrfLength}
                onHighlightRegion={handleHighlightRegion}
              />
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500 shadow-xs">
                Veuillez d'abord charger ou saisir une séquence biologique dans l'onglet d'importation.
              </div>
            )
          )}

          {activeTab === 'motifs' && (
            sequence ? (
              <MotifFinder
                sequence={sequence}
                detectedType={detectedType}
                onHighlightRegion={handleHighlightRegion}
                matches={motifMatches}
                setMatches={setMotifMatches}
              />
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500 shadow-xs">
                Veuillez d'abord charger ou saisir une séquence biologique dans l'onglet d'importation.
              </div>
            )
          )}
        </div>

        {/* Interactive Genome Cartography maps (Always rendered below the tabs) */}
        {sequence && (
          <div className="flex flex-col gap-6 border-t border-slate-200/80 pt-6">
            <LinearMap
              sequence={sequence}
              detectedType={detectedType}
              orfs={orfs}
              motifMatches={motifMatches}
              highlightedRegion={highlightedRegion}
              onHighlightRegion={handleHighlightRegion}
              minOrfLength={minOrfLength}
              setMinOrfLength={setMinOrfLength}
            />

            <VisualSequencer
              sequence={sequence}
              detectedType={detectedType}
              highlightedRegion={highlightedRegion}
              onClearHighlight={handleClearHighlight}
            />
          </div>
        )}

        {/* Educational/Technical Footer Details Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-900 text-slate-300 rounded-2xl p-5 border border-slate-800 text-xs mt-4">
          <div className="flex flex-col gap-1.5">
            <span className="font-bold text-white flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-blue-400" />
              1. 100% Client-Side
            </span>
            <p className="text-slate-400 leading-normal">
              Aucun serveur externe, aucune fuite de données biologiques. Toutes les opérations de transcription, traduction, GC% et expressions régulières IUPAC s'effectuent en temps réel dans votre navigateur.
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Binary className="w-4 h-4 text-emerald-400" />
              2. Détection IUPAC & 6 Cadres
            </span>
            <p className="text-slate-400 leading-normal">
              L'outil convertit les codes dégénérés IUPAC en Regex javascript pour une détection sans faille des sites de restriction, et balaye l'entièreté des 6 cadres de lecture ouverts directes et complémentaires.
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Github className="w-4 h-4 text-blue-400" />
              3. Déploiement GitHub Pages
            </span>
            <p className="text-slate-400 leading-normal">
              Configuration relative <code>base: \'./\'</code> validée dans <code>vite.config.ts</code> et workflow automatisé d'intégration continue écrit dans <code>.github/workflows/deploy.yml</code>.
            </p>
          </div>
        </div>

      </main>

      {/* 3. Footer area */}
      <footer className="bg-slate-100 border-t border-slate-200 py-6 px-6 text-center text-xs text-slate-500 shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-sans">
          <p>© 2026 - BioLab Analyzer • Responsable scientifique : Emma Sotoca</p>
          <p className="flex items-center gap-1 justify-center">
            Propulsé par <span className="font-semibold text-slate-700">TypeScript</span> et <span className="font-semibold text-slate-700">Vite React</span>.
          </p>
        </div>
      </footer>
    </div>
  );
}
