# BCON Test Suite

Complete test suite for the BCON parser with unit tests, performance benchmarks, and comparisons.

## 🚀 Quick Start

### Run All Tests

```bash
npm test
# or
node test/tests.js
node test/test-type-validation.js
node test/test-nested-constructors.js
node test/test-spread-objects.js
```

### Run Performance Benchmark

```bash
node test/performance.js
```

### Run JSON Comparison

```bash
node test/comparison.js
```

## 📋 Test Files Overview

### `tests.js` - Main Unit Test Suite
**64 comprehensive tests** covering all BCON features:
- Basic data types (primitives, dates, regex, BigInt)
- Variables and references (use/as, Main, This)
- Objects and arrays (dictionaries, nested structures)
- String interpolation
- Destructuring (objects and arrays)
- Classes (validators and constructors)
- Type validation system
- Operators (?, ...)
- Inheritance (extends)
- Comments and exports
- Error handling
- Import comprehensive.bcon file

### `test-type-validation.js` - Type System Tests
**15 tests** validating type checking:
- Validators (classes without parameters)
- Constructors (classes with parameters)
- Nested objects and structures
- Arrays with typed elements
- Optional fields
- Type mismatch detection
- Nullish coalescing operator with types

### `test-nested-constructors.js` - Nested Constructor Tests
**5 tests** for advanced constructor features (BCON 2.2+):
- Constructor calls in default values
- Constructor calls as arguments
- Validators as default values
- Spread operator in arrays
- Deep nested constructor hierarchies

### `test-spread-objects.js` - Spread Operator Tests
**6 tests** for spread operator functionality (BCON 2.2+):
- Spread in objects (merging multiple objects)
- Spread in arrays (combining arrays)
- Key overwriting behavior
- Type validation (array vs object spread)
- Error handling for mismatched types

### `performance.js` - Performance Benchmark
**12 benchmark tests** measuring parsing and stringification speed:
- Simple operations (strings, objects, arrays)
- Complex file parsing (comprehensive.bcon with all features)
- Constructors with parameters
- Nullish coalescing operator (?)
- Spread operator (...)
- String interpolation
- Round-trip operations
- Throughput metrics (ops/sec)

### `comparison.js` - JSON vs BCON Comparison
Performance and feature comparison:
- File size comparison
- Parsing speed (JSON vs BCON)
- Stringification speed
- Feature advantages listing
- Real-world configuration file analysis
- Performance verdict and recommendations

## 📁 Test Data

### `data/comprehensive.bcon` - All-in-One Demo File
**Comprehensive example** demonstrating ALL BCON features (8.4KB):
- **Moscow City Data** - Real-world city information in English
- All data types (primitives, dates, regex, BigInt)
- Classes (validators and constructors with parameters)
- Operator `?` (nullish coalescing in defaults and arguments)
- Spread operator (`...` for both arrays and objects)
- Inheritance (extends)
- String interpolation
- Type validation system
- Constructor calls in default values
- Constructor calls as arguments
- Nested structures and deep hierarchies
- Arrays and collections
- Comments and documentation

**Key Features Demonstrated:**
- `District` class with nested `Coordinates` constructor in defaults
- `MetroStation` class with spread operator for variable arguments
- Spread operator for combining arrays: `[...arr1; ...arr2; ...]`
- Spread operator for merging objects: `[...obj1; ...obj2; ...]`
- `HistoricalSite` extending `Location` class
- Real Moscow data: 5 districts, 3 metro stations, 5 landmarks

This single file replaces 13+ previous test files and serves as:
- Performance benchmark reference
- Feature demonstration
- Integration test target
- Documentation by example
- Real-world use case

## 🧪 Test Summary

**Total: 90 tests** across 4 test files

| File | Tests | Focus |
|------|-------|-------|
| `tests.js` | 64 | Main features, parsing, stringification |
| `test-type-validation.js` | 15 | Type checking, validation |
| `test-nested-constructors.js` | 5 | Advanced constructors (BCON 2.2+) |
| `test-spread-objects.js` | 6 | Spread operator (BCON 2.2+) |

