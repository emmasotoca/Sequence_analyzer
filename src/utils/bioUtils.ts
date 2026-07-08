import { SequenceType, SequenceFormat, ORF, MotifMatch, MotifPattern, BaseFreq, AminoAcidGroupFreq, GCWindowData } from '../types';

// Standard Genetic Code (Codon -> Amino Acid)
export const CODON_TABLE: Record<string, string> = {
  'GCA': 'A', 'GCC': 'A', 'GCG': 'A', 'GCT': 'A', 'GCU': 'A',
  'TGC': 'C', 'TGT': 'C', 'TGCU': 'C', 'UGU': 'C', 'UGC': 'C',
  'GAC': 'D', 'GAT': 'D', 'GAU': 'D', 'GACU': 'D',
  'GAA': 'E', 'GAG': 'E',
  'TTC': 'F', 'TTT': 'F', 'UUC': 'F', 'UUU': 'F',
  'GGA': 'G', 'GGC': 'G', 'GGG': 'G', 'GGT': 'G', 'GGU': 'G',
  'CAC': 'H', 'CAT': 'H', 'CAU': 'H',
  'ATA': 'I', 'ATC': 'I', 'ATT': 'I', 'AUA': 'I', 'AUC': 'I', 'AUU': 'I',
  'AAA': 'K', 'AAG': 'K',
  'CTA': 'L', 'CTC': 'L', 'CTG': 'L', 'CTT': 'L', 'TTA': 'L', 'TTG': 'L',
  'CUA': 'L', 'CUC': 'L', 'CUG': 'L', 'CUU': 'L', 'UUA': 'L', 'UUG': 'L',
  'ATG': 'M', 'AUG': 'M', // Start codon
  'AAC': 'N', 'AAT': 'N', 'AAU': 'N',
  'CCA': 'P', 'CCC': 'P', 'CCG': 'P', 'CCT': 'P', 'CCU': 'P',
  'CAA': 'Q', 'CAG': 'Q',
  'AGA': 'R', 'AGG': 'R', 'CGA': 'R', 'CGC': 'R', 'CGG': 'R', 'CGT': 'R', 'CGU': 'R',
  'AGC': 'S', 'AGT': 'S', 'TCA': 'S', 'TCC': 'S', 'TCG': 'S', 'TCT': 'S',
  'AGU': 'S', 'UCA': 'S', 'UCC': 'S', 'UCG': 'S', 'UCU': 'S',
  'ACA': 'T', 'ACC': 'T', 'ACG': 'T', 'ACT': 'T', 'ACU': 'T',
  'GTA': 'V', 'GTC': 'V', 'GTG': 'V', 'GTT': 'V', 'GUA': 'V', 'GUC': 'V', 'GUG': 'V', 'GUU': 'V',
  'TGG': 'W', 'UGG': 'W',
  'TAC': 'Y', 'TAT': 'Y', 'UAC': 'Y', 'UAU': 'Y',
  'TAA': '*', 'TAG': '*', 'TGA': '*', // Stop codons
  'UAA': '*', 'UAG': '*', 'UGA': '*'
};

