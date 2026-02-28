import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string | null;
  hint?: string;
}

export function FormInput({ label, error, hint, id, ...rest }: FormInputProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="form-group">
      <label className="form-label" htmlFor={inputId}>{label}</label>
      <input
        id={inputId}
        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        aria-invalid={error ? 'true' : undefined}
        style={{
          borderColor: error ? 'var(--color-error)' : undefined,
        }}
        {...rest}
      />
      {hint && !error && (
        <span id={`${inputId}-hint`} className="text-muted text-sm">{hint}</span>
      )}
      {error && (
        <span id={`${inputId}-error`} role="alert" style={{ fontSize: '0.8rem', color: 'var(--color-error)' }}>
          {error}
        </span>
      )}
    </div>
  );
}

interface FormTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string | null;
  hint?: string;
}

export function FormTextarea({ label, error, hint, id, ...rest }: FormTextareaProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="form-group">
      <label className="form-label" htmlFor={inputId}>{label}</label>
      <textarea
        id={inputId}
        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        aria-invalid={error ? 'true' : undefined}
        style={{
          borderColor: error ? 'var(--color-error)' : undefined,
          resize: 'vertical',
          minHeight: '5rem',
        }}
        {...rest}
      />
      {hint && !error && (
        <span id={`${inputId}-hint`} className="text-muted text-sm">{hint}</span>
      )}
      {error && (
        <span id={`${inputId}-error`} role="alert" style={{ fontSize: '0.8rem', color: 'var(--color-error)' }}>
          {error}
        </span>
      )}
    </div>
  );
}
