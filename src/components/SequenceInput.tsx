import React, { useRef, useState } from 'react';
import { SequenceType, SequenceFormat } from '../types';
import { BIOLOGICAL_EXAMPLES } from '../data/examples';
import { FileUp, Trash2, CheckCircle2 } from 'lucide-react';

interface SequenceInputProps {
  rawInput: string;
  setRawInput: (val: string) => void;
  sequence: string;
  detectedType: SequenceType;
  format: SequenceFormat;
  header: string;
  onClear: () => void;
}

export const SequenceInput: React.FC<SequenceInputProps> = ({
  rawInput,
  setRawInput,
  sequence,
  detectedType,
  format,
  header,
  onClear,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);

  // Handle manual file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  // Process text file content
  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result && typeof event.target.result === 'string') {
        setRawInput(event.target.result);
      }
    };
    reader.readAsText(file);
  };

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const loadExample = (id: string) => {
    const ex = BIOLOGICAL_EXAMPLES.find(item => item.id === id);
    if (ex) {
      setRawInput(ex.sequence);
    }
  };

  // Helper to find currently selected example details
  const activeExample = BIOLOGICAL_EXAMPLES.find(
    (ex) => rawInput.includes(ex.sequence) || ex.sequence.includes(sequence)
  );

  const displayTitle = activeExample ? activeExample.name : (header ? header : "Séquence personnalisée");
  const displayDesc = activeExample ? activeExample.description : "Séquence brute importée ou saisie manuellement par l'utilisateur.";

  return (
    <div id="sequence-input-container" className="bg-white border border-slate-200 rounded-2xl shadow-xs p-6 flex flex-col gap-6">
      
      {/* 1. Header Section */}
      <div>
        <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wider block">
          FORMAT FASTA, RAW OU FICHIERS TEXTE EXTÉRIEURS
        </span>
        <h2 className="text-sm font-extrabold text-slate-800 tracking-tight font-sans uppercase mt-0.5">
          SAISIE DE LA SÉQUENCE BIOLOGIQUE
        </h2>
      </div>

      {/* 2. Samples Section */}
      <div className="flex flex-col gap-3">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          ÉCHANTILLONS DE SÉQUENCES RÉELLES
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {BIOLOGICAL_EXAMPLES.map((ex) => {
            const isSelected = activeExample?.id === ex.id;
            return (
              <div
                id={`btn-load-${ex.id}`}
                key={ex.id}
                onClick={() => loadExample(ex.id)}
                className={`p-4 border rounded-xl transition-colors cursor-pointer flex flex-col gap-1 ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50/10'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-700 truncate">
                    {ex.name}
                  </span>
                  <span
                    className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded shrink-0 ${
                      ex.type === 'DNA'
                        ? 'bg-blue-100 text-blue-700'
                        : ex.type === 'RNA'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {ex.type}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                  {ex.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Text Editor Section */}
      <div className="flex flex-col gap-3">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          ÉDITEUR DE SÉQUENCE BRUTE (FASTA / RAW)
        </h3>
        <div
          className={`relative flex flex-col rounded-xl border-2 border-dashed p-1 transition-all ${
            dragActive ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200 hover:border-slate-300'
          }`}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
        >
          <textarea
            id="sequence-textarea-input"
            value={rawInput}
            onChange={(e) => setRawInput(e.target.value)}
            placeholder=">Exemple_FASTA | Collez votre séquence d'ADN, ARN ou Protéine ici..."
            className="w-full min-h-[180px] p-4 pb-12 text-xs font-mono text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 border border-slate-200 rounded-xl bg-white resize-y"
          />

          {/* Delete Clear button overlay in bottom right */}
          {rawInput && (
            <button
              id="btn-clear-sequence"
              onClick={onClear}
              className="absolute right-4 bottom-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-extrabold px-3 py-1.5 rounded-lg text-[10px] tracking-wider transition-all cursor-pointer shadow-xs uppercase"
            >
              EFFACER
            </button>
          )}

          {/* Drag Over Overlay */}
          {dragActive && (
            <div className="absolute inset-0 bg-blue-50/90 flex flex-col items-center justify-center gap-2 rounded-xl pointer-events-none">
              <FileUp className="w-10 h-10 text-blue-600 animate-bounce" />
              <p className="text-sm font-semibold text-blue-800">Déposez votre fichier biologique ici</p>
              <p className="text-xs text-blue-600">Prend en charge .txt, .fasta, .fa</p>
            </div>
          )}
        </div>

        {/* 4. Import & Status Row */}
        <div className="flex flex-wrap items-center justify-between gap-4 mt-1">
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".txt,.fasta,.fa"
              className="hidden"
            />
            <button
              id="btn-upload-file"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-lg text-xs transition-all cursor-pointer shadow-xs uppercase"
            >
              <FileUp className="w-4 h-4" />
              IMPORTER FICHIER
            </button>
            <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
              FASTA, TXT, SEQ
            </span>
          </div>

          {sequence && (
            <div className="text-xs font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              SÉQUENCE CHARGÉE
            </div>
          )}
        </div>
      </div>

      {/* 5. Loaded Sequence Summary Block */}
      {sequence && (
        <div className="p-4 border border-slate-200 rounded-xl bg-blue-50/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-800 truncate max-w-md">
                {displayTitle}
              </span>
              <span
                className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase shrink-0 ${
                  detectedType === 'DNA'
                    ? 'bg-blue-600 text-white'
                    : detectedType === 'RNA'
                    ? 'bg-amber-500 text-white'
                    : 'bg-emerald-600 text-white'
                }`}
              >
                {detectedType === 'DNA' ? 'ADN' : detectedType === 'RNA' ? 'ARN' : 'Protéine'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-normal line-clamp-2">
              {displayDesc}
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end shrink-0">
            <span className="text-[9px] font-extrabold text-slate-400 tracking-wider uppercase">
              LONGUEUR
            </span>
            <span className="text-sm font-extrabold text-slate-800 font-mono mt-0.5">
              {sequence.length.toLocaleString()} {detectedType === 'PROTEIN' ? 'aa' : 'pb'}
            </span>
          </div>
        </div>
      )}

    </div>
  );
};
