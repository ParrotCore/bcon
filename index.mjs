import { readFileSync, existsSync, lstatSync } from 'node:fs';
import { resolve as getAbsolutePath } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parse, stringify } from './parser/index.mjs';

// Global configuration
globalThis.__bconConfig = {
    default_path: process.cwd(),
    default_encoding: 'utf-8'
};

/**
 * @function init
 * @param {object} options
 * @param {boolean} options.allowGlobal
 * @param {boolean} options.allowRequire - Note: Custom loaders not supported in ESM, use import hooks instead
 * @param {object} options.config
 * @param {string|null} options.config.defaultPath
 * @param {string|null} options.config.defaultEncoding
 * @description This method is used to set up BCON.
 * @returns {void}
 */
function init({ allowGlobal = false, allowRequire = false, config: { defaultPath = null, defaultEncoding = null } = {} } = {}) {
    if (allowGlobal) globalThis.BCON = { config: __bconConfig, parse, stringify, init };
    
    if (allowRequire) {
        console.warn('BCON ESM: allowRequire is not supported in ES modules. Use dynamic import() instead: const config = await import("./file.bcon");');
    }

    if (defaultEncoding) {
        if (!Buffer.isEncoding(defaultEncoding)) throw Error(`Given encoding "${defaultEncoding}" is not handled encoding.`);
        __bconConfig.default_encoding = defaultEncoding;
    }

    if (defaultPath) {
        const
            isAvailable = existsSync(defaultPath),
            isDirectory = isAvailable ? lstatSync(defaultPath).isDirectory() : false,
            absolutePath = getAbsolutePath(defaultPath);

        if (!isAvailable) throw Error(`Directory "${absolutePath}" does not exist.`);
        if (!isDirectory) throw Error(`File "${absolutePath}" is not a directory.`);

        __bconConfig.default_path = absolutePath;
    }
}

const config = globalThis.__bconConfig;

export { config, parse, stringify, init };
export default { config, parse, stringify, init };
