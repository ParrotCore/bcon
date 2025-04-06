/**
 * @function addSpaces
 * @param {number|"\\t"|"\\n"|" "} spaces - Whitespace character, or number of spaces.
 * @param {number} nesting - Number of current nesting. 
 * @description Returns whitespaces.
 * @returns {string}
 */

function add_spaces(spaces, nesting)
{
    if(!spaces || !nesting) return '';
    if((typeof spaces !=='string' || !/^\s$/.test(spaces)) && isNaN(spaces)) throw new TypeError('"spaces" argument must be a whitespace character, or a number.');

    let
        str;

    if(isNaN(spaces))
    {
        str = Array.from({ length: Number(spaces) * nesting }, () => ' ');
    }
    else
    {
        str = Array.from({ length: nesting }, () => spaces)
    }

    return str.join('');
}

module.exports = add_spaces;