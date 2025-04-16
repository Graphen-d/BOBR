import React from 'react';
import { formatValue } from '../utils/formatters';

function GameBalance({ balance }) {
  return (
    <div className="game-balance">
      <span>Saldo: {formatValue(balance, 8, 2)} SOL</span>
    </div>
  );
}

export default GameBalance;