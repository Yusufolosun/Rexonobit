# PaginationBar

**Location:** `frontend/src/components/PaginationBar.tsx`

Renders previous/next buttons and numbered page controls with ellipsis windowing for large page counts.

---

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `page` | `number` | *(required)* | Current 1-based page |
| `totalPages` | `number` | *(required)* | Total page count |
| `onPageChange` | `(page: number) => void` | *(required)* | Called with new page when user navigates |
| `windowSize` | `number` | `5` | How many page links to show in the middle |
| `className` | `string` | `""` | Extra CSS class names on the `<nav>` element |

---

## Usage

```tsx
import PaginationBar from "@/components/PaginationBar";
import { useState } from "react";

function TxHistoryPage() {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(txCount / PAGE_SIZE);

  return (
    <>
      <TxHistoryTable page={page} />
      <PaginationBar
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </>
  );
}
```

---

## Behavior

- Returns `null` when `totalPages ≤ 1`.
- Generates an ellipsis-bounded window of page links around the active page.
- The active page button shows `aria-current="page"`.
- Previous/next buttons are disabled (opacity reduced) at the boundaries.

---

## Page-list algorithm

```
[1]  …  [start … end]  …  [N]
```

The window clips to the valid range and omits leading/trailing ellipsis when the window is adjacent to the first or last page.

---

## Accessibility

- Root element is `<nav aria-label="Pagination" role="navigation">`.
- Each page button has `aria-label="Page N"`.
- Active page has `aria-current="page"`.
- Ellipsis spans are `aria-hidden="true"`.

---

## Styling

The component uses inline styles for portability. Add `.pagination-bar` overrides via your global CSS to customize appearance.

---

## Dependencies

- React 18
- No external dependencies
