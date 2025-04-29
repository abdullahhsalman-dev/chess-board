export type PieceType =
  | "pawn"
  | "rook"
  | "knight"
  | "bishop"
  | "queen"
  | "king";
export type Color = "white" | "black";

export interface ChessPiece {
  type: PieceType;
  color: Color;
  hasMoved?: boolean;
}

export interface Position {
  row: number;
  col: number;
}

export interface GameState {
  whiteCanCastleKingside: boolean;
  whiteCanCastleQueenside: boolean;
  blackCanCastleKingside: boolean;
  blackCanCastleQueenside: boolean;
  enPassantTarget: Position | null;
  halfMoveClock: number;
  fullMoveNumber: number;
}

export interface MoveHistory {
  piece: ChessPiece;
  from: Position;
  to: Position;
  capturedPiece: ChessPiece | null;
  promotion?: PieceType;
  notation: string;
}

export interface MoveResult {
  newBoard: (ChessPiece | null)[][];
  newGameState: GameState;
  capturedPiece: ChessPiece | null;
}

// Create the initial chess board
export function initialBoard(): (ChessPiece | null)[][] {
  const board: (ChessPiece | null)[][] = Array(8)
    .fill(null)
    .map(() => Array(8).fill(null));

  // Set up pawns
  for (let col = 0; col < 8; col++) {
    board[1][col] = { type: "pawn", color: "black" };
    board[6][col] = { type: "pawn", color: "white" };
  }

  // Set up rooks
  board[0][0] = { type: "rook", color: "black" };
  board[0][7] = { type: "rook", color: "black" };
  board[7][0] = { type: "rook", color: "white" };
  board[7][7] = { type: "rook", color: "white" };

  // Set up knights
  board[0][1] = { type: "knight", color: "black" };
  board[0][6] = { type: "knight", color: "black" };
  board[7][1] = { type: "knight", color: "white" };
  board[7][6] = { type: "knight", color: "white" };

  // Set up bishops
  board[0][2] = { type: "bishop", color: "black" };
  board[0][5] = { type: "bishop", color: "black" };
  board[7][2] = { type: "bishop", color: "white" };
  board[7][5] = { type: "bishop", color: "white" };

  // Set up queens
  board[0][3] = { type: "queen", color: "black" };
  board[7][3] = { type: "queen", color: "white" };

  // Set up kings
  board[0][4] = { type: "king", color: "black" };
  board[7][4] = { type: "king", color: "white" };

  return board;
}

// Deep clone the board
export function cloneBoard(
  board: (ChessPiece | null)[][]
): (ChessPiece | null)[][] {
  return board.map((row) => row.map((piece) => (piece ? { ...piece } : null)));
}

// Check if a position is within the board boundaries
export function isValidPosition(position: Position): boolean {
  return (
    position.row >= 0 &&
    position.row < 8 &&
    position.col >= 0 &&
    position.col < 8
  );
}

// Clean the board (clone to ensure immutability)
export function cleanBoard(
  board: (ChessPiece | null)[][]
): (ChessPiece | null)[][] {
  return board.map((row) => row.map((piece) => (piece ? { ...piece } : null)));
}

// Get all possible moves for a piece
export function getPossibleMoves(
  board: (ChessPiece | null)[][],
  position: Position,
  gameState: GameState
): Position[] {
  const piece = board[position.row][position.col];
  if (!piece) return [];

  let moves: Position[] = [];

  switch (piece.type) {
    case "pawn":
      moves = getPawnMoves(board, position, gameState);
      break;
    case "rook":
      moves = getRookMoves(board, position);
      break;
    case "knight":
      moves = getKnightMoves(board, position);
      break;
    case "bishop":
      moves = getBishopMoves(board, position);
      break;
    case "queen":
      moves = getQueenMoves(board, position);
      break;
    case "king":
      moves = getKingMoves(board, position, gameState);
      break;
  }

  // Filter out moves that would leave the king in check
  return moves.filter((move) => {
    const { newBoard } = movePiece(board, position, move, gameState);
    const cleanNewBoard = cleanBoard(newBoard);
    return !isKingInCheck(cleanNewBoard, piece.color, gameState);
  });
}

