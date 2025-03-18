const
    REGEXPS = [
        {
            matcher: /"([^\n\r"]|(?<=\\)")*"\.date/gi,
            type: 'DATE-LITERAL'
        },
        {
            matcher: /"([^\n\r"]|(?<=\\)")*"\.(utf(?:-)?8|utf(?:-)?16le|base(?:-)?64|ascii|latin(?:-)?1|binary|hex)/gi,
            type: 'FILE-LITERAL'
        },
        {
            matcher: /"([^"]|(?<=\\)")*"/g,
            type: 'STRING-LITERAL'
        },
        {
            matcher: /\/([^\/\n\r]|(?<=\\)\/)+\/[igsmuy]*/g,
            type: 'REGEXP-LITERAL'
        },
        {
            matcher: /(?:-)?(0x[A-Fa-f0-9_]+|0b[0-1_]+|[0-9_]*e(\+|\-)[0-9_]+|[0-9_]*\.[0-9_]+|[0-9_]+|Infinity)|NaN/g,
            type: 'NUMBER-LITERAL'
        },
        {
            matcher: /True|False/g,
            type: 'BOOLEAN-LITERAL'
        },
        {
            matcher: /Null/g,
            type: 'NULL-LITERAL'
        },
        {
            matcher: /Undefined/g,
            type: 'UNDEFINED-LITERAL'
        },
        {
            matcher: /import/g,
            type: 'KEYWORD'
        },
        {
            matcher: /use/g,
            type: 'KEYWORD'
        },
        {
            matcher: /as/g,
            type: 'KEYWORD'
        },
        {
            matcher: /=>/g,
            type: 'ASSIGNMENT'
        },
        {
            matcher: /@[A-Za-z_]+[A-Za-z0-9_]*/g,
            type: 'ASSOC-KEY'
        },
        {
            matcher: /@\*/g,
            type: 'NUMERIC-KEY'
        },
        {
            matcher: /[A-Za-z_][A-Za-z0-9_]*(\.([A-Za-z_][A-Za-z0-9_]*|\d+))+/g,
            type: 'VARIABLE-PATH'
        },
        {
            matcher: /[A-Za-z_][A-Za-z0-9_]*/g,
            type: 'VARIABLE-NAME'
        },
        {
            matcher: /\[/g,
            type: 'SYMBOL'
        },
        {
            matcher: /\]/g,
            type: 'SYMBOL'
        },
        {
            matcher: /;/g,
            type: 'END'
        }
    ],

    getTokenLocalization = require('../util/getTokenLocalization'),

    {
        existsSync: exists
    } = require('node:fs'),
    {
        resolve: getAbsolutePath,
        join: pathJoin
    } = require('node:path');

/**
 * @function clearStack
 * @param {error} error - Error to clear. 
 * @description Removes stack of an error, then returns back.
 * @returns {error}
 */
function clearStack(error)
{
    error.stack = structuredClone(error.message);

    return error;
}

/**
 * @function remove_comments
 * @param {string} string - BCON Code.
 * @returns {string}
 * @description Removes all comments from given BCON code.
 */

function remove_comments(string)
{
    const
        str = string.replace(/\r\n|\r(?!\n)/g, '\n')

    let
        output = '',
        isString = false,
        isMultilineComment = false,
        isComment = false;

    for(let i in str)
    {
        if(str[i] === '#' && !isString && !isComment && !isMultilineComment)
        {
            isComment = true;
            continue;
        }

        if(str[i] === '\'' && str[i-1] !== '\\' && !isString && !isComment)
        {
            isMultilineComment = !isMultilineComment;
            continue;
        }

        if(str[i] === '#' && str[i-1] !== '\\' && !isString && !isMultilineComment && !isComment)
        {
            isComment = true;
        }

        if(str[i] === '\n' && isComment)
        {
            isComment = false;
        }

        if(str[i] === '"' && str[i-1] !== '\\' && !isComment && !isMultilineComment)
        {
            isString = !isString;
        }

        if(isComment || isMultilineComment) output += str[i] === '\n' ? '\n' : ' ';
        else output += str[i];
    }

    return output;
}

/**
 * @typedef Token
 * @type {{string: String, index: Number, type: String}}
 * @description BCON token.
 */

/**
 * @typedef TokenArray
 * @type {Token[]}
 * @description Array of BCON code tokens.
 */

/**
 * @function filter
 * @param {TokenArray} arr - Array of tokens to filter by their indexes.
 * @description Filters array of tokens of using same indexes more than once.
 * @returns {TokenArray} Filtered array of tokens.
 */

function filter(arr)
{
    let
        res = [
            arr[0]
        ];

    for(let i = 1; i < arr.length; i++)
    {
        const
            CURRENT_ELEMENT = arr[i];
            LAST_ELEMENT = res[res.length-1];

        if(CURRENT_ELEMENT.index > LAST_ELEMENT.index + LAST_ELEMENT.string.length - 1) res.push(arr[i]);
        else if(LAST_ELEMENT.index === CURRENT_ELEMENT.index && LAST_ELEMENT.string.length < CURRENT_ELEMENT.string.length)
        {
            res.pop();
            res.push(CURRENT_ELEMENT);
        }
    }

    return res;
}

