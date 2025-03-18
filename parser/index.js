const
    tokenize = require('./tokenizer'),
    createAST = require('./createAST'),
    parseAST = require('./parseAST');

function parse(text)
{
    const
        TOKENS = tokenize(text),
        AST = createAST(text, TOKENS),
        PARSED = parseAST(AST, parse);

    return PARSED;
}

module.exports = parse;