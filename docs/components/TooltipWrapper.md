# TooltipWrapper

**Location:** `frontend/src/components/TooltipWrapper.tsx`

Wraps any inline element to show an accessible CSS-powered tooltip on hover and keyboard focus-within.

---

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `content` | `string` | *(required)* | Tooltip text |
| `children` | `ReactNode` | *(required)* | Trigger element(s) |
| `placement` | `"top" \| "bottom" \| "left" \| "right"` | `"top"` | Preferred tooltip direction |
| `disabled` | `boolean` | `false` | Suppresses tooltip rendering entirely |
| `className` | `string` | `""` | Extra class on the wrapper `<span>` |

---

## Usage

```tsx
import TooltipWrapper from "@/components/TooltipWrapper";

<TooltipWrapper content="Copy wallet address" placement="top">
  <button onClick={handleCopy}>Copy</button>
</TooltipWrapper>

<TooltipWrapper content="Trust score: 850 / 1000" placement="right">
  <span className="badge-primary">Platinum</span>
</TooltipWrapper>
```

---

## Accessibility

- Uses `aria-describedby` to associate the tooltip text with the trigger element.
- The tooltip element has `role="tooltip"`.
- The tooltip is shown on CSS `:hover` and `:focus-within` via the `.tooltip-wrapper` class defined in `index.css`.

---

## CSS Dependencies

The tooltip visibility uses these CSS rules (already in `frontend/src/index.css`):

```css
.tooltip-wrapper:hover .tooltip,
.tooltip-wrapper:focus-within .tooltip { opacity: 1; }
```

---

## Theming

| CSS Variable | Default | Description |
|---|---|---|
| `--tooltip-bg` | `#1e1e2e` | Background color |
| `--tooltip-fg` | `#ffffff` | Text color |

---

## Dependencies

- React 18 (`useId` for unique IDs)
- CSS tooltip classes in `index.css`
