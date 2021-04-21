// The MIT License (MIT)
//
// Copyright (c) 2020 The Prometheus Authors
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
import { parser } from 'lezer-snowsql';
import { styleTags, tags } from '@codemirror/highlight';
import { newCompleteStrategy } from './complete';
import { newLintStrategy, snowSQLLinter } from './lint';
import { LezerLanguage } from '@codemirror/language';
export const snowSQLLanguage = LezerLanguage.define({
    parser: parser.configure({
        props: [
            styleTags({
                LineComment: tags.comment,
                LabelName: tags.labelName,
                StringLiteral: tags.string,
                NumberLiteral: tags.number,
                Duration: tags.number,
                'Abs Absent Drop  IP Something Policy AbsentOverTime AvgOverTime Ceil Changes Clamp ClampMax ClampMin CountOverTime DaysInMonth DayOfMonth DayOfWeek Delta Deriv Exp Floor HistogramQuantile HoltWinters Hour Idelta Increase Irate LabelReplace LabelJoin LastOverTime Ln Log10 Log2 MaxOverTime MinOverTime Minute Month PredictLinear QuantileOverTime Rate Resets Round Scalar Sgn Sort SortDesc Sqrt StddevOverTime StdvarOverTime SumOverTime Time Timestamp Vector Year': tags.function(tags.variableName),
                'Avg Create Select Allowed_IP_Policy Describe Desc From Bottomk Count Count_values Group Max Min Quantile Stddev Stdvar Sum Topk': tags.operatorKeyword,
                'By Without Table Dash Stage Allowed IP Bool On Ignoring GroupLeft GroupRight Offset Start End': tags.modifier,
                'And Unless Or': tags.logicOperator,
                'Sub Add Type  Network Policy Mul Mod Div Eql Neq Lte Lss Gte Gtr EqlRegex EqlSingle NeqRegex Pow At': tags.operator,
                UnaryOp: tags.arithmeticOperator,
                '( )': tags.paren,
                '[ ]': tags.squareBracket,
                '{ }': tags.brace,
                '⚠': tags.invalid,
            }),
        ],
    }),
    languageData: {
        closeBrackets: { brackets: ['(', '[', '{', "'", '"', '`'] },
        commentTokens: { line: '#' },
    },
});
/**
 * This class holds the state of the completion extension for CodeMirror and allow hot-swapping the complete strategy.
 */
export class snowSQLExtension {
    constructor() {
        this.complete = newCompleteStrategy();
        this.lint = newLintStrategy();
        this.enableLinter = true;
        this.enableCompletion = true;
    }
    setComplete(conf) {
        this.complete = newCompleteStrategy(conf);
        return this;
    }
    getComplete() {
        return this.complete;
    }
    activateCompletion(activate) {
        this.enableCompletion = activate;
        return this;
    }
    setLinter(linter) {
        this.lint = linter;
        return this;
    }
    getLinter() {
        return this.lint;
    }
    activateLinter(activate) {
        this.enableLinter = activate;
        return this;
    }
    asExtension() {
        let extension = [snowSQLLanguage];
        if (this.enableCompletion) {
            const completion = snowSQLLanguage.data.of({
                autocomplete: (context) => {
                    return this.complete.snowSQL(context);
                },
            });
            extension = extension.concat(completion);
        }
        if (this.enableLinter) {
            extension = extension.concat(snowSQLLinter(this.lint.snowSQL, this.lint));
        }
        return extension;
    }
}
//# sourceMappingURL=snowsql.js.map