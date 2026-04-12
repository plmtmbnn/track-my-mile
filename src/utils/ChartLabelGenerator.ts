/**
 * Formats a distance value into a clean, readable string.
 * < 1 KM: Meters (e.g., 200m)
 * >= 1 KM: Kilometers (e.g., 2.5km)
 */
export const formatDistanceLabel = (km: number): string => {
  if (km <= 0) return '0';
  if (km < 1) {
    return `${Math.round(km * 1000)}m`;
  }
  // Remove trailing .0 for cleaner labels (e.g., 2.0km -> 2km)
  return `${parseFloat(km.toFixed(2))}km`;
};

/**
 * Generates raw numeric ticks based on the range and step.
 */
export const generateTicks = (maxRange: number, stepSize: number): number[] => {
  const ticks: number[] = [];
  let current = 0;

  while (current <= maxRange) {
    // Fixed to avoid floating point precision errors (e.g., 0.3000000004)
    ticks.push(parseFloat(current.toFixed(3)));
    current += stepSize;
  }

  // Always ensure the max range is included
  if (ticks[ticks.length - 1] !== maxRange) {
    ticks.push(maxRange);
  }

  return ticks;
};

/**
 * Filters a large array of ticks down to a specific target count.
 * Always preserves the first (0) and last (max) labels.
 */
export const reduceLabels = (ticks: number[], targetCount: number = 6): number[] => {
  if (ticks.length <= targetCount) return ticks;

  const reduced: number[] = [ticks[0]]; // Always include 0
  const step = (ticks.length - 1) / (targetCount - 1);

  for (let i = 1; i < targetCount - 1; i++) {
    const index = Math.round(i * step);
    reduced.push(ticks[index]);
  }

  reduced.push(ticks[ticks.length - 1]); // Always include Max
  return reduced;
};

/**
 * Orchestrator: Generates final formatted labels for the X-Axis
 */
export const generateXAxisLabels = (maxRange: number, stepSize: number, maxLabels: number = 6) => {
  const rawTicks = generateTicks(maxRange, stepSize);
  const visibleTicks = reduceLabels(rawTicks, maxLabels);
  
  return visibleTicks.map(val => ({
    value: val,
    label: formatDistanceLabel(val)
  }));
};