// Get all possible moves for a pawn
function getPawnMoves(
  board: (ChessPiece | null)[][],
  position: Position,
  gameState: GameState
): Position[] {
  const { row, col } = position;
  const piece = board[row][col];
  if (!piece || piece.type !== "pawn") return [];

  const moves: Position[] = [];
  const direction = piece.color === "white" ? -1 : 1;
  const startingRow = piece.color === "white" ? 6 : 1;

  // Move forward one square
  const oneForward = { row: row + direction, col };
  if (isValidPosition(oneForward) && !board[oneForward.row][oneForward.col]) {
    moves.push(oneForward);

    // Move forward two squares from starting position
    if (row === startingRow) {
      const twoForward = { row: row + 2 * direction, col };
      if (!board[twoForward.row][twoForward.col]) {
        moves.push(twoForward);
      }
    }
  }

  // Capture diagonally
  const capturePositions = [
    { row: row + direction, col: col - 1 },
    { row: row + direction, col: col + 1 },
  ];

  for (const capturePos of capturePositions) {
    if (isValidPosition(capturePos)) {
      const targetPiece = board[capturePos.row][capturePos.col];

      // Normal capture
      if (targetPiece && targetPiece.color !== piece.color) {
        moves.push(capturePos);
      }

      // En passant capture
      if (
        !targetPiece &&
        gameState.enPassantTarget &&
        capturePos.row === gameState.enPassantTarget.row &&
        capturePos.col === gameState.enPassantTarget.col
      ) {
        moves.push(capturePos);
      }
    }
  }

  return moves;
}

// Get all possible moves for a rook
function getRookMoves(
  board: (ChessPiece | null)[][],
  position: Position
): Position[] {
  const { row, col } = position;
  const piece = board[row][col];
  if (!piece) return [];

  const moves: Position[] = [];
  const directions = [
    { row: -1, col: 0 }, // up
    { row: 1, col: 0 }, // down
    { row: 0, col: -1 }, // left
    { row: 0, col: 1 }, // right
  ];

  for (const direction of directions) {
    let currentRow = row + direction.row;
    let currentCol = col + direction.col;

    while (isValidPosition({ row: currentRow, col: currentCol })) {
      const targetPiece = board[currentRow][currentCol];

      if (!targetPiece) {
        moves.push({ row: currentRow, col: currentCol });
      } else if (targetPiece.color !== piece.color) {
        moves.push({ row: currentRow, col: currentCol });
        break;
      } else {
        break;
      }

      currentRow += direction.row;
      currentCol += direction.col;
    }
  }

  return moves;
}

// Get all possible moves for a knight
function getKnightMoves(
  board: (ChessPiece | null)[][],
  position: Position
): Position[] {
  const { row, col } = position;
  const piece = board[row][col];
  if (!piece) return [];

  const moves: Position[] = [];
  const knightMoves = [
    { row: row - 2, col: col - 1 },
    { row: row - 2, col: col + 1 },
    { row: row - 1, col: col - 2 },
    { row: row - 1, col: col + 2 },
    { row: row + 1, col: col - 2 },
    { row: row + 1, col: col + 2 },
    { row: row + 2, col: col - 1 },
    { row: row + 2, col: col + 1 },
  ];

  for (const move of knightMoves) {
    if (isValidPosition(move)) {
      const targetPiece = board[move.row][move.col];

      if (!targetPiece || targetPiece.color !== piece.color) {
        moves.push(move);
      }
    }
  }

  return moves;
}

// Get all possible moves for a bishop
function getBishopMoves(
  board: (ChessPiece | null)[][],
  position: Position
): Position[] {
  const { row, col } = position;
  const piece = board[row][col];
  if (!piece) return [];

  const moves: Position[] = [];
  const directions = [
    { row: -1, col: -1 }, // up-left
    { row: -1, col: 1 }, // up-right
    { row: 1, col: -1 }, // down-left
    { row: 1, col: 1 }, // down-right
  ];

  for (const direction of directions) {
    let currentRow = row + direction.row;
    let currentCol = col + direction.col;

    while (isValidPosition({ row: currentRow, col: currentCol })) {
      const targetPiece = board[currentRow][currentCol];

      if (!targetPiece) {
        moves.push({ row: currentRow, col: currentCol });
      } else if (targetPiece.color !== piece.color) {
        moves.push({ row: currentRow, col: currentCol });
        break;
      } else {
        break;
      }

      currentRow += direction.row;
      currentCol += direction.col;
    }
  }

  return moves;
}

