import * as XLSX from 'xlsx';
import { FileData, ComparisonConfig, ComparisonResult, ChangeType, ProcessedRow, RowData } from '../types';

/**
 * Reads an Excel file and returns the data from the first sheet.
 */
export const readExcelFile = async (file: File): Promise<FileData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        // Convert to JSON with headers
        const jsonData = XLSX.utils.sheet_to_json<RowData>(sheet, { defval: "" });
        
        // Extract columns from the first row if available, or scan keys
        let columns: string[] = [];
        if (jsonData.length > 0) {
          // get unique keys from all rows to handle potential sparse data
          const allKeys = new Set<string>();
          jsonData.forEach(row => Object.keys(row).forEach(k => allKeys.add(k)));
          columns = Array.from(allKeys);
        }

        resolve({
          name: file.name,
          data: jsonData,
          columns
        });
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
};

/**
 * Normalizes values for comparison based on config.
 */
const normalizeValue = (val: any, ignoreCase: boolean): string => {
  if (val === null || val === undefined) return '';
  const str = String(val).trim();
  return ignoreCase ? str.toLowerCase() : str;
};

/**
 * Core logic to compare two datasets.
 */
export const compareDatasets = (
  baseFile: FileData,
  liveFile: FileData,
  config: ComparisonConfig
): ComparisonResult => {
  const { primaryKey, ignoreCase } = config;
  
  // 1. Index Base Data
  const baseMap = new Map<string, RowData>();
  baseFile.data.forEach(row => {
    const keyVal = row[primaryKey];
    if (keyVal !== undefined && keyVal !== null && keyVal !== '') {
      baseMap.set(String(keyVal), row);
    }
  });

  // 2. Index Live Data
  const liveMap = new Map<string, RowData>();
  liveFile.data.forEach(row => {
    const keyVal = row[primaryKey];
    if (keyVal !== undefined && keyVal !== null && keyVal !== '') {
      liveMap.set(String(keyVal), row);
    }
  });

  // 3. Determine Union of Columns
  const allColumnsSet = new Set([...baseFile.columns, ...liveFile.columns]);
  // Ensure primary key is first, followed by specific metadata columns if we wanted to enforce order
  // But for now we just convert to array.
  const allColumns = Array.from(allColumnsSet);

  const processedRows: ProcessedRow[] = [];
  const stats = { total: 0, new: 0, updated: 0, removed: 0, unchanged: 0 };

  // 4. Compare Base vs Live (Handle REMOVED, UPDATED, UNCHANGED)
  baseMap.forEach((baseRow, key) => {
    const liveRow = liveMap.get(key);

    if (!liveRow) {
      // REMOVED
      processedRows.push({
        ...baseRow,
        _meta_change_type: ChangeType.REMOVED,
        _meta_changed_columns: [],
        _meta_row_id: key
      });
      stats.removed++;
    } else {
      // Compare Columns
      const changedCols: string[] = [];
      let isUpdated = false;

      // We compare all columns present in the union, except the primary key (which must match)
      allColumns.forEach(col => {
        if (col === primaryKey) return;

        const baseVal = baseRow[col];
        const liveVal = liveRow[col];

        // Logic: 
        // If col exists only in dictionary, retain dictionary value (handled by default merge if unchaged, but we need to check change).
        // If col exists only in live, it's a value change if base was empty/undefined.
        
        const normBase = normalizeValue(baseVal, ignoreCase);
        const normLive = normalizeValue(liveVal, ignoreCase);

        if (normBase !== normLive) {
          changedCols.push(col);
          isUpdated = true;
        }
      });

      if (isUpdated) {
        // Merge strategy: Use Live row values, but ensure we keep base columns that might be missing in Live (though logic says update if changed)
        // Actually, requirement says: "If unchanged -> keep dictionary value". 
        // "If a cell value has changed in the live file -> update it."
        // We will construct a merged object.
        const mergedRow = { ...baseRow, ...liveRow }; // Live overwrites Base for matching keys

        processedRows.push({
          ...mergedRow,
          _meta_change_type: ChangeType.UPDATED,
          _meta_changed_columns: changedCols,
          _meta_row_id: key
        });
        stats.updated++;
      } else {
        processedRows.push({
          ...baseRow,
          _meta_change_type: ChangeType.UNCHANGED,
          _meta_changed_columns: [],
          _meta_row_id: key
        });
        stats.unchanged++;
      }
    }
  });

  // 5. Check for NEW rows in Live
  liveMap.forEach((liveRow, key) => {
    if (!baseMap.has(key)) {
      processedRows.push({
        ...liveRow,
        _meta_change_type: ChangeType.NEW,
        _meta_changed_columns: [], // Entire row is new
        _meta_row_id: key
      });
      stats.new++;
    }
  });

  stats.total = processedRows.length;

  return {
    rows: processedRows,
    allColumns,
    stats,
    primaryKey
  };
};

/**
 * Generates an Excel file from the processed result.
 */
export const exportToExcel = (result: ComparisonResult) => {
  const { rows, allColumns } = result;
  
  // Prepare data for export: remove internal meta keys and add user-facing meta columns
  const exportData = rows.map(row => {
    const { _meta_change_type, _meta_changed_columns, _meta_row_id, ...data } = row;
    
    // Create an ordered object based on allColumns + meta columns
    const orderedRow: any = {};
    
    // Add Meta first
    orderedRow['CHANGE_TYPE'] = _meta_change_type;
    orderedRow['CHANGED_COLUMNS'] = _meta_changed_columns.join(', ');
    
    // Add Data
    allColumns.forEach(col => {
      orderedRow[col] = data[col];
    });

    return orderedRow;
  });

  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Merged Data");
  
  XLSX.writeFile(wb, "merged_output.xlsx");
};
