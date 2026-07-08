import React, { useState, useEffect, useMemo } from 'react';
import { SequenceType, MotifPattern, MotifMatch } from '../types';
import { DEFAULT_MOTIFS, searchMotifs, IUPAC_MAP } from '../utils/bioUtils';
import { Plus, Trash2, Check, Search, HelpCircle, AlertCircle, FileSpreadsheet } from 'lucide-react';

interface MotifFinderProps {
  sequence: string;
  detectedType: SequenceType;
  onHighlightRegion: (start: number, end: number, label: string, color: string, sourceType: 'motif') => void;
  matches: MotifMatch[];
  setMatches: (matches: MotifMatch[]) => void;
}

export const MotifFinder: React.FC<MotifFinderProps> = ({
  sequence,
  detectedType,
  onHighlightRegion,
  matches,
  setMatches,
}) => {
  // Motifs state (initially DEFAULT_MOTIFS)
  const [customMotifs, setCustomMotifs] = useState<MotifPattern[]>([]);
  const [selectedMotifIds, setSelectedMotifIds] = useState<string[]>(
    DEFAULT_MOTIFS.map(m => m.id)
  );

  // Form states for creating custom motifs
  const [newName, setNewName] = useState<string>('');
  const [newPattern, setNewPattern] = useState<string>('');
  const [newType, setNewType] = useState<'restriction' | 'promoter' | 'custom'>('custom');
  const [newDescription, setNewDescription] = useState<string>('');
  const [formError, setFormError] = useState<string>('');
  const [formSuccess, setFormSuccess] = useState<boolean>(false);

  // Search input for filtering matches
  const [matchSearch, setMatchSearch] = useState<string>('');

  const isNucleic = detectedType === 'DNA' || detectedType === 'RNA';

  // Load custom motifs from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('bio_analyzer_custom_motifs');
      if (stored) {
        const parsed = JSON.parse(stored) as MotifPattern[];
        setCustomMotifs(parsed);
        // Automatically select custom motifs too
        setSelectedMotifIds(prev => [...prev, ...parsed.map(m => m.id)]);
      }
    } catch (e) {
      console.error('Erreur lors du chargement des motifs personnalisés :', e);
    }
  }, []);

  // Save custom motifs to localStorage
  const saveCustomMotifs = (updatedList: MotifPattern[]) => {
    setCustomMotifs(updatedList);
    try {
      localStorage.setItem('bio_analyzer_custom_motifs', JSON.stringify(updatedList));
    } catch (e) {
      console.error('Erreur lors de la sauvegarde des motifs personnalisés :', e);
    }
  };

  // Combine Default and Custom Motifs
  const allMotifs = useMemo(() => {
    return [...DEFAULT_MOTIFS, ...customMotifs];
  }, [customMotifs]);

  // Execute search of motifs in the active sequence
  useEffect(() => {
    if (!sequence || !isNucleic) {
      setMatches([]);
      return;
    }

    // Convert RNA to DNA representation if needed for searching DNA motifs
    const dnaRepresentation = detectedType === 'RNA' ? sequence.replace(/U/g, 'T') : sequence;

    // Filter only currently enabled motifs
    const enabledMotifs = allMotifs.filter(m => selectedMotifIds.includes(m.id));
    
    const results = searchMotifs(dnaRepresentation, enabledMotifs);
    setMatches(results);
  }, [sequence, detectedType, selectedMotifIds, allMotifs, isNucleic, setMatches]);

  // Handle adding custom motif
  const handleAddMotif = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess(false);

    const name = newName.trim();
    const pattern = newPattern.trim().toUpperCase();

    if (!name) {
      setFormError('Le nom du motif est obligatoire.');
      return;
    }
    if (!pattern) {
      setFormError('La séquence du motif est obligatoire.');
      return;
    }

    // Validate characters are standard IUPAC bases
    const validIUPAC = new RegExp(`^[${Object.keys(IUPAC_MAP).join('')}]+$`, 'i');
    if (!validIUPAC.test(pattern)) {
      setFormError('Le motif contient des caractères invalides. Utilisez les codes IUPAC : A, C, G, T, U, R, Y, S, W, K, M, B, D, H, V, N.');
      return;
    }

    // Check duplicate
    const id = `custom_${Date.now()}`;
    const newMotif: MotifPattern = {
      id,
      name,
      pattern,
      type: newType,
      description: newDescription.trim() || `Motif personnalisé: ${pattern}`
    };

    const updated = [...customMotifs, newMotif];
    saveCustomMotifs(updated);
    setSelectedMotifIds(prev => [...prev, id]);

    // Reset form
    setNewName('');
    setNewPattern('');
    setNewType('custom');
    setNewDescription('');
    setFormSuccess(true);
    setTimeout(() => setFormSuccess(false), 3000);
  };

  // Delete custom motif
  const handleDeleteCustomMotif = (id: string) => {
    const updated = customMotifs.filter(m => m.id !== id);
    saveCustomMotifs(updated);
    setSelectedMotifIds(prev => prev.filter(mid => mid !== id));
  };

  // Toggle active motif checkboxes
  const toggleMotifSelection = (id: string) => {
    setSelectedMotifIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(mid => mid !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Select/Unselect All
  const handleToggleAll = (enable: boolean) => {
    if (enable) {
      setSelectedMotifIds(allMotifs.map(m => m.id));
    } else {
      setSelectedMotifIds([]);
    }
  };

  // Filtered motif matches for table search
  const filteredMatches = useMemo(() => {
    return matches.filter(m => {
      const s = matchSearch.toLowerCase();
      return (
        m.name.toLowerCase().includes(s) ||
        m.sequence.toLowerCase().includes(s) ||
        m.start.toString().includes(matchSearch) ||
        m.type.toLowerCase().includes(s)
      );
    });
  }, [matches, matchSearch]);

  const getMotifTypeBadge = (type: string) => {
    switch (type) {
      case 'restriction':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">Restriction</span>;
      case 'promoter':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">Promoteur</span>;
      case 'custom':
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-100">Perso</span>;
    }
  };

  const getMotifMatchColor = (type: string) => {
    switch (type) {
      case 'restriction': return '#EF4444'; // Red
      case 'promoter': return '#2563EB'; // Blue
      case 'custom':
      default:
        return '#8B5CF6'; // Purple
    }
  };

  if (!isNucleic) {
    return (
      <div id="motifs-disabled-container" className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-400 flex flex-col items-center justify-center gap-4">
        <HelpCircle className="w-12 h-12 text-slate-300 stroke-1" />
        <div>
          <p className="font-semibold text-slate-700">Recherche de Motifs non Applicable</p>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-2">
            La séquence active est une protéine. La recherche de sites de restriction nucléotidiques et de boîtes promotrices s'applique spécifiquement aux structures d'acide nucléique (ADN et ARN).
          </p>
        </div>
      </div>
    );
  }

  return (
    <div id="motif-finder-container" className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      
      {/* 1. Left Column: Motif Library Selector */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800">Bibliothèque de Motifs</h3>
            <p className="text-xs text-slate-500 mt-0.5">Activez les sites d'intérêts pour scanner la séquence.</p>
          </div>
          <div className="flex gap-2 text-[10px] font-bold text-slate-500">
            <button
              id="btn-motifs-all"
              onClick={() => handleToggleAll(true)}
              className="text-blue-600 hover:underline cursor-pointer"
            >
              Tous
            </button>
            <span>|</span>
            <button
              id="btn-motifs-none"
              onClick={() => handleToggleAll(false)}
              className="text-slate-500 hover:underline cursor-pointer"
            >
              Aucun
            </button>
          </div>
        </div>

        {/* Motif List Scroller */}
        <div className="flex flex-col gap-2 max-h-[250px] overflow-y-auto border border-slate-50 rounded-lg p-1">
          {allMotifs.map((motif) => {
            const isChecked = selectedMotifIds.includes(motif.id);
            const isCustom = motif.id.startsWith('custom_');
            return (
              <div
                id={`motif-lib-item-${motif.id}`}
                key={motif.id}
                onClick={() => toggleMotifSelection(motif.id)}
                className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                  isChecked
                    ? 'bg-slate-50/80 border-slate-200'
                    : 'bg-white border-transparent hover:bg-slate-50/40'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}} // toggled by parent div click
                    className="mt-0.5 rounded accent-blue-600 cursor-pointer"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      {motif.name}
                      {getMotifTypeBadge(motif.type)}
                    </span>
                    <span className="text-[10px] font-mono font-medium text-slate-500 mt-0.5">
                      Séquence : {motif.pattern}
                    </span>
                    {motif.description && (
                      <span className="text-[10px] text-slate-400 font-sans mt-0.5 leading-tight">
                        {motif.description}
                      </span>
                    )}
                  </div>
                </div>

                {isCustom && (
                  <button
                    id={`btn-delete-motif-${motif.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCustomMotif(motif.id);
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Supprimer ce motif"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Custom Motif Addition Form */}
        <div className="border-t border-slate-100 pt-4 flex flex-col gap-3">
          <h4 className="text-xs font-bold text-slate-700">Créer un Motif Personnalisé</h4>
          <form onSubmit={handleAddMotif} className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2">
              <input
                id="input-custom-motif-name"
                type="text"
                placeholder="Nom (ex: EcoRI)"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="p-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <input
                id="input-custom-motif-pattern"
                type="text"
                placeholder="Séquence (IUPAC)"
                value={newPattern}
                onChange={(e) => setNewPattern(e.target.value.toUpperCase())}
                className="p-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
              />
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <select
                id="select-custom-motif-type"
                value={newType}
                onChange={(e: any) => setNewType(e.target.value)}
                className="col-span-1 p-2 text-xs border border-slate-200 rounded-lg text-slate-600 focus:outline-none bg-white cursor-pointer"
              >
                <option value="custom">Perso</option>
                <option value="restriction">Restriction</option>
                <option value="promoter">Promoteur</option>
              </select>
                <input
                  id="input-custom-motif-desc"
                  type="text"
                  placeholder="Description courte"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="col-span-2 p-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
            </div>

            {formError && (
              <div className="flex items-start gap-1.5 text-[10px] text-rose-600 bg-rose-50 border border-rose-100 rounded-lg p-2 font-sans leading-tight">
                <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-lg p-2 font-sans">
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>Motif enregistré et activé avec succès !</span>
              </div>
            )}

            <button
              id="btn-submit-custom-motif"
              type="submit"
              className="inline-flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Ajouter à la Bibliothèque
            </button>
          </form>
        </div>
      </div>

      {/* 2. Right Columns: Motif Matches Table (Spans 2 cols) */}
      <div className="xl:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-800">
              Résultats de Recherche de Motifs ({matches.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Positions exactes et dinucléotides trouvés dans la séquence analysée.
            </p>
          </div>

          <div className="relative shrink-0">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
            <input
              id="match-search-input"
              type="text"
              placeholder="Filtrer résultats..."
              value={matchSearch}
              onChange={(e) => setMatchSearch(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 w-44"
            />
          </div>
        </div>

        {/* Motif Matches List Table */}
        <div className="border border-slate-100 rounded-xl overflow-hidden max-h-[380px] overflow-y-auto flex-1">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-600 font-bold sticky top-0">
                <th className="p-3">Type</th>
                <th className="p-3">Nom du Motif</th>
                <th className="p-3">Coordonnées (5' → 3')</th>
                <th className="p-3">Séquence Match</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredMatches.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    Aucune correspondance trouvée. Modifiez les motifs actifs ou le motif de recherche.
                  </td>
                </tr>
              ) : (
                filteredMatches.map((m) => {
                  return (
                    <tr
                      id={`match-row-${m.id}`}
                      key={m.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="p-3">
                        {getMotifTypeBadge(m.type)}
                      </td>
                      <td className="p-3 font-bold text-slate-800">
                        {m.name}
                      </td>
                      <td className="p-3 font-mono text-slate-600">
                        {m.start.toLocaleString()} .. {m.end.toLocaleString()}
                        <span className="text-[10px] text-slate-400 ml-1.5">
                          (L={m.end - m.start + 1} bp)
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="font-mono font-bold text-blue-600 bg-blue-50/60 border border-blue-100/50 px-2 py-0.5 rounded text-[11px] select-all">
                          {m.sequence}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          id={`btn-highlight-match-${m.id}`}
                          onClick={() => onHighlightRegion(
                            m.start,
                            m.end,
                            `${m.name} (${m.sequence})`,
                            getMotifMatchColor(m.type),
                            'motif'
                          )}
                          className="px-2.5 py-1 text-[11px] font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                        >
                          Surligner
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Quick IUPAC table documentation */}
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-[11px] text-slate-500 font-sans leading-relaxed">
          <span className="font-bold text-slate-600 block mb-1">💡 Aide-mémoire IUPAC dégénéré :</span>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 font-mono">
            <div><span className="font-bold text-slate-700">R</span> = A / G</div>
            <div><span className="font-bold text-slate-700">Y</span> = C / T / U</div>
            <div><span className="font-bold text-slate-700">S</span> = G / C</div>
            <div><span className="font-bold text-slate-700">W</span> = A / T / U</div>
            <div><span className="font-bold text-slate-700">K</span> = G / T / U</div>
            <div><span className="font-bold text-slate-700">N</span> = N'importe quel nucléotide</div>
          </div>
        </div>
      </div>

    </div>
  );
};
