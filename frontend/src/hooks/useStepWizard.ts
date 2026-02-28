import { useCallback, useState } from "react";

interface UseStepWizardOptions {
  /** Total number of steps in the wizard (1-based). */
  totalSteps: number;
  /** Initial step index (1-based). Defaults to 1. */
  initialStep?: number;
}

interface UseStepWizardReturn {
  /** Current step (1-based). */
  step: number;
  /** Total number of steps. */
  totalSteps: number;
  /** Whether the current step is the first. */
  isFirst: boolean;
  /** Whether the current step is the last. */
  isLast: boolean;
  /** Progress as a 0-1 ratio. */
  progress: number;
  /** Advance to the next step (no-op on last step). */
  next: () => void;
  /** Go back to the previous step (no-op on first step). */
  back: () => void;
  /** Jump directly to a specific step. Throws if out of range. */
  goTo: (step: number) => void;
  /** Reset to initial step. */
  reset: () => void;
}

/**
 * useStepWizard
 *
 * Manages multi-step wizard state (step index, navigation, progress).
 * Useful for multi-page forms like circle creation or loan application.
 *
 * @example
 * const { step, next, back, isLast, progress } = useStepWizard({ totalSteps: 4 });
 */
export function useStepWizard({
  totalSteps,
  initialStep = 1,
}: UseStepWizardOptions): UseStepWizardReturn {
  if (totalSteps < 1) throw new RangeError("useStepWizard: totalSteps must be ≥ 1");

  const clamp = useCallback((n: number) => Math.min(Math.max(n, 1), totalSteps), [totalSteps]);

  const [step, setStep] = useState<number>(() => clamp(initialStep));

  const next = useCallback(() => setStep((s) => clamp(s + 1)), [clamp]);
  const back = useCallback(() => setStep((s) => clamp(s - 1)), [clamp]);
  const goTo = useCallback(
    (target: number) => {
      if (target < 1 || target > totalSteps) {
        throw new RangeError(`useStepWizard: step ${target} is out of range [1, ${totalSteps}]`);
      }
      setStep(target);
    },
    [totalSteps]
  );
  const reset = useCallback(() => setStep(clamp(initialStep)), [clamp, initialStep]);

  return {
    step,
    totalSteps,
    isFirst: step === 1,
    isLast: step === totalSteps,
    progress: totalSteps === 1 ? 1 : (step - 1) / (totalSteps - 1),
    next,
    back,
    goTo,
    reset,
  };
}
