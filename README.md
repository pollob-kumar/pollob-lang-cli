# Pollob Lang 🇧🇩

Bangla-flavored toy programming language. File extension: **`.pks`**

bhailang theke inspired hoye banano - kintu nijer keyword shoho.

## Install

```bash
npm install -g pollob-lang-cli
```

## Run kora

```bash
pollob amar-code.pks
```

## Syntax

### Program structure

Shob program `pollob start` diye shuru hoy ar `pollob end` diye shesh hoy.

```
pollob start
    ...code...
pollob end
```

### Print kora

```
bolo pollob "Hello World!";
bolo pollob "Value:", a;
```

### Variable

Kono special keyword lagena, shoja `=` diye assign korle hobe.

```
a = 10;
b = "ekta string";
c = true;
d = null;
```

### If / Else-if / Else

```
jodi (boyosh < 13) {
    bolo pollob "Bacha";
} abar (boyosh < 20) {
    bolo pollob "Teenager";
} nahola {
    bolo pollob "Boro manush";
}
```

### Loop (for)

```
easy loop (i = 0; i < 10; i = i + 1) {
    bolo pollob i;
}
```

### Break

`thamo;` likhle loop ba switch theke bairer hoye jaben.

```
easy loop (i = 0; i < 10; i = i + 1) {
    jodi (i == 5) {
        thamo;
    }
    bolo pollob i;
}
```

### Function

```
faa welcome(naam) {
    bolo pollob "Welcome,", naam;
}

welcome("Pollob");
```

### Switch case

```
switch on(din) {
    1:
        bolo pollob "Sombar";
        thamo;
    2:
        bolo pollob "Mongolbar";
        thamo;
    default:
        bolo pollob "Janina";
}
```

### True / False / Null

```
a = true;
b = false;
c = null;
```

## Keyword Table

| Keyword | Kaaj |
|---|---|
| `pollob start` | Program shuru |
| `pollob end` | Program shesh |
| `bolo pollob` | Print kora |
| `jodi` | if |
| `abar` | else if |
| `nahola` | else |
| `easy loop()` | for loop |
| `true` | boolean true |
| `false` | boolean false |
| `thamo` | break |
| `null` | empty/faka value |
| `faa` | function declare |
| `switch on()` | switch-case |
| `default` | switch er default case |

## Operators

`+` `-` `*` `/` `%` `==` `!=` `<` `>` `<=` `>=` `&&` `||` `!`

## Examples

`examples/` folder e kichu sample code ache:

- `hello.pks` - shoja print + variable
- `if-else.pks` - jodi/abar/nahola
- `loop.pks` - easy loop + thamo
- `function.pks` - faa function
- `switch.pks` - switch on()

## License

MIT
