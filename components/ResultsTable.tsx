import React, { useState, useMemo } from 'react';
import { ComparisonResult, ChangeType, ProcessedRow } from '../types';
import { ChevronLeft, ChevronRight, AlertCircle, ArrowRight } from 'lucide-react';

interface ResultsTableProps {
  result: ComparisonResult;
}

const PAGE_SIZE = 50;

const ResultsTable: React.FC<ResultsTableProps> = ({ result }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [filterType, setFilterType] = useState<ChangeType | 'ALL'>('ALL');

  const filteredRows = useMemo(() => {
    if (filterType === 'ALL') return result.rows;
    return result.rows.filter(r => r._meta_change_type === filterType);
  }, [result.rows, filterType]);

  const totalPages = Math.ceil(filteredRows.length / PAGE_SIZE);
  
  const currentRows = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredRows.slice(start, start + PAGE_SIZE);
  }, [currentPage, filteredRows]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const getRowStyle = (type: ChangeType) => {
    switch (type) {
      case ChangeType.NEW: return 'bg-green-100 hover:bg-green-200';
      case ChangeType.REMOVED: return 'bg-rose-50 hover:bg-rose-100 opacity-75';
      case ChangeType.UPDATED: return 'bg-amber-50 hover:bg-amber-100';
      default: return 'hover:bg-gray-50';
    }
  };

  const getBadgeStyle = (type: ChangeType) => {
    switch (type) {
      case ChangeType.NEW: return 'bg-green-200 text-green-800 border-green-300';
      case ChangeType.REMOVED: return 'bg-rose-100 text-rose-800 border-rose-200';
      case ChangeType.UPDATED: return 'bg-amber-100 text-amber-800 border-amber-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const isCellChanged = (row: ProcessedRow, col: string) => {
    return row._meta_change_type === ChangeType.UPDATED && row._meta_changed_columns.includes(col);
  };

  // Ensure Primary key is first
  const displayColumns = useMemo(() => {
    const cols = result.allColumns.filter(c => c !== result.primaryKey);
    return [result.primaryKey, ...cols];
  }, [result.allColumns, result.primaryKey]);

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Table Toolbar */}
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">Filter:</span>
          <select 
            className="text-sm border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-1.5 border"
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value as any);
              setCurrentPage(1);
            }}
          >
            <option value="ALL">All Changes</option>
            <option value={ChangeType.UPDATED}>Updated</option>
            <option value={ChangeType.NEW}>New</option>
            <option value={ChangeType.REMOVED}>Removed</option>
            <option value={ChangeType.UNCHANGED}>Unchanged</option>
          </select>
          <span className="text-xs text-gray-500 ml-2">Showing {filteredRows.length} rows</span>
        </div>

        <div className="flex items-center space-x-2">
           <button 
             onClick={() => handlePageChange(currentPage - 1)}
             disabled={currentPage === 1}
             className="p-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
           >
             <ChevronLeft className="w-5 h-5 text-gray-600" />
           </button>
           <span className="text-sm text-gray-600">
             Page {currentPage} of {totalPages || 1}
           </span>
           <button 
             onClick={() => handlePageChange(currentPage + 1)}
             disabled={currentPage === totalPages || totalPages === 0}
             className="p-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
           >
             <ChevronRight className="w-5 h-5 text-gray-600" />
           </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="flex-1 overflow-auto custom-scrollbar relative">
        <table className="min-w-full divide-y divide-gray-200 border-collapse">
          <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                Status
              </th>
              {displayColumns.map((col) => (
                <th key={col} className={`px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap ${col === result.primaryKey ? 'bg-indigo-50/50 text-indigo-700' : ''}`}>
                  {col} {col === result.primaryKey && '(PK)'}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentRows.map((row) => (
              <tr key={String(row._meta_row_id)} className={`transition-colors duration-150 ${getRowStyle(row._meta_change_type)}`}>
                <td className="px-4 py-2 whitespace-nowrap sticky left-0 z-10 bg-inherit shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getBadgeStyle(row._meta_change_type)}`}>
                    {row._meta_change_type}
                  </span>
                </td>
                {displayColumns.map((col) => {
                  const isChanged = isCellChanged(row, col);
                  const isPK = col === result.primaryKey;
                  
                  return (
                    <td 
                      key={col} 
                      className={`px-4 py-2 whitespace-nowrap text-sm text-gray-700 ${isChanged ? 'bg-green-200 font-medium text-green-900 ring-1 ring-inset ring-green-300' : ''} ${isPK ? 'font-semibold text-gray-900' : ''}`}
                    >
                      {row[col] !== null && row[col] !== undefined ? String(row[col]) : <span className="text-gray-300 italic">null</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
            {currentRows.length === 0 && (
              <tr>
                <td colSpan={displayColumns.length + 1} className="px-4 py-8 text-center text-gray-500">
                  <div className="flex flex-col items-center">
                    <AlertCircle className="w-8 h-8 mb-2 text-gray-300" />
                    <p>No rows found for this filter.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ResultsTable;