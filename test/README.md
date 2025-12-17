# BCON Test Suite

Complete test suite for the BCON parser with unit tests and performance benchmarks.

## 🚀 Quick Start

### Run Unit Tests

```bash
npm test
```

### Run Performance Benchmark

```bash
npm run performance
```

## 📋 Available Commands

| Command | Description |
|---------|-------------|
| `npm test` | Run all unit tests (50 tests) |
| `npm run performance` | Run performance benchmark (11 tests) |

## 🧪 Unit Tests (`tests.js`)

The unit test suite contains **50 comprehensive tests** covering all BCON features:

### Test Categories

#### 📦 Basic Data Types (15 tests)
Tests for all primitive and built-in data types:
- Strings with interpolation
- Numbers (integer, float, scientific notation)
- Hex, Octal, Binary numbers
- Boolean values (True/False)
- Special values (Null, Undefined, NaN, Infinity)
- BigInt
- Regular Expressions

#### 🔧 Variables (3 tests)
- Simple variable declarations
- Variables with different types
- Multiple variable usage

#### 📚 Dictionaries/Objects (2 tests)
- Simple object structures
- Nested object structures

#### 📋 Arrays (3 tests)
- Simple arrays
- Dot notation access (`items.0`, `items.1`, `items.2`)
- Arrays of objects

#### 🔤 String Interpolation (3 tests)
- Interpolation with variables
- Interpolation with `This` reference
- Interpolation with `Main` reference

#### 🔗 References (3 tests)
- Dot notation for nested properties
- `Main` object reference
- `This` object reference

#### 🎯 Destructuring (4 tests)
- Dictionary destructuring
- Destructuring with aliases
- Array destructuring
- `skip` keyword usage

#### 📥 Imports (4 tests)
- Import .bcon files
- Import from different files
- Import shared configurations
- Cross-file references

#### 💬 Comments (2 tests)
- Single-line comments (`#`)
- Multi-line comments (`'...'`)

#### 📤 Stringify (6 tests)
- Stringify objects
- Stringify arrays
- Stringify boolean values
- Stringify null values
- Stringify nested structures
- Custom formatting

#### 🔬 Integration Tests (3 tests)
- Complete Warsaw configuration parsing
- Complete Zgierz configuration parsing
- Round-trip: parse → stringify → parse

#### ❌ Error Handling (2 tests)
- Missing export statement detection
- Invalid syntax handling

### Expected Output

```
🧪 Running BCON Test Suite

============================================================
✅ Parse string
✅ Parse number
✅ Parse float
...
✅ Error: Invalid syntax
============================================================

Total: 50 | Passed: 50 | Failed: 0
```

## ⚡ Performance Benchmark (`performance.js`)

The performance benchmark suite contains **11 benchmark tests** measuring speed and throughput:

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

4. **Parse Moscow config** (100 iterations)
   - Complex file parsing with 1.39KB file
   - Reports KB/sec processing speed

5. **Parse Warsaw config with imports** (50 iterations)
   - Tests import mechanism performance
   - 1.73KB file with external references

6. **Parse Zgierz config with imports** (50 iterations)
   - Import performance verification
   - 1.21KB file

#### Stringification Performance
7. **Stringify simple object** (1000 iterations)
   - Object serialization speed
   - Basic BCON output generation

8. **Stringify Moscow config** (100 iterations)
   - Complex object serialization
   - Reports MB/sec output speed

#### Combined Operations
9. **Round-trip** (500 iterations)
   - Full cycle: parse → stringify → parse
   - Real-world usage simulation

10. **Parse with string interpolation** (500 iterations)
    - Interpolation performance impact
    - Variable substitution speed

11. **Parse with variable references** (500 iterations)
    - Reference resolution performance
    - Dot notation access speed

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

  Total tests:     11
  Total time:      1.56s
  Average per test: 141.65ms

  Performance ratings:
    Parsing:     1.19ms (avg)
    Stringifying: 63.87μs (avg)

============================================================

📝 Sample Output:

  Warsaw Config:
    City: Warsaw
    Population: 17,200,000
    Mayor: Rafał Trzaskowski
    Monuments: 7 listed

  Zgierz Config:
    City: Zgierz
    Population: 54,000
    Mayor: Przemysław Staniszewski
    Voivodeship: Łódź

============================================================

✅ Benchmark completed successfully!
```

## 📁 Test Files

### Test Scripts
- **tests.js** - Main unit test suite (50 tests)
- **performance.js** - Performance benchmark suite (11 tests)

### Sample BCON Files (`data/` directory)
- **warsaw.bcon** - Warsaw city configuration (1.73KB)
  - Capital city example with imports
  - Mayor data, monuments, dates
  - String interpolation examples
  
- **zgierz.bcon** - Zgierz city configuration (1.21KB)
  - Regional city example
  - Import usage with destructuring
  - Variable references
  
- **moscow.bcon** - Moscow city configuration (1.39KB)
  - Complex nested structures
  - Multiple data types
  - Performance test baseline

### Shared Configuration Files (`data/` directory)
- **cityTypes.bcon** - City type definitions
- **cityMayors.bcon** - Mayor database
- **\*_keywords.txt** - External text files for import tests

## 🔧 Adding New Tests

### Unit Test

Add to `tests.js`:

```javascript
test('Your test name', () => {
    const result = BCON.parse('export "Hello";');
    assert.strictEqual(result, "Hello");
});
```

### Performance Benchmark

Add to `performance.js`:

```javascript
const code = 'export "test";';
const benchmark = benchmark('Your benchmark', () => BCON.parse(code), 1000);
printBenchmark(benchmark);
```

## 📊 Test Coverage

### Features Covered
- ✅ All BCON data types
- ✅ Variable declarations and usage
- ✅ Data structures (objects, arrays)
- ✅ String interpolation
- ✅ References (Main, This, dot notation)
- ✅ Destructuring (objects and arrays)
- ✅ File imports and cross-references
- ✅ Comments (single and multi-line)
- ✅ Stringify/Parse round-trip
- ✅ Error handling and validation
- ✅ Performance characteristics
- ✅ Real-world configuration examples

### Code Quality
- All tests use native Node.js `assert` module
- No external testing frameworks required
- Clean, readable test output
- Comprehensive error messages
- Performance metrics with statistical analysis

## 🐛 Debugging

### Run Individual Test File

```bash
node test/tests.js
# or
node test/performance.js
```

### Debug Specific Test

Create a debug file:

```javascript
const BCON = require('../index.js');

const code = `
    use "test" as value;
    export value;
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

1. **Import errors**: Ensure `allowRequire: true` is set
2. **Path issues**: Check `defaultPath` configuration
3. **Encoding issues**: Verify `defaultEncoding` setting

## 🔗 Links

- **GitHub Repository**: https://github.com/parrotcore/bcon-parser
- **npm Package**: https://www.npmjs.com/package/bcon-parser
- **Report Issues**: https://github.com/parrotcore/bcon-parser/issues

## 📝 License

MIT License - see [LICENSE](../LICENSE) file for details.