// Codon to Amino Acid Full Name (French)
export const AA_NAMES: Record<string, { short: string; full: string; property: string }> = {
  'A': { short: 'Ala', full: 'Alanine', property: 'Hydrophobe' },
  'C': { short: 'Cys', full: 'Cystéine', property: 'Polaire non chargée' },
  'D': { short: 'Asp', full: 'Acide Aspartique', property: 'Acide (Chargée -)' },
  'E': { short: 'Glu', full: 'Acide Glutamique', property: 'Acide (Chargée -)' },
  'F': { short: 'Phe', full: 'Phénylalanine', property: 'Hydrophobe / Aromatique' },
  'G': { short: 'Gly', full: 'Glycine', property: 'Polaire non chargée / Spéciale' },
  'H': { short: 'His', full: 'Histidine', property: 'Basique (Chargée +)' },
  'I': { short: 'Ile', full: 'Isoleucine', property: 'Hydrophobe' },
  'K': { short: 'Lys', full: 'Lysine', property: 'Basique (Chargée +)' },
  'L': { short: 'Leu', full: 'Leucine', property: 'Hydrophobe' },
  'M': { short: 'Met', full: 'Méthionine (START)', property: 'Hydrophobe' },
  'N': { short: 'Asn', full: 'Asparagine', property: 'Polaire non chargée' },
  'P': { short: 'Pro', full: 'Proline', property: 'Hydrophobe / Spéciale' },
  'Q': { short: 'Gln', full: 'Glutamine', property: 'Polaire non chargée' },
  'R': { short: 'Arg', full: 'Arginine', property: 'Basique (Chargée +)' },
  'S': { short: 'Ser', full: 'Sérine', property: 'Polaire non chargée' },
  'T': { short: 'Thr', full: 'Thréonine', property: 'Polaire non chargée' },
  'V': { short: 'Val', full: 'Valine', property: 'Hydrophobe' },
  'W': { short: 'Trp', full: 'Tryptophane', property: 'Hydrophobe / Aromatique' },
  'Y': { short: 'Tyr', full: 'Tyrosine', property: 'Polaire / Aromatique' },
  '*': { short: 'STOP', full: 'Codon STOP', property: 'Signal d\'Arrêt' }
};

// IUPAC Degenerate base translations
export const IUPAC_MAP: Record<string, string> = {
  'A': 'A', 'C': 'C', 'G': 'G', 'T': 'T', 'U': 'U',
  'R': '[AG]', 'Y': '[CTU]', 'S': '[GC]', 'W': '[ATU]',
  'K': '[GTU]', 'M': '[AC]', 'B': '[CGTU]', 'D': '[AGTU]',
  'H': '[ACTU]', 'V': '[ACG]', 'N': '[ACGTU]'
};

// Clean raw input from whitespaces, numbers, and FASTA headers
export function parseAndCleanSequence(rawText: string): {
  cleanedSeq: string;
  format: SequenceFormat;
  header: string;
} {
  const lines = rawText.trim().split('\n');
  let format: SequenceFormat = 'RAW';
  let header = '';
  let cleanedLines: string[] = [];

  if (lines.length > 0 && lines[0].startsWith('>')) {
    format = 'FASTA';
    header = lines[0].substring(1).trim();
    cleanedLines = lines.slice(1);
  } else {
    cleanedLines = lines;
  }

  // Remove numbers, whitespace, special characters, and convert to uppercase
  const cleanedSeq = cleanedLines
    .join('')
    .replace(/[\d\s\r\n\t_.-]/g, '')
    .toUpperCase();

  return { cleanedSeq, format, header };
}

// Automatic Sequence Type Detection
export function detectSequenceType(seq: string): SequenceType {
  if (!seq) return 'UNKNOWN';

  // Count matches
  const dnaChars = (seq.match(/[ACGTN]/g) || []).length;
  const rnaChars = (seq.match(/[ACGUN]/g) || []).length;
  
  const totalLen = seq.length;
  if (totalLen === 0) return 'UNKNOWN';

  const dnaRatio = dnaChars / totalLen;
  const rnaRatio = rnaChars / totalLen;

  // If > 85% is DNA or RNA bases, classify as nucleic acid
  if (dnaRatio > 0.85 || rnaRatio > 0.85) {
    // Distinguish DNA vs RNA based on T vs U counts
    const tCount = (seq.match(/T/g) || []).length;
    const uCount = (seq.match(/U/g) || []).length;

    if (uCount > tCount) {
      return 'RNA';
    } else {
      return 'DNA';
    }
  }

  // Protein alphabet validation: check how many characters fall in standard AA codes
  const aaChars = (seq.match(/[ACDEFGHIKLMNPQRSTVWY*]/g) || []).length;
  const aaRatio = aaChars / totalLen;

  if (aaRatio > 0.80) {
    return 'PROTEIN';
  }

  return 'UNKNOWN';
}

// Convert DNA to RNA (Transcription)
export function transcribeDNA(dna: string): string {
  return dna.replace(/T/g, 'U');
}

// Convert RNA to DNA (Reverse Transcription)
export function reverseTranscribeRNA(rna: string): string {
  return rna.replace(/U/g, 'T');
}

