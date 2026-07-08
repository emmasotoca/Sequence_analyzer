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
import { Dna, BarChart3, Binary, Search, HelpCircle, GraduationCap, Github } from 'lucide-react';

export default function App() {
  // Initialize with the GFP DNA biological sample for a rich first-load experience
  const [rawInput, setRawInput] = useState<string>(BIOLOGICAL_EXAMPLES[0].sequence);
  const [windowSize, setWindowSize] = useState<number>(50);
  const [minOrfLength, setMinOrfLength] = useState<number>(30);
  const [activeTab, setActiveTab] = useState<'stats' | 'translation' | 'motifs'>('stats');
  
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col selection:bg-blue-100 selection:text-blue-900">
      {/* 1. Header Area - Bento Style */}
      <header className="bg-white border-b border-slate-200 py-3.5 px-6 shadow-sm shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold shadow-sm shadow-blue-100 animate-pulse">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold tracking-tight font-display text-slate-800 flex items-center gap-2">
                BioLab <span className="text-blue-600">Analyzer</span> <span className="text-[10px] bg-blue-50 text-blue-600 font-mono px-2 py-0.5 rounded-full border border-blue-100 font-semibold uppercase">Client-Side</span>
              </h1>
              <p className="text-xs text-slate-500 font-sans mt-0.5">
                Plateforme d'analyse par <span className="font-semibold text-slate-700">Emma Sotoca</span> • Prêt pour GitHub Pages
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping"></span>
              Chercheuse : Emma Sotoca
            </span>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg font-mono border border-slate-200">v1.2.0</span>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Main Content Body */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 flex flex-col gap-6">
        
        {/* Sequence Input (Top row) */}
        <SequenceInput
          rawInput={rawInput}
          setRawInput={setRawInput}
          sequence={sequence}
          detectedType={detectedType}
          format={format}
          header={header}
          onClear={handleClear}
        />

        {sequence ? (
          <>
            {/* Navigational Workspace Tabs - Bento Style */}
            <div className="flex border-b border-slate-200">
              <button
                id="tab-stats"
                onClick={() => setActiveTab('stats')}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
                  activeTab === 'stats'
                    ? 'border-blue-600 text-blue-600 bg-blue-50/10'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                Composition & Statistiques
              </button>
              
              <button
                id="tab-translation"
                onClick={() => setActiveTab('translation')}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
                  activeTab === 'translation'
                    ? 'border-emerald-600 text-emerald-600 bg-emerald-50/10'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                <Binary className="w-4 h-4" />
                Traduction & Recherche d'ORFs
              </button>
              
              <button
                id="tab-motifs"
                onClick={() => setActiveTab('motifs')}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
                  activeTab === 'motifs'
                    ? 'border-blue-500 text-blue-500 bg-blue-50/10'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                <Search className="w-4 h-4" />
                Recherche de Motifs Biologiques
              </button>
            </div>

            {/* Active Workspace View */}
            <div className="transition-all duration-300">
              {activeTab === 'stats' && (
                <DashboardStats
                  sequence={sequence}
                  detectedType={detectedType}
                  windowSize={windowSize}
                  setWindowSize={setWindowSize}
                />
              )}

              {activeTab === 'translation' && (
                <TranslationOrfFinder
                  sequence={sequence}
                  detectedType={detectedType}
                  minOrfLength={minOrfLength}
                  setMinOrfLength={setMinOrfLength}
                  onHighlightRegion={handleHighlightRegion}
                />
              )}

              {activeTab === 'motifs' && (
                <MotifFinder
                  sequence={sequence}
                  detectedType={detectedType}
                  onHighlightRegion={handleHighlightRegion}
                  matches={motifMatches}
                  setMatches={setMotifMatches}
                />
              )}
            </div>

            {/* Interactive Physical Visualizers (Always visible at the bottom) */}
            <div className="flex flex-col gap-6 border-t border-slate-200/80 pt-6">
              <LinearMap
                sequence={sequence}
                detectedType={detectedType}
                orfs={orfs}
                motifMatches={motifMatches}
                highlightedRegion={highlightedRegion}
                onHighlightRegion={handleHighlightRegion}
              />

              <VisualSequencer
                sequence={sequence}
                detectedType={detectedType}
                highlightedRegion={highlightedRegion}
                onClearHighlight={handleClearHighlight}
              />
            </div>
          </>
        ) : (
          /* Empty State Dashboard Greeting card */
          <div className="flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-2xl bg-white p-12 text-center shadow-xs">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
            </div>
            <h2 className="text-xl font-bold text-slate-800 font-display">Bienvenue sur le BioLab Analyzer !</h2>
            <p className="text-sm text-slate-500 max-w-md mt-2 leading-relaxed">
              Créé pour <span className="font-bold text-slate-700">Emma Sotoca</span> • Saisissez une séquence d'acide nucléique (ADN/ARN) ou peptidique brute ou au format FASTA, importez un fichier local, ou chargez l'un de nos exemples pré-chargés.
            </p>
            <div className="flex flex-wrap justify-center gap-3 mt-6">
              <button
                id="btn-quick-gfp"
                onClick={() => setRawInput(BIOLOGICAL_EXAMPLES[0].sequence)}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm cursor-pointer"
              >
                Gène GFP (Fluorescence Verte)
              </button>
              <button
                id="btn-quick-insulin"
                onClick={() => setRawInput(BIOLOGICAL_EXAMPLES[1].sequence)}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all border border-slate-200 cursor-pointer"
              >
                Gène Insuline Humaine
              </button>
            </div>
          </div>
        )}

        {/* Informative educational section about the tool's absolute client-side speed */}
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
              Configuration relative <code>base: './'</code> validée dans <code>vite.config.ts</code> et workflow automatisé d'intégration continue écrit dans <code>.github/workflows/deploy.yml</code>.
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

