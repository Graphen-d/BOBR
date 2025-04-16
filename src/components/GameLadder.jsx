import React from 'react';
import { formatValue } from '../utils/formatters';

function GameLadder({ 
  rewards, 
  currentLevel, 
  maxLevels, 
  onSelect, 
  selectedColumn, 
  levelResults 
}) {
  const levelRewards = rewards.slice(1, maxLevels).reverse();

  // Retrieve level-specific result
  const getLevelResult = (level) => {
    return levelResults.find((lr) => lr.level === level);
  };

  return (
    <div className="game-ladder">
      {levelRewards.map((reward, index) => {
        const level = maxLevels - index;
        const levelResult = getLevelResult(level);
        const isCurrentLevel = level === currentLevel;

        let leftContent, rightContent;

        if (levelResult) {
          const { column, correct, forcedCorrect } = levelResult;
          
          const renderReward = (col) => {
            if (forcedCorrect || (correct && level <= currentLevel)) {
              return col === column ? '🪵' : formatValue(reward, 8, 2);
            }
            
            if (!correct) {
              return col === column ? '💧' : formatValue(reward, 8, 2);
            }
            
            return formatValue(reward, 8, 2);
          };

          leftContent = renderReward('left');
          rightContent = renderReward('right');
        } else {
          leftContent = rightContent = formatValue(reward, 8, 2);
        }

        return (
          <React.Fragment key={level}>
            <div
              className={`ladder-row left 
                ${isCurrentLevel ? 'current' : ''} 
                ${selectedColumn === 'left' ? 'selected' : ''}`}
              onClick={() => isCurrentLevel && onSelect('left')}
            >
              {leftContent}
            </div>
            <div
              className={`ladder-row right 
                ${isCurrentLevel ? 'current' : ''} 
                ${selectedColumn === 'right' ? 'selected' : ''}`}
              onClick={() => isCurrentLevel && onSelect('right')}
            >
              {rightContent}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default GameLadder;