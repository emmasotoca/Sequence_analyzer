import React, { useState, useMemo, useEffect } from 'react';
import { SequenceType } from '../types';
import { ChevronLeft, ChevronRight, Hash, Search, ArrowRight, CornerDownRight } from 'lucide-react';

interface VisualSequencerProps {
  sequence: string;
  detectedType: SequenceType;
  highlightedRegion: {
    start: number;
    end: number;
    label: string;
    color: string;
    sourceType: string;
  } | null;
  onClearHighlight: () => void;
}

export const VisualSequencer: React.FC<VisualSequencerProps> = ({
  sequence,
  detectedType,
  highlightedRegion,
  onClearHighlight,
}) => {
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [jumpIndexInput, setJumpIndexInput] = useState<string>('');
  const [seqSearchQuery, setSeqSearchQuery] = useState<string>('');
  const [localSearchHighlight, setLocalSearchHighlight] = useState<{ start: number; end: number } | null>(null);

  const basesPerPage = 900; // 15 lines of 60 bases
  const totalBases = sequence ? sequence.length : 0;
  const totalPages = Math.ceil(totalBases / basesPerPage);

  // If a region is highlighted, auto-navigate to the page containing that region's start index
  useEffect(() => {
    if (highlightedRegion && totalBases > 0) {
      const startIdx = highlightedRegion.start;
      const targetPage = Math.floor(startIdx / basesPerPage);
      if (targetPage >= 0 && targetPage < totalPages) {
        setCurrentPage(targetPage);
      }
    }
  }, [highlightedRegion, totalBases, totalPages]);

  // Handle local sequence find (e.g. search "ATG" inside the sequence)
  const handleLocalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalSearchHighlight(null);
    const query = seqSearchQuery.trim().toUpperCase();
    if (!query || !sequence) return;

    const index = sequence.indexOf(query);
    if (index !== -1) {
      setLocalSearchHighlight({
        start: index,
        end: index + query.length - 1
      });
      // Jump page to this match
      const targetPage = Math.floor(index / basesPerPage);
      setCurrentPage(targetPage);
    } else {
      alert(`Séquence "${query}" introuvable dans le génome.`);
    }
  };

  // Jump directly to coordinate
  const handleJumpToCoordinate = (e: React.FormEvent) => {
    e.preventDefault();
    const idx = parseInt(jumpIndexInput.trim(), 10);
    if (isNaN(idx) || idx < 0 || idx >= totalBases) {
      alert(`Index invalide. Entrez un nombre entre 0 et ${totalBases - 1}.`);
      return;
    }
    const targetPage = Math.floor(idx / basesPerPage);
    setCurrentPage(targetPage);
    setJumpIndexInput('');
  };

  // Get bases for current page
  const pageStartIdx = currentPage * basesPerPage;
  const pageEndIdx = Math.min(totalBases, pageStartIdx + basesPerPage);
  const pageBases = useMemo(() => {
    if (!sequence) return '';
    return sequence.substring(pageStartIdx, pageEndIdx);
  }, [sequence, pageStartIdx, pageEndIdx]);

  // Structure the bases into rows of 60, split into blocks of 10
  const rows = useMemo(() => {
    const lines: {
      lineStartIdx: number;
      blocks: {
        blockStartIdx: number;
        bases: { base: string; absIdx: number }[];
      }[];
    }[] = [];

    const rowLength = 60;
    const blockLength = 10;

    for (let i = 0; i < pageBases.length; i += rowLength) {
      const lineStartIdx = pageStartIdx + i;
      const lineText = pageBases.substring(i, i + rowLength);
      
      const blocks: {
        blockStartIdx: number;
        bases: { base: string; absIdx: number }[];
      }[] = [];

      for (let j = 0; j < lineText.length; j += blockLength) {
        const blockStartIdx = lineStartIdx + j;
        const blockText = lineText.substring(j, j + blockLength);
        
        const bases = blockText.split('').map((char, charIdx) => ({
          base: char,
          absIdx: blockStartIdx + charIdx
        }));

        blocks.push({ blockStartIdx, bases });
      }

      lines.push({ lineStartIdx, blocks });
    }

    return lines;
  }, [pageBases, pageStartIdx]);

  if (!sequence) return null;

  return (
    <div id="visual-sequencer-container" className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col gap-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <CornerDownRight className="w-5 h-5 text-blue-600" />
            Séquenceur Visuel & Explorateur de Bases
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Vue nucléotidique détaillée structurée par blocs de 10. Les coordonnées exactes s'affichent sur les marges gauches.
          </p>
        </div>

        {/* Toolbar: Jump and Find */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Find base string */}
          <form onSubmit={handleLocalSearch} className="flex items-center">
            <div className="relative">
              <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
              <input
                id="search-sequencer-string"
                type="text"
                placeholder="Chercher séquence..."
                value={seqSearchQuery}
                onChange={(e) => setSeqSearchQuery(e.target.value)}
                className="pl-8 pr-2 py-1.5 text-xs border border-slate-200 rounded-l-lg focus:outline-none focus:ring-1 focus:ring-blue-500 w-36 uppercase font-mono font-semibold"
              />
            </div>
            <button
              id="btn-search-sequencer"
              type="submit"
              className="px-2.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-r-lg transition-colors cursor-pointer"
            >
              Rechercher
            </button>
          </form>

          {/* Jump to coordinate */}
          <form onSubmit={handleJumpToCoordinate} className="flex items-center">
            <div className="relative">
              <Hash className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
              <input
                id="jump-coordinate-input"
                type="text"
                placeholder="Aller à l'index..."
                value={jumpIndexInput}
                onChange={(e) => setJumpIndexInput(e.target.value)}
                className="pl-8 pr-2 py-1.5 text-xs border border-slate-200 rounded-l-lg focus:outline-none focus:ring-1 focus:ring-blue-500 w-28 font-mono"
              />
            </div>
            <button
              id="btn-jump-coordinate"
              type="submit"
              className="px-2.5 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-r-lg transition-colors cursor-pointer"
            >
              Aller
            </button>
          </form>
        </div>
      </div>

      {/* active selection summary */}
      {(highlightedRegion || localSearchHighlight) && (
        <div className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-ping"></span>
            <span className="font-semibold text-slate-700">
              {highlightedRegion ? (
                <>Surlignage actif : <span className="font-mono text-blue-600 font-bold">{highlightedRegion.label}</span> (Coordonnées : {highlightedRegion.start} à {highlightedRegion.end})</>
              ) : (
                <>Séquence recherchée trouvée aux positions <span className="font-mono text-emerald-600 font-bold">{localSearchHighlight?.start} à {localSearchHighlight?.end}</span></>
              )}
            </span>
          </div>
          <button
            id="btn-clear-highlights"
            onClick={() => {
              onClearHighlight();
              setLocalSearchHighlight(null);
            }}
            className="text-[10px] font-bold text-rose-500 hover:text-rose-700 hover:underline cursor-pointer"
          >
            Effacer le surlignage
          </button>
        </div>
      )}

      {/* Main Base Viewer */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 md:p-6 overflow-x-auto">
        <div className="min-w-[500px] flex flex-col gap-1.5 font-mono text-sm leading-none text-slate-300">
          {rows.map((row, rIdx) => (
            <div key={rIdx} className="flex items-center gap-4 py-0.5 select-all">
              {/* Left Coordinate column (1-based index display is standard, but we show both or 0-based for perfect precision) */}
              <span className="text-[10px] font-bold text-slate-500 w-16 text-right shrink-0">
                {(row.lineStartIdx).toLocaleString()} bp
              </span>

              {/* Blocks of 10 nucleotides */}
              <div className="flex items-center gap-3.5">
                {row.blocks.map((block, bIdx) => (
                  <div key={bIdx} className="flex items-center">
                    {block.bases.map(({ base, absIdx }) => {
                      // Check if highlighted by parent selected region
                      const isHighlightedByParent = highlightedRegion &&
                        absIdx >= highlightedRegion.start &&
                        absIdx <= highlightedRegion.end;

                      // Check if highlighted by local text search
                      const isHighlightedByLocal = localSearchHighlight &&
                        absIdx >= localSearchHighlight.start &&
                        absIdx <= localSearchHighlight.end;

                      const isHl = isHighlightedByParent || isHighlightedByLocal;
                      const hlColor = isHighlightedByParent 
                        ? highlightedRegion.color 
                        : '#10B981'; // Green for search matches

                      return (
                        <span
                          key={absIdx}
                          className={`w-4 text-center font-bold font-mono transition-all duration-200 relative group py-0.5 rounded-sm ${
                            isHl
                              ? 'text-slate-950 font-extrabold shadow-sm'
                              : 'text-slate-300 hover:text-white hover:bg-slate-800'
                          }`}
                          style={isHl ? { backgroundColor: hlColor } : {}}
                          title={`Base: ${base} | Position absolue: ${absIdx}`}
                        >
                          {base}
                          {/* absolute coordinate tooltip on base hover */}
                          <span className="absolute bottom-full left-1/2 -translate-x-1/2 bg-slate-900 text-white rounded font-sans text-[9px] px-1 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none mb-1 whitespace-nowrap z-30">
                            Pos: {absIdx}
                          </span>
                        </span>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination Controller */}
      <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs">
        <div className="text-slate-500 font-semibold">
          Affichage des bases <span className="font-mono text-slate-800 font-bold">{pageStartIdx.toLocaleString()}</span> à <span className="font-mono text-slate-800 font-bold">{pageEndIdx.toLocaleString()}</span> sur <span className="font-mono text-slate-800 font-bold">{totalBases.toLocaleString()}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-prev-page"
            disabled={currentPage === 0}
            onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
            className="p-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-bold text-slate-700">
            Page {currentPage + 1} / {totalPages}
          </span>
          <button
            id="btn-next-page"
            disabled={currentPage === totalPages - 1}
            onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
            className="p-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
