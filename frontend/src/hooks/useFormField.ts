/**
 * @module useFormField
 * @description Controlled input hook with integrated validation.
 * Provides value, onChange, onBlur, error state, and a validate() trigger.
 * Pair with FormInput component for consistent form UX.
 */
import { useState, useCallback, ChangeEvent } from 'react';
import type { ValidationResult } from '../lib/validators';

export type ValidateFn = (value: string) => ValidationResult;

export interface FormField {
  value: string;
  error: string | null;
  touched: boolean;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onBlur: () => void;
  reset: () => void;
  set: (v: string) => void;
  validate: () => boolean;
}

export function useFormField(initial = '', validateFn?: ValidateFn): FormField {
  const [value, setValue] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const runValidation = useCallback((v: string): boolean => {
    if (!validateFn) return true;
    const result = validateFn(v);
    setError(result.valid ? null : result.error);
    return result.valid;
  }, [validateFn]);

  const onChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const v = e.target.value;
    setValue(v);
    if (touched) runValidation(v);
  }, [touched, runValidation]);

  const onBlur = useCallback(() => {
    setTouched(true);
    runValidation(value);
  }, [value, runValidation]);

  const reset = useCallback(() => {
    setValue(initial);
    setError(null);
    setTouched(false);
  }, [initial]);

  const set = useCallback((v: string) => {
    setValue(v);
  }, []);

  const validate = useCallback(() => {
    setTouched(true);
    return runValidation(value);
  }, [value, runValidation]);

  return { value, error, touched, onChange, onBlur, reset, set, validate };
}