// Get all possible moves for a queen
function getQueenMoves(
  board: (ChessPiece | null)[][],
  position: Position
): Position[] {
  return [...getRookMoves(board, position), ...getBishopMoves(board, position)];
}

// Get all possible moves for a king
function getKingMoves(
  board: (ChessPiece | null)[][],
  position: Position,
  gameState: GameState
): Position[] {
  const { row, col } = position;
  const piece = board[row][col];
  if (!piece || piece.type !== "king") return [];

  const moves: Position[] = [];
  const kingMoves = [
    { row: row - 1, col: col - 1 },
    { row: row - 1, col: col },
    { row: row - 1, col: col + 1 },
    { row: row, col: col - 1 },
    { row: row, col: col + 1 },
    { row: row + 1, col: col - 1 },
    { row: row + 1, col: col },
    { row: row + 1, col: col + 1 },
  ];

  for (const move of kingMoves) {
    if (isValidPosition(move)) {
      const targetPiece = board[move.row][move.col];

      if (!targetPiece || targetPiece.color !== piece.color) {
        moves.push(move);
      }
    }
  }

  // Castling
  if (!piece.hasMoved) {
    // Kingside castling
    if (
      (piece.color === "white" && gameState.whiteCanCastleKingside) ||
      (piece.color === "black" && gameState.blackCanCastleKingside)
    ) {
      const rookPos = { row, col: 7 };
      const rook = board[rookPos.row][rookPos.col];

      if (
        rook &&
        rook.type === "rook" &&
        rook.color === piece.color &&
        !rook.hasMoved
      ) {
        const path = [
          { row, col: col + 1 },
          { row, col: col + 2 },
        ];

        const pathClear = path.every((pos) => !board[pos.row][pos.col]);
        const kingNotInCheck =
          !isKingInCheck(board, piece.color, gameState) &&
          !isPositionUnderAttack(
            board,
            { row, col: col + 1 },
            piece.color,
            gameState
          );

        if (pathClear && kingNotInCheck) {
          moves.push(path[1]);
        }
      }
    }

    // Queenside castling
    if (
      (piece.color === "white" && gameState.whiteCanCastleQueenside) ||
      (piece.color === "black" && gameState.blackCanCastleQueenside)
    ) {
      const rookPos = { row, col: 0 };
      const rook = board[rookPos.row][rookPos.col];

      if (
        rook &&
        rook.type === "rook" &&
        rook.color === piece.color &&
        !rook.hasMoved
      ) {
        const path = [
          { row, col: col - 1 },
          { row, col: col - 2 },
          { row, col: col - 3 },
        ];

        const pathClear = path.every((pos) => !board[pos.row][pos.col]);
        const kingNotInCheck =
          !isKingInCheck(board, piece.color, gameState) &&
          !isPositionUnderAttack(
            board,
            { row, col: col - 1 },
            piece.color,
            gameState
          );

        if (pathClear && kingNotInCheck) {
          moves.push(path[1]);
        }
      }
    }
  }

  return moves;
}

