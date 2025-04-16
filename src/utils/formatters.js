export const formatValue = (value, maxDecimals = 8, minDecimals = 2) => {
  // Adicionar validação de entrada
  if (typeof value !== 'number' || isNaN(value)) {
    console.warn('Valor inválido fornecido');
    return 0;
  }

  // Limitar valores extremos
  const clampedValue = Math.max(
    Math.min(value, Number.MAX_SAFE_INTEGER), 
    -Number.MAX_SAFE_INTEGER
  );

  const effectiveDecimals = clampedValue < 1 
    ? Math.min(maxDecimals, Math.max(minDecimals, -Math.floor(Math.log10(clampedValue)) + 1))
    : minDecimals;

  return Number(clampedValue.toFixed(maxDecimals));
};