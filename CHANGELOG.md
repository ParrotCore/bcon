# Changelog

All notable changes to bcon-parser will be documented in this file.

## [2.1.0] - 2025-12-21

### Added
- **Class System with Type Validation** 🎉
  - Define reusable schemas with `class` keyword
  - Type validation for primitive types (String, Number, Boolean, BigInt, Date, RegExp, etc.)
  - Support for nested object types and arrays
  - Optional fields with `?` operator
  - Default values with `=` operator
  - Class inheritance with `extends` keyword
  - Composition support (foundation for future `includes` keyword)
  - Automatic type checking at parse time
  - Comprehensive error messages for type mismatches, missing fields, and unknown fields
  - Deep recursive validation for nested class instances
  - Class names can be used as types in field definitions
  
- **New Lexer Tokens**
  - `CLASS` - Class definition keyword
  - `EXTENDS` - Inheritance keyword
  - `INCLUDES` - Composition keyword (reserved for future use)
  - `COLON` - Type annotation separator
  - `QUESTION` - Optional field marker
  - `EQUALS` - Default value assignment

- **Parser Enhancements**
  - `parseClass()` - Parse class declarations with fields, inheritance, and mixins
  - `parseClassField()` - Parse individual class fields with type annotations
  - `parseType()` - Parse type definitions (primitives, objects, arrays, tuples)
  - `ClassInstance` AST node type for validated class instances
  - **Loose expressions support** - Allow unused literals and expressions without errors

- **Evaluator Enhancements**
  - `registerClass()` - Register class definitions with inheritance resolution
  - `createInstance()` - Create validated class instances
  - `validateType()` - Comprehensive type validation system
  - `validateTypeReference()` - Deep recursive validation for nested class types
  - Type validators for all primitive and complex types
  - Detailed error messages with field paths

### Changed
- Parser now allows unused expressions (literals, objects, arrays) in files
  - Useful for development, debugging, and leaving temporary values
  - Similar to JavaScript's behavior with expression statements
  - Expressions are parsed and validated but not evaluated

### Tests
- 13 comprehensive class system tests
- 5 loose expressions tests
- All 68 tests passing with full coverage

### Changed
- Updated README.md with classes feature in key features list
- Enhanced overview section to highlight type validation
- Added "Classes" to table of contents

## [2.0.0] - 2025-12-17

### Changed
- **Consolidated documentation** - Merged ESM migration guide into main README.md
- **Improved Module Support section** with comparison table and examples
- **Removed separate documentation files** (ESM-MIGRATION.md, README-PL.md)
- Cleaned up unused utility files from `/util` folder

### Documentation
- Enhanced README.md with comprehensive CJS/ESM comparison
- Added migration guide section directly in README
- Better structured examples for both module systems

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