/**
 * @function sort
 * @param {TokenArray} arr - Array of tokens to sort.
 * @description Sorts array of tokens by their indexes.
 * @returns {TokenArray} Sorted array of tokens.
 */

function sort(arr)
{
    return arr.sort((a, b) => a.index - b.index);
}

/**
 * @function checkForUnexpectedTokens
 * @param {TokenArray} arr - Array of BCON tokens.
 * @param {String} string - String including BCON code.
 * @description It's used to check for tokens that weren't matched.
 * @returns {TokenArray|void}
 */

function checkForUnexpectedTokens(arr, string)
{
    // Removing references here:
    const
        ARRAY = structuredClone(arr);

    let
        currentIndex = 0;

    while(currentIndex < string.length)
    {
        if(currentIndex < ARRAY[0].index)
        {
            if(/\s/.test(string[currentIndex])) currentIndex++;
            else throw clearStack(new SyntaxError(`Unexpected Token: "${string[currentIndex]}" at ${getTokenLocalization(string, currentIndex)}.`))
        }
        else if(currentIndex === ARRAY[0].index)
        {
            currentIndex += ARRAY.shift().string.length;
        }
    }

    return arr;
}

/**
 * @typedef LiteralToken
 * @description Represents single literal as a token.
 * @type {{ value: any, original:string, index:number, type:"LITERAL" }}
 */

/**
 * @function parseLiterals
 * @param {TokenArray} arr - Array of BCON tokens.
 * @description Transforms all tokens of literals to literals themselves. It doesn't affect any value that is not literal.
 * @returns {[...Token[], ...LiteralToken[]]|void} Array of BCON literals & tokens.
 */

function parseLiterals(arr, string)
{
    /**
     * @function parseLiteral
     * @param {Token} literal - Single token from `tokenize` method.
     * @param {string} string - String including BCON code.
     * @description Transforms single bcon token to literal.
     * @returns {LiteralToken} BCON Literal
     */
    function parseLiteral(literal, string)
    {
        const
            LITERAL = {
                value: '',
                original: literal.string,
                index: literal.index,
                type: literal.type
            };

        switch(literal.type.slice(0, -'-LITERAL'.length))
        {
            case 'DATE':
                LITERAL.value = new Date(literal.string.slice(1, -5));
                break;

            case 'FILE':
                const
                    ENCODING = literal.string.split('.').pop(),
                    PATH = literal.string.slice(1, -(ENCODING.length + 2));

                LITERAL.encoding = ENCODING;

                if(!Buffer.isEncoding(ENCODING)) throw clearStack(new Error(`Could not recognize "${ENCODING}" as handled encoding at ${getTokenLocalization(string, literal.index)}`));

                if(getAbsolutePath(PATH) === PATH) LITERAL.path = PATH;
                else LITERAL.path = pathJoin(__bconConfig.default_path, PATH)

                if(!exists(LITERAL.path)) throw clearStack(new Error(`File "${getAbsolutePath(PATH)}" does not exist at ${getTokenLocalization(string, literal.index)}`))

                delete LITERAL.value;        
                break;
        
            case 'NUMBER':
                LITERAL.value = Number(literal.string);
                break;

            case 'NULL':
                LITERAL.value = null;
                break;

            case 'UNDEFINED':
                LITERAL.value = undefined;
                break;

            case 'BOOLEAN':
                LITERAL.value = literal.string === 'True';
                break;
            
            case 'STRING':
                LITERAL.value = literal.string.slice(1, -1)
                break;

            case 'REGEXP':
                const
                    flags = literal.string.split(/\//).pop(),
                    expr = literal.string.slice(1, -(flags.length + 1));

                LITERAL.value = new RegExp(expr, flags);
                break;
        }

        return LITERAL;
    }

    for(let i in arr) if(arr[i].type.endsWith('LITERAL')) arr[i] = parseLiteral(arr[i], string);

    return arr;
}

/**
 * @function tokenize
 * @param {String} string - String including BCON code.
 * @description Splits BCON code to tokens.
 * @returns {TokenArray} Array of BCON tokens.
 */

function tokenize(string)
{
    const
        str = remove_comments(string);

    let
        tokens = [];

    for(const { matcher: MATCHER, type: TYPE } of REGEXPS)
    {
        const
            MATCHES = str.matchAll(MATCHER)

        for(const MATCH of MATCHES)
        {
            tokens.push({
                string: MATCH[0],
                index: MATCH.index,
                type: TYPE
            });
        }
    }

    for(const METHOD of [ sort, filter, checkForUnexpectedTokens, parseLiterals ]) tokens = METHOD(tokens, str);

    return tokens;
}

module.exports = tokenize;