import { createRequire } from 'module';
import { describe, it, expect } from 'vitest';

/**
 * Load the CJS bundle directly via createRequire to test the
 * actual CommonJS runtime behavior. Vitest's ESM transform would
 * otherwise mask the missing .default property.
 */
const require = createRequire(import.meta.url);

function loadCjsBundle(): Record<string, unknown> {
  const resolved = require.resolve('web-tree-sitter');
  delete require.cache[resolved];
  return require(resolved);
}

describe('web-tree-sitter CJS default export', () => {
  it('.default is defined and points to the module namespace', () => {
    const mod = loadCjsBundle();

    expect(mod.default).toBeDefined();
    expect(mod.default).toBe(mod);
  });

  it('.default.Parser is the Parser class', () => {
    const mod = loadCjsBundle();
    const def = mod.default as Record<string, unknown>;

    expect(typeof def.Parser).toBe('function');
    expect(def.Parser).toBe(mod.Parser);
  });

  it('.default.Language is the Language class', () => {
    const mod = loadCjsBundle();
    const def = mod.default as Record<string, unknown>;

    expect(typeof def.Language).toBe('function');
    expect(def.Language).toBe(mod.Language);
  });

  it('esModuleInterop __importDefault returns usable object', () => {
    const mod = loadCjsBundle();

    // Simulate what __importDefault does at runtime:
    // if __esModule is set, return mod.default
    const imported = mod.__esModule
      ? (mod.default as Record<string, unknown>)
      : { default: mod };

    expect(imported).toBeDefined();
    expect(typeof imported.Parser).toBe('function');
    expect(typeof imported.Language).toBe('function');
  });
});
