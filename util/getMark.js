/**
 * @function get_mark
 * @param {string} string - String representing LKON code.
 * @param {number} index - Index of token.
 * @description It's used to get a number of character at specified index relatively to the line where it appears.
 * @returns {number} Number of character, relative to the line.
 */


function get_mark (string, index)
{
    let
        mark_number = string.slice(0, index);

    mark_number = mark_number.split(/\r\n|(?<!\r)\n|\r(?!\n)/).pop();

    return mark_number.length + 1;
}

module.exports = get_mark;