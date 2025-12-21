/**
 * New BCON parser - Main file (ESM version)
 */

import Lexer from './Lexer.mjs';
import Parser from './Parser.mjs';
import Evaluator from './Evaluator.mjs';
import stringify from './Stringifier.mjs';

/**
 * Main BCON parsing function
 */
function parse(source, config = {}) {
    // Use global configuration if available
    const finalConfig = {
        defaultPath: config.defaultPath || globalThis.__bconConfig?.default_path || process.cwd(),
        defaultEncoding: config.defaultEncoding || globalThis.__bconConfig?.default_encoding || 'utf-8'
    };

    // Lexical analysis (tokenization)
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();

    // Parsing (creating AST)
    const parser = new Parser(tokens, source, finalConfig);
    const ast = parser.parse();

    // Evaluation (executing AST)
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
