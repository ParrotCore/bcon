const fs = require('fs');
const path = require('path');

require('..').init({
	allowGlobal: true,
	allowRequire: true,
	config: {
		defaultEncoding: 'utf-8',
		defaultPath: path.join(__dirname, 'data')
	}
});

// ============================================
// Performance Testing Utilities
// ============================================

function formatTime(ms) {
	if (ms < 1) return `${(ms * 1000).toFixed(2)}μs`;
	if (ms < 1000) return `${ms.toFixed(2)}ms`;
	return `${(ms / 1000).toFixed(2)}s`;
}

function formatSize(bytes) {
	if (bytes < 1024) return `${bytes}B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)}KB`;
	return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
}

function benchmark(name, method, iterations = 1) {
	const times = [];
	let result;
	
	// Warm-up run
	method();
	
	// Actual benchmark runs
	for (let i = 0; i < iterations; i++) {
		const start = performance.now();
		result = method();
		const end = performance.now();
		times.push(end - start);
	}
	
	const avg = times.reduce((a, b) => a + b, 0) / times.length;
	const min = Math.min(...times);
	const max = Math.max(...times);
	
	return {
		name,
		iterations,
		avg,
		min,
		max,
		total: times.reduce((a, b) => a + b, 0),
		result
	};
}

function printBenchmark(benchmark) {
	console.log(`\n  ${benchmark.name}:`);
	if (benchmark.iterations > 1) {
		console.log(`    Iterations: ${benchmark.iterations}`);
		console.log(`    Average:    ${formatTime(benchmark.avg)}`);
		console.log(`    Min:        ${formatTime(benchmark.min)}`);
		console.log(`    Max:        ${formatTime(benchmark.max)}`);
		console.log(`    Total:      ${formatTime(benchmark.total)}`);
	} else {
		console.log(`    Time:       ${formatTime(benchmark.avg)}`);
	}
}

// ============================================
// Performance Tests
// ============================================

console.log('⚡ BCON Performance Benchmark\n');
console.log('='.repeat(60));

// Test 1: Parse simple string
const simpleString = 'export "Hello, World!";';
const b1 = benchmark('Parse simple string', () => BCON.parse(simpleString), 1000);
printBenchmark(b1);
console.log(`    Throughput: ${(1000 / b1.avg).toFixed(0)} ops/sec`);

// Test 2: Parse simple object
const simpleObject = 'export [@name=>"Alice";@age=>30;@active=>True;];';
const b2 = benchmark('Parse simple object', () => BCON.parse(simpleObject), 1000);
printBenchmark(b2);
console.log(`    Throughput: ${(1000 / b2.avg).toFixed(0)} ops/sec`);

// Test 3: Parse array
const simpleArray = 'export [@*=>"red";@*=>"green";@*=>"blue";];';
const b3 = benchmark('Parse simple array', () => BCON.parse(simpleArray), 1000);
printBenchmark(b3);
console.log(`    Throughput: ${(1000 / b3.avg).toFixed(0)} ops/sec`);

// Test 4: Parse complex comprehensive file
const comprehensivePath = path.join(__dirname, 'data', 'comprehensive.bcon');
const comprehensiveSize = fs.statSync(comprehensivePath).size;
const comprehensiveContent = fs.readFileSync(comprehensivePath, 'utf-8');
const b4 = benchmark('Parse comprehensive config', () => BCON.parse(comprehensiveContent), 100);
printBenchmark(b4);
console.log(`    File size:  ${formatSize(comprehensiveSize)}`);
console.log(`    Throughput: ${(1000 / b4.avg).toFixed(0)} ops/sec`);
console.log(`    Speed:      ${formatSize(comprehensiveSize / (b4.avg / 1000))}/sec`);

// Test 5: Parse comprehensive with require (includes all language features)
const b5 = benchmark('Parse comprehensive (via require)', () => {
	delete require.cache[require.resolve('./data/comprehensive.bcon')];
	return require('./data/comprehensive.bcon');
}, 50);
printBenchmark(b5);
console.log(`    Throughput: ${(1000 / b5.avg).toFixed(0)} ops/sec`);

// Test 6: Complex nested structures with classes
const classesCode = `
	class User (name, age) [
		@name: String => name ? "Unknown";
		@age: Number => age ? 0;
	];
	use User("Alice", 30) as user1;
	use User("Bob", Null) as user2;
	export [@users => [@* => user1; @* => user2;];];
`;
const b6 = benchmark('Parse with class constructors', () => BCON.parse(classesCode), 500);
printBenchmark(b6);
console.log(`    Throughput: ${(1000 / b6.avg).toFixed(0)} ops/sec`);

