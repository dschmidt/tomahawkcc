# tomahawkcc

> Tools to compile tomahawk javascript plugins from multi-file ES2015 source to a single ES5 file

<hr/>
**WARNING: This is highly experimental and WIP**
<hr/>

## Installation

Assuming you have a working [Node.js](https://nodejs.org) installation, simply run the following command in your terminal

```bash
npm install -g dschmidt/tomahawkcc
```

and you should have the `tomahawkcc` command available.

If you don't have Node.js installed, consider using [nvm](https://github.com/creationix/nvm) or similar.

## Usage

Simply go to the `tomahawk-resolvers` root folder and invoke it like so:

```bash
tomahawkcc soundcloud/content/contents/code/soundcloud.js > outputfile.js
```

## Build standalone executable

```bash
jx package index.js "tomahawkcc" --extract-what "*.node,./content" --extract-overwrite --extract-verbose --extract-app-root --native
```
