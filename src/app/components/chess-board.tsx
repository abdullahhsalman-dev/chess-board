"use client";

import { useState, useEffect } from "react";
import {
  initialBoard,
  getPossibleMoves,
  movePiece,
  isKingInCheck,
  isCheckmate,
  isStalemate,
  type PieceType,
  type Color,
  type Position,
  type ChessPiece,
  type GameState,
  type MoveHistory,
} from "@/app/lib/chess-logic";
import ChessPieceComponent from "./chess-piece";
import PromotionModal from "./promotion-modal";

export default function ChessBoard() {
  const [board, setBoard] = useState<(ChessPiece | null)[][]>(initialBoard());
  const [selectedPiece, setSelectedPiece] = useState<Position | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<Position[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<Color>("white");
  const [gameStatus, setGameStatus] = useState<string>("");
  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const [promotionPosition, setPromotionPosition] = useState<Position | null>(
    null
  );
  const [moveHistory, setMoveHistory] = useState<MoveHistory[]>([]);
  const [gameState, setGameState] = useState<GameState>({
    whiteCanCastleKingside: true,
    whiteCanCastleQueenside: true,
    blackCanCastleKingside: true,
    blackCanCastleQueenside: true,
    enPassantTarget: null,
    halfMoveClock: 0,
    fullMoveNumber: 1,
  });

  // Check for checkmate or stalemate after each move
  useEffect(() => {
    if (isCheckmate(board, currentPlayer, gameState)) {
      setGameStatus(
        `Checkmate! ${currentPlayer === "white" ? "Black" : "White"} wins!`
      );
    } else if (isStalemate(board, currentPlayer, gameState)) {
      setGameStatus("Stalemate! The game is a draw.");
    } else if (isKingInCheck(board, currentPlayer, gameState)) {
      setGameStatus(
        `${
          currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1)
        } is in check!`
      );
    } else {
      setGameStatus(
        `${
          currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1)
        }'s turn`
      );
    }
  }, [board, currentPlayer, gameState]);

  const handleSquareClick = (row: number, col: number) => {
    if (
      isCheckmate(board, currentPlayer, gameState) ||
      isStalemate(board, currentPlayer, gameState)
    ) {
      return;
    }

    if (selectedPiece) {
      const isValidMove = possibleMoves.some(
        (move) => move.row === row && move.col === col
      );

      if (isValidMove) {
        const pieceToMove = board[selectedPiece.row][selectedPiece.col];
        if (!pieceToMove) return;

        const isPawnPromotion =
          pieceToMove.type === "pawn" &&
          ((pieceToMove.color === "white" && row === 0) ||
            (pieceToMove.color === "black" && row === 7));

        if (isPawnPromotion) {
          setPromotionPosition({ row, col });
          setShowPromotionModal(true);
          return;
        }

        const { newBoard, newGameState, capturedPiece } = movePiece(
          board,
          { row: selectedPiece.row, col: selectedPiece.col },
          { row, col },
          gameState
        );

        setMoveHistory([
          ...moveHistory,
          {
            piece: pieceToMove,
            from: { row: selectedPiece.row, col: selectedPiece.col },
            to: { row, col },
            capturedPiece,
            notation: generateNotation(
              pieceToMove,
              { row: selectedPiece.row, col: selectedPiece.col },
              { row, col },
              capturedPiece,
              newBoard,
              newGameState
            ),
          },
        ]);

        setBoard(newBoard);
        setGameState(newGameState);
        setCurrentPlayer(currentPlayer === "white" ? "black" : "white");
        setSelectedPiece(null);
        setPossibleMoves([]);
      } else {
        const clickedPiece = board[row][col];
        if (clickedPiece && clickedPiece.color === currentPlayer) {
          setSelectedPiece({ row, col });
          setPossibleMoves(getPossibleMoves(board, { row, col }, gameState));
        } else {
          setSelectedPiece(null);
          setPossibleMoves([]);
        }
      }
    } else {
      const clickedPiece = board[row][col];
      if (clickedPiece && clickedPiece.color === currentPlayer) {
        setSelectedPiece({ row, col });
        setPossibleMoves(getPossibleMoves(board, { row, col }, gameState));
      }
    }
  };

  const handlePromotion = (pieceType: PieceType) => {
    if (!selectedPiece || !promotionPosition) return;

    const pieceToPromote = board[selectedPiece.row][selectedPiece.col];
    if (!pieceToPromote) return;

    const { newBoard, newGameState, capturedPiece } = movePiece(
      board,
      { row: selectedPiece.row, col: selectedPiece.col },
      promotionPosition,
      gameState,
      pieceType
    );

    setMoveHistory([
      ...moveHistory,
      {
        piece: pieceToPromote,
        from: { row: selectedPiece.row, col: selectedPiece.col },
        to: promotionPosition,
        capturedPiece,
        promotion: pieceType,
        notation: generateNotation(
          pieceToPromote,
          { row: selectedPiece.row, col: selectedPiece.col },
          promotionPosition,
          capturedPiece,
          newBoard,
          newGameState,
          pieceType
        ),
      },
    ]);

    setBoard(newBoard);
    setGameState(newGameState);
    setCurrentPlayer(currentPlayer === "white" ? "black" : "white");
    setSelectedPiece(null);
    setPossibleMoves([]);
    setShowPromotionModal(false);
    setPromotionPosition(null);
  };

  const resetGame = () => {
    setBoard(initialBoard());
    setSelectedPiece(null);
    setPossibleMoves([]);
    setCurrentPlayer("white");
    setGameStatus("White's turn");
    setMoveHistory([]);
    setGameState({
      whiteCanCastleKingside: true,
      whiteCanCastleQueenside: true,
      blackCanCastleKingside: true,
      blackCanCastleQueenside: true,
      enPassantTarget: null,
      halfMoveClock: 0,
      fullMoveNumber: 1,
    });
  };

  // Generate algebraic notation for a move
  const generateNotation = (
    piece: ChessPiece,
    from: Position,
    to: Position,
    capturedPiece: ChessPiece | null,
    newBoard: (ChessPiece | null)[][],
    gameState: GameState,
    promotionPiece?: PieceType
  ): string => {
    if (piece.type === "king" && Math.abs(from.col - to.col) === 2) {
      return to.col > from.col ? "O-O" : "O-O-O";
    }

    const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
    const ranks = ["8", "7", "6", "5", "4", "3", "2", "1"];

    let notation = "";

    if (piece.type !== "pawn") {
      notation +=
        piece.type === "knight" ? "N" : piece.type.charAt(0).toUpperCase();
    }

    if (piece.type === "pawn" && capturedPiece) {
      notation += files[from.col];
    }

    const ambiguousPieces = findAmbiguousPieces(
      board,
      piece,
      from,
      to,
      gameState
    );
    if (ambiguousPieces.length > 0) {
      if (ambiguousPieces.every((p) => p.col !== from.col)) {
        notation += files[from.col];
      } else if (ambiguousPieces.every((p) => p.row !== from.row)) {
        notation += ranks[from.row];
      } else {
        notation += files[from.col] + ranks[from.row];
      }
    }

    if (capturedPiece) {
      notation += "x";
    }

    notation += files[to.col] + ranks[to.row];

    if (promotionPiece) {
      notation +=
        "=" +
        (promotionPiece === "knight"
          ? "N"
          : promotionPiece.charAt(0).toUpperCase());
    }

    const nextPlayer = piece.color === "white" ? "black" : "white";
    if (isCheckmate(newBoard, nextPlayer, gameState)) {
      notation += "#";
    } else if (isKingInCheck(newBoard, nextPlayer, gameState)) {
      notation += "+";
    }

    return notation;
  };

  // Find pieces of the same type that could also move to the target square
  const findAmbiguousPieces = (
    board: (ChessPiece | null)[][],
    piece: ChessPiece,
    from: Position,
    to: Position,
    gameState: GameState
  ): Position[] => {
    const ambiguousPieces: Position[] = [];

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (row === from.row && col === from.col) continue;

        const currentPiece = board[row][col];
        if (
          currentPiece &&
          currentPiece.type === piece.type &&
          currentPiece.color === piece.color
        ) {
          const moves = getPossibleMoves(board, { row, col }, gameState);
          if (
            moves.some((move) => move.row === to.row && move.col === to.col)
          ) {
            ambiguousPieces.push({ row, col });
          }
        }
      }
    }

    return ambiguousPieces;
  };

  return (
    <div className="flex flex-col items-center">
      <div className="mb-4 text-lg font-semibold">{gameStatus}</div>

      <div className="grid grid-cols-8 border border-gray-800 shadow-lg">
        {board.map((row, rowIndex) =>
          row.map((piece, colIndex) => {
            const isSelected =
              selectedPiece?.row === rowIndex &&
              selectedPiece?.col === colIndex;
            const isPossibleMove = possibleMoves.some(
              (move) => move.row === rowIndex && move.col === colIndex
            );
            const isLight = (rowIndex + colIndex) % 2 === 0;

            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`
                  w-16 h-16 flex items-center justify-center relative
                  ${isLight ? "bg-amber-200" : "bg-amber-800"} 
                  ${isSelected ? "ring-4 ring-blue-500 ring-inset" : ""}
                  ${isPossibleMove ? "ring-4 ring-green-500 ring-inset" : ""}
                `}
                onClick={() => handleSquareClick(rowIndex, colIndex)}
              >
                {colIndex === 0 && (
                  <span className="absolute left-1 top-1 text-xs font-bold text-gray-700">
                    {8 - rowIndex}
                  </span>
                )}
                {rowIndex === 7 && (
                  <span className="absolute right-1 bottom-1 text-xs font-bold text-gray-700">
                    {String.fromCharCode(97 + colIndex)}
                  </span>
                )}

                {piece && <ChessPieceComponent piece={piece} />}

                {isPossibleMove && !piece && (
                  <div className="w-4 h-4 rounded-full bg-green-500 opacity-60"></div>
                )}
                {isPossibleMove && piece && (
                  <div className="absolute inset-0 ring-4 ring-red-500 ring-inset opacity-60"></div>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="mt-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-2">Move History</h3>
        <div className="bg-white p-4 rounded shadow max-h-60 overflow-y-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left">#</th>
                <th className="text-left">White</th>
                <th className="text-left">Black</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: Math.ceil(moveHistory.length / 2) }).map(
                (_, index) => (
                  <tr key={index}>
                    <td>{index + 1}.</td>
                    <td>{moveHistory[index * 2]?.notation || ""}</td>
                    <td>{moveHistory[index * 2 + 1]?.notation || ""}</td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      <button
        className="mt-6 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        onClick={resetGame}
      >
        Reset Game
      </button>

      {showPromotionModal && (
        <PromotionModal color={currentPlayer} onSelect={handlePromotion} />
      )}
    </div>
  );
}
