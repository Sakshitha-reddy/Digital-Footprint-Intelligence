import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UploadCloud,
  Image as ImageIcon,
  X,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  FileCheck,
} from 'lucide-react';

interface PhotoUploadDropzoneProps {
  onFileSelect: (file: File | null, previewUrl: string | null) => void;
  selectedFile: File | null;
  previewUrl: string | null;
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export const PhotoUploadDropzone: React.FC<PhotoUploadDropzoneProps> = ({
  onFileSelect,
  selectedFile,
  previewUrl,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const validateAndProcessFile = useCallback(
    (file: File) => {
      setErrorMessage(null);

      // Validate MIME type
      const isAcceptedType =
        ACCEPTED_TYPES.includes(file.type.toLowerCase()) ||
        /\.(jpe?g|png|webp)$/i.test(file.name);

      if (!isAcceptedType) {
        setErrorMessage('Invalid file format. Please upload JPG, PNG, or WEBP images only.');
        return;
      }

      // Validate File Size
      if (file.size > MAX_SIZE_BYTES) {
        setErrorMessage(`File exceeds 10MB limit (${formatFileSize(file.size)}). Please choose a smaller image.`);
        return;
      }

      setIsProcessing(true);

      const reader = new FileReader();
      reader.onload = () => {
        setIsProcessing(false);
        const dataUrl = reader.result as string;
        onFileSelect(file, dataUrl);
      };
      reader.onerror = () => {
        setIsProcessing(false);
        setErrorMessage('Failed to read selected image file.');
      };
      reader.readAsDataURL(file);
    },
    [onFileSelect]
  );

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      validateAndProcessFile(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      validateAndProcessFile(file);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFileSelect(null, null);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleReplace = (e: React.MouseEvent) => {
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const handleZoneClick = () => {
    if (!selectedFile && !previewUrl) {
      fileInputRef.current?.click();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
          <span>Target Reference Photo (Optional)</span>
        </label>
        <span className="text-[10px] font-mono text-slate-500">
          Max 10 MB · JPG, PNG, WEBP
        </span>
      </div>

      {/* Hidden Native File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        onChange={handleFileInputChange}
        className="hidden"
        aria-label="Upload target reference photo"
      />

      <AnimatePresence mode="wait">
        {!previewUrl ? (
          /* Empty / Dropzone State */
          <motion.div
            key="empty-dropzone"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleZoneClick}
            onKeyDown={handleKeyDown}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            tabIndex={0}
            role="button"
            aria-label="Drag and drop photo here or click to browse files"
            className={`w-full min-h-[160px] p-6 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${
              isDragging
                ? 'border-blue-400 bg-blue-600/15 scale-[1.01] shadow-lg shadow-blue-500/10'
                : 'border-white/[0.12] hover:border-blue-500/50 bg-[#060a12]/70 hover:bg-slate-900/50'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-3 text-blue-400">
              <UploadCloud className={`w-6 h-6 transition-transform duration-300 ${isDragging ? 'scale-110 -translate-y-0.5' : ''}`} />
            </div>

            <h4 className="text-sm font-bold text-white font-sans tracking-tight">
              Upload target photo
            </h4>

            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5 font-sans">
              <span>Drag & drop your image here</span>
              <span className="text-slate-600">or</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="text-blue-400 hover:text-blue-300 font-semibold underline underline-offset-2 transition-colors"
              >
                Browse files
              </button>
            </p>

            <div className="flex items-center gap-2 mt-3">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900 text-slate-400 border border-white/[0.06]">JPG</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900 text-slate-400 border border-white/[0.06]">PNG</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900 text-slate-400 border border-white/[0.06]">WEBP</span>
            </div>
          </motion.div>
        ) : (
          /* Uploaded Preview State */
          <motion.div
            key="preview-card"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="w-full p-4 rounded-2xl border border-blue-500/30 bg-[#080d19] flex items-center justify-between gap-4 shadow-md"
          >
            {/* Left: Thumbnail Preview & Metadata */}
            <div className="flex items-center gap-3.5 min-w-0 flex-1">
              <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-white/[0.12] bg-slate-950 flex-shrink-0">
                <img
                  src={previewUrl}
                  alt="Target upload preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-1 right-1 p-0.5 rounded-full bg-emerald-500 text-white">
                  <CheckCircle2 className="w-3 h-3" />
                </div>
              </div>

              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                  <p className="text-xs font-bold text-white font-sans truncate">
                    {selectedFile?.name || 'reference_photo.jpg'}
                  </p>
                </div>

                <p className="text-[11px] font-mono text-slate-400">
                  {selectedFile ? formatFileSize(selectedFile.size) : 'Preloaded Reference'}
                  <span className="mx-1.5 text-slate-600">·</span>
                  <span className="text-emerald-400 font-semibold">Ready for biometric correlation</span>
                </p>
              </div>
            </div>

            {/* Right: Actions (Replace & Remove) */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={handleReplace}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/[0.08] text-xs font-semibold transition-all flex items-center gap-1.5"
                title="Replace with another image"
              >
                <RefreshCw className="w-3 h-3 text-blue-400" />
                <span>Replace</span>
              </button>

              <button
                type="button"
                onClick={handleRemove}
                className="px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 hover:text-white border border-rose-800/40 text-xs font-semibold transition-all flex items-center gap-1.5"
                title="Remove uploaded photo"
              >
                <X className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      {errorMessage && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2 font-mono"
        >
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{errorMessage}</span>
        </motion.div>
      )}
    </div>
  );
};
