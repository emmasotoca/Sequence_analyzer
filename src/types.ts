export type SequenceType = 'DNA' | 'RNA' | 'PROTEIN' | 'UNKNOWN';
export type SequenceFormat = 'RAW' | 'FASTA';

export interface BiologicalExample {
  id: string;
  name: string;
  type: SequenceType;
  sequence: string;
  description: string;
}

export interface ORF {
  id: string;
  frame: number; // 1, 2, 3, -1, -2, -3
  start: number; // 0-based index in the sequence (original strand, direct coords)
  end: number;   // 0-based index in the sequence (original strand, direct coords)
  lengthBp: number;
  lengthAa: number;
  dnaSeq: string;
  proteinSeq: string;
}

export interface MotifPattern {
  id: string;
  name: string;
  pattern: string; // IUPAC or literal pattern
  type: 'restriction' | 'promoter' | 'custom';
  description?: string;
}

export interface MotifMatch {
  id: string;
  name: string;
  start: number; // 0-based coordinate
  end: number;   // 0-based coordinate
  sequence: string;
  type: 'restriction' | 'promoter' | 'custom';
  description?: string;
}

export interface GCWindowData {
  position: number;
  gcPercent: number;
}

export interface BaseFreq {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

export interface AminoAcidGroupFreq {
  name: string;
  count: number;
  percentage: number;
  color: string;
  elements: string;
}

export interface HighlightRegion {
  start: number; // 0-based, inclusive
  end: number;   // 0-based, inclusive
  label: string;
  color: string;
  sourceType: 'orf' | 'motif' | 'selection';
}
