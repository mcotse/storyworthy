/**
 * Convert Storyworthy CSV to Daily Moments import format
 *
 * Usage: bun run scripts/convert-csv.ts <input.csv> [output.json]
 */

import { readFileSync, writeFileSync } from 'fs';

interface Entry {
  date: string;
  storyworthy: string;
  thankful: string;
  createdAt: string;
  updatedAt: string;
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

function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.log('Usage: bun run scripts/convert-csv.ts <input.csv> [output.json]');
    process.exit(1);
  }

  const inputFile = args[0];
  const outputFile = args[1] || inputFile.replace('.csv', '-import.json');

  console.log(`Reading: ${inputFile}`);
  const csv = readFileSync(inputFile, 'utf-8');
  const lines = csv.split('\n');

  // Skip header row
  const dataLines = lines.slice(1).filter(line => line.trim());

  const entries: Entry[] = [];
  let skipped = 0;

  for (const line of dataLines) {
    const columns = parseCsvLine(line);

    // Columns: day, Date, Date2, Moment, Notes, Food, Feedback
    const dateStr = columns[1];  // M/D/YYYY format
    const moment = columns[3] || '';
    const thankful = columns[4] || '';

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

    const now = new Date().toISOString();

    entries.push({
      date,
      storyworthy: moment.trim(),
      thankful: thankful.trim(),
      createdAt: now,
      updatedAt: now,
    });
  }

  // Sort by date
  entries.sort((a, b) => a.date.localeCompare(b.date));

  const output = { entries, version: 1 };
  writeFileSync(outputFile, JSON.stringify(output, null, 2));

  console.log(`\nConverted ${entries.length} entries`);
  console.log(`Skipped ${skipped} empty/invalid entries`);
  console.log(`Output: ${outputFile}`);
}

main();
