import React, { useMemo, useState } from 'react';
import { SequenceType, ORF, MotifMatch } from '../types';
import { HelpCircle, Info, Landmark } from 'lucide-react';

interface LinearMapProps {
  sequence: string;
  detectedType: SequenceType;
  orfs: ORF[];
  motifMatches: MotifMatch[];
  highlightedRegion: {
    start: number;
    end: number;
    label: string;
    color: string;
    sourceType: string;
  } | null;
  onHighlightRegion: (start: number, end: number, label: string, color: string, sourceType: any) => void;
}

export const LinearMap: React.FC<LinearMapProps> = ({
  sequence,
  detectedType,
  orfs,
  motifMatches,
  highlightedRegion,
  onHighlightRegion,
}) => {
  const [hoveredItem, setHoveredItem] = useState<{
    name: string;
    start: number;
    end: number;
    details: string;
    x: number;
    y: number;
  } | null>(null);

  const isNucleic = detectedType === 'DNA' || detectedType === 'RNA';
  const L = sequence ? sequence.length : 0;

  // Map 0-based sequence index to SVG X coordinates (20px margin left and right)
  const mapCoordsToX = (pos: number) => {
    if (L === 0) return 20;
    return 20 + (pos / L) * 960;
  };

  // Stack direct ORFs on lanes above axis (Y = 55, 38, 21)
  // Stack reverse ORFs on lanes below axis (Y = 105, 122, 139)
  const getOrfYCoordinate = (frame: number) => {
    switch (frame) {
      case 1: return 54;
      case 2: return 38;
      case 3: return 22;
      case -1: return 106;
      case -2: return 122;
      case -3: return 138;
      default: return 80;
    }
  };

  const getOrfColor = (frame: number) => {
    return frame > 0 
      ? 'rgba(16, 185, 129, 0.85)' // emerald green
      : 'rgba(245, 158, 11, 0.85)'; // amber orange
  };

  const getOrfStrokeColor = (frame: number) => {
    return frame > 0 ? '#10B981' : '#F59E0B';
  };

  const getMotifMatchColor = (type: string) => {
    switch (type) {
      case 'restriction': return '#EF4444'; // Red
      case 'promoter': return '#4F46E5'; // Indigo
      case 'custom':
      default:
        return '#8B5CF6'; // Purple
    }
  };

  // Generate ticks for scale ruler (10 divisions)
  const rulerTicks = useMemo(() => {
    if (L === 0) return [];
    const ticks = [];
    const division = Math.ceil(L / 10);
    const step = Math.max(1, Math.ceil(division / 10) * 10); // round to neat values

    for (let i = 0; i < L; i += step) {
      ticks.push(i);
    }
    // Always add the last position if not already there
    if (ticks[ticks.length - 1] !== L - 1) {
      ticks.push(L - 1);
    }
    return ticks;
  }, [L]);

  if (!sequence) return null;

  if (!isNucleic) {
    return (
      <div id="linear-map-disabled" className="bg-white border border-slate-200 rounded-2xl p-6 text-center text-slate-400">
        <p className="text-xs">Carte linéaire non générée pour l'analyse d'acides aminés isolés.</p>
      </div>
    );
  }

  return (
    <div id="linear-map-card" className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col gap-4 relative">
      <div>
        <h3 className="text-base font-bold text-slate-800">Carte Linéaire Interactive de la Séquence</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Cartographie globale des ORFs (vert = direct, jaune = complémentaire) et des motifs détectés. Survolez pour voir les infos, cliquez pour localiser.
        </p>
      </div>

      <div className="relative border border-slate-50 rounded-xl bg-slate-50/50 p-2 overflow-x-auto">
        <svg
          viewBox="0 0 1000 180"
          className="w-full min-w-[700px] h-[180px] overflow-visible select-none"
        >
          {/* BACKGROUND ACTIVE HIGHLIGHT AREA */}
          {highlightedRegion && (
            <rect
              x={mapCoordsToX(highlightedRegion.start)}
              y={10}
              width={Math.max(2, mapCoordsToX(highlightedRegion.end) - mapCoordsToX(highlightedRegion.start))}
              height={140}
              fill={`${highlightedRegion.color}15`}
              stroke={highlightedRegion.color}
              strokeWidth={1.2}
              strokeDasharray="4 3"
              className="transition-all duration-300"
            />
          )}

          {/* MAIN SEQUENCE CENTRAL AXIS LINE */}
          <line
            x1={mapCoordsToX(0)}
            y1={80}
            x2={mapCoordsToX(L - 1)}
            y2={80}
            stroke="#94A3B8"
            strokeWidth={4}
            strokeLinecap="round"
          />

          {/* Scale Ruler ticks & Labels */}
          {rulerTicks.map((tick, index) => {
            const x = mapCoordsToX(tick);
            return (
              <g key={index} className="opacity-70">
                <line x1={x} y1={76} x2={x} y2={84} stroke="#475569" strokeWidth={1.5} />
                <text
                  x={x}
                  y={95}
                  textAnchor="middle"
                  className="font-mono text-[9px] font-semibold fill-slate-500"
                >
                  {tick.toLocaleString()}
                </text>
              </g>
            );
          })}

          {/* GENOME MAP SCALE BAR ARROWS ON ENDS */}
          <polygon points="12,80 20,75 20,85" fill="#94A3B8" />
          <polygon points="988,80 980,75 980,85" fill="#94A3B8" />
          <text x={12} y={70} className="font-mono text-[8px] fill-slate-400 font-bold">5'</text>
          <text x={980} y={70} className="font-mono text-[8px] fill-slate-400 font-bold">3'</text>

          {/* 1. DETECTED ORFs LANES */}
          {orfs.map((orf) => {
            const x1 = mapCoordsToX(orf.start);
            const x2 = mapCoordsToX(orf.end);
            const w = Math.max(4, x2 - x1);
            const y = getOrfYCoordinate(orf.frame);
            const color = getOrfColor(orf.frame);
            const strokeColor = getOrfStrokeColor(orf.frame);
            const isHighlighted = highlightedRegion?.start === orf.start && highlightedRegion?.end === orf.end;

            return (
              <rect
                key={orf.id}
                x={x1}
                y={y - 5}
                width={w}
                height={10}
                rx={3}
                fill={color}
                stroke={isHighlighted ? '#1E293B' : strokeColor}
                strokeWidth={isHighlighted ? 2.5 : 1}
                className="cursor-pointer transition-all hover:opacity-100 hover:brightness-105"
                onClick={() => {
                  onHighlightRegion(
                    orf.start,
                    orf.end,
                    `ORF ${orf.frame > 0 ? '+' : ''}${orf.frame} (${orf.lengthAa} aa)`,
                    orf.frame > 0 ? '#10B981' : '#F59E0B',
                    'orf'
                  );
                }}
                onMouseEnter={(e) => {
                  setHoveredItem({
                    name: `Cadre d'Ouverture de Lecture (ORF)`,
                    start: orf.start,
                    end: orf.end,
                    details: `Cadre: ${orf.frame > 0 ? '+' : ''}${orf.frame} | Longueur: ${orf.lengthBp} bp (${orf.lengthAa} aa)`,
                    x: x1 + w / 2,
                    y: y - 10
                  });
                }}
                onMouseLeave={() => setHoveredItem(null)}
              />
            );
          })}

          {/* 2. MOTIF MATCHES */}
          {motifMatches.map((m) => {
            const x = mapCoordsToX(m.start);
            const color = getMotifMatchColor(m.type);
            const isHighlighted = highlightedRegion?.start === m.start && highlightedRegion?.end === m.end;

            // Draw different shapes based on motif type
            // Promoter: flags, Restriction: vertical pin, Custom: triangles
            const shapeProps = {
              className: "cursor-pointer hover:scale-125 transition-transform origin-bottom",
              onClick: () => {
                onHighlightRegion(
                  m.start,
                  m.end,
                  `${m.name} (${m.sequence})`,
                  color,
                  'motif'
                );
              },
              onMouseEnter: () => {
                setHoveredItem({
                  name: m.name,
                  start: m.start,
                  end: m.end,
                  details: `Séquence: ${m.sequence} | Type: ${m.type === 'restriction' ? 'Restriction' : m.type === 'promoter' ? 'Promoteur' : 'Personnalisé'}`,
                  x: x,
                  y: 65
                });
              },
              onMouseLeave: () => setHoveredItem(null)
            };

            if (m.type === 'restriction') {
              // Red vertical tag cut line
              return (
                <g key={m.id}>
                  <line
                    x1={x}
                    y1={65}
                    x2={x}
                    y2={95}
                    stroke={color}
                    strokeWidth={isHighlighted ? 3 : 1.8}
                    {...shapeProps}
                  />
                  <circle
                    cx={x}
                    cy={65}
                    r={3}
                    fill={color}
                    {...shapeProps}
                  />
                </g>
              );
            } else if (m.type === 'promoter') {
              // Blue flag/banner
              return (
                <polygon
                  key={m.id}
                  points={`${x},80 ${x},63 ${x+6},67 ${x},71`}
                  fill={color}
                  stroke={isHighlighted ? '#1E293B' : 'none'}
                  strokeWidth={isHighlighted ? 1.5 : 0}
                  {...shapeProps}
                />
              );
            } else {
              // Purple triangle/diamond
              return (
                <polygon
                  key={m.id}
                  points={`${x},74 ${x-4},80 ${x},86 ${x+4},80`}
                  fill={color}
                  stroke={isHighlighted ? '#1E293B' : 'none'}
                  strokeWidth={isHighlighted ? 1.5 : 0}
                  {...shapeProps}
                />
              );
            }
          })}
        </svg>

        {/* Dynamic Vector Tooltip on hover */}
        {hoveredItem && (
          <div
            className="absolute z-20 bg-slate-900 text-white rounded-lg p-2.5 shadow-md pointer-events-none text-[11px] leading-normal flex flex-col gap-0.5"
            style={{
              left: `${(hoveredItem.x / 1000) * 100}%`,
              transform: 'translateX(-50%)',
              bottom: '125px',
            }}
          >
            <span className="font-extrabold text-sky-400">{hoveredItem.name}</span>
            <span className="font-semibold">Coordonnées: {hoveredItem.start} .. {hoveredItem.end}</span>
            <span className="text-slate-300 italic">{hoveredItem.details}</span>
          </div>
        )}
      </div>

      {/* Map Legend indicators */}
      <div className="flex flex-wrap items-center justify-between gap-4 mt-2 border-t border-slate-100 pt-3 text-xs text-slate-500 font-sans">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-3.5 h-2 rounded bg-emerald-500"></span> ORFs Brin Direct (+1, +2, +3)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3.5 h-2 rounded bg-amber-500"></span> ORFs Brin Complémentaire (-1, -2, -3)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-3 bg-red-500"></span> Sites de Restriction
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-0.5 h-3 border-r-4 border-b-4 border-indigo-500"></span> Motifs Promoteurs
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rotate-45 bg-purple-500"></span> Motifs Personnalisés
          </span>
        </div>
        
        {highlightedRegion && (
          <div className="bg-blue-50 text-blue-800 px-3 py-1 rounded-lg border border-blue-100 font-semibold text-[11px] animate-pulse">
            Surligné : {highlightedRegion.label} ({highlightedRegion.start} .. {highlightedRegion.end})
          </div>
        )}
      </div>
    </div>
  );
};
