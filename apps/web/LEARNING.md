# Learning Notes — Next.js Web App

Things I learned and concepts I should understand after building this app.

---

## Next.js App Router

### File-based routing

Every folder with a `page.tsx` inside `app/` becomes a route:

```
app/
  dsa/
    page.tsx              → /dsa
    problems/
      page.tsx            → /dsa/problems
      [id]/
        page.tsx          → /dsa/problems/:id   (dynamic segment)
```

`[id]` is a dynamic segment — the folder name in brackets becomes a URL parameter.

### `'use client'` vs Server Components

By default, every component in the App Router is a **Server Component** — it runs on the server only, can't use hooks or browser APIs.

Add `'use client'` at the top to make it a **Client Component** — it runs in the browser and can use `useState`, `useEffect`, event handlers, etc.

```tsx
'use client';   // needs this to use hooks

import { useState } from 'react';
```

**Rule of thumb**: only add `'use client'` when you actually need interactivity. Static pages (like a problem description with no state) can stay as server components.

### Dynamic imports with `next/dynamic`

For heavy browser-only libraries (like Monaco Editor), use `dynamic()` to avoid SSR errors and reduce the initial bundle:

```tsx
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,         // don't try to render on the server
  loading: () => <Spinner />,  // show while the chunk loads
});
```

Without `ssr: false`, Monaco throws because it accesses `window` — which doesn't exist during server-side rendering.

### `useParams()`

In a dynamic route page (`[id]/page.tsx`), get the URL segments with `useParams()`:

```tsx
const { id } = useParams<{ id: string }>();
// url: /dsa/problems/two-sum → id = "two-sum"
```

---

## Packages Used

### `@monaco-editor/react`

The code editor used in the DSA problem page. Monaco is the same editor that powers VS Code.

Key props:
```tsx
<MonacoEditor
  height="100%"
  language="python"        // syntax highlighting language
  theme="vs-dark"          // VS Code dark theme
  value={code}             // controlled value
  onChange={(v) => setCode(v ?? '')}
  options={{
    fontSize: 13,
    minimap: { enabled: false },
    fontFamily: 'JetBrains Mono, monospace',
  }}
/>
```

`value` + `onChange` = controlled component (React state owns the code).

### `react-resizable-panels`

Lets users drag to resize panels (like a real IDE). Used in the problem page layout.

```tsx
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';

<PanelGroup orientation="horizontal">
  <Panel defaultSize="50%" minSize="30%">Left content</Panel>
  <PanelResizeHandle />   {/* the draggable divider */}
  <Panel defaultSize="50%">Right content</Panel>
</PanelGroup>
```

- `orientation` can be `"horizontal"` (side-by-side) or `"vertical"` (top-bottom)
- `defaultSize` is a percentage; `minSize` prevents panels from collapsing too far

### `@clerk/nextjs`

Clerk handles auth (sign in, sign up, session management). Key hooks and components:

```tsx
import { useAuth } from '@clerk/nextjs';
const { userId } = useAuth();  // null if not signed in

import { useUser } from '@clerk/nextjs';
const { user } = useUser();    // full user object

// In layouts: wrap with <ClerkProvider>
// Protect pages: use (auth) route group or middleware
```

The gateway's `ClerkGuard` validates the JWT that Clerk issues in the browser.

### `lucide-react`

Icon library — clean, consistent SVG icons:

```tsx
import { ChevronLeft, Play, CheckCircle } from 'lucide-react';
<Play size={13} className="text-white" />
```

Each icon is a React component. `size` sets width/height. Style with Tailwind or `className`/`style`.

---

## Patterns Used

### Importing JSON directly

Next.js (with `resolveJsonModule: true` in tsconfig) lets you import JSON files as modules — no `fetch` needed:

```tsx
import problemsData from '../../../../data/problems.json';
const problems = problemsData as Problem[];
```

This is bundled at build time — good for static data that rarely changes. For live data, use `fetch` instead.

### Building a lookup map from an array

When you need fast O(1) access to items by key (instead of O(n) `Array.find()`):

```tsx
const PROBLEMS_BY_SLUG = Object.fromEntries(
  problems.map((p) => [p.slug, p])
);

// Later:
const problem = PROBLEMS_BY_SLUG[id];  // instant lookup
```

This pattern is common when you load a list but need to look up individual items by ID/slug.

### Dynamic topic filtering with `useMemo`

Deriving unique values from data, computed only once:

```tsx
const topics = useMemo(() => {
  const unique = Array.from(new Set(PROBLEMS.map((p) => p.topic))).sort();
  return ['All', ...unique];
}, []);  // empty deps = compute once
```

`useMemo` caches the result. Without it, this runs on every render (fine for small arrays, wasteful for 154 items).

### Controlled Monaco editor

The editor is a controlled component — React state is the source of truth for the code:

```tsx
const [code, setCode] = useState(problem?.starterCode ?? '');

<MonacoEditor
  value={code}
  onChange={(v) => setCode(v ?? '')}
/>
```

When a user selects a different problem, `problem.starterCode` changes. To reset the editor, update `code` state:

```tsx
useEffect(() => {
  setCode(problem?.starterCode ?? '');
}, [problem?.slug]);  // re-run when the problem changes
```

> ⚠️ This `useEffect` isn't in the codebase yet — if you add problem switching without a page navigation, you'll need it.

---

## Things To Watch / Follow Up

| Topic | What to understand |
|-------|-------------------|
| Server Components vs Client Components | When should something be `'use client'`? What are the performance implications? |
| Next.js data fetching | `fetch` in server components, `use()`, SWR, React Query — which is right for what? |
| Monaco `language="python"` | Monaco does syntax highlighting but NOT Python execution. Judge0 is needed for actual running. |
| `JSON.stringify` for testCase inputs | Currently serializes test inputs as JSON strings for display. When Judge0 is integrated, the format will need to match what Judge0 expects. |
| `data/problems.json` duplication | The same data lives in `apps/gateway/prisma/problems.json` and `apps/web/data/problems.json`. Seed the DB and fetch from the API to eliminate this drift. |
