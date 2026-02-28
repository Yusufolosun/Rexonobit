# useAccordion

**Location:** `frontend/src/hooks/useAccordion.ts`

Manages open/closed state for accordion or collapsible panel groups. Supports single-open (default) and multi-open modes.

---

## Signature

```ts
function useAccordion(options?: UseAccordionOptions): UseAccordionReturn
```

---

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `multi` | `boolean` | `false` | Allow multiple panels open simultaneously |
| `defaultOpen` | `number \| number[]` | `undefined` | Initially open panel index/indices |

---

## Return Value

| Field | Type | Description |
|-------|------|-------------|
| `openPanels` | `Set<number>` | Set of currently open panel indices |
| `isOpen` | `(index: number) => boolean` | Check if a panel is open |
| `toggle` | `(index: number) => void` | Toggle a panel |
| `open` | `(index: number) => void` | Open a panel |
| `close` | `(index: number) => void` | Close a panel |
| `closeAll` | `() => void` | Close all panels |

---

## Usage

### Single-open FAQ accordion

```tsx
import { useAccordion } from "@/hooks/useAccordion";

const items = ["What is ROSCA?", "How is my score calculated?", "How do I repay?"];

function FAQ() {
  const { isOpen, toggle } = useAccordion({ defaultOpen: 0 });

  return (
    <dl>
      {items.map((q, i) => (
        <div key={i}>
          <dt>
            <button
              onClick={() => toggle(i)}
              aria-expanded={isOpen(i)}
              aria-controls={`faq-answer-${i}`}
            >
              {q}
            </button>
          </dt>
          <dd id={`faq-answer-${i}`} hidden={!isOpen(i)}>
            Answer for: {q}
          </dd>
        </div>
      ))}
    </dl>
  );
}
```

### Multi-open settings panels

```tsx
const { isOpen, toggle } = useAccordion({ multi: true, defaultOpen: [0, 2] });
```

---

## Accessibility

Pair with `aria-expanded` on trigger buttons and `aria-controls` pointing to the content panel ID for full accordion accessibility (WAI-ARIA Accordion pattern).

---

## Dependencies

- React 18 (`useCallback`, `useState`)
- No external packages
