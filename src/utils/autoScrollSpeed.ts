/**
 * Calculate auto-scroll speed from BPM value
 * Uses linear formula: speed = BPM / 30
 * 
 * Examples:
 * - 60 BPM → 2.0x
 * - 90 BPM → 3.0x
 * - 120 BPM → 4.0x
 * - 150 BPM → 5.0x (capped at 4.0x)
 * 
 * @param bpm - BPM value (beats per minute)
 * @returns Speed multiplier between 0.5 and 4.0, or 2.5 (default) if BPM is invalid
 */
export function calculateSpeedFromBPM(bpm?: number | null): number {
  // Default speed if BPM is not provided or invalid
  if (!bpm || bpm <= 0 || !Number.isFinite(bpm)) {
    return 2.5;
  }
  
  // Apply linear formula: speed = BPM / 30
  const calculatedSpeed = bpm / 30;
  
  // Bound the speed between 0.5 (minimum) and 4.0 (maximum)
  const minSpeed = 0.5;
  const maxSpeed = 4.0;
  
  return Math.max(minSpeed, Math.min(maxSpeed, calculatedSpeed));
}