// Reverse Complement of DNA
export function getReverseComplementDNA(dna: string): string {
  const complements: Record<string, string> = {
    'A': 'T', 'T': 'A', 'C': 'G', 'G': 'C', 'N': 'N',
    'R': 'Y', 'Y': 'R', 'S': 'S', 'W': 'W', 'K': 'M', 'M': 'K',
    'B': 'V', 'D': 'H', 'H': 'D', 'V': 'B'
  };
  return dna
    .split('')
    .reverse()
    .map(base => complements[base] || base)
    .join('');
}

// Reverse Complement of RNA
export function getReverseComplementRNA(rna: string): string {
  const complements: Record<string, string> = {
    'A': 'U', 'U': 'A', 'C': 'G', 'G': 'C', 'N': 'N',
    'R': 'Y', 'Y': 'R', 'S': 'S', 'W': 'W', 'K': 'M', 'M': 'K',
    'B': 'V', 'D': 'H', 'H': 'D', 'V': 'B'
  };
  return rna
    .split('')
    .reverse()
    .map(base => complements[base] || base)
    .join('');
}

// Molecular Weight Estimator (g/mol)
export function calculateMolecularWeight(seq: string, type: SequenceType): number {
  if (!seq || seq.length === 0) return 0;

  if (type === 'DNA') {
    // Formula: Weight = (An * 313.2) + (Cn * 289.2) + (Gn * 329.2) + (Tn * 304.2) + 79.0 (for 5' phosphate)
    const counts = { A: 0, C: 0, G: 0, T: 0, N: 0 };
    for (const char of seq) {
      if (char in counts) counts[char as keyof typeof counts]++;
      else counts.N++;
    }
    const weight = (counts.A * 313.21) + (counts.C * 289.18) + (counts.G * 329.21) + (counts.T * 304.2) + (counts.N * 309.1) + 79.0;
    return Math.round(weight * 100) / 100;
  }

  if (type === 'RNA') {
    // Formula: Weight = (An * 329.2) + (Cn * 305.2) + (Gn * 345.2) + (Un * 320.2) + 79.0 (for 5' phosphate)
    const counts = { A: 0, C: 0, G: 0, U: 0, N: 0 };
    for (const char of seq) {
      if (char in counts) counts[char as keyof typeof counts]++;
      else counts.N++;
    }
    const weight = (counts.A * 329.21) + (counts.C * 305.18) + (counts.G * 345.21) + (counts.U * 320.2) + (counts.N * 325.1) + 79.0;
    return Math.round(weight * 100) / 100;
  }

  if (type === 'PROTEIN') {
    // Weights of individual water-free amino acid residues
    const aaWeights: Record<string, number> = {
      'A': 71.08, 'R': 156.19, 'N': 114.10, 'D': 115.09, 'C': 103.14,
      'E': 129.12, 'Q': 128.13, 'G': 57.05, 'H': 137.14, 'I': 113.16,
      'L': 113.16, 'K': 128.17, 'M': 131.19, 'F': 147.18, 'P': 97.12,
      'S': 87.08, 'T': 101.10, 'W': 186.21, 'Y': 163.18, 'V': 99.13
    };
    let weight = 0;
    for (const char of seq) {
      weight += aaWeights[char] || 110.0; // 110.0 is the average AA residue weight
    }
    // Add water molecule weight (18.02) for the terminal ends
    if (weight > 0) weight += 18.02;
    return Math.round(weight * 100) / 100;
  }

  return 0;
}

// Base composition frequencies for Nucleic Acids
export function calculateBaseComposition(seq: string, type: SequenceType): BaseFreq[] {
  if (type !== 'DNA' && type !== 'RNA') return [];

  const len = seq.length || 1;
  const counts: Record<string, number> = {};
  const standardBases = type === 'DNA' ? ['A', 'C', 'G', 'T'] : ['A', 'C', 'G', 'U'];
  
  // Initialize standard bases
  standardBases.forEach(b => { counts[b] = 0; });
  counts['N/Autre'] = 0;

  for (const char of seq) {
    if (standardBases.includes(char)) {
      counts[char]++;
    } else {
      counts['N/Autre']++;
    }
  }

  const colors: Record<string, string> = {
    'A': '#3B82F6', // Blue
    'C': '#EF4444', // Red
    'G': '#10B981', // Green
    'T': '#F59E0B', // Orange/Yellow
    'U': '#F59E0B', // Orange/Yellow
    'N/Autre': '#6B7280' // Gray
  };

  return Object.keys(counts).map(base => ({
    name: base,
    count: counts[base],
    percentage: Math.round((counts[base] / len) * 1000) / 10,
    color: colors[base] || '#9CA3AF'
  }));
}

