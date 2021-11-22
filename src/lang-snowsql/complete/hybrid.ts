import { CompleteStrategy } from './index';
import { SyntaxNode } from 'lezer-tree';
import { SnowClient } from '../client';
import {
  //And,
  //Div,
  //Eql,
  //Gte,
  //Gtr,
  Identifier,
  //LabelName,
  //Lss,
  //Lte,
  //Mod,
  //LabelMatchList,
  NumberLiteral,
  Or,
  //Pow,
  StringLiteral,
  //Sub,
 // SubqueryExpr,
} from 'lezer-snowsql';
import { Completion, CompletionContext, CompletionResult } from '@codemirror/autocomplete';
import { EditorState } from '@codemirror/state';
import { containsAtLeastOneChild, containsChild, retrieveAllRecursiveNodes, walkBackward, walkThrough } from '../parser/path-finder';
import {
  dropSQLTerms,
  aggregateOpTerms,
  atModifierTerms,
  binOpModifierTerms,
  basicSqlTerms,
  binOpTerms,
  durationTerms,
  functionIdentifierTerms,
  matchOpTerms,
  snippets,
} from './snowsql.terms';
import //buildLabelMatchers
'../parser/matcher';
import { Matcher } from '../types/matcher';
import { syntaxTree } from '@codemirror/language';

const autocompleteNodes: { [key: string]: Completion[] } = {
  matchOp: matchOpTerms,
  binOp: binOpTerms,
  duration: durationTerms,
  binOpModifier: binOpModifierTerms,
  basicSql: basicSqlTerms,
  atModifier: atModifierTerms,
  functionIdentifier: functionIdentifierTerms,  
  aggregateOp: aggregateOpTerms,
  dropSql: dropSQLTerms,
};

// ContextKind is the different possible value determinate by the autocompletion
export enum ContextKind {
  // dynamic autocompletion (required a distant server)
  MetricName,
  LabelName,
  LabelValue,
  // static autocompletion
  Function,
  Aggregation,
  BinOpModifier,
  BinOp,
  MatchOp,
  dropSQLTerms,
  Duration,
  Offset,
  Bool,
  basicSql,
  AtModifiers,
}

export interface Context {
  kind: ContextKind;
  metricName?: string;
  labelName?: string;
  matchers?: Matcher[];
}

function arrayToCompletionResult(data: Completion[], from: number, to: number, includeSnippet = false, span = true): CompletionResult {
  const options = data;
  if (includeSnippet) {
    options.push(...snippets);
  }
  return {
    from: from,
    to: to,
    options: options,
    span: span ? /^[a-zA-Z0-9_:]+$/ : undefined,
  } as CompletionResult;
}

// computeStartCompleteLabelPositionInLabelMatcherOrInGroupingLabel calculates the start position only when the node is a LabelMatchers or a GroupingLabels
function computeStartCompleteLabelPositionInLabelMatcherOrInGroupingLabel(node: SyntaxNode, pos: number): number {
  // Here we can have two different situations:
  // 1. `metric{}` or `sum by()` with the cursor between the bracket
  // and so we have increment the starting position to avoid to consider the open bracket when filtering the autocompletion list.
  // 2. `metric{foo="bar",} or `sum by(foo,)  with the cursor after the comma.
  // Then the start number should be the current position to avoid to consider the previous labelMatcher/groupingLabel when filtering the autocompletion list.
  let start = node.from + 1;
  if (node.firstChild !== null) {
    // here that means the LabelMatchers / GroupingLabels has a child, which is not possible if we have the expression `metric{}`. So we are likely trying to autocomplete the label list after a comma
    start = pos;
  }
  return start;
}

// computeStartCompletePosition calculates the start position of the autocompletion.
// It is an important step because the start position will be used by CMN to find the string and then to use it to filter the CompletionResult.
// A wrong `start` position will lead to have the completion not working.
// Note: this method is exported only for testing purpose.
export function computeStartCompletePosition(node: SyntaxNode, pos: number): number {
  let start = node.from;
  /*
  if (node.type.id === LabelMatchers || node.type.id === GroupingLabels) {
    start = computeStartCompleteLabelPositionInLabelMatcherOrInGroupingLabel(node, pos);
  } */
  return start;
}

