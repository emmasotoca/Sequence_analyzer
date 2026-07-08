import React, { useRef, useState } from 'react';
import { SequenceType, SequenceFormat } from '../types';
import { BIOLOGICAL_EXAMPLES } from '../data/examples';
import { parseAndCleanSequence, detectSequenceType } from '../utils/bioUtils';
import { FileUp, Trash2, HelpCircle, AlertCircle, RefreshCw, FileText } from 'lucide-react';

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

  // Badges for sequence type representation
  const getTypeBadge = () => {
    switch (detectedType) {
      case 'DNA':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            ADN double brin / simple brin
          </span>
        );
      case 'RNA':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-100">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            ARN (Uraciles détectés)
          </span>
        );
      case 'PROTEIN':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
            Protéine (Acides Aminés)
          </span>
        );
      case 'UNKNOWN':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-50 text-slate-500 border border-slate-200">
            Type non détecté
          </span>
        );
    }
  };

  return (
    <div id="sequence-input-container" className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight font-sans">
            Saisie de Séquence Biologique
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Collez votre séquence au format brut ou FASTA, ou chargez un fichier d'analyse.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {BIOLOGICAL_EXAMPLES.map((ex) => (
            <button
              id={`btn-load-${ex.id}`}
              key={ex.id}
              onClick={() => loadExample(ex.id)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-indigo-50/50 hover:text-indigo-700 border border-slate-200 hover:border-indigo-200 rounded-lg transition-all cursor-pointer"
              title={ex.description}
            >
              {ex.name.split(' : ')[1] || ex.name}
            </button>
          ))}
        </div>
      </div>

      <div
        className={`relative flex flex-col gap-2 rounded-xl border-2 border-dashed p-1 transition-all ${
          dragActive ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-200 hover:border-slate-300'
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
          className="w-full min-h-[180px] p-4 text-sm font-mono text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-y rounded-lg bg-slate-50/30"
        />

        {/* Drag Over Overlay */}
        {dragActive && (
          <div className="absolute inset-0 bg-indigo-50/90 flex flex-col items-center justify-center gap-2 rounded-xl pointer-events-none">
            <FileUp className="w-10 h-10 text-indigo-600 animate-bounce" />
            <p className="text-sm font-semibold text-indigo-800">Déposez votre fichier biologique ici</p>
            <p className="text-xs text-indigo-600">Prend en charge .txt, .fasta, .fa</p>
          </div>
        )}
      </div>

      {/* Control Buttons & Info Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
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
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-indigo-700 bg-indigo-50/60 hover:bg-indigo-100/80 border border-indigo-100 rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <FileUp className="w-4 h-4 text-indigo-600" />
            Importer un fichier
          </button>
          
          {sequence && (
            <button
              id="btn-clear-sequence"
              onClick={onClear}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-100 rounded-xl transition-all cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              Effacer
            </button>
          )}
        </div>

        {sequence && (
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-500">Format :</span>
              <span className="bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono font-bold text-[10px]">
                {format}
              </span>
            </div>
            {format === 'FASTA' && header && (
              <div className="flex items-center gap-1.5 max-w-[200px] truncate" title={header}>
                <span className="font-semibold text-slate-500">En-tête :</span>
                <span className="text-slate-700 font-mono italic">{header}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-500">Longueur nette :</span>
              <span className="font-bold text-slate-800 font-mono">{sequence.length.toLocaleString()} bp/aa</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-500">Molécule :</span>
              {getTypeBadge()}
            </div>
          </div>
        )}
      </div>

      {/* Real-time sequence validity / warnings */}
      {sequence && detectedType === 'UNKNOWN' && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-800 text-xs">
          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Attention : </span>
            La séquence entrée contient beaucoup de caractères non standards ou invalides. L'analyse peut donner des résultats erronés ou incomplets. Assurez-vous d'utiliser des bases nucléiques standards (A, C, G, T, U) ou des acides aminés (A-Z).
          </div>
        </div>
      )}
    </div>
  );
};
