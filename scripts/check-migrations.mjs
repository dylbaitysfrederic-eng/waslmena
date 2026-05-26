import fs from 'node:fs';
import path from 'node:path';

const migrationsDir = path.join(process.cwd(), 'migrations');
const journalPath = path.join(migrationsDir, 'meta', '_journal.json');

// These migrations existed locally without journal entries and were recovered by
// 0039_recover_missing_access_columns.sql. Keep this list explicit so future
// missing journal entries still fail the check.
const recoveredMissingJournalTags = new Set([
  '0033_optional_modules',
  '0034_order_idempotency',
  '0035_delivery_mvp',
]);

const readJson = filePath => JSON.parse(fs.readFileSync(filePath, 'utf8'));

const migrationFiles = fs
  .readdirSync(migrationsDir)
  .filter(fileName => /^\d{4}_.+\.sql$/.test(fileName))
  .sort();

const sqlTags = migrationFiles.map(fileName => fileName.replace(/\.sql$/, ''));
const sqlTagSet = new Set(sqlTags);
const journal = readJson(journalPath);
const journalEntries = journal.entries ?? [];
const journalTags = journalEntries.map(entry => entry.tag);
const journalTagSet = new Set(journalTags);

const issues = [];

const duplicateSqlTags = sqlTags.filter((tag, index) => sqlTags.indexOf(tag) !== index);
const duplicateJournalTags = journalTags.filter((tag, index) => journalTags.indexOf(tag) !== index);
const duplicateJournalIndexes = journalEntries
  .map(entry => entry.idx)
  .filter((idx, index, indexes) => indexes.indexOf(idx) !== index);

if (duplicateSqlTags.length > 0) {
  issues.push(`Duplicate SQL migration tags: ${duplicateSqlTags.join(', ')}`);
}

if (duplicateJournalTags.length > 0) {
  issues.push(`Duplicate journal tags: ${duplicateJournalTags.join(', ')}`);
}

if (duplicateJournalIndexes.length > 0) {
  issues.push(`Duplicate journal indexes: ${duplicateJournalIndexes.join(', ')}`);
}

const missingFromJournal = sqlTags.filter((tag) => {
  return !journalTagSet.has(tag) && !recoveredMissingJournalTags.has(tag);
});

const recoveredMissingFromJournal = sqlTags.filter((tag) => {
  return !journalTagSet.has(tag) && recoveredMissingJournalTags.has(tag);
});

if (missingFromJournal.length > 0) {
  issues.push(`SQL files missing from journal: ${missingFromJournal.join(', ')}`);
}

const journalWithoutSql = journalTags.filter(tag => !sqlTagSet.has(tag));

if (journalWithoutSql.length > 0) {
  issues.push(`Journal entries without SQL files: ${journalWithoutSql.join(', ')}`);
}

const missingRecoveredFiles = [...recoveredMissingJournalTags].filter(tag => !sqlTagSet.has(tag));

if (missingRecoveredFiles.length > 0) {
  issues.push(`Recovered migration tags without SQL files: ${missingRecoveredFiles.join(', ')}`);
}

for (const [index, entry] of journalEntries.entries()) {
  if (entry.idx !== index) {
    issues.push(`Journal index mismatch for ${entry.tag}: expected ${index}, found ${entry.idx}`);
  }
}

const sqlNumbers = sqlTags.map(tag => Number.parseInt(tag.slice(0, 4), 10));
const maxSqlNumber = Math.max(...sqlNumbers);
const missingSqlNumbers = [];

for (let number = 0; number <= maxSqlNumber; number += 1) {
  if (!sqlNumbers.includes(number)) {
    missingSqlNumbers.push(String(number).padStart(4, '0'));
  }
}

if (missingSqlNumbers.length > 0) {
  issues.push(`Migration SQL numbering has gaps: ${missingSqlNumbers.join(', ')}`);
}

if (issues.length > 0) {
  console.error('Migration integrity check failed:');
  for (const issue of issues) {
    console.error(`- ${issue}`);
  }
  process.exit(1);
}

console.log('Migration integrity check passed.');

if (recoveredMissingFromJournal.length > 0) {
  console.log(`Recovered journal exceptions: ${recoveredMissingFromJournal.join(', ')}`);
}