// analyzeCompletion is going to determinate what should be autocompleted.
// The value of the autocompletion is then calculate by the function buildCompletion.
// Note: this method is exported for testing purpose only. Do not use it directly.
export function analyzeCompletion(state: EditorState, node: SyntaxNode): Context[] {
  const result: Context[] = [];
  switch (node.type.id) {
    case 0: // 0 is the id of the error node
     // if (node.parent?.type.id === SubqueryExpr && containsAtLeastOneChild(node.parent, Duration)) {
        // we are likely in the given situation:
        //    `rate(foo[5d:5])`
        // so we should autocomplete a duration
      //  result.push({ kind: ContextKind.Duration });
//break;
   //   }
      // when we are in the situation 'metric_name !', we have the following tree
      // Expr(VectorSelector(MetricIdentifier(Identifier),⚠))
      // We should try to know if the char '!' is part of a binOp.
      // Note: as it is quite experimental, maybe it requires more condition and to check the current tree (parent, other child at the same level ..etc.).
      const operator = state.sliceDoc(node.from, node.to);
      if (binOpTerms.filter((term) => term.label.includes(operator)).length > 0) {
        result.push({ kind: ContextKind.BinOp });
      }
      break;
    case Identifier:
      // sometimes an Identifier has an error has parent. This should be treated in priority
      if (node.parent?.type.id === 0) {
      }
      // As the leaf Identifier is coming for a lot of different case, we have to take a bit time to analyze the tree
      // in order to know what we have to autocomplete exactly.
      // Here is some cases:
      // 1. metric_name / ignor --> we should autocomplete the BinOpModifier + metric/function/aggregation
      // 2. http_requests_total{method="GET"} off --> offset or binOp should be autocompleted here
      // 3. rate(foo[5m]) un --> offset or binOp should be autocompleted
      // 4. sum(http_requests_total{method="GET"} off) --> offset or binOp should be autocompleted
      // 5. sum(http_requests_total{method="GET"} / o) --> BinOpModifier + metric/function/aggregation
      // All examples above gives a different tree each time but ends up to be treated in this case.
      // But they all have the following common tree pattern:
      // Parent( Expr(...),
      //         ... ,
      //         Expr(VectorSelector(MetricIdentifier(Identifier)))
      //       )
      //
      // So the first things to do is to get the `Parent` and to determinate if we are in this configuration.
      // Otherwise we would just have to autocomplete the metric / function / aggregation.

      const parent = node.parent?.parent?.parent?.parent;
      if (!parent) {
        // this case is normally impossible since by definition, the identifier has 3 parents,
        // and in Lexer, there is always a default parent in top of everything.
        result.push(
          { kind: ContextKind.MetricName, metricName: state.sliceDoc(node.from, node.to) },
          { kind: ContextKind.Function },
          { kind: ContextKind.Aggregation }
        );
        break;
      }
      // now we have to know if we have two Expr in the direct children of the `parent`
     /* const containExprTwice = containsChild(parent, Expr, Expr);
      if (containExprTwice) {
      } else {
        result.push(
          { kind: ContextKind.MetricName, metricName: state.sliceDoc(node.from, node.to) },
          { kind: ContextKind.Function },
          { kind: ContextKind.Aggregation }
        );
      }
      break;
    /*
    case GroupingLabels:
      // In this case we are in the given situation:
      //      sum by ()
      // So we have to autocomplete any labelName
      result.push({ kind: ContextKind.LabelName });
      break;

    case LabelName:
      if (node.parent?.type.id === GroupingLabel) {
        // In this case we are in the given situation:
        //      sum by (myL)
        // So we have to continue to autocomplete any kind of labelName
        result.push({ kind: ContextKind.LabelName });
      } */

    case NumberLiteral:

    /*
      if (node.parent?.type.id === 0 && node.parent.parent?.type.id === SubqueryExpr) {
        // Here we are likely in this situation:
        //     `go[5d:4]`
        // and we have the given tree:
        // Expr( SubqueryExpr(
        // 		Expr(VectorSelector(MetricIdentifier(Identifier))),
        // 		Duration, Duration, ⚠(NumberLiteral)
        // ))
        // So we should continue to autocomplete a duration
        result.push({ kind: ContextKind.Duration });
      }
      break;


      */
    /*

    case Pow:
    case Mul:
    case Div:
    case Mod:
    case Add:
    case Sub:
    case Eql:
    case Gte:
    case Gtr:
    case Lte:
    case Lss:
    case And:
    case Or:
*/
  }
  return result;
}

export class HybridComplete implements CompleteStrategy {
  private readonly SnowClient: SnowClient | undefined;
  private readonly maxMetricsMetadata: number;

  constructor(SnowClient?: SnowClient, maxMetricsMetadata = 10000) {
    this.SnowClient = SnowClient;
    this.maxMetricsMetadata = maxMetricsMetadata;
  }

  getSnowClient(): SnowClient | undefined {
    return this.SnowClient;
  }

