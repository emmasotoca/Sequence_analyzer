import React, { useMemo, useState } from 'react';
import { SequenceType } from '../types';
import {
  calculateMolecularWeight,
  calculateBaseComposition,
  calculateAminoAcidGroupComposition,
  generateGCProfile
} from '../utils/bioUtils';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell
} from 'recharts';
import { Activity, Sliders, Dna, Anchor, Layers, HelpCircle } from 'lucide-react';

interface DashboardStatsProps {
  sequence: string;
  detectedType: SequenceType;
  windowSize: number;
  setWindowSize: (size: number) => void;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  sequence,
  detectedType,
  windowSize,
  setWindowSize,
}) => {
  const [localWindowSize, setLocalWindowSize] = useState<number>(windowSize);

  // Calculate molecular weight
  const molecularWeight = useMemo(() => {
    return calculateMolecularWeight(sequence, detectedType);
  }, [sequence, detectedType]);

  // Calculate base composition (for DNA/RNA)
  const baseComposition = useMemo(() => {
    if (detectedType === 'DNA' || detectedType === 'RNA') {
      return calculateBaseComposition(sequence, detectedType);
    }
    return [];
  }, [sequence, detectedType]);

  // Calculate amino acid group composition (for Protein)
  const proteinComposition = useMemo(() => {
    if (detectedType === 'PROTEIN') {
      return calculateAminoAcidGroupComposition(sequence);
    }
    return [];
  }, [sequence, detectedType]);

  // Calculate global GC% (for DNA/RNA)
  const globalGCPct = useMemo(() => {
    if (detectedType !== 'DNA' && detectedType !== 'RNA') return 0;
    const gcCount = (sequence.match(/[CG]/g) || []).length;
    const totalLen = sequence.length || 1;
    return Math.round((gcCount / totalLen) * 1000) / 10;
  }, [sequence, detectedType]);

  // Calculate CpG dinucleotide count (for DNA/RNA)
  const cpgCount = useMemo(() => {
    if (detectedType !== 'DNA' && detectedType !== 'RNA') return 0;
    let count = 0;
    for (let i = 0; i < sequence.length - 1; i++) {
      if (sequence[i] === 'C' && sequence[i + 1] === 'G') {
        count++;
      }
    }
    return count;
  }, [sequence, detectedType]);

  // Generate GC sliding profile data
  const gcProfileData = useMemo(() => {
    if (detectedType !== 'DNA' && detectedType !== 'RNA') return [];
    return generateGCProfile(sequence, windowSize);
  }, [sequence, detectedType, windowSize]);

  // Handle window size slider release
  const handleWindowSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const size = parseInt(e.target.value, 10);
    setLocalWindowSize(size);
  };

  const applyWindowSize = () => {
    setWindowSize(localWindowSize);
  };

  if (!sequence) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
        <Activity className="w-12 h-12 text-slate-300 stroke-1" />
        <p className="font-medium text-slate-500">Aucune séquence active à analyser.</p>
        <p className="text-xs text-slate-400">Entrez ou importez une séquence ci-dessus pour activer le tableau de bord.</p>
      </div>
    );
  }

  const isNucleic = detectedType === 'DNA' || detectedType === 'RNA';

  return (
    <div id="dashboard-stats-container" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* 1. Quick Stats Cards - Bento Grid Row */}
      <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Molecular Weight Card */}
        <div id="stat-card-mw" className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Anchor className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Poids Moléculaire</span>
            <span className="text-xl font-extrabold text-slate-800 font-mono">
              {molecularWeight.toLocaleString('fr-FR')} <span className="text-xs font-normal text-slate-500">g/mol</span>
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Séquence à brin unique</span>
          </div>
        </div>

        {/* Global GC% Card (or length if protein) */}
        {isNucleic ? (
          <div id="stat-card-gc" className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <Dna className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Taux Global de GC</span>
              <span className="text-xl font-extrabold text-slate-800 font-mono">
                {globalGCPct}%
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                {(sequence.match(/[CG]/g) || []).length} bases G/C sur {sequence.length}
              </span>
            </div>
          </div>
        ) : (
          <div id="stat-card-protein-length" className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Nombre de Résidus (AA)</span>
              <span className="text-xl font-extrabold text-slate-800 font-mono">
                {sequence.length} <span className="text-xs font-normal text-slate-500">aa</span>
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Acides aminés traduits</span>
            </div>
          </div>
        )}

        {/* CpG Island / Dinucleotides */}
        {isNucleic ? (
          <div id="stat-card-cpg" className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Dinucléotides CpG</span>
              <span className="text-xl font-extrabold text-slate-800 font-mono">
                {cpgCount}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                Séquences "CG" directes (5' → 3')
              </span>
            </div>
          </div>
        ) : (
          <div id="stat-card-protein-properties" className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-sky-50 text-sky-600 rounded-xl">
              <Dna className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Charges polaires nettes</span>
              <span className="text-xl font-extrabold text-slate-800 font-mono">
                {proteinComposition.find(g => g.name.includes('Basiques'))?.count || 0} (+) / {proteinComposition.find(g => g.name.includes('Acides'))?.count || 0} (-)
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                Ratio acides aminés chargés
              </span>
            </div>
          </div>
        )}

        {/* Dark Indigo Contrast Tip Card */}
        <div className="bg-indigo-900 border border-indigo-800 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden flex flex-col justify-center">
          <div className="absolute -right-6 -bottom-6 text-indigo-800/40 opacity-40 select-none pointer-events-none">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="currentColor"><path d="M20 10c0 4.418-3.582 8-8 8s-8-3.582-8-8c0-4.418 3.582-8 8-8s8 3.582 8 8Z"/></svg>
          </div>
          <div className="relative z-10">
            <span className="text-[10px] font-bold text-indigo-200 uppercase tracking-wider block mb-1">Ressource Laboratoire</span>
            <p className="text-[11px] text-indigo-100 leading-relaxed font-sans">
              {isNucleic
                ? "Les taux de GC élevés indiquent des zones stables à point de fusion (Tm) élevé. Idéal pour concevoir des amorces PCR robustes."
                : "La composition détermine le repliement structurel. Les domaines hydrophobes s'enfouissent au cœur des hélices d'acides aminés."
              }
            </p>
          </div>
        </div>
      </div>

      {/* 2. Composition Bar Chart (Left column) */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-800">
            {isNucleic ? 'Composition Nucléotidique' : 'Groupes Physico-chimiques'}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Répartition des bases de l'ADN/ARN ou des propriétés des acides aminés.
          </p>
        </div>

        <div className="h-[220px] w-full flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={isNucleic ? baseComposition : proteinComposition}
              margin={{ top: 10, right: 5, left: -20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
              <Tooltip
                contentStyle={{ background: '#1E293B', border: 'none', borderRadius: '8px', color: '#FFF' }}
                labelStyle={{ fontWeight: 'bold', fontSize: '11px', color: '#94A3B8' }}
                itemStyle={{ fontSize: '12px' }}
                formatter={(value: any, name: any, props: any) => [
                  `${value} (${props.payload.percentage}%)`,
                  isNucleic ? 'Fréquence' : 'Nombre'
                ]}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {(isNucleic ? baseComposition : proteinComposition).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Legend table */}
        <div className="mt-2 flex flex-col gap-1.5 text-xs">
          {(isNucleic ? baseComposition : proteinComposition).map((entry, idx) => (
            <div key={idx} className="flex items-center justify-between text-slate-700 py-1 border-b border-slate-50 last:border-b-0">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-xs shrink-0" style={{ backgroundColor: entry.color }}></span>
                <span className="font-semibold text-slate-800">{entry.name}</span>
                {!isNucleic && (
                  <span className="text-[10px] text-slate-400 font-mono hidden sm:inline truncate max-w-[120px]" title={(entry as any).elements}>
                    ({(entry as any).elements})
                  </span>
                )}
              </div>
              <span className="font-mono font-medium text-slate-600">
                {entry.count.toLocaleString()} ({entry.percentage}%)
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Sliding GC Profile Line Chart (Right column, spans 2 cols) */}
      <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-800">
              {isNucleic ? 'Profil de GC Glissant' : 'Propriétés Structurelles de la Protéine'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 font-sans">
              {isNucleic
                ? 'Taux de GC% calculé le long de la séquence d\'ADN pour localiser les îlots CpG.'
                : 'La composition d\'acides aminés glissante n\'est disponible que pour l\'ADN/ARN.'}
            </p>
          </div>

          {isNucleic && (
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-2 shrink-0">
              <div className="flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-xs font-semibold text-slate-600">Fenêtre :</span>
                <span className="text-xs font-bold text-indigo-600 font-mono w-10 text-right">{localWindowSize} bp</span>
              </div>
              <input
                id="gc-window-slider"
                type="range"
                min="10"
                max="300"
                step="5"
                value={localWindowSize}
                onChange={handleWindowSizeChange}
                className="w-24 accent-indigo-600 cursor-pointer"
              />
              <button
                id="btn-apply-window"
                onClick={applyWindowSize}
                disabled={localWindowSize === windowSize}
                className="px-2.5 py-1 text-[10px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:text-slate-400 rounded-lg transition-all cursor-pointer"
              >
                Appliquer
              </button>
            </div>
          )}
        </div>

        {isNucleic ? (
          <div className="h-[220px] w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={gcProfileData}
                margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis
                  dataKey="position"
                  tick={{ fontSize: 10, fill: '#64748B' }}
                  label={{ value: 'Position (bp)', position: 'insideBottom', offset: -5, fill: '#64748B', fontSize: 10 }}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#64748B' }}
                  domain={[0, 100]}
                  label={{ value: 'GC %', angle: -90, position: 'insideLeft', offset: 10, fill: '#64748B', fontSize: 10 }}
                />
                <Tooltip
                  contentStyle={{ background: '#1E293B', border: 'none', borderRadius: '8px', color: '#FFF' }}
                  labelStyle={{ fontWeight: 'bold', fontSize: '11px', color: '#94A3B8' }}
                  itemStyle={{ fontSize: '12px' }}
                  formatter={(value: any) => [`${value}%`, 'Taux GC%']}
                />
                {/* Indigo reference line for GC profile */}
                <Line
                  type="monotone"
                  dataKey="gcPercent"
                  stroke="#4F46E5"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[220px] border border-dashed border-slate-200 rounded-xl bg-slate-50/50 p-6 text-center">
            <HelpCircle className="w-10 h-10 text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-700">Profil de GC Indisponible</p>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              Les protéines n'ont pas de nucléotides G ou C à analyser. Ce graphique affiche l'évolution de la stabilité nucléotidique et est activé pour les séquences d'ADN et d'ARN.
            </p>
          </div>
        )}

        {isNucleic && (
          <div className="text-[10px] text-slate-500 flex justify-between items-center bg-slate-50 border border-slate-100 p-2.5 rounded-lg mt-1 font-sans">
            <span>💡 <b>Îlots CpG :</b> Zones de forte densité GC (souvent &gt; 50% ou 60%) près du début des gènes (promoteurs) chez les vertébrés.</span>
            <span className="hidden md:inline font-mono text-slate-400">Points calculés : {gcProfileData.length}</span>
          </div>
        )}
      </div>

    </div>
  );
};
