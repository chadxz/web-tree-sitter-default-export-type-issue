/**
 * web-tree-sitter CJS default export type mismatch reproduction.
 *
 * Under module: "commonjs" + esModuleInterop: true, TypeScript
 * compiles `import Parser from 'web-tree-sitter'` without error.
 * It resolves the default import as the module namespace (typeof
 * import("web-tree-sitter")), so TypeScript expects you to write
 * `Parser.Parser.init()` to access the class.
 *
 * At runtime, the CJS bundle sets __esModule: true and exposes
 * named exports (Parser, Language, etc.) but has no .default.
 * Because __esModule is true, esModuleInterop's __importDefault
 * returns module.default — which is undefined.
 *
 * Result: `Parser` is undefined at runtime, and any access throws.
 */

import Parser from 'web-tree-sitter';

// TypeScript thinks this is the module namespace.
// At runtime it's undefined.
console.log('Parser (default import):', Parser);
console.log('typeof Parser:', typeof Parser);

// TypeScript says Parser.Parser.init() is valid since it thinks
// the default import is the module namespace. At runtime, Parser
// is undefined so this throws immediately.
async function main() {
  try {
    await Parser.Parser.init();
  } catch (e) {
    console.error('Failed:', (e as Error).message);
  }
}

main();
