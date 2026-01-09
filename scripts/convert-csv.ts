/**
 * Convert Storyworthy CSV to Daily Moments import format
 *
 * Usage: bun run scripts/convert-csv.ts <input.csv...> [-o output.json]
 *
 * Examples:
 *   bun run scripts/convert-csv.ts data.csv
 *   bun run scripts/convert-csv.ts 2021.csv 2022.csv 2023.csv -o combined.json
 */

import { readFileSync, writeFileSync } from 'fs';

interface Entry {
  date: string;
  storyworthy: string;
  thankful: string;
  createdAt: number;
  modifiedAt?: number;
}

function parseDate(dateStr: string): string | null {
  // Input format: M/D/YYYY (e.g., "1/1/2025")
  const match = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;

  const [, month, day, year] = match;
  // Output format: YYYY-MM-DD
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());

  return result;
}

function detectFormat(headerLine: string): { dateIdx: number; momentIdx: number; notesIdx: number } {
  const headers = parseCsvLine(headerLine).map(h => h.toLowerCase());

  // Format 1: "Date, Moment, Notes" (2021 format)
  if (headers[0] === 'date' && headers[1] === 'moment') {
    return { dateIdx: 0, momentIdx: 1, notesIdx: 2 };
  }

  // Format 2: "day, Date, Date2, Moment, Notes, Food, Feedback" (other years)
  return { dateIdx: 1, momentIdx: 3, notesIdx: 4 };
}

function processCsvFile(inputFile: string): { entries: Entry[]; skipped: number } {
  console.log(`Reading: ${inputFile}`);
  const csv = readFileSync(inputFile, 'utf-8');
  const lines = csv.split('\n');

  if (lines.length < 2) {
    return { entries: [], skipped: 0 };
  }

  // Detect format from header
  const { dateIdx, momentIdx, notesIdx } = detectFormat(lines[0]);

  // Skip header row
  const dataLines = lines.slice(1).filter(line => line.trim());

  const entries: Entry[] = [];
  let skipped = 0;
  const now = Date.now();

  for (const line of dataLines) {
    const columns = parseCsvLine(line);

    const dateStr = columns[dateIdx] || '';
    const moment = columns[momentIdx] || '';
    const thankful = columns[notesIdx] || '';

    // Skip entries with no content
    if (!moment.trim() && !thankful.trim()) {
      skipped++;
      continue;
    }

    const date = parseDate(dateStr);
    if (!date) {
      console.warn(`Skipping invalid date: ${dateStr}`);
      skipped++;
      continue;
    }

    entries.push({
      date,
      storyworthy: moment.trim(),
      thankful: thankful.trim(),
      createdAt: now,
    });
  }

  return { entries, skipped };
}

function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.log('Usage: bun run scripts/convert-csv.ts <input.csv...> [-o output.json]');
    console.log('Examples:');
    console.log('  bun run scripts/convert-csv.ts data.csv');
    console.log('  bun run scripts/convert-csv.ts 2021.csv 2022.csv 2023.csv -o combined.json');
    process.exit(1);
  }

  // Parse arguments for input files and output file
  const inputFiles: string[] = [];
  let outputFile = '';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '-o' && args[i + 1]) {
      outputFile = args[i + 1];
      i++; // Skip next arg
    } else {
      inputFiles.push(args[i]);
    }
  }

  if (inputFiles.length === 0) {
    console.error('Error: No input files specified');
    process.exit(1);
  }

  // Default output filename
  if (!outputFile) {
    if (inputFiles.length === 1) {
      outputFile = inputFiles[0].replace('.csv', '-import.json');
    } else {
      outputFile = 'combined-import.json';
    }
  }

  // Process all input files
  const allEntries: Entry[] = [];
  let totalSkipped = 0;

  for (const inputFile of inputFiles) {
    const { entries, skipped } = processCsvFile(inputFile);
    allEntries.push(...entries);
    totalSkipped += skipped;
    console.log(`  → ${entries.length} entries (${skipped} skipped)`);
  }

  // Sort by date and deduplicate (keep last occurrence for same date)
  const entryMap = new Map<string, Entry>();
  for (const entry of allEntries) {
    entryMap.set(entry.date, entry);
  }
  const entries = Array.from(entryMap.values()).sort((a, b) => a.date.localeCompare(b.date));

  const duplicates = allEntries.length - entries.length;
  if (duplicates > 0) {
    console.log(`\nMerged ${duplicates} duplicate dates`);
  }

  const output = {
    metadata: {
      version: '1.0',
      exportDate: new Date().toISOString(),
      entryCount: entries.length,
      appName: 'Daily Moments',
    },
    entries,
  };
  writeFileSync(outputFile, JSON.stringify(output, null, 2));

  console.log(`\nTotal: ${entries.length} unique entries`);
  console.log(`Skipped: ${totalSkipped} empty/invalid entries`);
  console.log(`Output: ${outputFile}`);
}

main();
