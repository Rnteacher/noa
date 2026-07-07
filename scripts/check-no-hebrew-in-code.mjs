import fs from 'fs';
import path from 'path';

const HEBREW_REGEX = /[\u0590-\u05FF]/;

// Files or directories to ignore
const IGNORED_PATHS = [
  'node_modules',
  '.next',
  '.git',
  '.supabase',
  'supabase/.branches',
  'supabase/.temp',
  'src/types/supabase.ts',
  'src/i18n/he.json',
  'docs',      // Skip product documentation
  'examples',  // Skip example files
  'README.md', // Skip root documentation
  'dist',
  'build'
];

// Directories to recursively scan
const DIRS_TO_SCAN = ['src', 'supabase', 'scripts'];

// Individual root-level config files to scan
const ROOT_FILES_TO_SCAN = [
  'package.json',
  'tsconfig.json',
  'next.config.ts',
  'tailwind.config.ts',
  'postcss.config.mjs',
  'eslint.config.mjs'
];

// Only check text-based extensions to prevent scanning binary files (like favicon.ico)
const TEXT_EXTENSIONS = ['.ts', '.tsx', '.json', '.sql', '.js', '.mjs', '.css', '.toml'];

let violationsCount = 0;

function shouldIgnore(filePath) {
  // Normalize path separators to forward slashes for cross-platform matching
  const normalizedPath = filePath.replace(/\\/g, '/');
  
  return IGNORED_PATHS.some(ignored => {
    const normalizedIgnored = ignored.replace(/\\/g, '/');
    return normalizedPath === normalizedIgnored || 
           normalizedPath.startsWith(normalizedIgnored + '/') || 
           normalizedPath.includes('/' + normalizedIgnored + '/');
  });
}

function scanFile(filePath) {
  if (shouldIgnore(filePath)) {
    return;
  }

  // Check if file has a text extension
  const ext = path.extname(filePath).toLowerCase();
  if (!TEXT_EXTENSIONS.includes(ext)) {
    return;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split(/\r?\n/);
    
    lines.forEach((line, index) => {
      if (HEBREW_REGEX.test(line)) {
        console.error(`Violation: Hebrew character found in file "${filePath}" at line ${index + 1}:`);
        console.error(`  > ${line.trim()}`);
        console.error('---');
        violationsCount++;
      }
    });
  } catch (error) {
    console.error(`Error reading file "${filePath}":`, error.message);
  }
}

function scanDirectory(dirPath) {
  if (shouldIgnore(dirPath)) {
    return;
  }

  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        scanDirectory(fullPath);
      } else if (entry.isFile()) {
        scanFile(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error reading directory "${dirPath}":`, error.message);
  }
}

// Start scanning
console.log('Starting Hebrew character scanner...');

// Scan directories
DIRS_TO_SCAN.forEach(dir => {
  if (fs.existsSync(dir)) {
    scanDirectory(dir);
  }
});

// Scan root files
ROOT_FILES_TO_SCAN.forEach(file => {
  if (fs.existsSync(file)) {
    scanFile(file);
  }
});

if (violationsCount > 0) {
  console.error(`FAIL: Found ${violationsCount} violation(s) with Hebrew characters in implementation files.`);
  process.exit(1);
} else {
  console.log('SUCCESS: No Hebrew characters found in implementation files.');
  process.exit(0);
}
