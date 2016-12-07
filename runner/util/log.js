const chalk = require('chalk');

/*
various level log messages
*/

function info(...args) {
  console.log(chalk.yellow(...toLog(args)));
}

function error(...args) {
  console.log(chalk.red(...toLog(args)));
}

function warn(...args) {
  console.log(chalk.magenta(...toLog(args)));
}

function debug(...args) {
  console.log(...args);
}

function trace(...args) {
  console.log(chalk.grey(...toLog(args)));
}

function toLog(args) {
  function toString(a) {
    let str;
    if (Array.isArray(a)) {
      return "[" + a.map(toString) + "]";
    }
    switch(typeof a) {
      case "object":
        str = a && a.toString();
        if (str === "[object Object]") return JSON.stringify(a);
        return str;
      default:
        return a;
    }
  }
  return args.map(toString);
}

module.exports = {
  trace,
  debug,
  info,
  warn,
  error,
}
