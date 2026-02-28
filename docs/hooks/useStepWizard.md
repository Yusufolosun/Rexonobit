# useStepWizard

**Location:** `frontend/src/hooks/useStepWizard.ts`

Manages multi-step wizard/form state: step index, nav actions, and derived progress. Designed for flows like circle creation, loan application, or onboarding.

---

## Signature

```ts
function useStepWizard(options: UseStepWizardOptions): UseStepWizardReturn
```

---

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `totalSteps` | `number` | *(required)* | Total step count (must be ≥ 1) |
| `initialStep` | `number` | `1` | Starting step (1-based) |

---

## Return Value

| Field | Type | Description |
|-------|------|-------------|
| `step` | `number` | Current step (1-based) |
| `totalSteps` | `number` | Total step count |
| `isFirst` | `boolean` | `true` when on step 1 |
| `isLast` | `boolean` | `true` when on the last step |
| `progress` | `number` | `0–1` ratio of progress |
| `next` | `() => void` | Advance one step |
| `back` | `() => void` | Go back one step |
| `goTo` | `(step: number) => void` | Jump to a specific step |
| `reset` | `() => void` | Reset to `initialStep` |

---

## Usage

### Circle creation wizard (4 steps)

```tsx
import { useStepWizard } from "@/hooks/useStepWizard";

function CreateCircleWizard() {
  const { step, next, back, isFirst, isLast, progress } = useStepWizard({
    totalSteps: 4,
  });

  return (
    <div>
      <ProgressBar value={progress} />

      {step === 1 && <CircleDetailsForm />}
      {step === 2 && <ContributionForm />}
      {step === 3 && <MemberInviteForm />}
      {step === 4 && <ReviewAndSubmit />}

      <div>
        {!isFirst && <button onClick={back}>Back</button>}
        {!isLast && <button onClick={next}>Next</button>}
        {isLast && <button onClick={handleSubmit}>Create Circle</button>}
      </div>
    </div>
  );
}
```

### With `goTo` for non-linear navigation

```tsx
const { goTo, step } = useStepWizard({ totalSteps: 5 });

// Skip to the review step
<button onClick={() => goTo(5)}>Review Now</button>
```

---

## `progress` Values

| Step | `totalSteps = 4` | Progress |
|------|-----------------|----------|
| 1 | 4 | `0.00` |
| 2 | 4 | `0.33` |
| 3 | 4 | `0.67` |
| 4 | 4 | `1.00` |

---

## Error Handling

- `goTo(n)` throws `RangeError` if `n < 1` or `n > totalSteps`.
- `next()` and `back()` clamp silently.

---

## Dependencies

- React 18 (`useCallback`, `useState`)
- No external packages
