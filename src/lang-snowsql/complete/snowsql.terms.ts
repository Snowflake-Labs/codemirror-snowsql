

import { Completion, snippet } from '@codemirror/autocomplete';

export const durationTerms = [{ label: 'y' }, { label: 'w' }, { label: 'd' }, { label: 'h' }, { label: 'm' }, { label: 's' }, { label: 'ms' }];
export const matchOpTerms = [{ label: '=' }, { label: '!=' }, { label: '=~' }, { label: '!~' }];
export const binOpTerms = [
  { label: '^' },
  { label: '*' },
  { label: '/' },
  { label: '%' },
  { label: '+' },
  { label: '-' },
  { label: '==' },
  { label: '>=' },
  { label: '>' },
  { label: '<' },
  { label: '<=' },
  { label: '!=' },
  { label: 'and' },
  { label: 'or' },
  { label: 'unless' },
];

export const binOpModifierTerms = [ 
 

];

export const atModifierTerms = [
 
  
];

export const functionIdentifierTerms = [


];

export const aggregateOpTerms = [
  {
    label: 'drop',
    detail: 'keyword',
    type: 'keyword',
  },

  {
    label: 'create',
    detail: 'keyword',
    type: 'keyword',
  },
  {
    label: 'describe',
    detail: 'keyword',
    type: 'keyword',
  },
  {
    label: 'select',
    detail: 'keyword',
    type: 'keyword',
  },
  {
    label: 'from',
    detail: 'keyword',
    type: 'keyword',
  },
  {
    label: 'where',
    detail: 'keyword',
    type: 'keyword',
  },
  {
    label: 'describe',
    detail: 'keyword',
    type: 'keyword',
  },
  {
    label: 'describe',
    detail: 'keyword',
    type: 'keyword',
  },
  {
    label: 'describe',
    detail: 'keyword',
    type: 'keyword',
  }
  
];

export const dropSQLTerms = [
  {
    label: 'by',
    info: 'Keep the listed labels, remove all others.',
    type: 'keyword',
  },
  {
    label: 'without',
    info: 'Remove the listed labels, preserve all others.',
    type: 'keyword',
  },

  {
    label: 'Drop',
    detail: 'aggregation',
    info: 'Allowed IP Policy',
    type: 'query',
    }
  
];

export const SQLqueries = [
  {
  label: 'Drop',
  detail: 'ip_policy',
  info: 'Allowed IP Policy',
  type: 'query',
  }
]

export const basicSqlTerms = [

  {
    label: 'Allowed_IP_Policy',
    detail: 'ip_policy',
    info: 'Allowed IP Policy',
    type: 'keyword',
},


  {
    label: 'select',
    detail: 'function',
    info: 'The select query',
    type: 'keyword',
  },
];


export const snippets: readonly Completion[] = [

  {
    label: 'basic select * from',
    type: 'function',
    detail: 'snippet',
    info: 'Basic Select Query',
    apply: snippet('select * from table_name;'),
  },

  {
    label: 'basic nested select',
    type: 'function',
    detail: 'snippet',
    info: 'Basic Nested Select Query',
    apply: snippet('select foo,bar from foobar where bar in (select foo,bar from foobar where bar < 100);'),
  },


  {   
    label: 'Create Account',
    type: 'function',
    detail: 'snippet',
    info: 'Create Account Query',
    apply: snippet("create account myaccount2 admin_name = placeholder admin_password = 'TestPassword1' email = myemail@org.com edition = enterprise;"),
  }
];
