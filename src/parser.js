// parser.js
// Token list ke "AST" (Abstract Syntax Tree) e convert kore.
// AST mane code er structure ke tree hisebe represent kora, jeta interpreter
// pore execute korbe.

class ParserError extends Error {
  constructor(message, line) {
    super(`Pollob Lang Error (Line ${line}): ${message}`);
    this.line = line;
  }
}

class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.pos = 0;
  }

  peek(offset = 0) {
    return this.tokens[this.pos + offset];
  }

  current() {
    return this.tokens[this.pos];
  }

  advance() {
    const tok = this.tokens[this.pos];
    this.pos++;
    return tok;
  }

  check(type) {
    return this.current().type === type;
  }

  match(type) {
    if (this.check(type)) {
      return this.advance();
    }
    return null;
  }

  expect(type, message) {
    if (this.check(type)) {
      return this.advance();
    }
    const tok = this.current();
    throw new ParserError(
      message || `'${type}' ashbe bole asha korchilam, kintu '${tok.value}' pelam`,
      tok.line
    );
  }

  // ---------- Entry point ----------
  parseProgram() {
    this.expect("POLLOB", "Program shuru korte 'pollob start' likha lagbe");
    this.expect("START", "Program shuru korte 'pollob start' likha lagbe");

    const body = [];
    while (!this.check("POLLOB") && !this.check("EOF")) {
      body.push(this.parseStatement());
    }

    this.expect("POLLOB", "Program shesh korte 'pollob end' likha lagbe");
    this.expect("END", "Program shesh korte 'pollob end' likha lagbe");

    return { type: "Program", body };
  }

  // ---------- Statements ----------
  parseStatement() {
    if (this.check("BOLO")) return this.parsePrint();
    if (this.check("JODI")) return this.parseIf();
    if (this.check("EASY")) return this.parseForLoop();
    if (this.check("FAA")) return this.parseFunctionDecl();
    if (this.check("SWITCH")) return this.parseSwitch();
    if (this.check("THAMO")) return this.parseBreak();
    if (this.check("LBRACE")) return this.parseBlock();

    // Identifier hole - hoy assignment, hoy function call
    if (this.check("IDENTIFIER")) {
      if (this.peek(1) && this.peek(1).type === "ASSIGN") {
        return this.parseAssignment();
      }
      // function call statement: name(args);
      const expr = this.parseExpression();
      this.expect("SEMI", "Statement er shesh e ';' lagbe");
      return { type: "ExpressionStatement", expression: expr };
    }

    const tok = this.current();
    throw new ParserError(`Eta bujhlam na: '${tok.value}'`, tok.line);
  }

  parseBlock() {
    this.expect("LBRACE", "'{' expected");
    const body = [];
    while (!this.check("RBRACE") && !this.check("EOF")) {
      body.push(this.parseStatement());
    }
    this.expect("RBRACE", "'}' expected (block bondho hoyni)");
    return { type: "Block", body };
  }

  parsePrint() {
    const line = this.current().line;
    this.expect("BOLO", "'bolo' expected");
    this.expect("POLLOB", "'bolo' er por 'pollob' likhte hobe, jemon: bolo pollob \"text\";");

    const args = [this.parseExpression()];
    while (this.match("COMMA")) {
      args.push(this.parseExpression());
    }
    this.expect("SEMI", "'bolo pollob ...' er shesh e ';' lagbe");
    return { type: "Print", args, line };
  }

  parseAssignment() {
    const line = this.current().line;
    const name = this.expect("IDENTIFIER").value;
    this.expect("ASSIGN", "'=' expected");
    const value = this.parseExpression();
    this.expect("SEMI", "Assignment er shesh e ';' lagbe");
    return { type: "Assignment", name, value, line };
  }

  parseIf() {
    const line = this.current().line;
    this.expect("JODI", "'jodi' expected");
    this.expect("LPAREN", "'jodi' er por '(' lagbe");
    const test = this.parseExpression();
    this.expect("RPAREN", "')' expected");
    const consequent = this.parseBlock();

    const elseIfs = [];
    while (this.check("ABAR")) {
      this.advance();
      this.expect("LPAREN", "'abar' er por '(' lagbe");
      const elseIfTest = this.parseExpression();
      this.expect("RPAREN", "')' expected");
      const elseIfBody = this.parseBlock();
      elseIfs.push({ test: elseIfTest, body: elseIfBody });
    }

    let alternate = null;
    if (this.check("NAHOLA")) {
      this.advance();
      alternate = this.parseBlock();
    }

    return { type: "If", test, consequent, elseIfs, alternate, line };
  }

  parseForLoop() {
    const line = this.current().line;
    this.expect("EASY", "'easy' expected");
    this.expect("LOOP", "'easy' er por 'loop' likhte hobe");
    this.expect("LPAREN", "'easy loop' er por '(' lagbe");

    // init: IDENTIFIER = expr
    const initName = this.expect("IDENTIFIER", "loop er moddhe variable name lagbe").value;
    this.expect("ASSIGN", "'=' expected (loop init)");
    const initValue = this.parseExpression();
    this.expect("SEMI", "';' expected loop er init er por");

    const test = this.parseExpression();
    this.expect("SEMI", "';' expected loop er condition er por");

    const updateName = this.expect("IDENTIFIER", "loop er update part e variable name lagbe").value;
    this.expect("ASSIGN", "'=' expected (loop update)");
    const updateValue = this.parseExpression();

    this.expect("RPAREN", "')' expected");
    const body = this.parseBlock();

    return {
      type: "ForLoop",
      init: { name: initName, value: initValue },
      test,
      update: { name: updateName, value: updateValue },
      body,
      line,
    };
  }

  parseFunctionDecl() {
    const line = this.current().line;
    this.expect("FAA", "'faa' expected");
    const name = this.expect("IDENTIFIER", "function er naam lagbe").value;
    this.expect("LPAREN", "'(' expected");

    const params = [];
    if (!this.check("RPAREN")) {
      params.push(this.expect("IDENTIFIER", "parameter name lagbe").value);
      while (this.match("COMMA")) {
        params.push(this.expect("IDENTIFIER", "parameter name lagbe").value);
      }
    }
    this.expect("RPAREN", "')' expected");
    const body = this.parseBlock();

    return { type: "FunctionDecl", name, params, body, line };
  }

  parseSwitch() {
    const line = this.current().line;
    this.expect("SWITCH", "'switch' expected");
    this.expect("ON", "'switch' er por 'on' likhte hobe, jemon: switch on(x) { }");
    this.expect("LPAREN", "'(' expected");
    const discriminant = this.parseExpression();
    this.expect("RPAREN", "')' expected");
    this.expect("LBRACE", "'{' expected");

    const cases = [];
    let defaultCase = null;

    while (!this.check("RBRACE") && !this.check("EOF")) {
      if (this.check("DEFAULT")) {
        this.advance();
        this.expect("COLON", "'default' er por ':' lagbe");
        const body = [];
        while (
          !this.check("RBRACE") &&
          !this.check("DEFAULT")
        ) {
          // peek for next case label (NUMBER/STRING/TRUE/FALSE/NULL ':' )
          if (this.isCaseLabelAhead()) break;
          body.push(this.parseStatement());
        }
        defaultCase = { body };
        continue;
      }

      // case value: NUMBER | STRING | TRUE | FALSE | NULL | IDENTIFIER
      const valueNode = this.parsePrimary();
      this.expect("COLON", "case value er por ':' lagbe");

      const body = [];
      while (
        !this.check("RBRACE") &&
        !this.check("DEFAULT") &&
        !this.isCaseLabelAhead()
      ) {
        body.push(this.parseStatement());
      }
      cases.push({ value: valueNode, body });
    }

    this.expect("RBRACE", "'}' expected (switch bondho hoyni)");
    return { type: "Switch", discriminant, cases, defaultCase, line };
  }

  // switch er moddhe pore-r case label dekhar jonno chhoto lookahead helper
  isCaseLabelAhead() {
    const t = this.current();
    if (
      t.type === "NUMBER" ||
      t.type === "STRING" ||
      t.type === "TRUE" ||
      t.type === "FALSE" ||
      t.type === "NULL"
    ) {
      const next = this.peek(1);
      return next && next.type === "COLON";
    }
    return false;
  }

  parseBreak() {
    const line = this.current().line;
    this.expect("THAMO", "'thamo' expected");
    this.expect("SEMI", "'thamo' er por ';' lagbe");
    return { type: "Break", line };
  }

  // ---------- Expressions (precedence climbing) ----------
  parseExpression() {
    return this.parseLogicalOr();
  }

  parseLogicalOr() {
    let left = this.parseLogicalAnd();
    while (this.check("OR")) {
      const op = this.advance().value;
      const right = this.parseLogicalAnd();
      left = { type: "Logical", operator: op, left, right };
    }
    return left;
  }

  parseLogicalAnd() {
    let left = this.parseEquality();
    while (this.check("AND")) {
      const op = this.advance().value;
      const right = this.parseEquality();
      left = { type: "Logical", operator: op, left, right };
    }
    return left;
  }

  parseEquality() {
    let left = this.parseComparison();
    while (this.check("EQ") || this.check("NEQ")) {
      const op = this.advance().value;
      const right = this.parseComparison();
      left = { type: "Binary", operator: op, left, right };
    }
    return left;
  }

  parseComparison() {
    let left = this.parseTerm();
    while (
      this.check("LT") ||
      this.check("GT") ||
      this.check("LTE") ||
      this.check("GTE")
    ) {
      const op = this.advance().value;
      const right = this.parseTerm();
      left = { type: "Binary", operator: op, left, right };
    }
    return left;
  }

  parseTerm() {
    let left = this.parseFactor();
    while (this.check("PLUS") || this.check("MINUS")) {
      const op = this.advance().value;
      const right = this.parseFactor();
      left = { type: "Binary", operator: op, left, right };
    }
    return left;
  }

  parseFactor() {
    let left = this.parseUnary();
    while (this.check("STAR") || this.check("SLASH") || this.check("PERCENT")) {
      const op = this.advance().value;
      const right = this.parseUnary();
      left = { type: "Binary", operator: op, left, right };
    }
    return left;
  }

  parseUnary() {
    if (this.check("NOT") || this.check("MINUS")) {
      const op = this.advance().value;
      const right = this.parseUnary();
      return { type: "Unary", operator: op, right };
    }
    return this.parsePrimary();
  }

  parsePrimary() {
    const tok = this.current();

    if (tok.type === "NUMBER") {
      this.advance();
      return { type: "Literal", value: tok.value };
    }
    if (tok.type === "STRING") {
      this.advance();
      return { type: "Literal", value: tok.value };
    }
    if (tok.type === "TRUE") {
      this.advance();
      return { type: "Literal", value: true };
    }
    if (tok.type === "FALSE") {
      this.advance();
      return { type: "Literal", value: false };
    }
    if (tok.type === "NULL") {
      this.advance();
      return { type: "Literal", value: null };
    }
    if (tok.type === "LPAREN") {
      this.advance();
      const expr = this.parseExpression();
      this.expect("RPAREN", "')' expected");
      return expr;
    }
    if (tok.type === "IDENTIFIER") {
      this.advance();
      if (this.check("LPAREN")) {
        this.advance();
        const args = [];
        if (!this.check("RPAREN")) {
          args.push(this.parseExpression());
          while (this.match("COMMA")) {
            args.push(this.parseExpression());
          }
        }
        this.expect("RPAREN", "')' expected (function call)");
        return { type: "Call", name: tok.value, args, line: tok.line };
      }
      return { type: "Identifier", name: tok.value };
    }

    throw new ParserError(`Expression e ki ache eta bujhlam na: '${tok.value}'`, tok.line);
  }
}

function parse(tokens) {
  const parser = new Parser(tokens);
  return parser.parseProgram();
}

module.exports = { parse, Parser, ParserError };
