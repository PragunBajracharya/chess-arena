import Link from "next/link";

export default function HomePage() {
  return (
    <section className="mx-auto flex max-w-3xl flex-col items-center gap-8 px-6 py-24 text-center">
      <h1 className="text-5xl font-bold">Play chess online</h1>
      <p className="text-lg text-neutral-500">
        Rated games against real opponents, or practise against Stockfish.
      </p>
      <div className="flex gap-4">
        <Link href="/play" className="btn text-lg">
          Play online
        </Link>
        <Link href="/play/bot" className="btn text-lg">
          Play a bot
        </Link>
      </div>
    </section>
  );
}
