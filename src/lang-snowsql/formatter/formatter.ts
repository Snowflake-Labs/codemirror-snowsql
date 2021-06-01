import {
  Tree,
  TreeFragment,
  stringInput,
  NodeType,
  Input,
  TreeCursor,
} from "lezer-tree";
import { parser } from "lezer-snowsql";

let doc1 = `select foo from (select bar from foobar) as bar where foo > 50;`; //your query to be formatterd here

function parse(d: string, fragments?: readonly TreeFragment[] | any) {
  let parse = parser.startParse(stringInput(d), 0, { fragments }),
    result: Tree | null | any;
  while (!(result = parse.advance())) {}
  return result;
}

var val = parse(doc1);

console.log("\n---\nOriginal Query: \n" + doc1 + "\n----");

function focusedNode(cursor: TreeCursor): {
  readonly type: NodeType;
  readonly from: number;
  readonly to: number;
} {
  const { type, from, to } = cursor;
  return { type, from, to };
}

enum Color {
  Red = 31,
  Green = 32,
  Yellow = 33,
}

function colorize(value: any, color: number): string {
  return "\u001b[" + color + "m" + String(value) + "\u001b[39m";
}

export function printTree(
  tree: Tree,
  input: Input | string,
  options: {
    from?: number;
    to?: number;
    start?: number;
    includeParents?: boolean;
  } = {}
): string {
  const cursor = tree.cursor();
  if (typeof input === "string") input = stringInput(input);
  const {
    from = 0,
    to = input.length,
    start = 0,
    includeParents = false,
  } = options;
  let output = "";
  const prefixes: string[] = [];
  for (;;) {
    const node = focusedNode(cursor);
    let leave = false;
    if (node.from <= to && node.to >= from) {
      const enter =
        !node.type.isAnonymous &&
        (includeParents || (node.from >= from && node.to <= to));
      if (enter) {
        leave = true;
        const isTop = output === "";
        if (!isTop || node.from > 0) {
          output += (!isTop ? "\n" : "") + prefixes.join("");
          const hasNextSibling = cursor.nextSibling() && cursor.prevSibling();
          if (hasNextSibling) {
            output += " ├─ ";
            prefixes.push(" │  ");
          } else {
            output += " └─ ";
            prefixes.push("    ");
          }
        }
        output += node.type.isError
          ? colorize(node.type.name, Color.Red)
          : node.type.name;
      }
      const isLeaf = !cursor.firstChild();
      if (enter) {
        const hasRange = node.from !== node.to;
        output +=
          " " +
          (hasRange
            ? "[" +
              colorize(start + node.from, Color.Yellow) +
              ".." +
              colorize(start + node.to, Color.Yellow) +
              "]"
            : colorize(start + node.from, Color.Yellow));
        if (hasRange && isLeaf) {
          output +=
            ": " +
            colorize(
              JSON.stringify(input.read(node.from, node.to)),
              Color.Green
            );
        }
      }
      if (!isLeaf) continue;
    }
    for (;;) {
      if (leave) prefixes.pop();
      leave = cursor.type.isAnonymous;
      if (cursor.nextSibling()) break;
      if (!cursor.parent()) return output;
      leave = true;
    }
  }
}

console.log(printTree(val, doc1));

export function printTreew(
  cursor: TreeCursor,
  input: Input | string
): string[] {
  var count = 0;

  if (typeof input === "string") input = stringInput(input);
  let output = "";
  let someOutput = "";
  const prefixes: string[] = [];
  for (;;) {
    let leave = false;
    leave = true;
    const isTop = output === "";
    if (!isTop || cursor.from > 0) {
      output += (!isTop ? "\n" : "") + prefixes.join("");
    }
    output += cursor.type.name;

    const isLeaf = !cursor.firstChild();

    if (cursor.type.name == "Select_base") {
      someOutput += formatSelectStmt(cursor, 0);
    }

    if (!isLeaf) continue;

    for (;;) {
      if (leave) prefixes.pop();
      leave = cursor.type.isAnonymous;
      if (cursor.nextSibling()) break;
      if (!cursor.parent()) return [output, someOutput];
      leave = true;
    }
  }
}

