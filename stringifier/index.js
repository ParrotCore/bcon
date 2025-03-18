const
    isAssociativeArray = require('../util/isAssociativeArray'),
    addSpaces = require('../util/spaces'),
    
    {
        inspect
    } = require('node:util');

/**
 * @function stringify_value
 * @param {any} value - Value to stringify into BCON Notation.
 * @param {function} replacer - Replacer method.
 * @description Converts JavaScript value to BCON string.
 * @returns {string}
 */

function stringify_value(value, replacer, space)
{
    let
        response = (replacer ? replacer : (val) => val)(value);

    switch(true)
    {
        case typeof response === 'number':
            response = response.toString();
            break;
        
        case typeof response === 'string':
            response = `"${response.replace(/(?<!\\)"/g, '\\"')}"`;

            if(!space && /[\b\f\n\r\t\v]/g.test(response)) response = response.replace(/[\b\f\n\r\t\v]/g, match => '\\' + inspect(match).slice(2, -1));
            break;

        case typeof response === 'boolean':
            response = response ? 'True' : 'False';
            break;

        case typeof response === 'undefined':
            response = 'Undefined';
            break;

        case response === null:
            response = 'Null';
            break;

        case response instanceof Date:
            response = `"${response.toLocaleString('en-US')}".date`;
            break;

        case response instanceof RegExp:
            response = response.toString();
            break;
    }
    
    return response;
}

/**
 * @function stringify_object
 * @param {object} value JS Object to stringify into BCON text.
 * @param {(this:any, key:string, value:any) => any|null} replacer - A function that transforms the results.
 * @param {number|string} space - Adds indentation, white space, and line break characters to the return-value BCON text to make it easier to read.
 * @param {number} nesting - Number of nesting of currently stringified object.
 * @description Converts a JavaScript object to a Language for KONfiguration (BCON) string.
 * @returns {string}
 */

function stringify_object(value, replacer=null, space=0, nesting=1)
{
    let
        response = [];

    for(let key in value)
    {
        let
            line_value = `${addSpaces(space, nesting)}@${isNaN(key) ? key : '*'}${space ? ' ' : ''}=>${space ? ' ' : ''}`;

        if(isAssociativeArray(value[key]) || Array.isArray(value[key])) line_value += `[${stringify_object(value[key], replacer, space, nesting+1)}${(space ? '\n' : '') + addSpaces(space, nesting)}]`;
        else line_value += stringify_value(value[key], replacer, space);

        line_value += ';';

        response.push(line_value);
    }

    return (space ? '\n' : '') + response.join(space ? '\n' : '');
}

/**
 * @function stringify
 * @param {object} value JS Object to stringify into BCON text.
 * @param {(this:any, key:string, value:any) => any|null} replacer - A function that transforms the results.
 * @param {number|string} space - Adds indentation, white space, and line break characters to the return-value BCON text to make it easier to read.
 * @description Converts a JavaScript object to a Language for KONfiguration (BCON) string.
 * @returns {string}
 */

function stringify(value, replacer, space)
{
    if(!isAssociativeArray(value) && !Array.isArray(value)) throw TypeError('Trying to transform value that is not an object to BCON string.');

    return `[${space ? '\n' : ''}${ stringify_object(value, replacer, space) }${space ? '\n' : ''}];`
}

module.exports = stringify;