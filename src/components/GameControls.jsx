import React, { useState, useEffect } from 'react';
import { formatValue } from '../utils/formatters';

function GameControls({ 
  betAmount, 
  onAdjustBet, 
  setToMin, 
  setToMax, 
  buttonText, 
  onButtonClick, 
  disabled, 
  gameActive 
}) {
  // Local state for input handling
  const [inputValue, setInputValue] = useState(formatValue(betAmount, 8, 2).toString());

  // Sync input value with prop changes
  useEffect(() => {
    setInputValue(formatValue(betAmount, 8, 2).toString());
  }, [betAmount]);

  // Input sanitization and validation
  const handleInputChange = (e) => {
    const rawValue = e.target.value;
    
    // Allow up to 8 decimal places, multiple decimal points filtered
    const sanitizedValue = rawValue
    .replace(/[^0-9.]/g, '')    // Remove caracteres não numéricos
    .replace(/(\..*)\./g, '$1') // Mantém apenas o primeiro ponto decimal
    .slice(0, 12)  // Limita o comprimento
    .split('.')    // Separa parte inteira e decimal
    .map((part, index) => {
      // Primeira parte (inteiros): remove zeros à esquerda
      if (index === 0) return part.replace(/^0+/, '') || '0';
      // Parte decimal: limita a 8 casas decimais
      return part.slice(0, 8);
    })
    .join('.');
    setInputValue(sanitizedValue);
  };

  // Final input validation on blur
  const handleBlur = () => {
    // Convert to number, validate range with more decimal precision
    const numValue = Math.max(
      0.000001, 
      Math.min(parseFloat(inputValue) || 0.000001, 100000)
    );
    
    // Use adjustment method with validated value
    onAdjustBet(false, numValue);
  };

  // Determine button styling based on state
  const getButtonStyle = () => {
    switch(buttonText) {
      case 'PLAY':
        return 'play-button';
      case 'END':
        return 'play-button end-button';
      case 'TAKE':
        return 'play-button take-button';
      default:
        return 'play-button';
    }
  };

  return (
    <div className="game-controls">
      <div className="bet-controls">
        <button 
          className="bet-button min" 
          onClick={setToMin} 
          disabled={gameActive}
        >
          MIN
        </button>
        
        <button 
          className="bet-button decrease" 
          onClick={() => onAdjustBet(false)} 
          disabled={gameActive}
        >
          −
        </button>
        
        <div className="bet-amount-container">
          <input 
            type="text" 
            className="bet-amount"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleBlur}
            disabled={gameActive}
            inputMode="decimal"
            pattern="[0-9]*[.]?[0-9]{0,2}"
          />
          <div className="bet-label">BET AMOUNT</div>
        </div>
        
        <button 
          className="bet-button increase" 
          onClick={() => onAdjustBet(true)} 
          disabled={gameActive}
        >
          +
        </button>
        
        <button 
          className="bet-button max" 
          onClick={setToMax} 
          disabled={gameActive}
        >
          MAX
        </button>
      </div>
      
      <button 
        className={getButtonStyle()}
        onClick={onButtonClick} 
        disabled={disabled}
      >
        {buttonText}
      </button>
    </div>
  );
}

export default GameControls;