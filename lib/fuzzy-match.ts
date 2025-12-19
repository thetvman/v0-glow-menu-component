// Fuzzy string matching utility for finding best matches between TMDB and IPTV content

export interface MatchResult {
  item: any
  score: number
  matchedTitle: string
}

/**
 * Calculate similarity between two strings using Levenshtein distance
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = []

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
      }
    }
  }

  return matrix[str2.length][str1.length]
}

/**
 * Normalize string for comparison (lowercase, remove special chars, etc.)
 */
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s]/g, "") // Remove special characters
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim()
}

/**
 * Calculate match score between two strings (0-100, higher is better)
 */
function calculateMatchScore(searchTerm: string, target: string): number {
  const normalizedSearch = normalizeString(searchTerm)
  const normalizedTarget = normalizeString(target)

  // Exact match
  if (normalizedSearch === normalizedTarget) {
    return 100
  }

  // Contains match
  if (normalizedTarget.includes(normalizedSearch)) {
    return 90
  }

  // Calculate similarity using Levenshtein distance
  const distance = levenshteinDistance(normalizedSearch, normalizedTarget)
  const maxLength = Math.max(normalizedSearch.length, normalizedTarget.length)
  const similarity = ((maxLength - distance) / maxLength) * 100

  return Math.max(0, similarity)
}

/**
 * Find best match for a title in a list of items
 */
export function findBestMatch<T extends { name?: string; title?: string }>(
  searchTitle: string,
  items: T[],
  minScore = 70,
): MatchResult | null {
  let bestMatch: MatchResult | null = null
  let highestScore = minScore

  for (const item of items) {
    const itemTitle = item.name || item.title || ""
    const score = calculateMatchScore(searchTitle, itemTitle)

    console.log(`[v0] Fuzzy match: "${searchTitle}" vs "${itemTitle}" = ${score.toFixed(1)}%`)

    if (score > highestScore) {
      highestScore = score
      bestMatch = {
        item,
        score,
        matchedTitle: itemTitle,
      }
    }
  }

  if (bestMatch) {
    console.log(`[v0] Best match found: "${bestMatch.matchedTitle}" with ${bestMatch.score.toFixed(1)}% confidence`)
  } else {
    console.log(`[v0] No match found above ${minScore}% threshold for "${searchTitle}"`)
  }

  return bestMatch
}
