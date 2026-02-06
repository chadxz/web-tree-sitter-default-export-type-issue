# web-tree-sitter CJS Default Export Type Mismatch

Minimal reproduction for a type mismatch in
[`web-tree-sitter@0.26.3`](https://www.npmjs.com/package/web-tree-sitter).

## Problem

The CJS bundle (`web-tree-sitter.cjs`) sets `__esModule: true` and
exports `{ Parser, Language, ... }` as **named** exports with **no**
`.default`. However, the CJS type declarations
(`web-tree-sitter.d.cts`) use a `declare module` block with
`export class Parser` and other named exports. Under
`module: "commonjs"` + `esModuleInterop: true`, TypeScript resolves
the default import as the module namespace — but at runtime
`.default` is `undefined`.

## Environment

```jsonc
// tsconfig.json
{
  "compilerOptions": {
    "module": "commonjs",
    "moduleResolution": "node",
    "esModuleInterop": true
  }
}
```

## What Happens

### Default import

```ts
import Parser from 'web-tree-sitter';
```

- **TypeScript**: Compiles — resolves `Parser` as the module
  namespace (`typeof import("web-tree-sitter")`). To access the
  Parser class you'd write `Parser.Parser.init()`.
- **Runtime**: `Parser` is `undefined`. The CJS bundle has
  `__esModule: true` so esModuleInterop looks for `.default` —
  which doesn't exist.

### Namespace import

```ts
import * as TreeSitter from 'web-tree-sitter';
```

- **TypeScript**: Same type as default import — the module
  namespace with `.Parser`, `.Language`, etc.
- **Runtime**: This actually works — `TreeSitter.Parser` is the
  real class. But the types and runtime only align by accident.

### The core mismatch

The CJS bundle's runtime shape:

```js
Object.defineProperty(exports, "__esModule", { value: true });
exports.Parser = Parser;
exports.Language = Language;
// ...
// No exports.default!
```

Because `__esModule` is `true`, `esModuleInterop`'s
`__importDefault` helper returns `module.default` (which is
`undefined`) rather than wrapping the module.

## Recommended Fix

The `.d.cts` file should match the actual CJS module shape.
Currently:

```ts
declare module 'web-tree-sitter' {
  export class Parser { /* ... */ }
  export class Language { /* ... */ }
  // ...
  // No default export
}
```

**Option A** — Add an explicit default export so the default
import works:

```diff
  declare module 'web-tree-sitter' {
    export class Parser { /* ... */ }
    export class Language { /* ... */ }
+
+   const _default: {
+     Parser: typeof Parser;
+     Language: typeof Language;
+     // ...
+   };
+   export default _default;
  }
```

**Option B** — Add `exports.default = exports` in the CJS bundle
so the runtime matches what esModuleInterop expects.

## Workaround for Consumers

Use a namespace import instead of a default import:

```ts
import * as TreeSitter from 'web-tree-sitter';

await TreeSitter.Parser.init();
const parser = new TreeSitter.Parser();
```

Or use `require` directly:

```ts
const { Parser } = require('web-tree-sitter');
await Parser.init();
```

## Reproduction Steps

```bash
pnpm install
pnpm test        # vitest — shows .default is undefined at runtime
pnpm typecheck   # tsc — compiles clean (that's the problem)
```

The typecheck passing is part of the bug — TypeScript doesn't
warn you that the default import will be `undefined` at runtime.

---

**Note:** This repo includes `@types/emscripten` as a dev
dependency. This is unrelated to the default export issue — the
`.d.cts` references `EmscriptenModule` (in `Parser.init`'s
signature) without declaring it or listing `@types/emscripten` as
a dependency. Without it, `tsc` fails with TS2304:
`Cannot find name 'EmscriptenModule'`. This is a separate
upstream bug where the published types depend on an undeclared
ambient type.
