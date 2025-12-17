/**
 * Nowy parser BCON - Główny plik
 */

const Lexer = require('./Lexer');
const Parser = require('./Parser');
const Evaluator = require('./Evaluator');
const stringify = require('./Stringifier');

/**
 * Główna funkcja parsująca BCON
 */
function parse(source, config = {}) {
    // Użyj globalnej konfiguracji jeśli dostępna
    const finalConfig = {
        defaultPath: config.defaultPath || global.__bconConfig?.default_path || process.cwd(),
        defaultEncoding: config.defaultEncoding || global.__bconConfig?.default_encoding || 'utf-8'
    };

    // Leksykalna analiza (tokenizacja)
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();

    // Parsowanie (tworzenie AST)
    const parser = new Parser(tokens, source, finalConfig);
    const ast = parser.parse();

    // Ewaluacja (wykonanie AST)
    const evaluator = new Evaluator(finalConfig);
    const result = evaluator.evaluate(ast, parse);

    return result;
}

module.exports = {
    parse,
    stringify,
    Lexer,
    Parser,
    Evaluator
};
