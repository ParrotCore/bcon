const
    getTokenLocalization = require('../util/getTokenLocalization'),

    /**
     * @function unexpectedToken
     * @param {string} string - BCON code.
     * @param {import('./tokenizer').Token|import('./tokenizer').LiteralToken} token - BCON token.
     * @param {string} expected - Expected token.
     * @returns {void}
     */

    unexpectedToken = (string, token, expected) => {
        throw new SyntaxError(`Unexpected Token: "${(token.original || token.string)}" at ${getTokenLocalization(string, token.index)}.${expected ? ` Expected: ${expected}.` : ''}`)
    },
    
    /**
     * @function unexpectedEndOfInput
     * @param {string} string - BCON code.
     * @param {string} expected - Expected token.
     * @description Returns errors 'Unexpected end of input'.
     * @returns {void}
     */

    unexpectedEndOfInput = (string, expected='') => {
        throw new SyntaxError(`Unexpected end of input at ${getTokenLocalization(string, string.length)}.${expected ? ` Expected: ${expected}.` : ''}`);
    };

/**
 * @function destructurizationAST
 * @param {string} string - BCON code.
 * @param {function} nextToken - Method that returns next token from the list.
 * @description It's used to destructurize BCON objects.
 * @returns {{name:string,path:string}[]}
 */

function destructurizationAST(string, nextToken, currentPath=[])
{
    let
        currentToken,
        indexCount = 0,
        destructurizationCollection = [];
    
    while(currentToken = nextToken())
    {
        const
            KEY = currentToken;

        if(!KEY) unexpectedEndOfInput(string);
        if(KEY.type === 'SYMBOL' && KEY.string === ']')
        {
            const
                END = nextToken();

            if(!END) unexpectedEndOfInput(string, '";"');
            if(END.type !== 'END') unexpectedToken(string, END, '";"');

            break;
        }

        if(KEY.type !== 'VARIABLE-NAME' && (KEY.type !== 'SYMBOL' || KEY.string !== '[') && KEY.type !== 'END') unexpectedToken(string,KEY,'variable name or "["');

        if(KEY.type === 'VARIABLE-NAME')
        {
            const
                NEXT = nextToken();

            if(!NEXT) unexpectedEndOfInput(string);
            if(NEXT.type === 'END')
            {
                destructurizationCollection.push({alias: KEY.string, path: [...currentPath, KEY.string]});
            }
            else if(NEXT.type === 'ASSIGNMENT')
            {
                const
                    PATH = nextToken();

                if(!PATH) unexpectedEndOfInput(string,'variable name or "["');
                if((PATH.type !== 'SYMBOL' || PATH.string !== '[') && PATH.type !== 'VARIABLE-NAME') throw unexpectedToken(string, PATH, 'variable name or "["');

                if(PATH.string === '[') destructurizationCollection.push(...destructurizationAST(string, nextToken, [...currentPath, KEY.string]));
                else
                {
                    destructurizationCollection.push({
                        alias: PATH.string,
                        path: [...currentPath, KEY.string]
                    });

                    const
                        END = nextToken();

                    

                    if(!END) unexpectedEndOfInput(string, '";"');
                    if(END.type !== 'END') unexpectedToken(string, END, '";"');
                }
            }
            else
                unexpectedToken(string, NEXT, '";"')
        }
        else if(KEY.type === 'SYMBOL')
            destructurizationCollection.push(...destructurizationAST(string, nextToken, [...currentPath, (indexCount++).toString()]));
        else
            destructurizationCollection.push({ alias: null, path: [...currentPath, (indexCount++).toString()] })
    };

    return destructurizationCollection;
}

/**
 * @function objectAST
 * @param {String} string - string representing BCON code. 
 * @param {function} nextToken - method that returns next token from tokens list.
 * @param {number} index - index of object that method will parse. 
 * @description It's used to parse objects from BCON syntax to AST.
 * @returns {Object}
 */

