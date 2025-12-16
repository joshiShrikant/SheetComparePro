import React, { useRef } from 'react';
import { Upload, FileSpreadsheet, X, CheckCircle } from 'lucide-react';

interface FileUploadProps {
  label: string;
  description: string;
  file: File | null;
  onFileSelect: (file: File) => void;
  onClear: () => void;
  color: 'blue' | 'indigo';
}

const FileUpload: React.FC<FileUploadProps> = ({ label, description, file, onFileSelect, onClear, color }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.match(/\.(xlsx|xls|csv)$/)) {
         onFileSelect(droppedFile);
      } else {
        alert("Please upload an Excel file (.xlsx, .xls) or CSV.");
      }
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  const colorClasses = color === 'blue' 
    ? 'border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100' 
    : 'border-indigo-300 bg-indigo-50 text-indigo-700 hover:bg-indigo-100';

  return (
    <div className="flex flex-col w-full">
      <label className="text-sm font-semibold text-gray-700 mb-2">{label}</label>
      
      {!file ? (
        <div
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${colorClasses}`}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="w-8 h-8 mb-2 opacity-75" />
            <p className="mb-1 text-sm"><span className="font-semibold">Click to upload</span> or drag and drop</p>
            <p className="text-xs opacity-75">{description}</p>
          </div>
          <input 
            ref={inputRef}
            type="file" 
            className="hidden" 
            accept=".xlsx, .xls, .csv" 
            onChange={handleInputChange}
          />
        </div>
      ) : (
        <div className={`relative flex items-center p-4 border rounded-lg ${color === 'blue' ? 'bg-blue-50 border-blue-200' : 'bg-indigo-50 border-indigo-200'}`}>
          <FileSpreadsheet className={`w-8 h-8 mr-3 ${color === 'blue' ? 'text-blue-600' : 'text-indigo-600'}`} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
            <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
          </div>
          <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
          <button 
            onClick={onClear}
            className="p-1 rounded-full hover:bg-gray-200 text-gray-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default FileUpload;