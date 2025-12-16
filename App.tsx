import React, { useState, useMemo } from 'react';
import { FileDiff, Settings, Download, Play, RefreshCw, AlertTriangle } from 'lucide-react';
import FileUpload from './components/FileUpload';
import ResultsTable from './components/ResultsTable';
import SummaryCards from './components/SummaryCards';
import { readExcelFile, compareDatasets, exportToExcel } from './services/excelService';
import { FileData, ComparisonResult } from './types';

const App: React.FC = () => {
  const [baseFile, setBaseFile] = useState<FileData | null>(null);
  const [liveFile, setLiveFile] = useState<FileData | null>(null);
  
  const [baseFileRaw, setBaseFileRaw] = useState<File | null>(null);
  const [liveFileRaw, setLiveFileRaw] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [primaryKey, setPrimaryKey] = useState<string>('');
  const [ignoreCase, setIgnoreCase] = useState(true);
  
  const [result, setResult] = useState<ComparisonResult | null>(null);

  // Derive common columns to suggest Primary Key
  const commonColumns = useMemo(() => {
    if (!baseFile || !liveFile) return [];
    const baseSet = new Set(baseFile.columns);
    return liveFile.columns.filter(col => baseSet.has(col));
  }, [baseFile, liveFile]);

  // Handle file reading
  const handleFileSelect = async (file: File, type: 'base' | 'live') => {
    setError(null);
    setLoading(true);
    try {
      const data = await readExcelFile(file);
      if (type === 'base') {
        setBaseFileRaw(file);
        setBaseFile(data);
      } else {
        setLiveFileRaw(file);
        setLiveFile(data);
      }
    } catch (err) {
      console.error(err);
      setError(`Failed to read ${type} file. Please ensure it is a valid Excel file.`);
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = () => {
    if (!baseFile || !liveFile || !primaryKey) return;
    setLoading(true);
    // Timeout to allow UI to render loading state
    setTimeout(() => {
      try {
        const res = compareDatasets(baseFile, liveFile, { primaryKey, ignoreCase });
        setResult(res);
      } catch (err) {
        console.error(err);
        setError("An error occurred during comparison.");
      } finally {
        setLoading(false);
      }
    }, 100);
  };

  const handleReset = () => {
    setBaseFile(null);
    setLiveFile(null);
    setBaseFileRaw(null);
    setLiveFileRaw(null);
    setPrimaryKey('');
    setResult(null);
    setError(null);
  };

  const handleExport = () => {
    if (result) {
      exportToExcel(result);
    }
  };

  // Auto-select ID or Code if present in common columns
  React.useEffect(() => {
    if (commonColumns.length > 0 && !primaryKey) {
      const candidate = commonColumns.find(c => c.toLowerCase() === 'id' || c.toLowerCase().includes('code') || c.toLowerCase().includes('key'));
      if (candidate) setPrimaryKey(candidate);
      else setPrimaryKey(commonColumns[0]);
    }
  }, [commonColumns, primaryKey]);

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 font-sans p-6 md:p-12">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex items-center justify-between pb-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-200">
              <FileDiff className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">SheetCompare Pro</h1>
              <p className="text-gray-500 mt-1">Compare Data Dictionary vs Live File, highlight changes, and merge.</p>
            </div>
          </div>
          {result && (
            <button 
              onClick={handleReset}
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Start Over
            </button>
          )}
        </header>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700 animate-fade-in">
            <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Input Section */}
        {!result && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in-up">
            <FileUpload 
              label="1. Data Dictionary (Base File)"
              description="Upload the source of truth (backup/original)."
              file={baseFileRaw}
              onFileSelect={(f) => handleFileSelect(f, 'base')}
              onClear={() => { setBaseFile(null); setBaseFileRaw(null); }}
              color="blue"
            />
            <FileUpload 
              label="2. Live File (Client File)"
              description="Upload the updated file from the client."
              file={liveFileRaw}
              onFileSelect={(f) => handleFileSelect(f, 'live')}
              onClear={() => { setLiveFile(null); setLiveFileRaw(null); }}
              color="indigo"
            />
          </div>
        )}

        {/* Config & Action Section */}
        {baseFile && liveFile && !result && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row items-end md:items-center justify-between gap-6 animate-fade-in">
            <div className="flex flex-col md:flex-row gap-6 w-full">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                  <Settings className="w-4 h-4 mr-1 text-gray-500" />
                  Select Primary Key
                </label>
                <select 
                  className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  value={primaryKey}
                  onChange={(e) => setPrimaryKey(e.target.value)}
                >
                  <option value="" disabled>-- Select Column --</option>
                  {commonColumns.map(col => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">Column must exist in both files to align rows.</p>
              </div>

              <div className="flex-1 flex items-center h-full pt-6">
                <label className="inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={ignoreCase}
                    onChange={(e) => setIgnoreCase(e.target.checked)}
                  />
                  <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  <span className="ms-3 text-sm font-medium text-gray-900">Ignore Case (Text Comparison)</span>
                </label>
              </div>
            </div>

            <button 
              onClick={handleProcess}
              disabled={loading || !primaryKey}
              className={`flex items-center justify-center px-8 py-3 text-base font-medium text-white bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-300 transition-all ${loading ? 'opacity-75 cursor-wait' : ''}`}
            >
              {loading ? (
                <>
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 mr-2 fill-current" />
                  Compare Files
                </>
              )}
            </button>
          </div>
        )}

        {/* Results Section */}
        {result && (
          <div className="animate-fade-in space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">Comparison Results</h2>
              <button 
                onClick={handleExport}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-sm transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Merged Excel
              </button>
            </div>
            
            <SummaryCards stats={result.stats} />
            
            <div className="h-[600px]">
              <ResultsTable result={result} />
            </div>
          </div>
        )}
        
      </div>
    </div>
  );
};

export default App;