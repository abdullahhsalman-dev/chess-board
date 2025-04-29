"use client";

import type { Color, PieceType } from "@/app/lib/chess-logic";

interface PromotionModalProps {
  color: Color;
  onSelect: (pieceType: PieceType) => void;
}

export default function PromotionModal({
  color,
  onSelect,
}: PromotionModalProps) {
  const pieces: PieceType[] = ["queen", "rook", "bishop", "knight"];

  const getPieceSymbol = (type: PieceType) => {
    switch (type) {
      case "queen":
        return color === "white" ? "♕" : "♛";
      case "rook":
        return color === "white" ? "♖" : "♜";
      case "bishop":
        return color === "white" ? "♗" : "♝";
      case "knight":
        return color === "white" ? "♘" : "♞";
      default:
        return "";
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl">
        <h3 className="text-xl font-bold mb-4">Promote Pawn</h3>
        <div className="flex space-x-4">
          {pieces.map((piece) => (
            <button
              key={piece}
              className="w-16 h-16 flex items-center justify-center text-4xl border border-gray-300 rounded hover:bg-gray-100"
              onClick={() => onSelect(piece)}
            >
              {getPieceSymbol(piece)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