### BCON 2.2 New Features

#### ✨ Constructor Calls in Default Values
```bcon
class District (name, coords) [
    @name: String => name;
    @coordinates: Coordinates => coords ? Coordinates(55.7558, 37.6173);
];
```

#### ✨ Constructor Calls as Arguments
```bcon
use District("Central", Coordinates(55.7558, 37.6173)) as centralDistrict;
```

#### ✨ Spread Operator for Arrays
```bcon
use [@* => "a"; @* => "b";] as arr1;
use [@* => "c"; @* => "d";] as arr2;
use [...arr1; ...arr2;] as combined;  # ["a", "b", "c", "d"]
```

#### ✨ Spread Operator for Objects
```bcon
use [@name => "John";] as personal;
use [@email => "john@example.com";] as contact;
use [...personal; ...contact;] as full;  # {name: "John", email: "john@..."}
```

#### ✨ Variable Arguments with Spread
```bcon
class MetroStation (name, ...lines) [
    @name: String => name;
    @lines: [String] => lines;
];

use MetroStation("Station", "Line 1", "Line 2", "Line 3") as station;
```

## 🧪 Test Categories (tests.js)

### 📦 Basic Data Types (15 tests)
Tests for all primitive and built-in data types:
- Strings with interpolation
- Numbers (integer, float, scientific notation)
- Hex, Octal, Binary numbers
- Boolean values (True/False)
- Special values (Null, Undefined, NaN, Infinity)
- BigInt
- Regular Expressions

### 🔧 Variables (3 tests)
- Simple variable declarations
- Variables with different types
- Multiple variable usage

### 📚 Dictionaries/Objects (2 tests)
- Simple object structures
- Nested object structures

### 📋 Arrays (3 tests)
- Simple arrays
- Dot notation access (`items.0`, `items.1`, `items.2`)
- Arrays of objects

### 🔤 String Interpolation (3 tests)
- Interpolation with variables
- Interpolation with `This` reference
- Interpolation with `Main` reference

### 🔗 References (3 tests)
- Dot notation for nested properties
- `Main` object reference
- `This` object reference

### 🎯 Destructuring (4 tests)
- Dictionary destructuring
- Destructuring with aliases
- Array destructuring
- `skip` keyword usage

### 📥 Import Tests (2 tests)
- Import comprehensive.bcon with require
- Complete comprehensive config parsing (Moscow city data)

### 💬 Comments (2 tests)
- Single-line comments (`#`)
- Multi-line comments (`'...'`)

### 📤 Stringify (6 tests)
- Stringify objects
- Stringify arrays
- Stringify boolean values
- Stringify null values
- Stringify nested structures
- Round-trip: parse → stringify → parse

### 🏗️ Classes (13 tests)
- Basic class definition
- Optional fields
- Default values
- Type validation (with expected failures)
- Missing required field detection
- Inheritance (extends)
- Nested object types
- Array types
- Extra fields detection
- Class name as type reference
- Deep nested validation
- Deep type error detection
- Plain objects against class types

### 📝 Literals & Expressions (4 tests)
- Unused literals: numbers
- Unused literals: strings
- Unused literals: objects and arrays
- Unused expressions between declarations

### ❌ Error Handling (2 tests)
- Missing export statement detection
- Invalid syntax handling

### Expected Output

```
🧪 Running BCON Test Suite

============================================================
✅ Parse String
✅ Parse Number
✅ Parse Float
...
✅ Unused expressions between declarations
============================================================

Total: 64 | Passed: 64 | Failed: 0
```

## ⚡ Performance Benchmark (`performance.js`)

The performance benchmark suite contains **12 benchmark tests** measuring speed and throughput using comprehensive.bcon (Moscow city data):

### Benchmark Categories

#### Parsing Performance
1. **Parse simple string** (1000 iterations)
   - Measures basic string parsing speed
   - Reports ops/sec throughput

2. **Parse simple object** (1000 iterations)
   - Tests object parsing performance
   - Includes multiple properties