// Amino Acid group composition
export function calculateAminoAcidGroupComposition(seq: string): AminoAcidGroupFreq[] {
  const len = seq.length || 1;
  const groups = [
    { name: 'Hydrophobes', elements: 'AVILMFYWP', color: '#10B981', count: 0 },
    { name: 'Polaires non chargés', elements: 'STCNQG', color: '#3B82F6', count: 0 },
    { name: 'Basiques (Chargés +)', elements: 'KRH', color: '#8B5CF6', count: 0 },
    { name: 'Acides (Chargés -)', elements: 'DE', color: '#EF4444', count: 0 }
  ];

  let otherCount = 0;

  for (const char of seq) {
    let assigned = false;
    for (const g of groups) {
      if (g.elements.includes(char)) {
        g.count++;
        assigned = true;
        break;
      }
    }
    if (!assigned && char !== '*') {
      otherCount++;
    }
  }

  const result: AminoAcidGroupFreq[] = groups.map(g => ({
    name: g.name,
    count: g.count,
    percentage: Math.round((g.count / len) * 1000) / 10,
    color: g.color,
    elements: g.elements.split('').join(', ')
  }));

  if (otherCount > 0) {
    result.push({
      name: 'Autres / Inconnus',
      count: otherCount,
      percentage: Math.round((otherCount / len) * 1000) / 10,
      color: '#6B7280',
      elements: 'Séquences d\'arrêt ou acides aminés atypiques'
    });
  }

  return result;
}

// Sliding GC% profile generator
export function generateGCProfile(seq: string, windowSize: number): GCWindowData[] {
  const len = seq.length;
  if (len < windowSize || windowSize <= 0) {
    // Return simple points if sequence is shorter than window
    const gc = (seq.match(/[CG]/g) || []).length;
    const gcPct = len > 0 ? (gc / len) * 100 : 0;
    return [{ position: 1, gcPercent: Math.round(gcPct * 10) / 10 }];
  }

  const data: GCWindowData[] = [];
  
  // Decide steps to keep data points reasonable (max ~300 points for charts)
  const maxPoints = 250;
  const step = Math.max(1, Math.ceil((len - windowSize) / maxPoints));

  for (let i = 0; i <= len - windowSize; i += step) {
    const sub = seq.substring(i, i + windowSize);
    const gcCount = (sub.match(/[CG]/g) || []).length;
    const gcPercent = (gcCount / windowSize) * 100;
    data.push({
      position: i + Math.floor(windowSize / 2) + 1, // Midpoint coordinate
      gcPercent: Math.round(gcPercent * 10) / 10
    });
  }

  return data;
}

// Translate a specific 3-letter codon
export function translateCodon(codon: string): string {
  const cleanCodon = codon.toUpperCase().replace(/T/g, 'U');
  return CODON_TABLE[cleanCodon] || '?';
}

// Translate sequence in a direct reading frame (1, 2, 3)
export function translateFrame(seq: string, frame: number, type: SequenceType): string {
  // Convert to RNA if DNA for standard processing, or process directly
  const standardSeq = type === 'DNA' ? transcribeDNA(seq) : seq;
  const offset = frame - 1;
  let translated = '';

  for (let i = offset; i <= standardSeq.length - 3; i += 3) {
    const codon = standardSeq.substring(i, i + 3);
    translated += CODON_TABLE[codon] || '?';
  }

  return translated;
}

