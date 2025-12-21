# Changelog

All notable changes to bcon-parser will be documented in this file.

## [2.3.0] - 2025-12-21

### Added
- **Class Constructors with Parameters** 🎉
  - Define classes with constructor parameters: `class Name (param1, param2, ...paramN) [...]`
  - Instantiate with arguments: `use Name(arg1, arg2, ...args) as instance`
  - Parameters available in field default value expressions
  - Spread operator (`...`) to collect remaining arguments into arrays
  - Validation ensures constructors are called with `()` and validators with `[]`
  
- **Constructor Calls in Default Values** 🎉
  - Nested constructor calls supported in field defaults
  - Example: `@coordinates: Coordinates => coords ? Coordinates(55.7558, 37.6173)`
  - Full expression support in default values via `parseExpression()`
  
- **Constructor Calls as Arguments** 🎉
  - Pass constructor calls directly as arguments to other constructors
  - Example: `use District("Central", Coordinates(55.7558, 37.6173)) as district`
  - Enables deep object hierarchies and composition
  
- **Nullish Coalescing Operator (`?`)** 🎉
  - New operator for elegant default values
  - Syntax: `value ? default` 
  - Returns left side if it exists (not `null`/`undefined`), otherwise right side
  - Works in all value contexts including class field defaults
  
- **Spread Operator (`...`) - Enhanced** 🎉
  - **In class parameters**: collect remaining arguments into array
  - **In constructor calls**: spread array elements as individual arguments
  - **In arrays**: combine multiple arrays: `[...arr1; ...arr2; ...]`
  - **In objects**: merge multiple objects: `[...obj1; ...obj2; ...]`
  - **Dynamic type detection**: Parser uses `UnknownExpression` for spread-only structures
  - **Evaluator determines type**: Based on first spread value (array vs object)
  - Example: `use [...personalInfo; ...contactInfo;] as fullProfile`

- **New Lexer Tokens**
  - `LPAREN`, `RPAREN` - Parentheses for constructor parameters and calls
  - `COMMA` - Argument separator
  - `SPREAD` - Spread operator (`...`)

- **Parser Enhancements**
  - `parseClassParameters()` - Parse constructor parameter lists
  - `parseArguments()` - Parse constructor call arguments with spread support
  - `parseExpression()` - Parse expressions with `?` operator and constructor calls
  - `parseClassField()` - Uses `parseExpression()` for full expression support in defaults
  - `parsePrimaryValue()` - Recognizes LPAREN after identifier for constructor calls
  - `parseObject()` - Returns `UnknownExpression` when only spread operators present
  - `ConditionalExpression` AST node for `?` operator
  - `ConstructorCall` AST node for class instantiation with arguments
  
- **Evaluator Enhancements**
  - `evaluateConditionalExpression()` - Evaluate `?` operator
  - `evaluateConstructorCall()` - Instantiate classes with parameters
  - `createInstanceWithParameters()` - Create instances with constructor arguments
  - `evaluateObject()` - Dynamic type detection for `UnknownExpression`
  - Spread operator for arrays: uses `push()` to maintain order
  - Spread operator for objects: uses `Object.assign()` for merging
  - Type validation: prevents spreading arrays in objects and vice versa
  - Parameters accessible in field default value expressions
  - Proper handling of optional fields with `undefined`/`null` values

- **Class System with Type Validation**
  - Define reusable schemas with `class` keyword
  - Type validation for primitive types (String, Number, Boolean, BigInt, Date, RegExp, etc.)
  - Support for nested object types and arrays
  - Optional fields with `?` operator
  - Default values with `=>` operator
  - Class inheritance with `extends` keyword
  - Composition support
  - Automatic type checking at parse time
  - Comprehensive error messages for type mismatches, missing fields, and unknown fields
  - Deep recursive validation for nested class instances
  - Class names can be used as types in field definitions

### Changed
- **Test Suite Optimization** 📦
  - Consolidated 13+ test .bcon files into single `comprehensive.bcon`
  - Updated to Moscow city data (English) with real-world examples
  - 5 districts, 3 metro stations, 6 landmarks
  - File size: 8.4KB demonstrating all BCON features
  - Updated `performance.js` to use comprehensive.bcon (12 benchmarks)
  - Updated `comparison.js` for JSON vs BCON analysis
  
- **Test Files** 🧪
  - `tests.js` - 64 tests (main suite)
  - `test-type-validation.js` - 15 tests (type checking)
  - `test-nested-constructors.js` - 5 tests (nested constructors)
  - `test-spread-objects.js` - 6 tests (spread operator)
  - `test-constructor-arguments.js` - 7 tests (argument handling)
  - **Total: 97 tests, 100% passing** ✅
  
- **Parser Improvements**
  - `parseClassField()` now uses `parseExpression()` instead of `parseValue()`
  - `parseArgument()` uses `parseExpression()` for full expression support
  - `parsePrimaryValue()` checks LPAREN before LBRACKET
  - `parseObject()` removed array-only restriction on spread operator
  - Better error messages for missing arguments and type mismatches
  
- **Evaluator Improvements**
  - Array elements use `push()` instead of index assignment (fixes spread order)
  - `evaluateObject()` handles both `ArrayExpression`, `ObjectExpression`, and `UnknownExpression`
  - Type checking prevents misuse of spread across incompatible types

- **Documentation Updates**
  - Updated `test/README.md` with comprehensive documentation
  - Added examples for all BCON 2.3+ features
  - Removed references to deprecated test files
  - Added troubleshooting section for common issues

### Fixed
- Spread operator now correctly works in objects (not just arrays)
- Array ordering preserved when using spread operator
- `UnknownExpression` type resolved dynamically based on spread values
- Constructor calls properly recognized in all expression contexts

### Tests
- 97 comprehensive tests across 5 test files
- All tests passing with full coverage
- Real-world examples with Moscow city data
  - Class inheritance with `extends` keyword
  - Composition support (foundation for future `includes` keyword)
  - Automatic type checking at parse time
  - Comprehensive error messages for type mismatches, missing fields, and unknown fields
  - Deep recursive validation for nested class instances
  - Class names can be used as types in field definitions

### Changed
- Parser now uses only `=>` for field default values in class definitions (both constructors and validators)
- Removed support for `=` in class field definitions for consistency with dictionary and validator syntax
- Optional fields with `undefined` values are properly skipped during validation
- Parser allows unused expressions (literals, objects, arrays) in files
  - Useful for development, debugging, and leaving temporary values
  - Similar to JavaScript's behavior with expression statements
  - Expressions are parsed and validated but not evaluated

### Tests
- 97 comprehensive tests across 5 test files
- All tests passing with full coverage
- Real-world examples with Moscow city data

### Removed
- 3 debug files (debug-*.js)
- 2 deprecated test files (demo-constructors.js, test-constructors.js)
- 13 old .bcon test files (consolidated into comprehensive.bcon)
- OPTIMIZATION_SUMMARY.md documentation file

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
