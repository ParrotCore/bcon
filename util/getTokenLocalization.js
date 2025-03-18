const
    getLine = require('./getLine'),
    getMark = require('./getMark');

/**
 * 
 * @param {string} string - LKON code string.
 * @param {number} index - Index of token  in string. 
 * @description Gets and formats string to provide information about where token with specified index appears in given string.
 * @returns {"<row>:<column>"} String made of row and column where token starts in string.
 */

function get_token_localization(string, index)
{
    const
        ROW = getLine(string, index),
        COL = getMark(string, index)

    return `${ROW}:${COL}`
}

module.exports = get_token_localization;