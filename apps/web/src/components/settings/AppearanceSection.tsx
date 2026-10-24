"use client";

import Image from "next/image";
import {
  BOARD_THEMES,
  PIECE_SETS,
  type AppTheme,
  type BoardTheme,
  type PieceSet,
  type Preferences,
} from "@chess/shared";
import { pieceSrc, usePreferences } from "@/lib/preferences";
import { Board } from "@/components/board/Board";
import { Panel } from "@/components/ui/Panel";
import { Segmented } from "@/components/ui/Toggle";

// Same values as globals.css; repeated here so every swatch shows its own colours.
const BOARD_COLOURS: Record<BoardTheme, { name: string; light: string; dark: string }> = {
  walnut: { name: "Walnut", light: "#e6dbc6", dark: "#9a7a5c" },
  green: { name: "Green", light: "#ebecd0", dark: "#779556" },
  blue: { name: "Blue", light: "#dee3e6", dark: "#8ca2ad" },
  slate: { name: "Slate", light: "#d4d7dc", dark: "#737d8c" },
};

const PIECE_NAMES: Record<PieceSet, string> = {
  classic: "Classic",
  chessnut: "Chessnut",
  fantasy: "Fantasy",
  celtic: "Celtic",
};

// Ruy Lopez, a few moves in: every piece type is on the board.
const PREVIEW_FEN = "r1bqkb1r/pppp1ppp/2n2n2/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4";

function Swatch({ theme }: { theme: BoardTheme }) {
  const c = BOARD_COLOURS[theme];
  return (
    <span aria-hidden="true" className="grid size-10 grid-cols-2 overflow-hidden rounded-md">
      <span style={{ background: c.light }} />
      <span style={{ background: c.dark }} />
      <span style={{ background: c.dark }} />
      <span style={{ background: c.light }} />
    </span>
  );
}

const optionClass = (on: boolean) =>
  `flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-[14px] transition-colors ${
    on ? "border-brass bg-brass/10 font-medium" : "border-line-strong hover:border-faint"
  }`;

export function AppearanceSection({ save }: { save: (patch: Partial<Preferences>) => void }) {
  const prefs = usePreferences();

  return (
    <Panel
      title="Appearance"
      description="Saved to your account, so they follow you to other devices."
    >
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="space-y-6">
          <div>
            <p className="mb-2 text-[14px] font-medium">Theme</p>
            <Segmented<AppTheme>
              label="Theme"
              value={prefs.theme}
              onChange={(theme) => save({ theme })}
              options={[
                { value: "dark", label: "Dark" },
                { value: "light", label: "Light" },
                { value: "system", label: "Match system" },
              ]}
            />
          </div>

          <fieldset>
            <legend className="mb-2 text-[14px] font-medium">Board</legend>
            <div
              role="radiogroup"
              aria-label="Board colours"
              className="grid grid-cols-2 gap-2 sm:grid-cols-4"
            >
              {BOARD_THEMES.map((t) => (
                <button
                  key={t}
                  type="button"
                  role="radio"
                  aria-checked={prefs.boardTheme === t}
                  onClick={() => save({ boardTheme: t })}
                  className={optionClass(prefs.boardTheme === t)}
                >
                  <Swatch theme={t} />
                  {BOARD_COLOURS[t].name}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-[14px] font-medium">Pieces</legend>
            <div
              role="radiogroup"
              aria-label="Piece set"
              className="grid grid-cols-2 gap-2 sm:grid-cols-4"
            >
              {PIECE_SETS.map((set) => (
                <button
                  key={set}
                  type="button"
                  role="radio"
                  aria-checked={prefs.pieceSet === set}
                  onClick={() => save({ pieceSet: set })}
                  className={`${optionClass(prefs.pieceSet === set)} flex-col !items-start`}
                >
                  <span aria-hidden="true" className="flex rounded-md bg-board-light p-1">
                    {(["wn", "bk"] as const).map((p) => (
                      <Image
                        key={p}
                        src={pieceSrc(set, p[0] as "w", p[1]!)}
                        alt=""
                        width={32}
                        height={32}
                      />
                    ))}
                  </span>
                  {PIECE_NAMES[set]}
                </button>
              ))}
            </div>
          </fieldset>
        </div>

        <div>
          <p className="mb-2 text-[14px] font-medium">Preview</p>
          <Board fen={PREVIEW_FEN} interactive={false} lastMove={{ from: "f1", to: "b5" }} />
        </div>
      </div>
    </Panel>
  );
}
