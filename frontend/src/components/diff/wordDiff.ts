export type DiffTokenType = "equal" | "delete" | "insert";

export interface DiffToken {
  type: DiffTokenType;
  text: string;
}

function tokenizeWords(input: string): string[] {
  const trimmed = input.trim();
  if (!trimmed) {
    return [];
  }
  return trimmed.split(/\s+/);
}

/**
 * Compute a deterministic word-level Longest Common Subsequence (LCS) diff
 * between `originalText` and `proposedText`, coalescing adjacent tokens of the same type.
 */
export function computeWordDiff(
  originalText: string,
  proposedText: string
): DiffToken[] {
  const origWords = tokenizeWords(originalText);
  const propWords = tokenizeWords(proposedText);

  if (origWords.length === 0 && propWords.length === 0) {
    return [];
  }
  if (origWords.length === 0) {
    return [{ type: "insert", text: propWords.join(" ") }];
  }
  if (propWords.length === 0) {
    return [{ type: "delete", text: origWords.join(" ") }];
  }

  const m = origWords.length;
  const n = propWords.length;

  // DP table for LCS
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array<number>(n + 1).fill(0)
  );

  for (let i = m - 1; i >= 0; i -= 1) {
    for (let j = n - 1; j >= 0; j -= 1) {
      if (origWords[i] === propWords[j]) {
        dp[i][j] = 1 + dp[i + 1][j + 1];
      } else {
        dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  const rawTokens: DiffToken[] = [];
  let i = 0;
  let j = 0;

  while (i < m && j < n) {
    if (origWords[i] === propWords[j]) {
      rawTokens.push({ type: "equal", text: origWords[i] });
      i += 1;
      j += 1;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      rawTokens.push({ type: "delete", text: origWords[i] });
      i += 1;
    } else {
      rawTokens.push({ type: "insert", text: propWords[j] });
      j += 1;
    }
  }

  while (i < m) {
    rawTokens.push({ type: "delete", text: origWords[i] });
    i += 1;
  }

  while (j < n) {
    rawTokens.push({ type: "insert", text: propWords[j] });
    j += 1;
  }

  // Coalesce consecutive tokens of the same type for clean rendering
  const mergedTokens: DiffToken[] = [];
  for (const token of rawTokens) {
    const last = mergedTokens[mergedTokens.length - 1];
    if (last && last.type === token.type) {
      last.text = `${last.text} ${token.text}`;
    } else {
      mergedTokens.push({ ...token });
    }
  }

  return mergedTokens;
}