// Check if a position is under attack by the opponent
export function isPositionUnderAttack(
  board: (ChessPiece | null)[][],
  position: Position,
  color: Color,
  gameState: GameState
): boolean {
  const opponentColor = color === "white" ? "black" : "white";

  // Check for attacks from pawns
  const pawnDirections =
    color === "white"
      ? [
          { row: position.row + 1, col: position.col - 1 },
          { row: position.row + 1, col: position.col + 1 },
        ]
      : [
          { row: position.row - 1, col: position.col - 1 },
          { row: position.row - 1, col: position.col + 1 },
        ];

  for (const dir of pawnDirections) {
    if (isValidPosition(dir)) {
      const piece = board[dir.row][dir.col];
      if (piece && piece.type === "pawn" && piece.color === opponentColor) {
        if (
          gameState.enPassantTarget &&
          dir.row === gameState.enPassantTarget.row &&
          dir.col === gameState.enPassantTarget.col
        ) {
          return true;
        }
        return true;
      }
    }
  }

  // Check for attacks from knights
  const knightMoves = [
    { row: position.row - 2, col: position.col - 1 },
    { row: position.row - 2, col: position.col + 1 },
    { row: position.row - 1, col: position.col - 2 },
    { row: position.row - 1, col: position.col + 2 },
    { row: position.row + 1, col: position.col - 2 },
    { row: position.row + 1, col: position.col + 2 },
    { row: position.row + 2, col: position.col - 1 },
    { row: position.row + 2, col: position.col + 1 },
  ];

  for (const move of knightMoves) {
    if (isValidPosition(move)) {
      const piece = board[move.row][move.col];
      if (piece && piece.type === "knight" && piece.color === opponentColor) {
        return true;
      }
    }
  }

  // Check for attacks from kings
  const kingMoves = [
    { row: position.row - 1, col: position.col - 1 },
    { row: position.row - 1, col: position.col },
    { row: position.row - 1, col: position.col + 1 },
    { row: position.row, col: position.col - 1 },
    { row: position.row, col: position.col + 1 },
    { row: position.row + 1, col: position.col - 1 },
    { row: position.row + 1, col: position.col },
    { row: position.row + 1, col: position.col + 1 },
  ];

  for (const move of kingMoves) {
    if (isValidPosition(move)) {
      const piece = board[move.row][move.col];
      if (piece && piece.type === "king" && piece.color === opponentColor) {
        return true;
      }
    }
  }

  // Check for attacks from sliding pieces (queen, rook, bishop)
  const directions = [
    { row: -1, col: 0 }, // up
    { row: 1, col: 0 }, // down
    { row: 0, col: -1 }, // left
    { row: 0, col: 1 }, // right
    { row: -1, col: -1 }, // up-left
    { row: -1, col: 1 }, // up-right
    { row: 1, col: -1 }, // down-left
    { row: 1, col: 1 }, // down-right
  ];

  for (const direction of directions) {
    let currentRow = position.row + direction.row;
    let currentCol = position.col + direction.col;

    while (isValidPosition({ row: currentRow, col: currentCol })) {
      const piece = board[currentRow][currentCol];

      if (piece) {
        if (piece.color === opponentColor) {
          const isDiagonal = direction.row !== 0 && direction.col !== 0;
          const isStraight = direction.row === 0 || direction.col === 0;

          if (
            (isDiagonal &&
              (piece.type === "bishop" || piece.type === "queen")) ||
            (isStraight && (piece.type === "rook" || piece.type === "queen"))
          ) {
            return true;
          }
        }
        break;
      }

      currentRow += direction.row;
      currentCol += direction.col;
    }
  }

  return false;
}

// Find the king's position
function findKing(
  board: (ChessPiece | null)[][],
  color: Color
): Position | null {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.type === "king" && piece.color === color) {
        return { row, col };
      }
    }
  }
  return null;
}

// Check if the king is in check
export function isKingInCheck(
  board: (ChessPiece | null)[][],
  color: Color,
  gameState: GameState
): boolean {
  const kingPosition = findKing(board, color);
  if (!kingPosition) return false;

  return isPositionUnderAttack(board, kingPosition, color, gameState);
}

