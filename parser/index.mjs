/**
 * Nowy parser BCON - Główny plik (ESM version)
 */

import Lexer from './Lexer.mjs';
import Parser from './Parser.mjs';
import Evaluator from './Evaluator.mjs';
import stringify from './Stringifier.mjs';

/**
 * Główna funkcja parsująca BCON
 */
function parse(source, config = {}) {
    // Użyj globalnej konfiguracji jeśli dostępna
    const finalConfig = {
        defaultPath: config.defaultPath || globalThis.__bconConfig?.default_path || process.cwd(),
        defaultEncoding: config.defaultEncoding || globalThis.__bconConfig?.default_encoding || 'utf-8'
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

export {
    parse,
    stringify,
    Lexer,
    Parser,
    Evaluator
};

export default {
    parse,
    stringify,
    Lexer,
    Parser,
    Evaluator
};
