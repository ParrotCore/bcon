/**
 * @function get_line
 * @param {string} string - String representing LKON code.
 * @param {number} index - Index of token.
 * @description It's used to get a number of line where the character with specified index appears.
 * @returns {number} Number of line where given index leads.
 */

function get_line (string, index)
{
    let
        line_number = 0;

    for(let i = 0; i < index; i++)
    {
        // CRLF
        if(string[i] + string[i+1] === '\r\n')
        {
            i++;
            line_number++;
        }
        // LF & CR
        else if(string[i] === '\r' || string[i] === '\n') line_number++
    }

    return line_number + 1;
}

module.exports = get_line;