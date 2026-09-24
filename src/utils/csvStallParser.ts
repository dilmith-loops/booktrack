import { Stall } from '../types';

/**
 * Cleanly format an exhibitor name into title case while preserving corporate and publisher acronyms.
 */
export const formatExhibitorName = (rawName: string, toTitleCase = true): string => {
  if (!rawName) return '';
  const trimmed = rawName.trim();
  if (!toTitleCase) return trimmed;

  const keepUpper = new Set([
    'PVT',
    'LTD',
    'PLC',
    'CGA',
    'MD',
    'UK',
    'USA',
    'II',
    'III',
    'IV',
    'BCC',
    'JEYA',
    'CIBF',
    'AI',
    'IT'
  ]);

  const words = trimmed.split(/\s+/);
  return words
    .map((word) => {
      const upper = word.toUpperCase().replace(/[^A-Z]/g, '');
      if (keepUpper.has(upper)) {
        return word.toUpperCase();
      }
      // Handle words with periods like 'M.D.'
      if (word.includes('.')) {
        return word.toUpperCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
};

/**
 * Resolve standard BMICH Exhibition Hall from booth code prefix.
 */
export const getHallFromBoothCode = (code: string): string => {
  if (!code) return 'Hall A';
  const prefix = code.trim().toUpperCase()[0];
  switch (prefix) {
    case 'A':
      return 'Hall A';
    case 'B':
      return 'Hall B';
    case 'C':
      return 'Hall C';
    case 'D':
      return 'Hall D';
    case 'E':
      return 'Hall E';
    case 'H':
      return 'Sirimavo Hall H';
    case 'J':
      return 'Sirimavo Hall J';
    case 'K':
      return 'Sirimavo Hall K';
    case 'L':
    case 'M':
    case 'P':
    case 'Q':
    case 'R':
    case 'S':
    case 'T':
      return `Pavilion ${prefix}`;
    default:
      return 'Main Hall';
  }
};

/**
 * Suggest a genre/category based on publisher name keywords.
 */
export const suggestCategory = (name: string, fallback = 'General Books & Fiction'): string => {
  const lower = name.toLowerCase();
  if (lower.includes('buddhis') || lower.includes('cultural') || lower.includes('dhamma')) {
    return 'Philosophy, Buddhism, Meditation';
  }
  if (lower.includes('academic') || lower.includes('educational') || lower.includes('school') || lower.includes('science') || lower.includes('medical') || lower.includes('university') || lower.includes('wisdom')) {
    return 'Academic, Educational & Reference';
  }
  if (lower.includes('child') || lower.includes('kids') || lower.includes('cartoon') || lower.includes('kiddies')) {
    return 'Children’s Books, Comics & Teen';
  }
  if (lower.includes('paper') || lower.includes('stationer') || lower.includes('corner') || lower.includes('packsco')) {
    return 'Stationery, Art & Student Supplies';
  }
  if (lower.includes('translat') || lower.includes('international') || lower.includes('imports')) {
    return 'International Books & Translations';
  }
  return fallback;
};

/**
 * Group a list of booth strings (e.g. ['A1', 'A2', 'A3', 'A10', 'A11', 'A12']) into contiguous ranges.
 */
export const groupBoothCodes = (booths: string[]): string => {
  if (!booths || booths.length === 0) return '';
  if (booths.length === 1) return booths[0];

  const parsed: { prefix: string; num: number | null; raw: string }[] = [];

  for (const b of booths) {
    const match = b.trim().match(/^([A-Za-z]+)(\d+)?$/);
    if (match) {
      parsed.push({
        prefix: match[1].toUpperCase(),
        num: match[2] ? parseInt(match[2], 10) : null,
        raw: b.trim()
      });
    } else {
      parsed.push({ prefix: '', num: null, raw: b.trim() });
    }
  }

  // If any have no numeric portion (e.g. 'L', 'M', 'S'), join them with commas
  if (parsed.some((p) => p.num === null)) {
    return booths.join(', ');
  }

  // Sort primarily by numeric portion
  parsed.sort((a, b) => (a.num! - b.num!));

  const ranges: string[] = [];
  let start = parsed[0].num!;
  let prev = parsed[0].num!;
  const prefix = parsed[0].prefix;

  for (let i = 1; i < parsed.length; i++) {
    const curr = parsed[i].num!;
    if (curr === prev + 1) {
      prev = curr;
    } else {
      if (start === prev) {
        ranges.push(`${prefix}${start}`);
      } else {
        ranges.push(`${prefix}${start} - ${prefix}${prev}`);
      }
      start = curr;
      prev = curr;
    }
  }

  if (start === prev) {
    ranges.push(`${prefix}${start}`);
  } else {
    ranges.push(`${prefix}${start} - ${prefix}${prev}`);
  }

  return ranges.join(', ');
};

export interface ParseStallsOptions {
  consolidateBooths?: boolean; // Group A1, A2, A3 by exhibitor + hall
  toTitleCase?: boolean; // Convert 'SADEEPA BOOKSHOP' -> 'Sadeepa Bookshop'
  defaultCategory?: string;
  defaultDiscount?: string;
}

/**
 * Robust CSV parser supporting quotes, commas, and line endings.
 */
function parseCsvRows(csvText: string): string[][] {
  const cleanText = csvText.replace(/^\uFEFF/, '').trim(); // Remove UTF-8 BOM
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentField.trim());
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // skip \n in \r\n
      }
      currentRow.push(currentField.trim());
      if (currentRow.some((f) => f.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((f) => f.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Parse stalls from CSV text (e.g. CIBF_2026_booth_exhibitors_English_only.csv).
 */
export const parseStallsCsv = (csvText: string, options: ParseStallsOptions = {}): Stall[] => {
  const {
    consolidateBooths = true,
    toTitleCase = true,
    defaultCategory = 'General Books & Fiction',
    defaultDiscount
  } = options;

  const rows = parseCsvRows(csvText);
  if (rows.length === 0) return [];

  // Identify column indices from header
  const header = rows[0].map((h) => h.toLowerCase().trim());
  let boothColIdx = header.findIndex((h) =>
    h.includes('booth') || h.includes('stall') || h.includes('code') || h.includes('number')
  );
  let exhibitorColIdx = header.findIndex((h) =>
    h.includes('exhibitor') || h.includes('publisher') || h.includes('name')
  );

  // Fallbacks if header is missing or non-standard
  if (boothColIdx === -1) boothColIdx = 0;
  if (exhibitorColIdx === -1) exhibitorColIdx = rows[0].length > 1 ? 1 : 0;

  // Process data rows
  const dataRows = rows.slice(1);

  if (!consolidateBooths) {
    // Mode B: Each row is an individual stall
    return dataRows
      .filter((r) => r.length > Math.max(boothColIdx, exhibitorColIdx))
      .map((r, index) => {
        const rawCode = r[boothColIdx]?.trim() || `B${index + 1}`;
        const rawName = r[exhibitorColIdx]?.trim() || `Exhibitor ${index + 1}`;
        const name = formatExhibitorName(rawName, toTitleCase);
        const hall = getHallFromBoothCode(rawCode);
        const id = `stall-${rawCode.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

        return {
          id,
          name,
          hall,
          stallNumber: rawCode,
          category: suggestCategory(name, defaultCategory),
          specialDiscount: defaultDiscount || undefined,
          isHidden: false
        };
      });
  }

  // Mode A: Smart Grouping by (Exhibitor, Hall)
  const groupedMap = new Map<string, { rawName: string; hall: string; booths: string[] }>();

  for (const r of dataRows) {
    if (r.length <= Math.max(boothColIdx, exhibitorColIdx)) continue;
    const rawCode = r[boothColIdx]?.trim();
    const rawName = r[exhibitorColIdx]?.trim();
    if (!rawCode || !rawName) continue;

    const hall = getHallFromBoothCode(rawCode);
    const key = `${rawName.toUpperCase()}__${hall}`;

    if (!groupedMap.has(key)) {
      groupedMap.set(key, { rawName, hall, booths: [] });
    }
    groupedMap.get(key)!.booths.push(rawCode);
  }

  const result: Stall[] = [];

  for (const [, item] of groupedMap.entries()) {
    const name = formatExhibitorName(item.rawName, toTitleCase);
    const stallNumber = groupBoothCodes(item.booths);
    const slugBase = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const hallSlug = item.hall.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const id = `stall-${slugBase}-${hallSlug}`;

    result.push({
      id,
      name,
      hall: item.hall,
      stallNumber,
      category: suggestCategory(name, defaultCategory),
      specialDiscount: defaultDiscount || undefined,
      isHidden: false
    });
  }

  return result;
};
