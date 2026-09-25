/**
 * fuzzyMatch.js
 * Provides Levenshtein distance-based fuzzy matching for cell comparison.
 * Handles typos like "shubham" vs "shuham" gracefully.
 */

/**
 * Compute Levenshtein distance between two strings.
 * This measures the minimum number of single-character edits
 * (insertions, deletions, substitutions) to transform one string into another.
 */
export function levenshteinDistance(a, b) {
  const aStr = String(a || '').toLowerCase().trim();
  const bStr = String(b || '').toLowerCase().trim();

  if (aStr === bStr) return 0;
  if (aStr.length === 0) return bStr.length;
  if (bStr.length === 0) return aStr.length;

  const matrix = [];

  for (let i = 0; i <= bStr.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= aStr.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= bStr.length; i++) {
    for (let j = 1; j <= aStr.length; j++) {
      const cost = bStr[i - 1] === aStr[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,       // deletion
        matrix[i][j - 1] + 1,       // insertion
        matrix[i - 1][j - 1] + cost  // substitution
      );
    }
  }

  return matrix[bStr.length][aStr.length];
}

/**
 * Calculate similarity ratio between two strings (0 to 1).
 * 1 = identical, 0 = completely different.
 */
export function similarityRatio(a, b) {
  const aStr = String(a || '').trim();
  const bStr = String(b || '').trim();

  if (aStr === '' && bStr === '') return 1;
  if (aStr === '' || bStr === '') return 0;

  const distance = levenshteinDistance(aStr, bStr);
  const maxLen = Math.max(aStr.length, bStr.length);
  return 1 - distance / maxLen;
}

/**
 * Determine match type based on similarity ratio.
 */
export function getMatchType(similarity, threshold) {
  if (similarity === 1) return 'exact';
  if (similarity >= threshold) return 'fuzzy';
  return 'none';
}

/**
 * Find character-level differences between two strings for highlighting.
 * Returns an array of segments with { text, isDiff } for each string.
 */
export function findDifferences(a, b) {
  const aStr = String(a || '');
  const bStr = String(b || '');

  if (aStr === bStr) {
    return {
      a: [{ text: aStr, isDiff: false }],
      b: [{ text: bStr, isDiff: false }],
    };
  }

  // Simple character-by-character diff
  const segmentsA = [];
  const segmentsB = [];

  const aLower = aStr.toLowerCase();
  const bLower = bStr.toLowerCase();
  const maxLen = Math.max(aStr.length, bStr.length);

  let currentSegA = { text: '', isDiff: false };
  let currentSegB = { text: '', isDiff: false };

  for (let i = 0; i < maxLen; i++) {
    const charA = aStr[i] || '';
    const charB = bStr[i] || '';
    const isDiff = aLower[i] !== bLower[i];

    if (i === 0) {
      currentSegA.isDiff = isDiff;
      currentSegB.isDiff = isDiff;
    }

    if (isDiff !== currentSegA.isDiff) {
      if (currentSegA.text) segmentsA.push(currentSegA);
      currentSegA = { text: charA, isDiff };
    } else {
      currentSegA.text += charA;
    }

    if (isDiff !== currentSegB.isDiff) {
      if (currentSegB.text) segmentsB.push(currentSegB);
      currentSegB = { text: charB, isDiff };
    } else {
      currentSegB.text += charB;
    }
  }

  if (currentSegA.text) segmentsA.push(currentSegA);
  if (currentSegB.text) segmentsB.push(currentSegB);

  return { a: segmentsA, b: segmentsB };
}

/**
 * Main matching function.
 * Compares selected columns across multiple files/sheets.
 *
 * @param {Array} selections - Array of { fileIndex, sheetName, columnName, data[] }
 * @param {number} threshold - Similarity threshold (0-1) for fuzzy match
 * @returns {Array} Array of match results
 */
export function performMatching(selections, threshold = 0.75) {
  if (selections.length < 2) {
    return [];
  }

  const results = [];
  let matchId = 0;

  // Get the first selection as the "base" to compare against
  const base = selections[0];

  for (let rowIdx = 0; rowIdx < base.data.length; rowIdx++) {
    const baseValue = base.data[rowIdx];

    if (baseValue === null || baseValue === undefined || String(baseValue).trim() === '') {
      continue;
    }

    const matchResult = {
      id: matchId++,
      baseValue: String(baseValue),
      baseSource: `${base.fileName} → ${base.sheetName} → ${base.columnName}`,
      baseRow: rowIdx + 1,
      comparisons: [],
    };

    // Compare against all other selections
    for (let selIdx = 1; selIdx < selections.length; selIdx++) {
      const other = selections[selIdx];
      let bestMatch = null;
      let bestSimilarity = 0;
      let bestRow = -1;

      for (let otherRow = 0; otherRow < other.data.length; otherRow++) {
        const otherValue = other.data[otherRow];

        if (otherValue === null || otherValue === undefined || String(otherValue).trim() === '') {
          continue;
        }

        const similarity = similarityRatio(String(baseValue), String(otherValue));

        if (similarity > bestSimilarity) {
          bestSimilarity = similarity;
          bestMatch = String(otherValue);
          bestRow = otherRow + 1;
        }
      }

      const matchType = getMatchType(bestSimilarity, threshold);
      const diffs = bestMatch ? findDifferences(String(baseValue), bestMatch) : null;

      matchResult.comparisons.push({
        source: `${other.fileName} → ${other.sheetName} → ${other.columnName}`,
        matchedValue: bestMatch || '—',
        matchedRow: bestRow,
        similarity: bestSimilarity,
        matchType,
        differences: diffs,
      });
    }

    results.push(matchResult);
  }

  return results;
}

/**
 * Get overall match statistics.
 */
export function getMatchStats(results) {
  let totalComparisons = 0;
  let exactMatches = 0;
  let fuzzyMatches = 0;
  let noMatches = 0;

  for (const result of results) {
    for (const comp of result.comparisons) {
      totalComparisons++;
      if (comp.matchType === 'exact') exactMatches++;
      else if (comp.matchType === 'fuzzy') fuzzyMatches++;
      else noMatches++;
    }
  }

  return { totalComparisons, exactMatches, fuzzyMatches, noMatches };
}
