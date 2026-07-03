// lexer.js
// Pollob Lang er source code ke "token" er list e bhag kore.
// Token mane chhoto chhoto unit - jemon keyword, number, string, operator etc.

const KEYWORDS = {
  pollob: "POLLOB",
  start: "START",
  end: "END",
  bolo: "BOLO",
  jodi: "JODI",
  abar: "ABAR",
  nahola: "NAHOLA",
  easy: "EASY",
  loop: "LOOP",
  true: "TRUE",
  false: "FALSE",
  thamo: "THAMO", // break
  null: "NULL",
  faa: "FAA", // function declare
  switch: "SWITCH",
  on: "ON",
  default: "DEFAULT",
};

class Token {
  constructor(type, value, line) {
    this.type = type;
    this.value = value;
    this.line = line;
  }
}

class LexerError extends Error {
  constructor(message, line) {
    super(`Pollob Lang Error (Line ${line}): ${message}`);
    this.line = line;
  }
}

function isDigit(ch) {
  return ch >= "0" && ch <= "9";
}

function isAlpha(ch) {
  return /[a-zA-Z_]/.test(ch);
}

function isAlphaNumeric(ch) {
  return isAlpha(ch) || isDigit(ch);
}

function tokenize(source) {
  const tokens = [];
  let i = 0;
  let line = 1;
  const len = source.length;

  while (i < len) {
    const ch = source[i];

    // Newline gunlo line number track korar jonno
    if (ch === "\n") {
      line++;
      i++;
      continue;
    }

    // Whitespace skip
    if (ch === " " || ch === "\t" || ch === "\r") {
      i++;
      continue;
    }

    // Comments: // ... (line shesh porjonto)
    if (ch === "/" && source[i + 1] === "/") {
      while (i < len && source[i] !== "\n") i++;
      continue;
    }

    // String literal: "..." ba '...'
    if (ch === '"' || ch === "'") {
      const quote = ch;
      let str = "";
      const startLine = line;
      i++;
      while (i < len && source[i] !== quote) {
        if (source[i] === "\n") line++;
        str += source[i];
        i++;
      }
      if (i >= len) {
        throw new LexerError("String shesh hoyni, quote (\" ba ') missing", startLine);
      }
      i++; // closing quote skip
      tokens.push(new Token("STRING", str, startLine));
      continue;
    }

    // Number literal
    if (isDigit(ch)) {
      let num = "";
      while (i < len && isDigit(source[i])) {
        num += source[i];
        i++;
      }
      if (source[i] === "." && isDigit(source[i + 1])) {
        num += source[i];
        i++;
        while (i < len && isDigit(source[i])) {
          num += source[i];
          i++;
        }
      }
      tokens.push(new Token("NUMBER", parseFloat(num), line));
      continue;
    }

    // Identifier ba keyword
    if (isAlpha(ch)) {
      let word = "";
      while (i < len && isAlphaNumeric(source[i])) {
        word += source[i];
        i++;
      }
      if (KEYWORDS.hasOwnProperty(word)) {
        tokens.push(new Token(KEYWORDS[word], word, line));
      } else {
        tokens.push(new Token("IDENTIFIER", word, line));
      }
      continue;
    }

    // Multi-character operators
    const two = source.substr(i, 2);
    if (two === "==") {
      tokens.push(new Token("EQ", "==", line));
      i += 2;
      continue;
    }
    if (two === "!=") {
      tokens.push(new Token("NEQ", "!=", line));
      i += 2;
      continue;
    }
    if (two === "<=") {
      tokens.push(new Token("LTE", "<=", line));
      i += 2;
      continue;
    }
    if (two === ">=") {
      tokens.push(new Token("GTE", ">=", line));
      i += 2;
      continue;
    }
    if (two === "&&") {
      tokens.push(new Token("AND", "&&", line));
      i += 2;
      continue;
    }
    if (two === "||") {
      tokens.push(new Token("OR", "||", line));
      i += 2;
      continue;
    }

    // Single-character tokens
    const singleMap = {
      "+": "PLUS",
      "-": "MINUS",
      "*": "STAR",
      "/": "SLASH",
      "%": "PERCENT",
      "=": "ASSIGN",
      "<": "LT",
      ">": "GT",
      "!": "NOT",
      "(": "LPAREN",
      ")": "RPAREN",
      "{": "LBRACE",
      "}": "RBRACE",
      ";": "SEMI",
      ",": "COMMA",
      ":": "COLON",
    };

    if (singleMap.hasOwnProperty(ch)) {
      tokens.push(new Token(singleMap[ch], ch, line));
      i++;
      continue;
    }

    throw new LexerError(`Eta ki character bujhlam na: '${ch}'`, line);
  }

  tokens.push(new Token("EOF", null, line));
  return tokens;
}

module.exports = { tokenize, Token, LexerError };
