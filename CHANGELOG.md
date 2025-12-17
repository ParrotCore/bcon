# Changelog

All notable changes to bcon-parser will be documented in this file.

## [1.1.0] - 2025-12-17

### Added
- **ES Modules (ESM) support** - Full support for modern JavaScript imports
  - Added `index.mjs` as ESM entry point
  - Added `.mjs` versions of all parser modules (Lexer, Parser, Evaluator, Stringifier)
  - Dual package support via `package.json` exports field
  - Works with both `require()` (CommonJS) and `import` (ESM)
  
- **Improved destructuring syntax**
  - Fixed issue where `skip` keyword wasn't recognized in array destructuring
  - Fixed issue where last array element couldn't be used without trailing semicolon
  - Better detection of destructuring vs object/array literals

### Changed
- Updated README.md with ESM usage examples and module support documentation
- Improved `parseUse()` and `parseDestructuring()` to handle `SKIP` token properly
- Better error messages for destructuring patterns

### Fixed
- Parser now correctly recognizes `[skip; value]` destructuring patterns
- Fixed handling of array destructuring without trailing semicolon: `[first; second]`
- Parser.mjs import statements cleaned up (proper spacing in destructuring)

## [1.0.1] - 2025 (Previous releases)

### Added
- `skip` keyword for array destructuring
- `from`/`as` syntax differentiation
- Export keyword requirement
- Multiple bug fixes and improvements

## [1.0.0] - Initial Release

### Added
- Initial BCON parser implementation
- CommonJS support
- Basic language features