3. **Parse simple array** (1000 iterations)
   - Array parsing speed test
   - Multiple elements

4. **Parse comprehensive config** (100 iterations)
   - Complex file parsing with 8.4KB file
   - Moscow city data with all BCON features
   - Reports KB/sec processing speed

5. **Parse with constructors** (500 iterations)
   - Constructor instantiation performance
   - Nested constructors in defaults

6. **Parse with nullish coalescing** (500 iterations)
   - Operator ? performance impact
   - Default value resolution

7. **Parse with spread operator** (500 iterations)
   - Spread operator for arrays and objects
   - Dynamic type detection

8. **Parse with string interpolation** (500 iterations)
   - Interpolation performance impact
   - Variable substitution speed

#### Stringification Performance
9. **Stringify simple object** (1000 iterations)
   - Object serialization speed
   - Basic BCON output generation

10. **Stringify comprehensive config** (100 iterations)
    - Complex object serialization
    - Reports MB/sec output speed

#### Combined Operations
11. **Round-trip** (500 iterations)
    - Full cycle: parse → stringify → parse
    - Real-world usage simulation

12. **Parse comprehensive with all features** (50 iterations)
    - Complete feature test
    - All BCON 2.2 capabilities

### Metrics Reported

For each benchmark:
- **Iterations**: Number of runs
- **Average time**: Mean execution time
- **Min/Max time**: Best and worst case
- **Total time**: Cumulative duration
- **Throughput**: Operations per second
- **File size**: For file-based tests
- **Speed**: Data processing rate (KB/sec or MB/sec)

### Expected Output

```
⚡ BCON Performance Benchmark

============================================================

  Parse simple string:
    Iterations: 1000
    Average:    48.01μs
    Min:        15.00μs
    Max:        4.02ms
    Total:      48.01ms
    Throughput: 20828 ops/sec

  [... more benchmarks ...]

============================================================

📊 Summary:

  Total tests:     12
  Total time:      1.82s
  Average per test: 151.67ms

  Performance ratings:
    Parsing:     1.24ms (avg)
    Stringifying: 68.43μs (avg)

============================================================

📝 Sample Output (Moscow City Data):

  Moscow Configuration:
    City: Moscow
    Country: Russia
    Population: 13,010,112
    Area: 2,561.5 sq km
    Districts: 5
    Metro Stations: 3
    Landmarks: 6

============================================================

✅ Benchmark completed successfully!
```

## 📊 JSON vs BCON Comparison (`comparison.js`)

Compares BCON with JSON using comprehensive.bcon:

### Comparison Metrics

1. **File Size**
   - BCON file size (comprehensive.bcon)
   - Equivalent JSON size
   - Size difference percentage

2. **Parsing Speed**
   - JSON.parse() performance
   - BCON.parse() performance
   - Speed comparison

3. **Stringification Speed**
   - JSON.stringify() performance
   - BCON.stringify() performance
   - Speed comparison

4. **Feature Advantages**
   - Features unique to BCON
   - Readability improvements
   - Type safety benefits
   - Configuration-focused design

### Expected Output

```
📊 BCON vs JSON Comparison

============================================================

File Size Comparison:
  BCON: 8.4 KB (comprehensive.bcon)
  JSON: ~12.3 KB (equivalent)
  BCON is 31.7% smaller

Parsing Speed:
  JSON: 0.45ms (avg)
  BCON: 1.24ms (avg)
  JSON is 2.76x faster

Stringification Speed:
  JSON: 0.12ms (avg)
  BCON: 0.68ms (avg)
  JSON is 5.67x faster

BCON Advantages:
  ✅ Human-readable configuration syntax
  ✅ Comments support (# and '...')
  ✅ Type validation system
  ✅ Class constructors with parameters
  ✅ Inheritance (extends)
  ✅ Nullish coalescing operator (?)
  ✅ Spread operator (...)
  ✅ String interpolation
  ✅ No quotes needed for keys
  ✅ No trailing comma issues
  ✅ Better for configuration files

Verdict:
  Use BCON for: Configuration files, human-edited data
  Use JSON for: API communication, high-performance parsing

============================================================
```

