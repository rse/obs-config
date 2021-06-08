
obs-config
==========

**OBS Studio Configuration Manager**

<p/>
<img src="https://nodei.co/npm/obs-config.png?downloads=true&stars=true" alt=""/>

<p/>
<img src="https://david-dm.org/rse/obs-config.png" alt=""/>

Abstract
--------

This is a small utility for managing the configuration files and
referenced media assets of [**OBS Studio**](https://obsproject.com).

Installation
------------

- download pre-built binary for Windows (x64):<br/>
  https://github.com/rse/obs-config/releases/download/0.9.0/obs-config-win-x64.exe

- download pre-built binary for macOS (x64):<br/>
  https://github.com/rse/obs-config/releases/download/0.9.0/obs-config-mac-x64

- download pre-built binary for GNU/Linux (x64):<br/>
  https://github.com/rse/obs-config/releases/download/0.9.0/obs-config-lnx-x64

- via Node.js/NPM for any platform:<br/>
  `$ npm install -g obs-config`

Usage
-----

```
$ obs-config \
  [-v|--verbose <level>]
  [-v|--verbose <level>]
  [-d|--directory <config-directory>]
  [-p|--profile <profile-pattern>[,...]]
  [-c|--collection <collection-pattern>[,...]]
  <command> [...]
$ obs-config [...] locate             # locate and display all external assets
$ obs-config [...] consolidate        # locate and internalize external assets
$ obs-config [...] relocate           # relocate all internal assets (after directory change)
$ obs-config [...] export <zip-file>  # export configuration and internal assets
$ obs-config [...] import <zip-file>  # import configuration and internal assets
```

License
-------

Copyright &copy; 2021 Dr. Ralf S. Engelschall (http://engelschall.com/)

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be included
in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