// Test 7: Stringify simple object
const objToStringify = { name: "Alice", age: 30, active: true };
const b7 = benchmark('Stringify simple object', () => BCON.stringify(objToStringify), 1000);
printBenchmark(b7);
console.log(`    Throughput: ${(1000 / b7.avg).toFixed(0)} ops/sec`);

// Test 8: Stringify complex object (comprehensive parsed)
const comprehensiveParsed = BCON.parse(comprehensiveContent);
const b8 = benchmark('Stringify comprehensive config', () => BCON.stringify(comprehensiveParsed), 100);
printBenchmark(b8);
const stringifiedSize = BCON.stringify(comprehensiveParsed).length;
console.log(`    Output size: ${formatSize(stringifiedSize)}`);
console.log(`    Throughput:  ${(1000 / b8.avg).toFixed(0)} ops/sec`);
console.log(`    Speed:       ${formatSize(stringifiedSize / (b8.avg / 1000))}/sec`);

// Test 9: Round-trip (parse → stringify → parse)
const b9 = benchmark('Round-trip (parse → stringify → parse)', () => {
	const parsed = BCON.parse(simpleObject);
	const stringified = BCON.stringify(parsed);
	return BCON.parse(stringified);
}, 500);
printBenchmark(b9);
console.log(`    Throughput: ${(1000 / b9.avg).toFixed(0)} ops/sec`);

// Test 10: String interpolation
const interpolationCode = `
	use "World" as target;
	use "Hello" as greeting;
	export "[greeting], [target]!";
`;
const b10 = benchmark('Parse with string interpolation', () => BCON.parse(interpolationCode), 500);
printBenchmark(b10);
console.log(`    Throughput: ${(1000 / b10.avg).toFixed(0)} ops/sec`);

// Test 11: Nullish coalescing operator (?)
const nullishCode = `
	use Null as x;
	use "default" as y;
	export [@result => x ? y;];
`;
const b11 = benchmark('Parse with nullish coalescing', () => BCON.parse(nullishCode), 500);
printBenchmark(b11);
console.log(`    Throughput: ${(1000 / b11.avg).toFixed(0)} ops/sec`);

// Test 12: Spread operator
const spreadCode = `
	class Team (name, ...members) [
		@name: String => name;
		@members: [String] => members;
	];
	use Team("Dev", "Alice", "Bob", "Charlie") as team;
	export team;
`;
const b12 = benchmark('Parse with spread operator', () => BCON.parse(spreadCode), 500);
printBenchmark(b12);
console.log(`    Throughput: ${(1000 / b12.avg).toFixed(0)} ops/sec`);

// ============================================
// Summary
// ============================================

console.log('\n' + '='.repeat(60));
console.log('\n📊 Summary:\n');

const totalTests = 12;
const totalTime = [b1, b2, b3, b4, b5, b6, b7, b8, b9, b10, b11, b12]
	.reduce((sum, b) => sum + b.total, 0);

console.log(`  Total tests:     ${totalTests}`);
console.log(`  Total time:      ${formatTime(totalTime)}`);
console.log(`  Average per test: ${formatTime(totalTime / totalTests)}`);

console.log('\n  Performance ratings:');
const parseAvg = (b1.avg + b2.avg + b3.avg + b4.avg) / 4;
const stringifyAvg = (b7.avg + b8.avg) / 2;
console.log(`    Parsing:     ${formatTime(parseAvg)} (avg)`);
console.log(`    Stringifying: ${formatTime(stringifyAvg)} (avg)`);

// ============================================
// Output Examples
// ============================================

console.log('\n' + '='.repeat(60));
console.log('\n📝 Sample Output (Comprehensive Config):\n');

const comprehensive = require('./data/comprehensive.bcon');
console.log(`  Project: ${comprehensive.application.name} v${comprehensive.application.version}`);
console.log(`  Production: ${comprehensive.application.isProduction}`);
console.log(`  Admin: ${comprehensive.users.admin.username} (${comprehensive.users.admin.email})`);
console.log(`  Teams: ${comprehensive.teams.all.length} total`);
console.log(`    - ${comprehensive.teams.development.name} (${comprehensive.teams.development.members.length} members)`);
console.log(`    - ${comprehensive.teams.qa.name} (${comprehensive.teams.qa.members.length} members)`);
console.log(`    - ${comprehensive.teams.design.name} (${comprehensive.teams.design.members.length} members)`);
console.log(`  Employees: ${comprehensive.employees.length}`);
console.log(`  Offices: ${comprehensive.offices.all.length}`);

console.log('\n' + '='.repeat(60));
console.log('\n✅ Benchmark completed successfully!\n');