export function logTree(tree: TreeCursor, input: Input | string): void {
  console.log(
    "***************\n" + printTreew(tree, input)[1] + "\n***************\n"
  );
}

logTree(val.cursor(), doc1);

function basicIndent(count: number): string {
  var basicIndent = "    ";
  return basicIndent.repeat(count);
}

function genericToken(cursor :TreeCursor, indent?: any) {
  return basicIndent(indent) + doc1.slice(cursor.from, cursor.to) + "\n";
}

function idList(cursor :TreeCursor, indent?:any) {
  var output: string = "";
  var limit: number = 0;

  if (cursor.to - cursor.from > 800) {
    if (cursor.firstChild()) {
      do {
        if (cursor.type.name.toString() == "Identifier") {
          if (limit + (cursor.to - cursor.from) > 80) {
            output += basicIndent(indent) + doc1.slice(cursor.from, cursor.to);
            limit = cursor.to - cursor.from;
          } else {
            output += basicIndent(indent) + doc1.slice(cursor.from, cursor.to);
            limit += cursor.to - cursor.from;
          }
        }

        if (cursor.type.name.toString() == "Comma") {
          output += ", ";
        }
      } while (cursor.nextSibling());
    }
  } else if (cursor.firstChild()) {
    do {
      if (cursor.type.name.toString() == "Identifier") {
        var arrayDot: any = [];
        if (
          doc1.slice(cursor.from, cursor.to).includes(".") &&
          doc1.slice(cursor.from, cursor.to).length > 80
        ) {
          arrayDot = doc1.slice(cursor.from, cursor.to).split(".");
          arrayDot = arrayDot.reverse();
          while (arrayDot.length > 1) {
            output += basicIndent(indent) + arrayDot.pop() + ".\n";
          }
          output += basicIndent(indent) + arrayDot.pop();
        } else {
          output += basicIndent(indent) + doc1.slice(cursor.from, cursor.to);
        }
      }

      if (cursor.type.name.toString() == "Comma") {
        output += ",\n";
      }
    } while (cursor.nextSibling());
  }
  cursor.parent();
  return output;
}

function formatFrom(cursor :TreeCursor, indent?:any) {
  var output = "";
  if (cursor.firstChild()) {
    if (cursor.type.name.toString() == "From") {
      output += "\n" + genericToken(cursor, indent);
      cursor.nextSibling();
    }

    if (cursor.type.name.toString() == "From_list") {
      if (cursor.firstChild()) {
        if (cursor.type.name.toString() == "Identifier") {
          cursor.parent();
          output += idList(cursor, indent);
        }

        if (cursor.type.name.toString() == "Select_with_parens") {
          if (
            cursor.firstChild() &&
            cursor.nextSibling() &&
            cursor.firstChild()
          ) {
            if (cursor.type.name.toString() == "Select_base") {
              output += "(\n" + formatSelectStmt(cursor, 1) + "\n)";
            }
          }
        }
      }
    }
  }

  cursor.parent();

  return output;
}

function formatSelectStmt(cursor:TreeCursor, indent?:any) {
  var selectOuput = "";
  if (cursor.firstChild()) {
    do {
      if (cursor.type.name.toString() == "Select") {
        selectOuput += genericToken(cursor, indent);
      }

      if (cursor.type.name.toString() == "Target_list") {
        selectOuput += idList(cursor, indent);
      }
      if (cursor.type.name.toString() == "From_clause") {
        selectOuput += formatFrom(cursor, indent);
      }
      if (cursor.type.name.toString() == "Where_clause") {
        selectOuput += "\nplaceholder";
      }
      if (cursor.type.name.toString() == "Smc") {
        selectOuput += "\n;";
      }
    } while (cursor.nextSibling());
  }
  return selectOuput;
}
