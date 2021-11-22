"use strict";
exports.__esModule = true;
exports.format = void 0;
var lezer_tree_1 = require("lezer-tree");
var lezer_snowsql_1 = require("lezer-snowsql");
function format(input) {
    var doc1 = input;
    var functionMap = {
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
        Opr: parenFormatter
    };
    function parse(d, fragments) {
        var parse = lezer_snowsql_1.parser.startParse(lezer_tree_1.stringInput(d), 0, { fragments: fragments }), result;
        while (!(result = parse.advance())) { }
        return result;
    }
    function mainFormatter(cursor, input) {
        var _a;
        if (typeof input === 'string')
            input = lezer_tree_1.stringInput(input);
        var formattedQuery = '';
        var stmtCount = 0;
        for (;;) {
            var isLeaf = !cursor.firstChild();
            if (cursor.type.name == 'Select_no_parens' && ((_a = cursor.node.parent) === null || _a === void 0 ? void 0 : _a.type.name) == 'SelectStmt') {
                stmtCount += 1;
                if (stmtCount > 1)
                    formattedQuery += '\n\n\n';
                formattedQuery += selectStmtFormatter(cursor, 0);
            }
            if (cursor.type.name == 'DropStmt') {
                stmtCount += 1;
                if (stmtCount > 1)
                    formattedQuery += '\n\n\n';
                formattedQuery += dropStmtFormatter(cursor, 0);
            }
            if (cursor.type.name == 'CreateStmt') {
                stmtCount += 1;
                if (stmtCount > 1)
                    formattedQuery += '\n\n\n';
                formattedQuery += tempFormatter(cursor);
            }
            if (cursor.type.name == 'CreateIntegrationStmt') {
                stmtCount += 1;
                if (stmtCount > 1)
                    formattedQuery += '\n\n\n';
                formattedQuery += tempFormatter(cursor);
            }
            if (cursor.type.name == 'Smc') {
                formattedQuery += '\n;';
            }
            if (!isLeaf)
                continue;
            //not a leaf? continue
            for (;;) {
                if (cursor.nextSibling())
                    break; //move to the next sibling
                if (!cursor.parent()) {
                    return formattedQuery;
                } //moves to parent, if there's no sibling
            }
        }
    }
    function basicIndent(count) {
        var basicIndent = '  ';
        return basicIndent.repeat(count);
    }
    function targetListFormatter(cursor, indent) {
        var output = '';
        var tempCursor = cursor.node.cursor;
        var children = [];
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
    function fromClauseFormatter(cursor, indent) {
        var output = '';
        var tempCursor = cursor.node.cursor;
        if (tempCursor.firstChild()) {
            do {
                output += functionMap[tempCursor.type.name](tempCursor, indent);
            } while (tempCursor.nextSibling());
        }
        tempCursor.parent();
        return output;
    }
    function noIndentFormatter(cursor) {
        var output = '';
        output = ' ' + sliceDoc(cursor) + ' ';
        return output;
    }
    function plainFormatter(cursor, indent) {
        return basicIndent(indent) + sliceDoc(cursor) + ' ';
    }
    function dropStmtFormatter(cursor, indent) {
        var output = '';
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
    function identifierFormatter(cursor, indent) {
        var output = '';
        var tempCursor = cursor.node.cursor;
        output = basicIndent(indent) + sliceDoc(tempCursor);
        return output;
    }
    function ifNotExistsFormatter(cursor, indent) {
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
    function ifExistsFormatter(cursor, indent) {
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
    function expressionFormatter(cursor, indent) {
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
    function keywordFormatter(cursor, indent) {
        return basicIndent(indent) + sliceDoc(cursor) + '\n';
    }
    function whereClauseFormatter(cursor, indent) {
        var output = '';
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
    function fromListFormatter(cursor, indent) {
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
    function numberLiteralFormatter(cursor, indent) {
        var output = '';
        output = sliceDoc(cursor);
        return output;
    }
    function selectWithParensFormatter(cursor, indent) {
        var output = '';
        var tempCursor = cursor.node.cursor;
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
    function parenFormatter(cursor, indent) {
        var output = '';
        var tempCursor = cursor.node.cursor;
        output = basicIndent(indent) + sliceDoc(tempCursor);
        return output;
    }
    function selectStmtFormatter(cursor, indent) {
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
    function colIdentifierFormatter(cursor, indent) {
        var output = '';
        var tempCursor = cursor.node.cursor;
        if (tempCursor.firstChild()) {
            if (tempCursor.type.name == 'Identifier') {
                output += basicIndent(indent) + sliceDoc(tempCursor);
            }
        }
        return output;
    }
    function tempFormatter(cursor) {
        var tempCursor = cursor.node.cursor;
        var formattedQuery = '';
        while (tempCursor.next()) {
            if (tempCursor.type.name == 'Smc') {
                break;
            }
            var node = tempCursor.node.firstChild;
            if (node == null) {
                formattedQuery += sliceDoc(tempCursor);
                if (['EmailAddr', 'Identifier', 'Urli', 'IpA', 'LabelName', 'StringLiteral'].includes(tempCursor.type.name)) {
                    formattedQuery += '\n';
                }
                else {
                    formattedQuery += ' ';
                }
            }
        }
        return formattedQuery;
    }
    function sliceDoc(cursor) {
        return doc1.slice(cursor.from, cursor.to);
    }
    var val = parse(input);
    return mainFormatter(val.cursor(), input);
}
exports.format = format;
