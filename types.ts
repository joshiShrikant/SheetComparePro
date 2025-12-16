export type RowData = Record<string, any>;

export enum ChangeType {
  UNCHANGED = 'UNCHANGED',
  UPDATED = 'UPDATED',
  NEW = 'NEW',
  REMOVED = 'REMOVED',
}

export interface ProcessedRow extends RowData {
  _meta_change_type: ChangeType;
  _meta_changed_columns: string[];
  _meta_row_id: string | number; // The value of the primary key
}

export interface FileData {
  name: string;
  data: RowData[];
  columns: string[];
}

export interface ComparisonStats {
  total: number;
  new: number;
  updated: number;
  removed: number;
  unchanged: number;
}

export interface ComparisonResult {
  rows: ProcessedRow[];
  allColumns: string[];
  stats: ComparisonStats;
  primaryKey: string;
}

export interface ComparisonConfig {
  primaryKey: string;
  ignoreCase: boolean;
}