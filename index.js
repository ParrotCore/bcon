const
    { parse, stringify } = require('./parser'),
    
    {
        existsSync: exists,
        readFileSync: read,
        lstatSync: lstat
    } = require('node:fs'),
    {
        resolve: getAbsolutePath
    } = require('node:path');

global.__bconConfig = {
    default_path: __dirname,
    default_encoding: 'utf-8'
};

/**
 * @function init
 * @param {object} options
 * @param {boolean} options.allowGlobal
 * @param {boolean} options.allowRequire
 * @param {object} options.config
 * @param {string|null} options.config.defaultPath
 * @param {string|null} options.config.defaultEncoding
 * @description This method is used to set up BCON. You may need it in global BCON variable, or wish to require() BCON files.
 * @returns {void}
 */
function init({ allowGlobal=false, allowRequire=false, config:{ defaultPath=null, defaultEncoding=null }={} }={})
{
    if(allowGlobal) global.BCON = module.exports;
    if(allowRequire) require.extensions['.bcon'] = (mod, filename) => {
        try
        {
            const
                PARSED = parse(
                    read(
                        filename,
                        __bconConfig.default_encoding
                    )
                );

            mod.exports = PARSED;
        }
        catch(error)
        {
            error.stack += `\n    at: ${filename}`;
            throw error;
        }
    };

    if(defaultEncoding)
    {
        if(!Buffer.isEncoding(defaultEncoding)) throw Error(`Given encoding "${defaultEncoding}" is not handled encoding.`);
        __bconConfig.default_encoding = defaultEncoding;
    }

    if(defaultPath)
    {
        const
            isAvailable = exists(defaultPath),
            isDirectory = isAvailable ? lstat(defaultPath).isDirectory() : false,
            absolutePath = getAbsolutePath(defaultPath);

        if(!isAvailable) throw Error(`Directory "${absolutePath}" does not exist.`);
        if(!isDirectory) throw Error(`File "${absolutePath}" is not a directory.`);

        __bconConfig.default_path = absolutePath;
    }
}

module.exports = {
    config: __bconConfig,
    parse,
    stringify,
    init
}