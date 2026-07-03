#!/usr/bin/env node

// bin/pollob.js
// Eta CLI entry point. Terminal theke "pollob kichu.pks" likhle eta run hobe.

const fs = require("fs");
const path = require("path");
const { run } = require("../src/index");

const args = process.argv.slice(2);

function printHelp() {
  console.log(`
Pollob Lang CLI

Babohar:
  pollob <file.pks>      .pks file run korbe
  pollob --version      version dekhabe
  pollob --help         eita dekhabe

Udahoron:
  pollob examples/hello.pks
`);
}

function printVersion() {
  const pkg = require("../package.json");
  console.log(`pollob-lang v${pkg.version}`);
}

if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
  printHelp();
  process.exit(0);
}

if (args[0] === "--version" || args[0] === "-v") {
  printVersion();
  process.exit(0);
}

const filePath = args[0];

if (!filePath.endsWith(".pks")) {
  console.error(`Pollob Lang Error: file extension '.pks' hote hobe. Apni dilen: '${filePath}'`);
  process.exit(1);
}

const resolvedPath = path.resolve(process.cwd(), filePath);

if (!fs.existsSync(resolvedPath)) {
  console.error(`Pollob Lang Error: file paoa jacche na: '${filePath}'`);
  process.exit(1);
}

const source = fs.readFileSync(resolvedPath, "utf-8");
const result = run(source);

if (result.error) {
  process.exit(1);
}
