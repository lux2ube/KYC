import React, { useState, useEffect, useCallback, useRef } from 'react';
import { UploadIcon, CheckCircleIcon } from './icons';

interface ImageUploaderProps {
  label: string;
  file: File | null;
  onFileChange: (file: File | null) => void;
  disabled: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ label, file, onFileChange, disabled }) => {
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    onFileChange(selectedFile);
  };

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      if (disabled) return;
      const droppedFile = event.dataTransfer.files?.[0] || null;
      if (droppedFile && droppedFile.type.startsWith('image/')) {
          onFileChange(droppedFile);
      }
  }, [disabled, onFileChange]);

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
  };

  return (
    <div className="w-full">
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className={`relative w-full aspect-[1.6/1] border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-center transition-colors duration-200
        ${disabled ? 'border-gray-700 bg-gray-800/50 cursor-not-allowed' : 'border-gray-600 hover:border-blue-500 hover:bg-gray-700/50 cursor-pointer'}
        ${preview ? 'border-solid' : ''}`}
      >
        {preview ? (
          <>
            <img src={preview} alt="Preview" className="object-contain w-full h-full rounded-md" />
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <span className="text-white font-semibold">Click to change</span>
            </div>
             <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1">
                <CheckCircleIcon className="w-6 h-6 text-white" />
            </div>
          </>
        ) : (
          <div className="text-gray-500">
            <UploadIcon className="w-10 h-10 mx-auto mb-2" />
            <p className="font-semibold text-gray-400">{label}</p>
            <p className="text-xs text-gray-500">Click or drag & drop</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUploader;