function objectAST (string, nextToken, index)
{
    let
        indexCount = 0,
        currentToken,
        currentObjectExpression = {
            type: '',
            properties: [],
            index
        };

    while(currentToken = nextToken())
    {
        
        if(!currentToken) unexpectedEndOfInput(string);
        if(currentToken.type === 'SYMBOL' && currentToken.string === ']') break;

        if(!currentObjectExpression.type)
        {
            if(currentToken.type === 'NUMERIC-KEY') currentObjectExpression.type = 'ARRAY-EXPRESSION';
            else currentObjectExpression.type = 'ASSOC-EXPRESSION';
        }

        const
            item = {},
            KEY = currentToken,
            ASSIGN = nextToken(),
            VALUE = nextToken();

        if(!ASSIGN | !VALUE) unexpectedEndOfInput(string);

        if(KEY.type === 'NUMERIC-KEY') item.key = indexCount++;
        else if (KEY.type === 'ASSOC-KEY') item.key = KEY.string;
        else
            unexpectedToken(string, KEY, 'assoc (@key) or numeric (@*) key.');

        if(ASSIGN.type !== 'ASSIGNMENT') unexpectedToken(string, ASSIGN, '"=>"')
        if(!VALUE.type.endsWith('LITERAL') && VALUE.type !== 'VARIABLE-NAME' && VALUE.type !== 'VARIABLE-PATH' && (VALUE.type !== 'SYMBOL' || VALUE.string !== '[')) unexpectedToken(string, VALUE)
        
        if(VALUE.string == '[')
            item.value = objectAST(string, nextToken, VALUE.index);
        else
            item.value = VALUE;

        const
            END = nextToken();

        if(!END) unexpectedEndOfInput(string);

        if(END.type !== 'END') unexpectedToken(string, END, '";"');
        else
        {
            currentObjectExpression.properties.push(item);
        }
    }

    return currentObjectExpression;
}

/**
 * @function createAST
 * @description Creates a tree representing hierarchic structure of expressions included in code.
 * @param {string} string - String representing BCON code.
 * @param {import("./tokenizer").TokenArray|import('./tokenizer').LiteralToken[]} tokens - Array of BCON tokens.
 */

function createAbstractSyntaxTree(string, tokens)
{
    const
        AST = {
            type: 'MODULE',
            head: [

            ],
            body: {

            }
        };

    let
        currentExpression = {},
        currentIndex = 0,
        currentToken,
        location = 'head';

    function nextToken()
    {
        return tokens[currentIndex++]
    }

    while(currentToken = nextToken())
    {
        // Head AST:
        if(location === 'head')
        {
            if(currentToken.type === 'KEYWORD' && ['import', 'use'].includes(currentToken.string) && !('type' in currentExpression))
            {
                // Import handle:
                if(currentToken.string === 'import')
                {
                    currentExpression.type = 'IMPORT-EXPRESSION';

                    const
                        FILE = nextToken(),
                        AS = nextToken(),
                        KEY = nextToken();

                    if(FILE.type !== 'FILE-LITERAL') throw new TypeError(`Cannot import "${FILE.original || FILE.string}" as it\'s not a file.`)
                    if(AS.type !== 'KEYWORD' && AS.string !== 'as') unexpectedToken(string, AS, '"as" keyword');

                    currentExpression.value = FILE;

                    if(KEY.type === 'VARIABLE-NAME') currentExpression.alias = KEY.string;
                    else if(KEY.type === 'SYMBOL' && KEY.string === '[')
                    {
                        currentExpression.destructurization = destructurizationAST(string, nextToken);
                        currentIndex--;
                    }
                    else
                        unexpectedToken(string, KEY, 'variable name or "["');
                }
                // Use handle:
                else
                {
                    currentExpression.type = 'USE-EXPRESSION'

                    const
                        VALUE = nextToken();

                    if(!VALUE.type.endsWith('LITERAL') && VALUE.type !== 'VARIABLE-NAME' && VALUE.type !== 'VARIABLE-PATH' && (VALUE.type !== 'SYMBOL' || VALUE.string !== '[')) throw new TypeError('Invalid assignment.');

                    if(VALUE.type === 'SYMBOL' && VALUE.string === '[') currentExpression.value = objectAST(string, nextToken, VALUE.index);
                    else currentExpression.value = VALUE;

                    const
                        AS = nextToken(),
                        KEY = nextToken();

                    if(AS.type !== 'KEYWORD' && AS.string !== 'as') unexpectedToken(string, AS, '"as" keyword.')
                    if(KEY.type !== 'VARIABLE-NAME' && (KEY.type !== 'SYMBOL' || KEY.string !== '[')) unexpectedToken(string, KEY, 'variable name or "[".');
                    
                    if(KEY.type === 'VARIABLE-NAME') currentExpression.alias = KEY.string;
                    else
                    {
                        currentExpression.destructurization = destructurizationAST(string, nextToken);
                        currentIndex--;
                    }
                }
            }
            else if(currentToken.type === 'SYMBOL' && currentToken.string === '[')
            {
                // Header was not ended.
                if('type' in currentExpression) unexpectedToken(string, currentToken, '";"');

                location = 'body';

                continue;
            }
            else if(currentToken.type === 'END')
            {
                // End of expression.
                AST[location].push(currentExpression);
                currentExpression = {};
            }
            else unexpectedToken(string, currentToken);
        }
        // Body AST:
        else {
            AST[location] = objectAST(string, nextToken, tokens[--currentIndex].index);

            const
                KEY = nextToken();

            if(!KEY || KEY.type !== 'END') unexpectedEndOfInput(string, '";"');
        }
    }

    return AST;
}

module.exports = createAbstractSyntaxTree;