// Full 6-Frame translation (returns lists of amino acids aligned with nucleotides)
export function get6FrameTranslation(seq: string, type: SequenceType): {
  direct: { frame1: string[]; frame2: string[]; frame3: string[] };
  reverse: { frame1: string[]; frame2: string[]; frame3: string[] };
} {
  const directSeq = type === 'DNA' ? seq : reverseTranscribeRNA(seq); // Work with DNA representation
  const reverseSeq = getReverseComplementDNA(directSeq);

  const translateSeqToCodonArray = (s: string, offset: number): string[] => {
    const arr: string[] = [];
    // Add empty spacers for offsets
    for (let o = 0; o < offset; o++) {
      arr.push('');
    }
    for (let i = offset; i <= s.length - 3; i += 3) {
      const codon = s.substring(i, i + 3);
      arr.push(CODON_TABLE[codon] || '?');
    }
    return arr;
  };

  return {
    direct: {
      frame1: translateSeqToCodonArray(directSeq, 0),
      frame2: translateSeqToCodonArray(directSeq, 1),
      frame3: translateSeqToCodonArray(directSeq, 2)
    },
    reverse: {
      frame1: translateSeqToCodonArray(reverseSeq, 0),
      frame2: translateSeqToCodonArray(reverseSeq, 1),
      frame3: translateSeqToCodonArray(reverseSeq, 2)
    }
  };
}

// ORF Finder (6 Open Reading Frames search)
// Direct DNA coordinates mapping
export function findORFs(dnaSeq: string, minLengthAa: number): ORF[] {
  const orfs: ORF[] = [];
  const seqLen = dnaSeq.length;

  const findStrandORFs = (seq: string, isReverseStrand: boolean) => {
    // Scan frames 0, 1, 2
    for (let f = 0; f < 3; f++) {
      const frameNum = isReverseStrand ? -(f + 1) : (f + 1);
      
      // Keep track of started ORFs in this frame
      // Map of start_codon_index (index in codons) -> start sequence position
      let currentStarts: number[] = [];

      for (let i = f; i <= seq.length - 3; i += 3) {
        const codon = seq.substring(i, i + 3);
        
        // START codon ATG
        if (codon === 'ATG') {
          currentStarts.push(i);
        }
        
        // STOP codons TAA, TAG, TGA
        if (codon === 'TAA' || codon === 'TAG' || codon === 'TGA') {
          if (currentStarts.length > 0) {
            // End of ORFs. Create ORF for all matching starts in this frame (nested ORFs or longest)
            // Usually, standard gene finders might look at the longest ORF or all potential ORFs.
            // Let's take the longest one or list all. Listing all starts that terminate here is highly informative.
            // We'll filter based on minimum amino acid length.
            for (const startPos of currentStarts) {
              const lengthBp = (i + 3) - startPos;
              const lengthAa = (lengthBp / 3) - 1; // excluding stop codon

              if (lengthAa >= minLengthAa) {
                const orfDna = seq.substring(startPos, i + 3);
                
                // Translate the ORF
                let proteinSeq = '';
                for (let cIdx = 0; cIdx < orfDna.length - 3; cIdx += 3) {
                  proteinSeq += CODON_TABLE[orfDna.substring(cIdx, cIdx + 3)] || '?';
                }

                // Map coordinates back to direct strand
                let directStart = 0;
                let directEnd = 0;

                if (!isReverseStrand) {
                  directStart = startPos;
                  directEnd = i + 2; // last base of stop codon
                } else {
                  // For reverse strand: index 'x' maps to 'seqLen - 1 - x' in direct strand
                  // 5' end of reverse strand maps to 3' of direct strand
                  // So reverse position startPos is direct coordinate (seqLen - 1 - startPos)
                  // reverse position i+2 is direct coordinate (seqLen - 1 - (i+2))
                  // On the direct strand, the region goes from the smaller index to the larger index
                  directStart = seqLen - 1 - (i + 2);
                  directEnd = seqLen - 1 - startPos;
                }

                orfs.push({
                  id: `orf_${frameNum}_${directStart}_${directEnd}`,
                  frame: frameNum,
                  start: directStart,
                  end: directEnd,
                  lengthBp,
                  lengthAa,
                  dnaSeq: orfDna,
                  proteinSeq
                });
              }
            }
            // Clear starts after reaching a STOP codon
            currentStarts = [];
          }
        }
      }
    }
  };

  // 1. Direct strand
  findStrandORFs(dnaSeq, false);

  // 2. Reverse strand
  const revComp = getReverseComplementDNA(dnaSeq);
  findStrandORFs(revComp, true);

  // Sort ORFs by length (longest first) or position
  return orfs.sort((a, b) => b.lengthBp - a.lengthBp);
}

