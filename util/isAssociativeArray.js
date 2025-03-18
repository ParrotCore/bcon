/**
 * @function is_associative_array
 * @param {*} value
 * @description Checks if given value is an associative array.
 * @returns {true|false}
 */
function is_associative_array(value)
{
    return typeof value === "object" && value !== null && !Array.isArray(value) && ![RegExp, Date].some(el => value instanceof el);
}

module.exports = is_associative_array;