## 🔧 Adding New Tests

### Unit Test

Add to appropriate test file:

```javascript
// tests.js
test('Your test name', () => {
    const result = BCON.parse('export "Hello";');
    assert.strictEqual(result, "Hello");
});

// test-type-validation.js
test('Type validation test', () => {
    const code = `
        class MyClass [
            @value: String;
        ];
        export MyClass [@value => "test";];
    `;
    const result = BCON.parse(code);
    assert.strictEqual(result.value, "test");
});

// test-nested-constructors.js
test('Constructor in default', () => {
    const code = `
        class Coords (x, y) [@x => x; @y => y;];
        class Point (coord) [@coord => coord ? Coords(0, 0);];
        export Point(Null);
    `;
    const result = BCON.parse(code);
    assert.strictEqual(result.coord.x, 0);
});

// test-spread-objects.js
test('Spread operator', () => {
    const code = `
        use [@a => 1;] as obj1;
        use [@b => 2;] as obj2;
        use [...obj1; ...obj2;] as merged;
        export merged;
    `;
    const result = BCON.parse(code);
    assert.deepStrictEqual(result, { a: 1, b: 2 });
});
```

### Performance Benchmark

Add to `performance.js`:

```javascript
const code = 'export "test";';
const benchmark = runBenchmark('Your benchmark', () => BCON.parse(code), 1000);
printBenchmark(benchmark);
```

## 📊 Test Coverage

### Features Covered
- ✅ All BCON data types (primitives, dates, regex, BigInt)
- ✅ Variable declarations and usage
- ✅ Data structures (objects, arrays)
- ✅ String interpolation
- ✅ References (Main, This, dot notation)
- ✅ Destructuring (objects and arrays)
- ✅ Classes (validators and constructors)
- ✅ Constructor calls in default values (BCON 2.2+)
- ✅ Constructor calls as arguments (BCON 2.2+)
- ✅ Spread operator for arrays and objects (BCON 2.2+)
- ✅ Nullish coalescing operator (?)
- ✅ Type validation system
- ✅ Inheritance (extends)
- ✅ Comments (single and multi-line)
- ✅ Stringify/Parse round-trip
- ✅ Error handling and validation
- ✅ Performance characteristics
- ✅ Real-world configuration examples (Moscow city data)

### Code Quality
- All tests use native Node.js `assert` module
- No external testing frameworks required
- Clean, readable test output
- Comprehensive error messages
- Performance metrics with statistical analysis
- 90 tests total across 4 test files
- 100% pass rate

## 🐛 Debugging

### Run Individual Test File

```bash
node test/tests.js
node test/test-type-validation.js
node test/test-nested-constructors.js
node test/test-spread-objects.js
```

### Debug Specific Feature

Create a debug file:

```javascript
const BCON = require('../index.js');

const code = `
    class Coords (x, y) [
        @x: Number => x ? 0;
        @y: Number => y ? 0;
    ];
    
    use Coords(55.7558, 37.6173) as moscowCoords;
    export moscowCoords;
`;

try {
    const result = BCON.parse(code);
    console.log('Result:', JSON.stringify(result, null, 2));
} catch (error) {
    console.log('Error:', error.message);
    console.log('Stack:', error.stack);
}
```

### Common Issues

1. **Spread type mismatch**: Ensure arrays spread into arrays, objects into objects
2. **Constructor parameter count**: Check all required parameters are provided
3. **Type validation**: Verify value types match field type declarations
4. **Nullish coalescing**: Remember `?` only triggers on `null` or `undefined`

## 🔗 Links

- **BCON Language**: Declarative configuration language
- **Version**: 2.2.0 with spread operator and nested constructors
- **License**: MIT

## 📝 License

MIT License - see [LICENSE](../LICENSE) file for details.

---

**Last Updated**: December 21, 2025  
**Test Status**: ✅ 90/90 tests passing  
**BCON Version**: 2.2.0
