import React from 'react';
import { ComparisonStats } from '../types';
import { Database, PlusCircle, Trash2, Edit3, CheckCircle } from 'lucide-react';

interface SummaryCardsProps {
  stats: ComparisonStats;
}

const SummaryCards: React.FC<SummaryCardsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex items-center space-x-3">
        <div className="p-2 bg-gray-100 rounded-lg">
          <Database className="w-5 h-5 text-gray-600" />
        </div>
        <div>
          <p className="text-xs text-gray-500 font-medium uppercase">Total Rows</p>
          <p className="text-xl font-bold text-gray-800">{stats.total}</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex items-center space-x-3">
        <div className="p-2 bg-green-100 rounded-lg">
          <PlusCircle className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <p className="text-xs text-green-600 font-medium uppercase">New</p>
          <p className="text-xl font-bold text-green-700">{stats.new}</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex items-center space-x-3">
        <div className="p-2 bg-amber-100 rounded-lg">
          <Edit3 className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <p className="text-xs text-amber-600 font-medium uppercase">Updated</p>
          <p className="text-xl font-bold text-amber-700">{stats.updated}</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex items-center space-x-3">
        <div className="p-2 bg-rose-100 rounded-lg">
          <Trash2 className="w-5 h-5 text-rose-600" />
        </div>
        <div>
          <p className="text-xs text-rose-600 font-medium uppercase">Removed</p>
          <p className="text-xl font-bold text-rose-700">{stats.removed}</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex items-center space-x-3">
        <div className="p-2 bg-blue-100 rounded-lg">
          <CheckCircle className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <p className="text-xs text-blue-600 font-medium uppercase">Unchanged</p>
          <p className="text-xl font-bold text-blue-700">{stats.unchanged}</p>
        </div>
      </div>
    </div>
  );
};

export default SummaryCards;