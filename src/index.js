// index.js
// Eta library entry point. Lexer -> Parser -> Interpreter pipeline ekhane jora.

const { tokenize, LexerError } = require("./lexer");
const { parse, ParserError } = require("./parser");
const { Interpreter, RuntimeError } = require("./interpreter");

/**
 * Pollob Lang source code (string) run kore.
 * @param {string} source - .pks file er content
 * @returns {{output: string[]}} - print howa lines
 */
function run(source) {
  try {
    const tokens = tokenize(source);
    const ast = parse(tokens);
    const interpreter = new Interpreter();
    interpreter.run(ast);
    return { output: interpreter.output };
  } catch (err) {
    if (err instanceof LexerError || err instanceof ParserError || err instanceof RuntimeError) {
      console.error(err.message);
      process.exitCode = 1;
      return { output: [], error: err.message };
    }
    throw err;
  }
}

module.exports = { run, tokenize, parse, Interpreter };