// Move a piece on the board
export function movePiece(
  board: (ChessPiece | null)[][],
  from: Position,
  to: Position,
  gameState: GameState,
  promotionPiece?: PieceType
): MoveResult {
  const newBoard = cloneBoard(board);
  const piece = newBoard[from.row][from.col];

  if (!piece)
    return { newBoard, newGameState: { ...gameState }, capturedPiece: null };

  const capturedPiece = newBoard[to.row][to.col]
    ? { ...newBoard[to.row][to.col]! }
    : null;

  const newGameState = { ...gameState };

  if (piece.type === "pawn" || capturedPiece) {
    newGameState.halfMoveClock = 0;
  } else {
    newGameState.halfMoveClock++;
  }

  if (piece.color === "black") {
    newGameState.fullMoveNumber++;
  }

  if (piece.type === "pawn") {
    if (
      gameState.enPassantTarget &&
      to.row === gameState.enPassantTarget.row &&
      to.col === gameState.enPassantTarget.col
    ) {
      const captureRow = piece.color === "white" ? to.row + 1 : to.row - 1;
      newBoard[captureRow][to.col] = null;
    }

    if (Math.abs(from.row - to.row) === 2) {
      const enPassantRow =
        piece.color === "white" ? from.row - 1 : from.row + 1;
      newGameState.enPassantTarget = { row: enPassantRow, col: from.col };
    } else {
      newGameState.enPassantTarget = null;
    }

    if (
      (piece.color === "white" && to.row === 0) ||
      (piece.color === "black" && to.row === 7)
    ) {
      piece.type = promotionPiece || "queen";
    }
  } else {
    newGameState.enPassantTarget = null;
  }

  if (piece.type === "king") {
    if (piece.color === "white") {
      newGameState.whiteCanCastleKingside = false;
      newGameState.whiteCanCastleQueenside = false;
    } else {
      newGameState.blackCanCastleKingside = false;
      newGameState.blackCanCastleQueenside = false;
    }

    if (Math.abs(from.col - to.col) === 2) {
      if (to.col > from.col) {
        const rookFrom = { row: from.row, col: 7 };
        const rookTo = { row: from.row, col: 5 };
        newBoard[rookTo.row][rookTo.col] = newBoard[rookFrom.row][rookFrom.col];
        newBoard[rookFrom.row][rookFrom.col] = null;
      } else {
        const rookFrom = { row: from.row, col: 0 };
        const rookTo = { row: from.row, col: 3 };
        newBoard[rookTo.row][rookTo.col] = newBoard[rookFrom.row][rookFrom.col];
        newBoard[rookFrom.row][rookFrom.col] = null;
      }
    }
  }

  if (piece.type === "rook") {
    if (piece.color === "white") {
      if (from.row === 7 && from.col === 0) {
        newGameState.whiteCanCastleQueenside = false;
      } else if (from.row === 7 && from.col === 7) {
        newGameState.whiteCanCastleKingside = false;
      }
    } else {
      if (from.row === 0 && from.col === 0) {
        newGameState.blackCanCastleQueenside = false;
      } else if (from.row === 0 && from.col === 7) {
        newGameState.blackCanCastleKingside = false;
      }
    }
  }

  if (capturedPiece && capturedPiece.type === "rook") {
    if (capturedPiece.color === "white") {
      if (to.row === 7 && to.col === 0) {
        newGameState.whiteCanCastleQueenside = false;
      } else if (to.row === 7 && to.col === 7) {
        newGameState.whiteCanCastleKingside = false;
      }
    } else {
      if (to.row === 0 && to.col === 0) {
        newGameState.blackCanCastleQueenside = false;
      } else if (to.row === 0 && to.col === 7) {
        newGameState.blackCanCastleKingside = false;
      }
    }
  }

  piece.hasMoved = true;
  newBoard[to.row][to.col] = piece;
  newBoard[from.row][from.col] = null;

  return { newBoard, newGameState, capturedPiece };
}

// Check if the game is in checkmate
export function isCheckmate(
  board: (ChessPiece | null)[][],
  color: Color,
  gameState: GameState
): boolean {
  if (!isKingInCheck(board, color, gameState)) {
    return false;
  }

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.color === color) {
        const moves = getPossibleMoves(board, { row, col }, gameState);
        if (moves.length > 0) {
          return false;
        }
      }
    }
  }

  return true;
}

// Check if the game is in stalemate
export function isStalemate(
  board: (ChessPiece | null)[][],
  color: Color,
  gameState: GameState
): boolean {
  if (isKingInCheck(board, color, gameState)) {
    return false;
  }

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.color === color) {
        const moves = getPossibleMoves(board, { row, col }, gameState);
        if (moves.length > 0) {
          return false;
        }
      }
    }
  }

  return true;
}
