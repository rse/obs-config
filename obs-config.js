#!/usr/bin/env node
/*!
**  obs-config -- OBS Studio Configuration Manager
**  Copyright (c) 2021 Dr. Ralf S. Engelschall <rse@engelschall.com>
**
**  Permission is hereby granted, free of charge, to any person obtaining
**  a copy of this software and associated documentation files (the
**  "Software"), to deal in the Software without restriction, including
**  without limitation the rights to use, copy, modify, merge, publish,
**  distribute, sublicense, and/or sell copies of the Software, and to
**  permit persons to whom the Software is furnished to do so, subject to
**  the following conditions:
**
**  The above copyright notice and this permission notice shall be included
**  in all copies or substantial portions of the Software.
**
**  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
**  EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
**  MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
**  IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
**  CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
**  TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
**  SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

/*  internal requirements  */
const os          = require("os")
const path        = require("path")
const fs          = require("fs")

/*  external requirements  */
const yargs       = require("yargs")
const chalk       = require("chalk")
const stripAnsi   = require("strip-ansi")
const glob        = require("glob-promise")
const minimatch   = require("minimatch")
// const jsYAML      = require("js-yaml")

/*  own package information  */
// const my          = require("./package.json")

;(async () => {
    /*  determine default configuration directory  */
    let configDir = ""
    if (os.platform() === "win32")
        configDir = path.join(process.env["APPDATA"], "obs-studio")
    else if (os.platform() === "darwin")
        configDir = path.join(process.env["HOME"], "Library", "Application Support", "obs-studio")
    else if (os.platform() === "linux")
        configDir = path.join(process.env["HOME"], ".config", "obs-studio")

    /*  parse command-line options  */
    const usage =
        "Usage: obs-config " +
        " [-v|--verbose <level>]" +
        " [-d|--directory <config-directory>]" +
        " [-g|--global]" +
        " [-p|--profile <pattern-list>[,...]]" +
        " [-c|--collection <pattern-list>[,...]]" +
        " [-a|--asset <pattern-list>[,...]]" +
        " <command> [...]\n" +
        "Usage: obs-config [...] locate             # locate and display all assets\n" +
        "Usage: obs-config [...] resolve            # locate and resolve all assets\n" +
        "Usage: obs-config [...] consolidate        # locate and internalize external assets\n" +
        "Usage: obs-config [...] abbreviate         # abbreviate all internal assets (before installation)\n" +
        "Usage: obs-config [...] relocate           # relocate   all internal assets (after installation)\n" +
        "Usage: obs-config [...] prune              # prune  configuration and internal assets\n" +
        "Usage: obs-config [...] export <zip-file>  # export configuration and internal assets\n" +
        "Usage: obs-config [...] import <zip-file>  # import configuration and internal assets"
    const opts = yargs()
        .parserConfiguration({
            "set-placeholder-key": true,
            "halt-at-non-option":  true
        })
        .usage(usage)
        .option("v", {
            alias:    "verbose",
            type:     "number",
            describe: "level of verbose output",
            nargs:    1,
            default:  0
        })
        .option("g", {
            alias:    "global",
            type:     "boolean",
            describe: "OBS Studio global settings",
            default:  true
        })
        .option("d", {
            alias:    "directory",
            type:     "string",
            describe: "OBS Studio configuration directory",
            nargs:    1,
            default:  configDir
        })
        .option("p", {
            alias:    "profile",
            type:     "string",
            describe: "OBS Studio profile name pattern list",
            nargs:    1,
            default:  "*"
        })
        .option("c", {
            alias:    "collection",
            type:     "string",
            describe: "OBS Studio scene collection name pattern list",
            nargs:    1,
            default:  "*"
        })
        .option("a", {
            alias:    "asset",
            type:     "string",
            describe: "OBS Studio asset path pattern list",
            nargs:    1,
            default:  "**"
        })
        .version(false)
        .help(true)
        .showHelpOnFail(true)
        .strict(true)
        .parse(process.argv.slice(2))
    if (opts._.length < 1) {
        process.stderr.write(`${usage}\n`)
        process.exit(1)
    }

    /*  helper function for verbose log output  */
    const logLevels = [ "NONE", chalk.blue("INFO"), chalk.yellow("DEBUG") ]
    const log = (level, msg) => {
        if (level > 0 && level < logLevels.length && level <= opts.verbose) {
            msg = `obs-config: ${chalk.blue(logLevels[level])}: ${msg}\n`
            if (opts.outputNocolor || !process.stderr.isTTY)
                msg = stripAnsi(msg)
            process.stderr.write(msg)
        }
    }

    /*  helper function for fatal error  */
    const fatal = (msg) => {
        process.stderr.write(`obs-studio: ${chalk.red("ERROR")}: ${msg}\n`)
        process.exit(1)
    }

    /*  sanity check options  */
    if (opts.directory === "")
        fatal("no OBS Studio configuration directory configured")

    /*  check whether element of a list should be taken  */
    const shouldTakeElement = (element, filter) => {
        let take = false
        for (const f of filter.split(/(?<!\\),/)) {
            let pattern = f
            let m
            let negate = false
            if ((m = f.match(/^!(.+)$/)) !== null) {
                negate = true
                pattern = m[1]
            }
            if (minimatch(element, pattern, { dot: true })) {
                if (!take && !negate)
                    take = true
                else if (take && negate)
                    take = false
            }
        }
        return take
    }

    /*  parse asset references  */
    const parseAssets = (data, type) => {
        const assets = []
        const regexps = [
            { re: /"((?:file:(?:\/\/)?)?(?:[A-Za-z]:)?(?:\/(?:\\"|[^/"])+)+\/((?:\\"|[^/"])+?)(\?[a-zA-Z][a-zA-Z0-9]*=.+)?)"/g, q: '"', s: "/"  },
            { re: /'((?:file:(?:\/\/)?)?(?:[A-Za-z]:)?(?:\/(?:\\'|[^/'])+)+\/((?:\\'|[^/'])+?)(\?[a-zA-Z][a-zA-Z0-9]*=.+)?)'/g, q: "'", s: "/"  },
            { re: /"((?:file:(?:\\\\)?)?(?:[A-Za-z]:)?(?:\\(?:\\"|[^\"])+)+\\((?:\\"|[^\"])+?)(\?[a-zA-Z][a-zA-Z0-9]*=.+)?)"/g, q: '"', s: "\\" },
            { re: /'((?:file:(?:\\\\)?)?(?:[A-Za-z]:)?(?:\\(?:\\'|[^\'])+)+\\((?:\\'|[^\'])+?)(\?[a-zA-Z][a-zA-Z0-9]*=.+)?)'/g, q: "'", s: "\\" },
        ]
        for (item of regexps) {
            while ((m = item.re.exec(data)) !== null) {
                if (shouldTakeElement(m[1], opts.asset)) {
                    let path = m[1]
                    if (type === "ini")
                        path = path
                            .replaceAll("\\\\\\\\", "\\")
                            .replaceAll("\\" + item.s, item.s)
                    else
                        path = path
                            .replaceAll("\\\\", "\\")
                            .replaceAll("\\" + item.s, item.s)
                    assets.push({
                        ref:   m[0],
                        idx:   m.index,
                        text:  m[1],
                        path:  path,
                        file:  m[2],
                        query: m[3]
                    })
                }
            }
        }
        return assets
    }

    /*  load configuration  */
    const pathExists = (p) =>
        fs.promises.access(p, fs.constants.F_OK).then(() => true).catch(() => false)
    const loadConfig = async () => {
        let config = []

        /*  load global settings  */
        if (opts.global) {
            const file = path.join(opts.directory, "global.ini")
            if (pathExists(file)) {
                log(2, `load [GLOBAL]     "global.ini"`)
                const data = await fs.promises.readFile(file, { encoding: "utf8" })
                const assets = parseAssets(data, "ini")
                config.push({
                    type:   "global",
                    path:   "global.ini",
                    data:   data,
                    assets: assets
                })
            }
        }

        /*  load profiles  */
        if (opts.profile !== "") {
            const profiles = await glob("*", { cwd: path.join(opts.directory, "basic", "profiles") })
            for (const profile of profiles) {
                if (shouldTakeElement(profile, opts.profile)) {
                    const files = await glob("*.json", { cwd: path.join(opts.directory, "basic", "profiles", profile) })
                    for (const file of files) {
                        log(2, `load [PROFILE]    "basic/profiles/${profile}/${file}"`)
                        const data = await fs.promises.readFile(path.join(opts.directory, "basic", "profiles", profile, file), { encoding: "utf8" })
                        const assets = parseAssets(data, "json")
                        config.push({
                            type:   "profile",
                            path:   `basic/profiles/${profile}/${file}`,
                            data:   data,
                            assets: assets
                        })
                    }
                }
            }
        }

        /*  load scene collections  */
        if (opts.collection !== "") {
            const collections = await glob("*.json", { cwd: path.join(opts.directory, "basic", "scenes") })
            for (const file of collections) {
                const collection = file.replace(/\.json$/, "")
                if (shouldTakeElement(collection, opts.collection)) {
                    log(2, `load [COLLECTION] "basic/scenes/${file}"`)
                    const data = await fs.promises.readFile(path.join(opts.directory, "basic", "scenes", file), { encoding: "utf8" })
                    const assets = parseAssets(data, "json")
                    config.push({
                        type:   "collection",
                        path:   `basic/scenes/${file}`,
                        data:   data,
                        assets: assets
                    })
                }
            }
        }

        return config
    }

    /*  dispatch commands  */
    const command = opts._[0]
    if (command === "locate") {
        if (opts._.length !== 1)
            fatal("locate: invalid numnber of arguments to command")
        const config = await loadConfig()
        for (const c of config) {
            process.stdout.write(`[${c.type}] ${c.path}:\n`)
            for (const asset of c.assets)
                process.stdout.write(`    [asset] ${asset.file} ${asset.path}\n`)
        }
    }
    else if (command === "resolve") {
        if (opts._.length !== 1)
            fatal("resolve: invalid numnber of arguments to command")
        log(1, "resolve")
    }
    else if (command === "consolidate") {
        if (opts._.length !== 1)
            fatal("consolidate: invalid numnber of arguments to command")
        log(1, "consolidate")
    }
    else if (command === "abbreviate") {
        if (opts._.length !== 1)
            fatal("abbreviate: invalid numnber of arguments to command")
        log(1, "abbreviat")
    }
    else if (command === "relocate") {
        if (opts._.length !== 1)
            fatal("relocate: invalid numnber of arguments to command")
        log(1, "relocate")
    }
    else if (command === "prune") {
        if (opts._.length !== 1)
            fatal("prune: invalid numnber of arguments to command")
        log(1, "prune")
    }
    else if (command === "export") {
        if (opts._.length !== 2)
            fatal("export: invalid numnber of arguments to command")
        const zipfile = opts._[1]
        log(1, `export: ${zipfile}`)
    }
    else if (command === "import") {
        if (opts._.length !== 2)
            fatal("import: invalid numnber of arguments to command")
        const zipfile = opts._[1]
        log(1, `import: ${zipfile}`)
    }
    else
        fatal(`invalid command "${command}"`)

    /*  gracefully terminate  */
    process.exit(0)
})().catch((err) => {
    /*  fatal error  */
    process.stderr.write(`obs-config: ${chalk.red("ERROR:")} ${err.stack}\n`)
    process.exit(1)
})

