/** Form validation utilities for REXONOBIT frontend */

export interface ValidationResult {
  valid: boolean;
  error: string | null;
}

const OK: ValidationResult = { valid: true, error: null };
const fail = (msg: string): ValidationResult => ({ valid: false, error: msg });

/** Validate STX amount (microSTX input as STX string, min 0.000001) */
export function validateSTX(value: string, label = 'Amount'): ValidationResult {
  if (!value || value.trim() === '') return fail(`${label} is required.`);
  const n = parseFloat(value);
  if (isNaN(n)) return fail(`${label} must be a number.`);
  if (n <= 0) return fail(`${label} must be greater than zero.`);
  if (n < 0.000001) return fail(`${label} too small (min 0.000001 STX).`);
  if (n > 1_000_000) return fail(`${label} exceeds maximum of 1,000,000 STX.`);
  return OK;
}

/** Validate a positive integer (circle IDs, task IDs, etc.) */
export function validatePositiveInt(value: string, label = 'Value'): ValidationResult {
  if (!value || value.trim() === '') return fail(`${label} is required.`);
  const n = parseInt(value, 10);
  if (isNaN(n) || String(n) !== value.trim()) return fail(`${label} must be a whole number.`);
  if (n <= 0) return fail(`${label} must be greater than zero.`);
  return OK;
}

/** Validate a non-empty string field */
export function validateRequired(value: string, label = 'Field'): ValidationResult {
  if (!value || value.trim() === '') return fail(`${label} is required.`);
  return OK;
}

/** Validate a string with max length */
export function validateMaxLength(value: string, max: number, label = 'Field'): ValidationResult {
  const req = validateRequired(value, label);
  if (!req.valid) return req;
  if (value.length > max) return fail(`${label} must be at most ${max} characters.`);
  return OK;
}

/** Validate a Stacks principal address */
export function validatePrincipal(value: string, label = 'Address'): ValidationResult {
  if (!value || value.trim() === '') return fail(`${label} is required.`);
  const v = value.trim();
  // Standard Stacks address: SP or ST prefix + 39 base58 chars
  if (!/^(SP|ST)[A-Z0-9]{24,39}$/.test(v)) return fail(`${label} is not a valid Stacks address.`);
  return OK;
}

/** Validate block count (ROSCA cycles, lock periods, etc.) */
export function validateBlockCount(value: string, min = 1, max = 52560, label = 'Blocks'): ValidationResult {
  const intCheck = validatePositiveInt(value, label);
  if (!intCheck.valid) return intCheck;
  const n = parseInt(value, 10);
  if (n < min) return fail(`${label} must be at least ${min} blocks.`);
  if (n > max) return fail(`${label} must be at most ${max} blocks (~${Math.round(max / 144)} days).`);
  return OK;
}

/** Validate comma-separated Stacks principals (for ROSCA payout order) */
export function validatePrincipalList(value: string, label = 'Payout order'): ValidationResult {
  if (!value || value.trim() === '') return fail(`${label} is required.`);
  const parts = value.split(',').map(s => s.trim()).filter(Boolean);
  if (parts.length < 2) return fail(`${label} must contain at least 2 addresses.`);
  if (parts.length > 20) return fail(`${label} cannot exceed 20 addresses.`);
  for (const p of parts) {
    const r = validatePrincipal(p, 'Each address');
    if (!r.valid) return r;
  }
  return OK;
}

/** Validate task title */
export function validateTaskTitle(value: string): ValidationResult {
  return validateMaxLength(value, 100, 'Title');
}

/** Validate task description */
export function validateTaskDescription(value: string): ValidationResult {
  return validateMaxLength(value, 500, 'Description');
}

/** Validate trust score threshold (0–1000) */
export function validateTrustScore(value: string, label = 'Trust score'): ValidationResult {
  const intCheck = validatePositiveInt(value, label);
  if (!intCheck.valid) return intCheck;
  const n = parseInt(value, 10);
  if (n > 1000) return fail(`${label} cannot exceed 1000.`);
  return OK;
}
