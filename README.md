# Flow Builder

A Vue 3 flow chart editor for conversation automations. It loads a flow from a JSON payload, draws it on a Vue Flow canvas, and lets you create, edit, move and delete nodes. Each node has a details drawer you can open from its URL.

![stack](https://img.shields.io/badge/Vue-3.5-42b883) ![ts](https://img.shields.io/badge/TypeScript-strict-3178c6) ![tests](https://img.shields.io/badge/tests-vitest-6E9F18)

---

## Quick start

Requirements: **Node.js ≥ 20.19** (22 recommended, see `.nvmrc`).

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # run the unit and component test suite once
npm run test:watch # run the tests in watch mode
npm run typecheck  # strict type-check of app, tests and config (vue-tsc)
npm run build      # type-check, then production build into dist/
npm run preview    # serve the production build
```

---

## Features

| Requirement | Where |
| --- | --- |
| Show the nodes from the payload JSON with Vue Flow | `components/flow/FlowCanvas.vue` |
| Drag nodes around the canvas (multi-select drag, snap to 4px) | `FlowCanvas.vue` → `store.moveNodes` |
| **Create New Node** button: Title, Description, Type (Send Message / Add Comments / Business Hours), plus an optional "Connect after" parent | `components/create/CreateNodeDialog.vue` |
| Node card shows an icon, the title and a truncated description | `components/flow/nodes/FlowNode.vue` |
| Details drawer opens from the URL (`/nodes/:nodeId`) and toggles when you click the node | `router/index.ts`, `components/drawer/NodeDetailsDrawer.vue` |
| Title and description can be edited; nodes can be deleted (with a confirmation) | `components/drawer/NodeDetailsPanel.vue` |
| **Send Message**: attachment tiles, image upload, and text messages you can add, edit or remove | `components/drawer/SendMessageFields.vue` |
| **Add Comments**: edit or remove the comment | `components/drawer/AddCommentFields.vue` |
| **Business Hours**: see and edit the hours for each day with a custom time picker; set the time zone; mark days as closed | `components/drawer/BusinessHoursFields.vue`, `components/common/TimePicker.vue` |
| Success / Failure branches are shown on the canvas only: you can't click them or open them by URL | `utils/flow.ts#isNodeInteractive`, drawer route guard |
| TanStack Query for fetching data and for mutations, using the required config | `lib/queryClient.ts`, `composables/useFlowQuery.ts`, `composables/useNodeMutations.ts` |
| Pinia for state, Vue Router for routing | `stores/flow.ts`, `router/index.ts` |
| UI built from shadcn-vue components (reka-ui + Tailwind v4 + CVA) | `components/ui/*` |

---

## Project structure

```
src/
├── api/flowApi.ts            # fetch payload (remote → bundled fallback) + simulated writes
├── components/
│   ├── common/               # TimePicker, FieldError, AppToaster
│   ├── create/               # CreateNodeDialog
│   ├── drawer/               # Drawer shell (route), panel, per-type field editors
│   ├── flow/                 # Canvas, toolbar, custom node components
│   └── ui/                   # shadcn-vue components (button, input, dialog, popover…)
├── composables/              # useFlowQuery, useNodeMutations, useHotkeys, useToast
├── constants/                # node types, limits, layout geometry, kind → icon/colour
├── lib/                      # cn() helper, QueryClient config
├── router/                   # routes (canvas + nested drawer route)
├── types/flow.ts             # domain types: payload, nodes, patches, form input
├── stores/flow.ts            # Pinia store: nodes, positions, undo/redo history
├── utils/                    # pure logic: flow, layout, draft, validation, time, canvas, file
└── views/FlowView.vue        # page: toolbar + canvas + drawer outlet + create dialog
tests/
├── unit/                     # utils, store, api, query config, mutations, hotkeys
└── components/               # node cards, drawer panel/route, dialog, field editors, time picker
```

---

## Design decisions

### Data flow: Query for server state, Pinia for the working document

```
          fetch (useQuery)                     hydrate once
S3 JSON ───────────────────► Query cache ─────────────────────► Pinia store ──► Canvas / Drawer
                                  ▲                                  │
                                  └──── setQueryData on success ─────┘
                                             (useNodeMutations)
```

- **TanStack Query** owns server state. With `staleTime: Infinity` the payload is fetched once, and after that only our own mutations change the cache.
- **Pinia** (`stores/flow.ts`) owns the *working document*: node records, canvas positions and the undo/redo history. Canvas positions are layout state, not server data, which is one reason the document lives in Pinia rather than only in the Query cache.
- **Mutations** update the store optimistically in `onMutate`, so the UI responds instantly. They then call the API, roll the store back if the call fails (and show a toast), and write the store into the Query cache when it succeeds. That way the cache and the store always agree.
- **Writes are simulated.** The payload sits in a read-only S3 bucket, so `flowApi.createNodes/updateNode/deleteNode` resolve after about 250 ms with the saved entity, the way a REST endpoint would. To use a real backend, replace these three functions; the hooks don't need to change. One result: a page reload fetches the original payload again.
- **Fallback payload.** If the S3 URL can't be reached (offline, CORS, a corporate proxy), the app loads the copy bundled at `public/payload.json`, so the editor still works.

### TypeScript

The whole app is written in **strict TypeScript** (`<script setup lang="ts">` in every SFC, `.ts` everywhere else, tests included).

- `src/types/flow.ts` models the payload as a **discriminated union** on `type` (`trigger`, `sendMessage`, `addComment`, `dateTime`, `dateTimeConnector`), so narrowing on `node.type` gives the correct `data` shape. Type guards such as `isConnector` / `isBusinessHours` live in `utils/flow.ts`.
- Drawer drafts are a second union keyed on `kind` (`utils/draft.ts`), so each field editor receives exactly the shape it edits.
- Components use type-based `defineProps<…>()`, `defineEmits<…>()` and `defineModel<…>()`; Vue Flow custom nodes are rendered through typed slots with `FlowCardData` / `ConnectorPillData`.
- `vue-tsc -b` checks three projects: the app (`tsconfig.app.json`), the tests (`tsconfig.vitest.json`) and the Vite config (`tsconfig.node.json`). `strict`, `noUnusedLocals`, `noUnusedParameters` and `noUncheckedIndexedAccess` are on.
- TypeScript is pinned to **6.0.x**: TypeScript 7 (the native port) does not yet ship the JavaScript API that `vue-tsc` needs.

### Normalisation

Vue Flow needs string ids, so every id and `parentId` is converted to a string, and the root marker `-1` becomes `null` (`utils/flow.ts#normalizePayload`). The payload has no description field. User-entered descriptions are stored in `data.description`; when a node has none, the card shows a summary built from its data: the message text, the comment, or "Business Hours - UTC".

### Routing and the drawer

The drawer is a **nested child route** (`/nodes/:nodeId`) of the canvas page. Moving between `/` and `/nodes/:id` therefore never remounts the canvas. Only the drawer slides in or out, using a transform-only CSS transition. When you switch from one node to another, the drawer stays open and its contents crossfade. If the active node is hidden or covered by the drawer, the canvas pans to it with `setCenter({ duration: 450 })`, offset by the drawer's width. An unknown id or a connector id redirects to `/` and shows a toast.

### Editing model

The drawer edits a **local draft** (`utils/draft.ts`) instead of the store directly:

- Validation runs on the draft. The **Save** button stays disabled until the draft has changed and is valid.
- Each save is **one undo step**, not one step per keystroke.
- **Reset** discards your changes.
- If the stored node changes underneath (for example after an undo), the draft reloads from it.

### Layout

`utils/layout.ts` is a small custom tidy-tree layout: it measures the width of each subtree, then centres each parent above its children. It handles orphaned nodes and cycles. A new node goes under its chosen parent, to the right of any siblings; a new Business Hours node gets its own Success and Failure connectors placed beneath it. The **Tidy layout** toolbar button re-runs the full layout, and you can undo it.

### Deleting nodes

When you delete a node, its children are **re-attached to the deleted node's parent**, so the rest of the flow stays intact. Deleting a Business Hours node also deletes its two connectors. The trigger can't be deleted.

### Render performance

- `FlowCanvas` **memoises the Vue Flow node object for each record**. If a node's record, position and active flag haven't changed, it reuses the same object, so Vue Flow and the node components skip work.
- Node components get small, primitive `data` (title, summary, kind, active). Icon components are marked with `markRaw`, so Vue never makes them reactive.
- Animations only change `transform` and `opacity`, so the GPU handles them. `prefers-reduced-motion` is respected.

### Validation rules (`utils/validation.ts`)

| Field | Rule |
| --- | --- |
| Title | required, 2–60 characters |
| Description | optional, ≤ 200 characters |
| Type | must be one of the three creatable types |
| Message text | can't be empty (remove it instead), ≤ 1000 characters; a message needs at least one text or attachment |
| Comment | ≤ 500 characters (empty means removed) |
| Business hours | valid `HH:mm`; end time after start time for each open day; valid IANA time zone |
| Attachment | PNG/JPG/GIF/WEBP/SVG/PDF, ≤ 5 MB, at most 10 per node |

### UI kit

The `components/ui` folder follows the shadcn-vue conventions: copied-in components built on **reka-ui**, styled with **Tailwind CSS v4** and `class-variance-authority`, plus a `cn()` helper. Fields that hold a fixed list of values use the shadcn *native select*, which is accessible and easy to test.

---

## Testing

`npm test` runs **Vitest** with jsdom and `@vue/test-utils`. The suite has over 100 tests:

- **Pure logic**: normalisation, summaries, edges, node factories, delete re-parenting, layout (no overlaps, branch ordering, cycles), validators, time helpers, draft round-trips, canvas helpers, hotkeys.
- **Store**: hydrate, add, update, remove, move, undo/redo, rollback, relayout.
- **Data layer**: the API fallback path, simulated writes, the required QueryClient config, and mutations (optimistic update, cache sync, rollback on error).
- **Components**: node cards, the time picker, each field editor (including file-upload validation), the details panel (dirty tracking, validation, reset, delete confirmation, reloading after undo), the create dialog, and the drawer route (URL access, redirects for connectors and unknown ids, saving through mutations).

---
