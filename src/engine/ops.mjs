export function evalOp(op, argsResolved) {
  switch (op) {
    case "add":
      return argsResolved.reduce((sum, val) => sum + val, 0);
    case "subtract":
      return argsResolved[0] - argsResolved[1];
    case "multiply":
      return argsResolved.reduce((product, val) => product * val, 1);
    case "divide":
      return argsResolved[0] / argsResolved[1];
    case "min":
      return Math.min(...argsResolved);
    case "max":
      return Math.max(...argsResolved);
    case "pow":
      return Math.pow(argsResolved[0], argsResolved[1]);
    case "identity":
      return argsResolved[0];
    default:
      throw new Error(`Unknown operation: ${op}`);
  }
}
