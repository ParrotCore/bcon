const
    CACHE = new Map(),
    {
        readFileSync: read
    } = require('node:fs');

    getAddress = require('../util/getAddress');

/**
 * @function parseObject
 * @param {object} object BCON Object parsed to AST. 
 * @param {{Main: Object, This: Object}} variables Associative list of variables.
 * @description Reproduces AST-parsed BCON Object to fully operable JS Object.
 * @returns {Array|Object}
 */

function parseObject(object, variables)
{
    const
        BODY = object.type === 'ARRAY-EXPRESSION' ? [] : {};

    if(!('Main' in variables)) variables.Main = BODY;
    variables.This = BODY;

    for(const EXPRESSION of object.properties)
    {
        const
            KEY = !isNaN(EXPRESSION.key) ? EXPRESSION.key : EXPRESSION.key.substring(1);

        let
            value;

        if(EXPRESSION.value.type === 'ARRAY-EXPRESSION' || EXPRESSION.value.type === 'ASSOC-EXPRESSION') value = parseObject(EXPRESSION.value, variables);
        else
        {
            if(EXPRESSION.value.type === 'FILE-LITERAL') value = read(EXPRESSION.value.path, EXPRESSION.value.encoding);
            else if(EXPRESSION.value.type.endsWith('LITERAL'))
            {
                if(EXPRESSION.value.type === 'BIGINT-LITERAL') console.log(EXPRESSION.value.type, EXPRESSION.value.value);
                value = EXPRESSION.value.value;

                if(EXPRESSION.value.type === 'STRING-LITERAL') value = value
                    .replace(
                        /(?<!\\)\[([a-zA-Z_][a-zA-Z_0-9]*(\.([a-zA-Z_][a-zA-Z_0-9]*|\d*))*)(?<!\\)\]/g,
                        (match) => getAddress(variables, match.slice(1,-1))
                    )
                    .replace(
                        /\\[bfnrtv]/g,
                        (match) => ({
                            b: '\b',
                            f: '\f',
                            n: '\n',
                            r: '\r',
                            t: '\t',
                            v: '\v'
                        })[match.substring(1)] 
                    );
            }
            else
            {
                if(EXPRESSION.value.type === 'VARIABLE-NAME') value = variables[EXPRESSION.value.string];
                else if(EXPRESSION.value.type === 'VARIABLE-PATH') value = getAddress(variables, EXPRESSION.value.string)
            }
        }

        BODY[KEY] = value;
    }

    return BODY;
}

/**
 * @function parseHead
 * @param {Object} object - BCON AST object.
 * @param {function} parseImport - Method that lets BCON import files.
 * @returns {Object} Associative list of variables that will be used when parsing.
 */

function parseHead (object, parseImport)
{
    const
        VARIABLES = {};

    for(const EXPRESSION of object)
    {
        let
            indexCount = 0,
            value;

        if(EXPRESSION.type === 'IMPORT-EXPRESSION')
        {
            const
                PATH = EXPRESSION.value.path,
                ENCODING = EXPRESSION.value.encoding;

            try
            {
                if(!CACHE.has(PATH)) CACHE.set(
                    PATH,
                    parseImport(
                        read(
                            PATH,
                            ENCODING
                        )
                    )
                )
            }
            catch(error)
            {
                error.stack += `\n    at: ${PATH}`;
                throw error;
            }

            value = CACHE.get(PATH);
        }
        else
        {
            if(['ASSOC-EXPRESSION', 'ARRAY-EXPRESSION'].includes(EXPRESSION.value.type))
            {
                value = parseObject(EXPRESSION.value, VARIABLES);
                delete VARIABLES.Main;
            }
            else if(EXPRESSION.value.type.endsWith('LITERAL'))
            {
                if(EXPRESSION.value.type === 'FILE-LITERAL') value = read(EXPRESSION.value.path, EXPRESSION.value.encoding);
                else value = EXPRESSION.value.value;
            }
            else if(EXPRESSION.value.string.startsWith('VARIABLE')) value = getAddress(VARIABLES, EXPRESSION.value.string);
        }

        if(EXPRESSION.alias) VARIABLES[EXPRESSION.alias] = value;
        else for(const KEY of EXPRESSION.destructurization)
        {
            if(KEY.alias === KEY.path[KEY.path.length-1] && Array.isArray(getAddress(value, KEY.path.slice(0, -1))))
            {
                KEY.path[KEY.path.length-1] = indexCount++;
            }

            const
                VALUE = getAddress(value, KEY.path);

            VARIABLES[KEY.alias] = VALUE;
        }
    }

    return VARIABLES;
}

/**
 * @function execute_ast
 * @param {object} AST - BCON AST
 * @param {function} parseImport Method used to parse imports. 
 * @description Executes BCON Abstract Syntax Tree and returns result. 
 * @returns {Array|Object} Object that is a result of BCON parsing process.
 */

function execute_ast (AST, parseImport)
{
    const
        VARIABLES = parseHead(AST.head, parseImport),
        BODY = parseObject(AST.body, VARIABLES);

    return BODY;
}

module.exports = execute_ast;