import ChessBoard from "@/app/components/chess-board";

export default function ChessPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <h1 className="text-3xl font-bold mb-8">Chess Game</h1>
      <ChessBoard />
    </div>
  );
}
