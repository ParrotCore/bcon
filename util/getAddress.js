/**
 * @function string_to_address
 * @param {string} str - String representing path to value in object.
 * @description Parses path string to the array of indexes/keys to get through in specified order.
 * @returns {[...String, ...Number]} - Array of indexes/keys to get through in specified order. 
 */

function string_to_address (str)
{
    const
        arr = str
            .replace(/\.([a-zA-Z_][a-zA-Z0-9_]*)/g, '[$1]')
            .split(/\](?!\[)|(?<!\])\[|\]\[/)
            .slice(0, -1);
    for(let i in arr) if(!isNaN(arr[i])) arr[i] = Number(arr[i]);

    return arr;
}

/**
 * @function get_address
 * @param {Object} obj - Object which script has to move through.
 * @param {[...String, ...Number]|String} path - Path of property to get.
 * @description Moves through the given object to get the object from specified path.
 * @returns {any|void} Value that appears at specified path in given object, or undefined.
 */

function get_address(obj, path) {
    if(typeof path === 'string') path = string_to_address(path);
    if(!Array.isArray(path)) throw new TypeError('"path" argument must be type of string or array.');

    let
        res = obj;

    for(const key of path)
    {
        if(res === undefined || res === null) throw Error(`Cannot read property "${key}" of ${typeof res}.`)
        res = res[key];
    }

    return res;
}

module.exports = get_address;