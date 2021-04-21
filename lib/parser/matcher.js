export {};
/*
function createMatcher(labelMatcher: SyntaxNode, state: EditorState): Matcher {
  const matcher = new Matcher(0, '', '');
  const cursor = labelMatcher.cursor;
  if (!cursor.next()) {
    // weird case, that would mean the labelMatcher doesn't have any child.
    return matcher;
  }
  do {
    switch (cursor.type.id) {
      
      case LabelName:
        matcher.name = state.sliceDoc(cursor.from, cursor.to);
        break;
      case MatchOp:
        const ope = cursor.node.firstChild;
        if (ope) {
          matcher.type = ope.type.id;
        }
        break;
      case StringLiteral:
        matcher.value = state.sliceDoc(cursor.from, cursor.to).slice(1, -1);
        break;
        
  } while (cursor.nextSibling());
  return matcher;
}
*/
/*
export function buildLabelMatchers(labelMatchers: SyntaxNode[], state: EditorState): Matcher[] {
  const matchers: Matcher[] = [];
  labelMatchers.forEach((value) => {
    matchers.push(createMatcher(value, state));
  });
  return matchers;
}

export function labelMatchersToString(metricName: string, matchers?: Matcher[], labelName?: string): string {
  if (!matchers || matchers.length === 0) {
    return metricName;
  }

  let matchersAsString = '';
  for (const matcher of matchers) {
    if (matcher.name === labelName || matcher.value === '') {
      continue;
    }
    let type = '';
    switch (matcher.type) {
      /*
      case EqlSingle:
        type = '=';
        break;
      case Neq:
        type = '!=';
        break;
      case NeqRegex:
        type = '!~';
        break;
      case EqlRegex:
        type = '=~';
        break;
      default:
        type = '=';
        
    }
    const m = `${matcher.name}${type}"${matcher.value}"`;
    if (matchersAsString === '') {
      matchersAsString = m;
    } else {
      matchersAsString = `${matchersAsString},${m}`;
    }
  }
  return `${metricName}{${matchersAsString}}`;
}

*/ 
//# sourceMappingURL=matcher.js.map