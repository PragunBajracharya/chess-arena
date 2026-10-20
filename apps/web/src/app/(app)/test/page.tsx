import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FreeBoard } from "@/components/game/FreeBoard";
 
export const metadata: Metadata = { title: "Test board" };
 
/** /test: a board where you move both sides. Development only; a 404 in production builds. */
export default function TestBoardPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <FreeBoard />;
}