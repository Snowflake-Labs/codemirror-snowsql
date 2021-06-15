

import { parser } from 'lezer-snowsql';
import { styleTags, tags } from '@codemirror/highlight';
import { Extension } from '@codemirror/state';
import { CompleteConfiguration, CompleteStrategy, newCompleteStrategy } from './complete';
import { LintStrategy, newLintStrategy, snowSQLLinter } from './lint';
import { CompletionContext } from '@codemirror/autocomplete';
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
        'Abs Absent Drop  IP Something Policy AbsentOverTime AvgOverTime Ceil Changes Clamp ClampMax ClampMin CountOverTime DaysInMonth DayOfMonth DayOfWeek Delta Deriv Exp Floor HistogramQuantile HoltWinters Hour Idelta Increase Irate LabelReplace LabelJoin LastOverTime Ln Log10 Log2 MaxOverTime MinOverTime Minute Month PredictLinear QuantileOverTime Rate Resets Round Scalar Sgn Sort SortDesc Sqrt StddevOverTime StdvarOverTime SumOverTime Time Timestamp Vector Year': tags.function(
          tags.variableName
        ),
        'Avg Create Select Allowed_IP_Policy Describe Desc From Bottomk Count Count_values Group Max Min Quantile Stddev Stdvar Sum Topk': tags.operatorKeyword,
        'By Without Table Dash Stage Allowed IP Bool On Ignoring GroupLeft GroupRight Offset Start End': tags.modifier,
        'And Unless Or': tags.logicOperator,
        'Sub Add Type  Network Policy  Mod Div Eql Neq Lte Lss Gte Gtr EqlRegex EqlSingle NeqRegex Pow At': tags.operator,
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
  private complete: CompleteStrategy;
  private lint: LintStrategy;
  private enableCompletion: boolean;
  private enableLinter: boolean;

  constructor() {
    this.complete = newCompleteStrategy();
    this.lint = newLintStrategy();
    this.enableLinter = true;
    this.enableCompletion = true;
  }

  setComplete(conf?: CompleteConfiguration): snowSQLExtension {
    this.complete = newCompleteStrategy(conf);
    return this;
  }

  getComplete(): CompleteStrategy {
    return this.complete;
  }

  activateCompletion(activate: boolean): snowSQLExtension {
    this.enableCompletion = activate;
    return this;
  }

  setLinter(linter: LintStrategy): snowSQLExtension {
    this.lint = linter;
    return this;
  }

  getLinter(): LintStrategy {
    return this.lint;
  }

  activateLinter(activate: boolean): snowSQLExtension {
    this.enableLinter = activate;
    return this;
  }

  asExtension(): Extension {
    let extension: Extension = [snowSQLLanguage];
    if (this.enableCompletion) {
      const completion = snowSQLLanguage.data.of({
        autocomplete: (context: CompletionContext) => {
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
