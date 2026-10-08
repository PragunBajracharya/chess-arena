/**
 * Plain Elo to get started. chess.com / lichess use Glicko-2, which also tracks
 * rating deviation; swap this out (e.g. the `glicko2` package) once games work.
 */
export function eloDelta(
  ratingA: number,
  ratingB: number,
  scoreA: 0 | 0.5 | 1,
  k = 32,
): { a: number; b: number } {
  const expectedA = 1 / (1 + 10 ** ((ratingB - ratingA) / 400));
  const delta = Math.round(k * (scoreA - expectedA));
  return { a: delta, b: -delta };
}
