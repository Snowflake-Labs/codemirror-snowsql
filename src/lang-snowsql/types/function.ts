

import {

} from 'lezer-snowsql';

export enum ValueType {
  none = 'none',
  vector = 'vector',
  scalar = 'scalar',
  matrix = 'matrix',
  string = 'string',
}

export interface snowSQLFunction {
  name: string;
  argTypes: ValueType[];
  variadic: number;
  returnType: ValueType;
}

// snowSQLFunctions is a list of all functions supported by snowSQL, including their types.
const snowSQLFunctions: { [key: number]: snowSQLFunction } = {



};

export function getFunction(id: number): snowSQLFunction {
  return snowSQLFunctions[id];
}
