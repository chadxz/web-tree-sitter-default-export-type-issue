import { describe, it, expect } from 'vitest';

describe('web-tree-sitter CJS default export type mismatch', () => {
  it('default import resolves to undefined at runtime', async () => {
    // Dynamic import to inspect the module shape at runtime
    const mod = await import('web-tree-sitter');

    // The CJS bundle sets __esModule: true but has no .default
    // property. Under esModuleInterop, Node/bundlers look for
    // .default first — and it's not there.
    expect(mod.default).toBeUndefined();
  });

  it('.Parser exists as a named export at runtime', async () => {
    const mod = await import('web-tree-sitter');

    // The actual Parser class is accessible as a named export on
    // the module namespace, but TypeScript's types don't expose it
    // this way under module: "commonjs".
    expect((mod as any).Parser).toBeDefined();
    expect(typeof (mod as any).Parser).toBe('function');
  });

  it('.Parser.init is callable at runtime', async () => {
    const mod = await import('web-tree-sitter');

    const Parser = (mod as any).Parser;
    expect(Parser).toBeDefined();
    expect(typeof Parser.init).toBe('function');
  });

  it('default import is not usable — init() throws', async () => {
    const mod = await import('web-tree-sitter');

    // This is what consumers hit: they do
    //   import Parser from 'web-tree-sitter';
    //   await Parser.init();
    // which blows up because mod.default is undefined.
    expect(() => {
      mod.default.init();
    }).toThrow();
  });
});
