import { Tree, TreeFragment, stringInput, Input, TreeCursor } from 'lezer-tree';
import { parser } from 'lezer-snowsql';

export function format(input: string) {
  var doc1: string = input;

  var functionMap: { [key: string]: Function } = {
    Select: keywordFormatter,

    Target_list: targetListFormatter,

    From_clause: fromClauseFormatter,

    Where_clause: whereClauseFormatter,

    From: keywordFormatter,

    From_list: fromListFormatter,

    Lss: noIndentFormatter,

    Lte: noIndentFormatter,

    Gte: noIndentFormatter,

    Eql: noIndentFormatter,

    Opr: parenFormatter,
  };

  function parse(d: string, fragments?: readonly TreeFragment[] | any) {
    let parse = parser.startParse(stringInput(d), 0, { fragments }),
      result: Tree | null | any;
    while (!(result = parse.advance())) {}
    return result;
  }

  function mainFormatter(cursor: TreeCursor, input: Input | string): string {
    if (typeof input === 'string') input = stringInput(input);
    let formattedQuery = '';
    var stmtCount: number = 0;
    for (;;) {
      const isLeaf = !cursor.firstChild();
      if (cursor.type.name == 'Select_no_parens' && cursor.node.parent?.type.name == 'SelectStmt') {
        stmtCount += 1;
        if (stmtCount > 1) formattedQuery += '\n\n\n';
        formattedQuery += selectStmtFormatter(cursor, 0);
      }

      if (cursor.type.name == 'DropStmt') {
        stmtCount += 1;
        if (stmtCount > 1) formattedQuery += '\n\n\n';
        formattedQuery += dropStmtFormatter(cursor, 0);
      }

      if (cursor.type.name == 'CreateStmt') {
        stmtCount += 1;
        if (stmtCount > 1) formattedQuery += '\n\n\n';
        formattedQuery += tempFormatter(cursor);
      }
      
      if (cursor.type.name == 'CreateIntegrationStmt') {
        stmtCount += 1;
        if (stmtCount > 1) formattedQuery += '\n\n\n';
        formattedQuery += tempFormatter(cursor);
      }

      if (cursor.type.name == 'Smc') {
        formattedQuery += '\n;';
      }

      if (!isLeaf) continue;
      //not a leaf? continue

      for (;;) {
        if (cursor.nextSibling()) break; //move to the next sibling
        if (!cursor.parent()) {
          return formattedQuery;
        } //moves to parent, if there's no sibling
      }
    }
  }

  function basicIndent(count: number): string {
    var basicIndent = '  ';
    return basicIndent.repeat(count);
  }

  function targetListFormatter(cursor: TreeCursor, indent: number): string {
    var output: string = '';
    var tempCursor: TreeCursor = cursor.node.cursor;

    var children: any = [];
    children = tempCursor.node.getChildren('Identifier');

    if (tempCursor.firstChild()) {
      do {
        if (tempCursor.type.name.toString() == 'Identifier') {
          output += basicIndent(indent + 1) + sliceDoc(tempCursor);
        }
        if (tempCursor.type.name.toString() == 'Star') {
          output += basicIndent(indent + 1) + sliceDoc(tempCursor);
        }

        if (tempCursor.type.name.toString() == 'Comma') {
          output += ',\n';
        }
      } while (tempCursor.nextSibling());
      output += '\n';
    }
    tempCursor.parent();
    return output;
  }

  function fromClauseFormatter(cursor: TreeCursor, indent: number): string {
    var output: string = '';
    var tempCursor: TreeCursor = cursor.node.cursor;

    if (tempCursor.firstChild()) {
      do {
        output += functionMap[tempCursor.type.name](tempCursor, indent);
      } while (tempCursor.nextSibling());
    }

    tempCursor.parent();
    return output;
  }

  function noIndentFormatter(cursor: TreeCursor): string {
    var output: string = '';
    output = ' ' + sliceDoc(cursor) + ' ';
    return output;
  }

  function plainFormatter(cursor: TreeCursor, indent: number): string {
    return basicIndent(indent) + sliceDoc(cursor) + ' ';
  }

  function dropStmtFormatter(cursor: TreeCursor, indent: number): string {
    var output: string = '';

    var tempCursor = cursor.node.cursor;
    if (tempCursor.firstChild()) {
      do {
        if (tempCursor.type.name == 'Drop') {
          output += plainFormatter(tempCursor, indent);
        }
        if (tempCursor.type.name == 'DdlTarget') {
          output += plainFormatter(tempCursor, indent);
        }

        if (tempCursor.type.name == 'IfExists') {
          output += ifExistsFormatter(tempCursor, indent);
        }

        if (tempCursor.type.name == 'Identifier') {
          output += identifierFormatter(tempCursor, indent);
        }

        if (tempCursor.type.name == 'DropOptions') {
          output += plainFormatter(tempCursor, indent);
        }
      } while (tempCursor.nextSibling());
    }

    return output;
  }

  function identifierFormatter(cursor: TreeCursor, indent: number): string {
    var output = '';
    var tempCursor = cursor.node.cursor;
    output = basicIndent(indent) + sliceDoc(tempCursor);

    return output;
  }

  function ifNotExistsFormatter(cursor: TreeCursor, indent: number): string {
    var output = '';
    var tempCursor = cursor.node.cursor;
    if (tempCursor.firstChild()) {
      do {
        if (tempCursor.type.name == 'If') {
          output += plainFormatter(tempCursor, indent);
        }
        if (tempCursor.type.name == 'Not') {
          output += plainFormatter(tempCursor, indent);
        }

        if (tempCursor.type.name == 'Exists') {
          output += plainFormatter(tempCursor, indent);
        }
      } while (tempCursor.nextSibling());
    }
    return output;
  }

  function ifExistsFormatter(cursor: TreeCursor, indent: number) {
    var output = '';
    var tempCursor = cursor.node.cursor;
    if (tempCursor.firstChild()) {
      do {
        if (tempCursor.type.name == 'If') {
          output += plainFormatter(tempCursor, indent);
        }

        if (tempCursor.type.name == 'Exists') {
          output += plainFormatter(tempCursor, indent);
        }
      } while (tempCursor.nextSibling());
    }
    return output;
  }

  function expressionFormatter(cursor: TreeCursor, indent: number) {
    var output = '';
    var tempCursor = cursor.node.cursor;
    if (tempCursor.firstChild()) {
      do {
        if (tempCursor.type.name == 'ColIdentifier') {
          output += colIdentifierFormatter(tempCursor, indent);
        }

        if (tempCursor.type.name == 'Select_with_parens') {
          output += selectWithParensFormatter(tempCursor, indent + 2);
        }

        if (['Lss', 'Gtr', 'Gte', 'Lte', 'Eql', 'In', 'Not'].includes(tempCursor.type.name)) {
          output += noIndentFormatter(tempCursor);
        }

        if (tempCursor.type.name == 'NumberLiteral') {
          output += numberLiteralFormatter(tempCursor);
        }
      } while (tempCursor.nextSibling());
    }
    return output;
  }
  function keywordFormatter(cursor: TreeCursor, indent: number): string {
    return basicIndent(indent) + sliceDoc(cursor) + '\n';
  }

  function whereClauseFormatter(cursor: TreeCursor, indent: number): string {
    var output: string = '';

    var tempCursor = cursor.node.cursor;

    if (tempCursor.firstChild()) {
      do {
        if (tempCursor.type.name == 'Where') {
          output += '\n' + keywordFormatter(tempCursor, indent);
        }
        if (tempCursor.type.name == 'ExpressionA') {
          output += expressionFormatter(tempCursor, indent + 1);
        }
      } while (tempCursor.nextSibling());
    }

    return output;
  }
  function fromListFormatter(cursor: TreeCursor, indent: number) {
    var output = '';
    var tempCursor = cursor.node.cursor;
    if (tempCursor.firstChild()) {
      do {
        if (tempCursor.type.name == 'Identifier') {
          output += basicIndent(indent + 1) + sliceDoc(tempCursor);
        }

        if (tempCursor.type.name == 'Comma') {
          output += ',\n';
        }

        if (tempCursor.type.name == 'Select_with_parens') {
          output += selectWithParensFormatter(tempCursor, indent + 2);
        }

        if (tempCursor.type.name == 'As') {
          output += noIndentFormatter(tempCursor) + ' ';
        }
        if (tempCursor.type.name == 'ColIdentifier') {
          output += colIdentifierFormatter(tempCursor, 0);
        }
      } while (tempCursor.nextSibling());
    }

    return output;
  }

  function numberLiteralFormatter(cursor: TreeCursor, indent?: number) {
    var output = '';
    output = sliceDoc(cursor);

    return output;
  }

  function selectWithParensFormatter(cursor: TreeCursor, indent: number) {
    var output: string = '';
    var tempCursor: TreeCursor = cursor.node.cursor;

    if (tempCursor.firstChild()) {
      do {
        if (tempCursor.type.name == 'Opl') {
          output += parenFormatter(tempCursor, indent - 3) + '\n';
        }

        if (tempCursor.type.name == 'Opr') {
          output += '\n' + parenFormatter(tempCursor, indent - 2);
        }

        if (tempCursor.type.name == 'Select_no_parens') {
          output += selectStmtFormatter(tempCursor, indent);
        }
      } while (tempCursor.nextSibling());
    }
    return output;
  }
  function parenFormatter(cursor: TreeCursor, indent: number) {
    var output = '';
    var tempCursor = cursor.node.cursor;
    output = basicIndent(indent) + sliceDoc(tempCursor);
    return output;
  }

  function selectStmtFormatter(cursor: TreeCursor, indent: number) {
    var tempCursor = cursor.node.cursor;
    var selectOuput = '';

    if (tempCursor.firstChild()) {
      if (tempCursor.firstChild()) {
        do {
          selectOuput += functionMap[tempCursor.type.name](tempCursor, indent);
        } while (tempCursor.nextSibling());
      }
      return selectOuput;
    }
  }

  function colIdentifierFormatter(cursor: TreeCursor, indent: number): string {
    var output: string = '';
    var tempCursor: TreeCursor = cursor.node.cursor;

    if (tempCursor.firstChild()) {
      if (tempCursor.type.name == 'Identifier') {
        output += basicIndent(indent) + sliceDoc(tempCursor);
      }
    }

    return output;
  }

  function tempFormatter(cursor: TreeCursor): string {
    var tempCursor = cursor.node.cursor;
    let formattedQuery: string = '';

    while (tempCursor.next()) {
      if (tempCursor.type.name == 'Smc') {
        break;
      }

      const node = tempCursor.node.firstChild;
      if (node == null) {
        formattedQuery += sliceDoc(tempCursor);
        if (['EmailAddr', 'Identifier', 'Urli', 'IpA', 'LabelName', 'StringLiteral'].includes(tempCursor.type.name)) {
          formattedQuery += '\n';
        } else {
          formattedQuery += ' ';
        }
      }
    }

    return formattedQuery;
  }

  function sliceDoc(cursor: TreeCursor): string {
    return doc1.slice(cursor.from, cursor.to);
  }

  var val = parse(input);
  return mainFormatter(val.cursor(), input);
}
