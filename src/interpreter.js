// interpreter.js
// AST (tree) ke "walk" kore actual kaaj kore - print kora, condition check kora,
// loop chalano, function call kora etc.

class RuntimeError extends Error {
  constructor(message, line) {
    super(`Pollob Lang Error (Line ${line ?? "?"}): ${message}`);
    this.line = line;
  }
}

// Loop break korar jonno special "signal" - thamo; pele eta throw kora hoy
// ar loop er moddhe catch kore loop bondho kora hoy.
class BreakSignal {}

class Environment {
  constructor(parent = null) {
    this.vars = new Map();
    this.parent = parent;
  }

  define(name, value) {
    this.vars.set(name, value);
  }

  set(name, value) {
    if (this.vars.has(name)) {
      this.vars.set(name, value);
      return;
    }
    if (this.parent) {
      this.parent.set(name, value);
      return;
    }
    // Notun variable, top-level e e create hobe
    this.vars.set(name, value);
  }

  get(name, line) {
    if (this.vars.has(name)) return this.vars.get(name);
    if (this.parent) return this.parent.get(name, line);
    throw new RuntimeError(`'${name}' kono variable ba function paoa jacche na`, line);
  }
}

class Interpreter {
  constructor() {
    this.globals = new Environment();
    this.functions = new Map();
    this.output = []; // print howa shob line ekhane jome (CLI o use korte parbe)
  }

  run(program) {
    // Function gulo age sob register kore newa hoy, jate jekhane theke
    // call hok kaaj korbe.
    for (const stmt of program.body) {
      if (stmt.type === "FunctionDecl") {
        this.functions.set(stmt.name, stmt);
      }
    }
    for (const stmt of program.body) {
      if (stmt.type !== "FunctionDecl") {
        this.execStatement(stmt, this.globals);
      }
    }
  }

  execBlock(block, env) {
    for (const stmt of block.body) {
      this.execStatement(stmt, env);
    }
  }

  execStatement(stmt, env) {
    switch (stmt.type) {
      case "Print":
        return this.execPrint(stmt, env);
      case "Assignment":
        return env.set(stmt.name, this.evalExpr(stmt.value, env));
      case "If":
        return this.execIf(stmt, env);
      case "ForLoop":
        return this.execForLoop(stmt, env);
      case "Switch":
        return this.execSwitch(stmt, env);
      case "Break":
        throw new BreakSignal();
      case "Block":
        return this.execBlock(stmt, new Environment(env));
      case "ExpressionStatement":
        return this.evalExpr(stmt.expression, env);
      case "FunctionDecl":
        // Function gulo run() er shuru e already register kora hoy.
        return;
      default:
        throw new RuntimeError(`Eta execute korte jani na: ${stmt.type}`, stmt.line);
    }
  }

  execPrint(stmt, env) {
    const values = stmt.args.map((arg) => this.evalExpr(arg, env));
    const line = values.map((v) => this.stringify(v)).join(" ");
    console.log(line);
    this.output.push(line);
  }

  execIf(stmt, env) {
    if (this.isTruthy(this.evalExpr(stmt.test, env))) {
      return this.execBlock(stmt.consequent, new Environment(env));
    }
    for (const branch of stmt.elseIfs) {
      if (this.isTruthy(this.evalExpr(branch.test, env))) {
        return this.execBlock(branch.body, new Environment(env));
      }
    }
    if (stmt.alternate) {
      return this.execBlock(stmt.alternate, new Environment(env));
    }
  }

  execForLoop(stmt, env) {
    const loopEnv = new Environment(env);
    loopEnv.define(stmt.init.name, this.evalExpr(stmt.init.value, env));

    try {
      while (this.isTruthy(this.evalExpr(stmt.test, loopEnv))) {
        try {
          this.execBlock(stmt.body, new Environment(loopEnv));
        } catch (e) {
          if (e instanceof BreakSignal) throw e;
          throw e;
        }
        loopEnv.set(stmt.update.name, this.evalExpr(stmt.update.value, loopEnv));
      }
    } catch (e) {
      if (e instanceof BreakSignal) return; // thamo; loop ke just stop kore dey
      throw e;
    }
  }

  execSwitch(stmt, env) {
    const value = this.evalExpr(stmt.discriminant, env);
    let matched = false;

    try {
      for (const c of stmt.cases) {
        const caseValue = this.evalExpr(c.value, env);
        if (!matched && this.looseEquals(value, caseValue)) {
          matched = true;
        }
        if (matched) {
          for (const s of c.body) this.execStatement(s, env);
        }
      }
      if (!matched && stmt.defaultCase) {
        for (const s of stmt.defaultCase.body) this.execStatement(s, env);
      }
    } catch (e) {
      if (e instanceof BreakSignal) return; // thamo; switch theke beriye ashe
      throw e;
    }
  }

  callFunction(name, args, line) {
    const fn = this.functions.get(name);
    if (!fn) {
      throw new RuntimeError(`'${name}' naame kono function pawa jacche na`, line);
    }
    const fnEnv = new Environment(this.globals);
    fn.params.forEach((param, idx) => {
      fnEnv.define(param, args[idx] !== undefined ? args[idx] : null);
    });
    try {
      this.execBlock(fn.body, fnEnv);
    } catch (e) {
      if (e instanceof BreakSignal) {
        // function er moddhe thamo; likhle just function ta thambe
        return null;
      }
      throw e;
    }
    return null;
  }

  evalExpr(node, env) {
    switch (node.type) {
      case "Literal":
        return node.value;
      case "Identifier":
        return env.get(node.name);
      case "Call":
        return this.callFunction(node.name, node.args.map((a) => this.evalExpr(a, env)), node.line);
      case "Unary":
        return this.evalUnary(node, env);
      case "Binary":
        return this.evalBinary(node, env);
      case "Logical":
        return this.evalLogical(node, env);
      default:
        throw new RuntimeError(`Eta evaluate korte jani na: ${node.type}`);
    }
  }

  evalUnary(node, env) {
    const right = this.evalExpr(node.right, env);
    if (node.operator === "-") return -right;
    if (node.operator === "!") return !this.isTruthy(right);
  }

  evalBinary(node, env) {
    const left = this.evalExpr(node.left, env);
    const right = this.evalExpr(node.right, env);

    switch (node.operator) {
      case "+":
        if (typeof left === "string" || typeof right === "string") {
          return this.stringify(left) + this.stringify(right);
        }
        return left + right;
      case "-":
        return left - right;
      case "*":
        return left * right;
      case "/":
        return left / right;
      case "%":
        return left % right;
      case "==":
        return this.looseEquals(left, right);
      case "!=":
        return !this.looseEquals(left, right);
      case "<":
        return left < right;
      case ">":
        return left > right;
      case "<=":
        return left <= right;
      case ">=":
        return left >= right;
      default:
        throw new RuntimeError(`Eta operator chini na: ${node.operator}`);
    }
  }

  evalLogical(node, env) {
    const left = this.evalExpr(node.left, env);
    if (node.operator === "&&") {
      return this.isTruthy(left) ? this.evalExpr(node.right, env) : left;
    }
    if (node.operator === "||") {
      return this.isTruthy(left) ? left : this.evalExpr(node.right, env);
    }
  }

  isTruthy(value) {
    if (value === null) return false;
    if (value === false) return false;
    return true;
  }

  looseEquals(a, b) {
    return a === b;
  }

  stringify(value) {
    if (value === null) return "faka";
    if (value === true) return "true";
    if (value === false) return "false";
    return String(value);
  }
}

module.exports = { Interpreter, RuntimeError, BreakSignal };
