/**
 * Helper: Linear Interpolation
 */
export const lerp = (a: number, b: number, t: number): number => {
  return a + (b - a) * t;
};

/**
 * Helper: Smoothstep Easing
 * Creates a sigmoid-like curve for non-linear transitions.
 */
export const smoothstep = (t: number): number => {
  return t * t * (3 - 2 * t);
};

interface ScaleConfig {
  distance: number;
  step: number;
  viewRange: number;
}

const SCALE_CONFIGS: ScaleConfig[] = [
  { distance: 0, step: 0.01, viewRange: 1.0 },    // Initial: 1km range
  { distance: 1, step: 0.1, viewRange: 5.0 },     // At 1km: transition to 5km range
  { distance: 5, step: 0.5, viewRange: 10.0 },    // At 5km: transition to 10km range
  { distance: 10, step: 1.0, viewRange: 20.0 },   // At 10km: transition to 20km range
  { distance: 20, step: 1.0, viewRange: 50.0 },   // Max: 50km range
];

/**
 * Calculates a smooth maxRange and stepSize for the chart X-axis
 * based on current distance.
 */
export const getSmoothScale = (currentDistanceKm: number) => {
  // 1. Find the current interval in our config
  let i = 0;
  while (i < SCALE_CONFIGS.length - 2 && currentDistanceKm > SCALE_CONFIGS[i + 1].distance) {
    i++;
  }

  const start = SCALE_CONFIGS[i];
  const end = SCALE_CONFIGS[i + 1];

  // 2. Calculate progress (t) within the current interval
  let t = (currentDistanceKm - start.distance) / (end.distance - start.distance);
  t = Math.max(0, Math.min(1, t)); // Clamp 0-1

  // 3. Apply easing for smoothness
  const easedT = smoothstep(t);

  // 4. Interpolate values
  const smoothRange = lerp(start.viewRange, end.viewRange, easedT);
  const smoothStep = lerp(start.step, end.step, easedT);

  return {
    maxRange: smoothRange,
    stepSize: smoothStep,
  };
};
