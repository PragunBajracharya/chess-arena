export function MoveList({ moves }: { moves: string[] }) {
  const pairs: [string, string | undefined][] = [];
  for (let i = 0; i < moves.length; i += 2) pairs.push([moves[i]!, moves[i + 1]]);

  return (
    <ol className="max-h-96 overflow-y-auto text-sm">
      {pairs.map(([white, black], i) => (
        <li
          key={i}
          className="grid grid-cols-[2.5rem_1fr_1fr] px-2 py-1 odd:bg-neutral-100 dark:odd:bg-neutral-800"
        >
          <span className="text-neutral-500">{i + 1}.</span>
          <span>{white}</span>
          <span>{black ?? ""}</span>
        </li>
      ))}
    </ol>
  );
}
