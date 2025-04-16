import React, { useState, useMemo, useCallback } from 'react';
import './App.css';
import GameControls from './components/GameControls';
import GameLadder from './components/GameLadder';
import GameBalance from './components/GameBalance';
import { formatValue } from './utils/formatters';

function App() {
  // Centralized Game Configuration
  const GAME_CONFIG = {
    INITIAL_BALANCE: 100,    // Starting balance for the player
    MULTIPLIER: 1.85,      // Reward multiplier per level
    MAX_LEVELS: 13,        // Total number of game levels
    MIN_BET: 0.000001,         // Minimum allowed bet amount
  };

  // Comprehensive Game State Management
  const [gameState, setGameState] = useState({
    balance: GAME_CONFIG.INITIAL_BALANCE,
    currentLevel: 1,
    gameActive: false,
    betAmount: GAME_CONFIG.MIN_BET,
    rewardAmount: 0,
    correctPositions: [],
    selectedColumn: null,
    levelResults: [],
    buttonState: 'PLAY', // Inicialmente, o botão é "PLAY"
    hasMoved: false,     // Flag para indicar se o jogador já clicou em alguma coluna
    gameId: Date.now().toString(36) + Math.random().toString(36).substr(2), // ID único de jogo
  });

  // Memoized Reward Calculation
  const calculateRewards = useCallback((betAmount) => {
    const rewards = [];
    let currentReward = betAmount;
    
    for (let i = 1; i <= GAME_CONFIG.MAX_LEVELS; i++) {
      rewards.push(currentReward);
      currentReward *= GAME_CONFIG.MULTIPLIER;
    }
    
    return rewards;
  }, []);

  // Memoized Rewards to Prevent Unnecessary Recalculations
  const REWARDS = useMemo(() => 
    calculateRewards(gameState.betAmount), 
    [gameState.betAmount, calculateRewards]
  );

  // Utility Function for Reward Formatting
  const formatReward = (value) => formatValue(value, 8, 2);

  const generateBetProgression = (balance) => {
    // Progressão de decimais micro
    const microSteps = [
      0.000001, 0.000002, 0.000005,  // Passos ultra-micro
      0.00001, 0.00002, 0.00005,     // Passos nano
      0.0001, 0.0002, 0.0005,        // Passos micro
      0.001, 0.002, 0.005,           // Passos pequenos
      0.01, 0.02, 0.05,              // Passos menores
      0.1, 0.2, 0.5,                 // Passos moderados
      1, 2, 5,                       // Passos padrão
      10, 25, 50, 100                // Passos grandes
    ];

    // Passos médios e grandes como antes
    const mediumSteps = [0.2, 0.5, 1, 2, 5, 10, 25, 50, 100];
    const largeSteps = [200, 500, 1000, 2500, 5000, 10000];
  
    let progression = microSteps.filter(step => step <= balance);
  
    // Adiciona passos micro primeiro
    progression.push(...microSteps);

    const multipliers = [0.25, 0.5, 0.75, 1.25, 1.5, 2, 3, 5, 10];
  multipliers.forEach(mult => {
    const step = Number((balance * mult).toFixed(6));
    if (step > progression[progression.length - 1]) {
      progression.push(step);
    }
  });
  
    // Adiciona passos médios e grandes conforme o saldo
    mediumSteps.forEach(step => {
      if (step <= balance) {
        progression.push(step);
      }
    });
  
    largeSteps.forEach(step => {
      if (step <= balance) {
        progression.push(step);
      }
    });
  
    // Múltiplos do saldo para valores muito altos
    if (balance > progression[progression.length - 1]) {
      const multipliers = [1.5, 2, 3, 5, 10];
      multipliers.forEach(mult => {
        const step = Math.floor(balance * mult);
        if (step > progression[progression.length - 1]) {
          progression.push(step);
        }
      });
    }
  
    // Remove duplicatas, ordena e retorna
    return [...new Set(progression)].sort((a, b) => a - b);
  };
  
  const adjustBetAmount = useCallback((increase, customValue) => {
    if (gameState.gameActive) return;
  
    setGameState(prev => {
      const currentBet = prev.betAmount;
      const betProgression = generateBetProgression(prev.balance);
      let newAmount;
  
      if (customValue !== undefined) {
        // Permite entradas com até 6 casas decimais
        newAmount = Math.max(
          0.000001, 
          Math.min(Number(customValue), prev.balance)
        );
      } else if (increase) {
        const currentIndex = betProgression.findIndex(value => value >= currentBet);
        
        newAmount = currentIndex < betProgression.length - 1 
          ? betProgression[currentIndex + 1] 
          : Math.min(prev.balance, betProgression[betProgression.length - 1]);
      } else {
        const currentIndex = betProgression.findIndex(value => value >= currentBet);
        
        newAmount = currentIndex > 0 
          ? betProgression[currentIndex - 1] 
          : 0.000001; // Valor micro mínimo
      }
  
      // Garante que o novo valor não exceda o saldo
      newAmount = Math.min(newAmount, prev.balance);
  
      // Formata para no máximo 6 casas decimais
      return { 
        ...prev, 
        betAmount: formatValue(newAmount, 8, 2) 
      };
    });
  }, [gameState.gameActive, gameState.balance]);

  // Game Start Handler
  const startGame = useCallback(() => {
    // Validate bet amount
    if (gameState.betAmount > gameState.balance) {
      alert("Saldo insuficiente para esta aposta!");
      return;
    }

    // Generate random game positions
    const generateSecurePositions = () => {
      // Usa crypto para geração mais segura de aleatoriedade
      return Array.from(
        { length: GAME_CONFIG.MAX_LEVELS }, 
        () => {
          // Usa Math.random com seed adicional
          const randomValue = (Date.now() * Math.random()) % 1;
          return randomValue < 0.5 ? 'left' : 'right';
        }
      );
    };
  
    const positions = generateSecurePositions();

    setGameState(prev => ({
      ...prev,
      correctPositions: positions,
      currentLevel: 2,                // Começa em nível 2, pois o nível 1 não aparece
      gameActive: true,
      rewardAmount: 0,
      selectedColumn: null,
      levelResults: [],
      balance: prev.balance - prev.betAmount, // Subtrai o valor da aposta
      buttonState: 'END',             // Inicia com botão END (para cancelar sem jogar)
      hasMoved: false                 // Nenhuma coluna foi clicada ainda
    }));
  }, [gameState.betAmount, gameState.balance]);

  // Column Selection Handler
  const selectColumn = useCallback((column) => {
    // Can only select if it's the current level
    if (!gameState.gameActive || column !== 'left' && column !== 'right') return;
  
    // Marcar que o jogador já se moveu
    setGameState(prev => ({ ...prev, hasMoved: true }));
    
    const correctColumn = gameState.correctPositions[gameState.currentLevel-1];
  
    const updateState = (newRewardAmount, newLevelResults, gameOver = false) => {
      setGameState(prev => ({
        ...prev,
        rewardAmount: newRewardAmount,
        levelResults: newLevelResults,
        currentLevel: gameOver ? prev.currentLevel : prev.currentLevel + 1,
        gameActive: !gameOver,
        selectedColumn: column,
        buttonState: gameOver ? 'PLAY' : 'TAKE',
        // Adiciona a recompensa ao saldo se o jogo terminar no último nível
        balance: gameOver && prev.currentLevel === GAME_CONFIG.MAX_LEVELS 
          ? prev.balance + newRewardAmount 
          : prev.balance
      }));
    };
  
    if (column === correctColumn) {
      // Se acertou, o prêmio passa a ser o valor do nível atual
      const newRewardAmount = REWARDS[gameState.currentLevel-1];
      const newLevelResults = [
        ...gameState.levelResults,
        { level: gameState.currentLevel, column, correct: true }
      ];
      updateState(
        newRewardAmount, 
        newLevelResults, 
        gameState.currentLevel === GAME_CONFIG.MAX_LEVELS
      );
    } else {
      // Se errou, encerra o jogo; o prêmio não é alterado
      const newLevelResults = [
        ...gameState.levelResults,
        { level: gameState.currentLevel, column, correct: false },
        ...gameState.correctPositions.slice(gameState.currentLevel).map((correctCol, index) => ({
          level: gameState.currentLevel + index + 1,
          column: correctCol,
          correct: true,
          forcedCorrect: true
        }))
      ];
      updateState(gameState.rewardAmount, newLevelResults, true);
    }
  }, [gameState, REWARDS]);

  // Game Reset / Cash Out Handler
  const resetGame = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      // Se nenhum movimento foi feito (hasMoved é false), reembolsa a aposta; 
      // Caso contrário, adiciona apenas o prêmio (rewardAmount)
      balance: prev.hasMoved ? (prev.balance + prev.rewardAmount) : (prev.balance + prev.betAmount),
      currentLevel: 1,
      gameActive: false,
      rewardAmount: 0,
      selectedColumn: null,
      levelResults: [],
      buttonState: 'PLAY',
      hasMoved: false
    }));
  }, []);
  

  // New method to handle TAKE action
  const takeReward = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      balance: prev.balance + prev.rewardAmount,
      currentLevel: 1,
      gameActive: false,
      rewardAmount: 0,
      selectedColumn: null,
      levelResults: [],
      buttonState: 'PLAY'
    }));
  }, []);

  // Updated Gameplay Handler
  const handleMainButtonClick = useCallback(() => {
    switch(gameState.buttonState) {
      case 'PLAY':
        startGame();
        break;
      case 'END':
        // Allows player to cancel game before making any moves
        resetGame();
        break;
      case 'TAKE':
        // Allows player to cash out current accumulated rewards
        takeReward();
        break;
      default:
        break;
    }
  }, [gameState.buttonState, startGame, resetGame, takeReward]);

  // Main Game Render
  return (
    <div className="app-container">
      {/* Decorações de pedra nos cantos */}
      <div className="stone-decoration stone-top-left"></div>
      <div className="stone-decoration stone-top-right"></div>
      <div className="stone-decoration stone-bottom-left"></div>
      <div className="stone-decoration stone-bottom-right"></div>
      
      <GameBalance balance={gameState.balance} />
      <header className="app-header">
        <h1>BOBRCOIN</h1>
      </header>
      <div className="game-container">
        <GameLadder
          rewards={REWARDS.map(r => parseFloat(formatReward(r)))}
          currentLevel={gameState.currentLevel}
          maxLevels={GAME_CONFIG.MAX_LEVELS}
          onSelect={selectColumn}
          selectedColumn={gameState.selectedColumn}
          levelResults={gameState.levelResults}
        />
        <div className="game-content">
          <GameControls
            betAmount={gameState.betAmount}
            onAdjustBet={adjustBetAmount}
            setToMin={() => adjustBetAmount(false, GAME_CONFIG.MIN_BET)}
            setToMax={() => adjustBetAmount(false, gameState.balance)}
            buttonText={gameState.buttonState}
            onButtonClick={handleMainButtonClick}
            disabled={false} // Always enabled now
            gameActive={gameState.gameActive}
          />
        </div>
      </div>
    </div>
  );
}

export default App;