  snowSQL(context: CompletionContext): Promise<CompletionResult | null> | CompletionResult | null {
    const { state, pos } = context;
    const tree = syntaxTree(state).resolve(pos, -1);
    const contexts = analyzeCompletion(state, tree);
    let asyncResult: Promise<Completion[]> = Promise.resolve([]);
    let completeSnippet = false;
    let span = true;
    for (const context of contexts) {
      switch (context.kind) {
        case ContextKind.Aggregation:
          asyncResult = asyncResult.then((result) => {
            return result.concat(autocompleteNodes.aggregateOp);
          });
          break;
        case ContextKind.Function:
          asyncResult = asyncResult.then((result) => {
            return result.concat(autocompleteNodes.functionIdentifier);
          });
          break;

        case ContextKind.basicSql:

          asyncResult = asyncResult.then((result) => {
            return result.concat(autocompleteNodes.basicSql);
          });
          break;

        case ContextKind.BinOpModifier:
          asyncResult = asyncResult.then((result) => {
            return result.concat(autocompleteNodes.binOpModifier);
          });
          break;
        case ContextKind.BinOp:
          asyncResult = asyncResult.then((result) => {
            return result.concat(autocompleteNodes.binOp);
          });
          break;
        case ContextKind.MatchOp:
          asyncResult = asyncResult.then((result) => {
            return result.concat(autocompleteNodes.matchOp);
          });
          break;
        case ContextKind.dropSQLTerms:
          asyncResult = asyncResult.then((result) => {
            return result.concat(autocompleteNodes.dropSQLTerms);
          });
          break;
        case ContextKind.Duration:
          span = false;
          asyncResult = asyncResult.then((result) => {
            return result.concat(autocompleteNodes.duration);
          });
          break;
        case ContextKind.Offset:
          asyncResult = asyncResult.then((result) => {
            return result.concat([{ label: 'offset' }]);
          });
          break;
        case ContextKind.Bool:
          asyncResult = asyncResult.then((result) => {
            return result.concat([{ label: 'bool' }]);
          });
          break;
        case ContextKind.AtModifiers:
          asyncResult = asyncResult.then((result) => {
            return result.concat(autocompleteNodes.atModifier);
          });
          break;
        case ContextKind.MetricName:
          asyncResult = asyncResult.then((result) => {
            completeSnippet = true;
            return this.autocompleteMetricName(result, context);
          });
          break;
        case ContextKind.LabelName:
          asyncResult = asyncResult.then((result) => {
            return this.autocompleteLabelName(result, context);
          });
          break;
        case ContextKind.LabelValue:
          asyncResult = asyncResult.then((result) => {
            return this.autocompleteLabelValue(result, context);
          });
      }
    }
    return asyncResult.then((result) => {
      return arrayToCompletionResult(result, computeStartCompletePosition(tree, pos), pos, completeSnippet, span);
    });
  }

  private autocompleteMetricName(result: Completion[], context: Context): Completion[] | Promise<Completion[]> {
    if (!this.SnowClient) {
      return result;
    }
    const metricCompletion = new Map<string, Completion>();
    return this.SnowClient.metricNames(context.metricName)
      .then((metricNames: string[]) => {
        for (const metricName of metricNames) {
          metricCompletion.set(metricName, { label: metricName, type: 'constant' });
        }

        if (metricNames.length <= this.maxMetricsMetadata) {
          // in order to enrich the completion list of the metric,
          // we are trying to find the associated metadata
          return this.SnowClient?.metricMetadata();
        }
      })
      .then((metricMetadata) => {
        if (metricMetadata) {
          for (const [metricName, node] of metricCompletion) {
            // For histograms and summaries, the metadata is only exposed for the base metric name,
            // not separately for the _count, _sum, and _bucket time series.
            const metadata = metricMetadata[metricName.replace(/(_count|_sum|_bucket)$/, '')];
            if (metadata) {
              if (metadata.length > 1) {
                // it means the metricName has different possible helper and type
                for (const m of metadata) {
                  if (node.detail === '') {
                    node.detail = m.type;
                  } else if (node.detail !== m.type) {
                    node.detail = 'unknown';
                    node.info = 'multiple different definitions for this metric';
                  }

                  if (node.info === '') {
                    node.info = m.help;
                  } else if (node.info !== m.help) {
                    node.info = 'multiple different definitions for this metric';
                  }
                }
              } else if (metadata.length === 1) {
                let { type, help } = metadata[0];
                if (type === 'histogram' || type === 'summary') {
                  if (metricName.endsWith('_count')) {
                    type = 'counter';
                    help = `The total number of observations for: ${help}`;
                  }
                  if (metricName.endsWith('_sum')) {
                    type = 'counter';
                    help = `The total sum of observations for: ${help}`;
                  }
                  if (metricName.endsWith('_bucket')) {
                    type = 'counter';
                    help = `The total count of observations for a bucket in the histogram: ${help}`;
                  }
                }
                node.detail = type;
                node.info = help;
              }
            }
          }
        }
        return result.concat(Array.from(metricCompletion.values()));
      });
  }

  private autocompleteLabelName(result: Completion[], context: Context): Completion[] | Promise<Completion[]> {
    if (!this.SnowClient) {
      return result;
    }
    return this.SnowClient.labelNames(context.metricName).then((labelNames: string[]) => {
      return result.concat(labelNames.map((value) => ({ label: value, type: 'constant' })));
    });
  }

  private autocompleteLabelValue(result: Completion[], context: Context): Completion[] | Promise<Completion[]> {
    if (!this.SnowClient || !context.labelName) {
      return result;
    }
    return this.SnowClient.labelValues(context.labelName, context.metricName, context.matchers).then((labelValues: string[]) => {
      return result.concat(labelValues.map((value) => ({ label: value, type: 'text' })));
    });
  }
}
