/** Fisher-Yates. Used to make a feed refresh visibly reorder content —
 * without it, refreshing would refetch the same ads in the same DB order
 * and look like nothing happened. */
export function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
