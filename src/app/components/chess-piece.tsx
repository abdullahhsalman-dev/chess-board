import type { ChessPiece } from "@/app/lib/chess-logic";

interface ChessPieceProps {
  piece: ChessPiece;
}

export default function ChessPieceComponent({ piece }: ChessPieceProps) {
  const getPieceSymbol = () => {
    const { type, color } = piece;

    switch (type) {
      case "pawn":
        return color === "white" ? "♙" : "♟";
      case "rook":
        return color === "white" ? "♖" : "♜";
      case "knight":
        return color === "white" ? "♘" : "♞";
      case "bishop":
        return color === "white" ? "♗" : "♝";
      case "queen":
        return color === "white" ? "♕" : "♛";
      case "king":
        return color === "white" ? "♔" : "♚";
      default:
        return "";
    }
  };

  return (
    <div
      className={`text-4xl ${
        piece.color === "white" ? "text-white" : "text-black"
      }`}
    >
      {getPieceSymbol()}
    </div>
  );
}