// Convert IUPAC pattern to valid Javascript Regular Expression
export function iupacToRegex(pattern: string): RegExp {
  let regexStr = '';
  for (const char of pattern.toUpperCase()) {
    regexStr += IUPAC_MAP[char] || char;
  }
  return new RegExp(regexStr, 'gi');
}

// Default biological motifs
export const DEFAULT_MOTIFS: MotifPattern[] = [
  // Sites de restriction
  { id: 'ecori', name: 'EcoRI (Site de restriction)', pattern: 'GAATTC', type: 'restriction', description: 'Enzyme de restriction coupant à G|AATTC' },
  { id: 'hindiii', name: 'HindIII (Site de restriction)', pattern: 'AAGCTT', type: 'restriction', description: 'Enzyme de restriction coupant à A|AGCTT' },
  { id: 'bamhi', name: 'BamHI (Site de restriction)', pattern: 'GGATCC', type: 'restriction', description: 'Enzyme de restriction coupant à G|GATCC' },
  { id: 'noti', name: 'NotI (Site de restriction)', pattern: 'GCGGCCGC', type: 'restriction', description: 'Enzyme de restriction rare coupant à GC|GGCCGC' },
  { id: 'taqi', name: 'TaqI (Site de restriction)', pattern: 'TCGA', type: 'restriction', description: 'Enzyme de restriction thermostable coupant à T|CGA' },
  // Promoteurs / Boîtes structurales
  { id: 'tata_box', name: 'Boîte TATA (Eucaryotes)', pattern: 'TATAWAW', type: 'promoter', description: 'Séquence promotrice eucaryote consensus (W = A ou T)' },
  { id: 'pribnow_box', name: 'Boîte de Pribnow (Procaryotes)', pattern: 'TATAAT', type: 'promoter', description: 'Région promotrice bactérienne consensus à -10' },
  { id: 'kozak', name: 'Séquence de Kozak (Initiation)', pattern: 'RCCATGG', type: 'promoter', description: 'Séquence consensus d\'initiation de la traduction chez les eucaryotes (R = A ou G)' },
  { id: 'shine_dalgarno', name: 'Séquence de Shine-Dalgarno', pattern: 'AGGAGG', type: 'promoter', description: 'Site de liaison du ribosome chez les procaryotes' },
  { id: 'cpg_island', name: 'Séquence double CpG', pattern: 'CG', type: 'custom', description: 'Dinucléotide CpG impliqué dans la méthylation de l\'ADN' }
];

// Match motifs in DNA sequence
export function searchMotifs(dnaSeq: string, motifs: MotifPattern[]): MotifMatch[] {
  const matches: MotifMatch[] = [];

  motifs.forEach(motif => {
    try {
      const regex = iupacToRegex(motif.pattern);
      let match;
      
      // Reset regex index for safety
      regex.lastIndex = 0;

      // Exec regex in loop to find all overlapping or sequential matches
      // To allow overlapping matches (like CG repeating), we can execute custom index searches
      // or standard global regex match. Let's do standard regex which is robust.
      // To support overlapping matches we can use lookahead assertions, but simple global find is usually expected.
      const rawMatches: { start: number; text: string }[] = [];
      
      // Direct search
      let m;
      while ((m = regex.exec(dnaSeq)) !== null) {
        if (m.index === regex.lastIndex) {
          regex.lastIndex++; // Avoid infinite loops on empty matches
        }
        rawMatches.push({
          start: m.index,
          text: m[0]
        });
      }

      rawMatches.forEach((rm, idx) => {
        matches.push({
          id: `match_${motif.id}_${rm.start}_${idx}`,
          name: motif.name,
          start: rm.start,
          end: rm.start + rm.text.length - 1,
          sequence: rm.text,
          type: motif.type,
          description: motif.description || `Motif: ${motif.pattern}`
        });
      });
    } catch (e) {
      console.error(`Erreur de Regex pour le motif ${motif.name}:`, e);
    }
  });

  return matches.sort((a, b) => a.start - b.start);
}
