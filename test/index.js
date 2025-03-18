require('../').init({
	allowGlobal:true,
	allowRequire:true,
	config: {
		defaultEncoding: 'utf-8',
		defaultPath: __dirname
	}
});

function getTime(name, method)
{
	const
		TIMES = [name];
	
	let
		start,
		end;

	start = Date.now();

	method();

	end = Date.now();

	TIMES.push(end - start + ' ms');

	return TIMES.join(': ');
}

const
	TIMES = [
		getTime('Parsing', () => require('./moscow.bcon')),
		getTime('Stringifying', () => BCON.stringify(require('./moscow.bcon')))
	]
		.join('\n  ');

console.log('# Times:\n  ' + TIMES)

console.log('# Output:');
console.log(require('./warsaw.bcon'))