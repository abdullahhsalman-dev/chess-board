import ChessBoard from "@/app/components/chess-board";

export default function ChessPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 transition-all">
      <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">
        Chess Game
      </h1>
      <div className="w-full max-w-4xl p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <ChessBoard />
      </div>
    </div>
  );
}
