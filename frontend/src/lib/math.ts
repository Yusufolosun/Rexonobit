// frontend/src/lib/math.ts
// Financial math utilities for microSTX conversions, interest, and trust score calculations

/**
 * @module math
 * @description Pure arithmetic helpers for protocol financial calculations.
 * All functions operate on integer microSTX to avoid floating-point rounding errors.
 * Use `BigInt`-based helpers for very large amounts if microSTX exceeds Number.MAX_SAFE_INTEGER.
 */

const MICROSTX_PER_STX = 1_000_000;
const BASIS_POINTS = 10_000; // 1 basis point = 0.01%

/** Convert STX (as float string or number) to microSTX integer. */
export function toMicroSTX(stx: number | string): number {
  return Math.round(Number(stx) * MICROSTX_PER_STX);
}

/** Convert microSTX integer to STX float. */
export function fromMicroSTX(microSTX: number): number {
  return microSTX / MICROSTX_PER_STX;
}

/**
 * Calculate simple interest on a principal amount.
 * @param principal  microSTX principal
 * @param rateBps    Interest rate in basis points (e.g. 500 = 5%)
 * @param periods    Number of compounding periods
 * @returns          Total interest owed in microSTX (integer)
 */
export function calcSimpleInterest(
  principal: number,
  rateBps: number,
  periods = 1
): number {
  return Math.floor((principal * rateBps * periods) / BASIS_POINTS);
}

/**
 * Calculate repayment total (principal + interest).
 */
export function calcRepaymentTotal(
  principal: number,
  rateBps: number,
  periods = 1
): number {
  return principal + calcSimpleInterest(principal, rateBps, periods);
}

/**
 * Calculate utilization ratio as a percentage (0–100).
 * Returns 0 if ceiling is 0 to avoid division by zero.
 */
export function calcUtilization(used: number, ceiling: number): number {
  if (ceiling === 0) return 0;
  return Math.min(100, (used / ceiling) * 100);
}

/**
 * Calculate a weighted trust score contribution.
 * @param value       Raw component value
 * @param maxValue    Maximum possible value for this component
 * @param weight      Weight out of 1000 (e.g. 400 = 40%)
 */
export function calcTrustContribution(
  value: number,
  maxValue: number,
  weight: number
): number {
  if (maxValue === 0) return 0;
  return Math.floor((value / maxValue) * weight);
}

/**
 * Sum an array of numbers.
 */
export function sum(values: number[]): number {
  return values.reduce((acc, v) => acc + v, 0);
}

/**
 * Clamp a value between min and max (inclusive).
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
