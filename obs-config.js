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

/*  external requirements  */
const yargs       = require("yargs")
const chalk       = require("chalk")
const stripAnsi   = require("strip-ansi")
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
        " [-p|--profile <profile-pattern>[,...]]" +
        " [-c|--collection <collection-pattern>[,...]]" +
        " <command> [...]\n" +
        "Usage: obs-config [...] locate             # locate and display all external assets\n" +
        "Usage: obs-config [...] consolidate        # locate and internalize external assets\n" +
        "Usage: obs-config [...] relocate           # relocate all internal assets (after directory change)\n" +
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
        .option("d", {
            alias:    "directory",
            type:     "string",
            describe: "OBS Studio configuration directory",
            default:  configDir
        })
        .option("p", {
            alias:    "profile",
            type:     "string",
            describe: "OBS Studio profile name pattern list",
            default:  "*"
        })
        .option("c", {
            alias:    "collection",
            type:     "string",
            describe: "OBS Studio scene collection name pattern list",
            default:  "*"
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
            msg = `pptx-surgeon: ${chalk.blue(logLevels[level])}: ${msg}\n`
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

    /*  dispatch commands  */
    const command = opts._[0]
    if (command === "locate") {
        if (opts._.length !== 1)
            fatal("locate: invalid numnber of arguments to command")
        log(0, "locate")
    }
    else if (command === "consolidate") {
        if (opts._.length !== 1)
            fatal("consolidate: invalid numnber of arguments to command")
        log(0, "consolidate")
    }
    else if (command === "relocate") {
        if (opts._.length !== 1)
            fatal("relocate: invalid numnber of arguments to command")
        log(0, "relocate")
    }
    else if (command === "export") {
        if (opts._.length !== 2)
            fatal("export: invalid numnber of arguments to command")
        const zipfile = opts._[1]
        log(0, `export: ${zipfile}`)
    }
    else if (command === "import") {
        if (opts._.length !== 2)
            fatal("import: invalid numnber of arguments to command")
        const zipfile = opts._[1]
        log(0, `import: ${zipfile}`)
    }

    /*  gracefully terminate  */
    process.exit(0)
})().catch((err) => {
    /*  fatal error  */
    process.stderr.write(`pptx-surgeon: ${chalk.red("ERROR:")} ${err.stack}\n`)
    process.exit(1)
})

