import { Tokenizer, IToken, TokenType, TokenizerError } from './Tokenizer';

export type Expression =
  | IAndExpression
  | IOrExpression
  | INotExpression
  | IFilterExpression
  | IColorFilterExpression
  | ISearchFilterExpression
  | IGroupExpression;

export interface IAndExpression {
  type: 'AND';
  left: Expression;
  right: Expression;
}

export interface IOrExpression {
  type: 'OR';
  left: Expression;
  right: Expression;
}

export interface INotExpression {
  type: 'NOT';
  expression: Expression;
}

export interface IFilterExpression {
  type: 'FILTER';
  name: string;
  value: string;
}

export interface IColorFilterExpression {
  type: 'COLOR_FILTER';
  name: 'color';
  value: IHexColorExpression | IRGBColorExpression;
}

export interface IRGBColorExpression {
  r: number;
  g: number;
  b: number;
}

export interface IHexColorExpression {
  hex: string;
}

export interface ISearchFilterExpression {
  type: 'SEARCH_FILTER';
  query: string;
}

export interface IGroupExpression {
  type: 'GROUP';
  expression: Expression;
}

export interface IQuotedString {
  type: 'QUOTED_STRING';
  value: string;
}

export interface ITokenizer {
  tokenize(query: string): IToken[];
}

export function isHexColorExpression(
  value: IRGBColorExpression | IHexColorExpression,
): value is IHexColorExpression {
  return (
    typeof value === 'object' && 'hex' in value && typeof value.hex === 'string'
  );
}

export class QueryParserError extends Error {
  // NOTE(nicholas-ramsey): Credit to Adam Coster (https://adamcoster.com/blog/javascript-custom-errors) because I am lazy.
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  constructor(message: string, asserter?: Function) {
    super(message);

    Error.captureStackTrace?.(this, asserter || this.constructor);
  }
}

export class QueryParser {
  private tokenizer: ITokenizer;
  private tokens: IToken[] = [];
  private cursor: number = 0;

  constructor(tokenizer?: ITokenizer) {
    this.tokenizer = tokenizer ?? new Tokenizer();
  }

  parse(query: string): Expression {
    try {
      this.tokens = this.tokenizer.tokenize(query);
    } catch (error) {
      if (!(error instanceof TokenizerError)) {
        throw error;
      }

      throw new QueryParserError(error.message);
    }

    this.cursor = 0;

    return this.parseExpression();
  }

  private parseExpression(): Expression {
    let expr = this.parseTerm();

    while (this.matchToken(TokenType.AND, TokenType.OR)) {
      const operator = this.previousToken.type;
      const right = this.parseTerm();

      expr =
        operator === TokenType.AND
          ? { type: 'AND', left: expr, right: right }
          : { type: 'OR', left: expr, right: right };
    }

    return expr;
  }

  private parseTerm(): Expression {
    if (this.matchToken(TokenType.NOT)) {
      return { type: 'NOT', expression: this.parseTerm() };
    }

    if (this.matchToken(TokenType.LEFT_PARENTHESIS)) {
      const expression = this.parseExpression();
      this.consumeToken(TokenType.RIGHT_PARENTHESIS);

      return { type: 'GROUP', expression };
    }

    if (this.matchToken(TokenType.SEARCH_FILTER_STRING)) {
      return {
        type: 'SEARCH_FILTER',
        query: this.previousToken.value,
      };
    }

    return this.parseFilterExpressions();
  }

  private parseColorFilterExpression(): IColorFilterExpression {
    const colorValue = this.consumeToken(TokenType.FILTER_VALUE).value;
    const isHex = colorValue.startsWith('#');

    if (isHex) {
      return {
        type: 'COLOR_FILTER',
        name: 'color',
        value: {
          hex: colorValue,
        },
      };
    }

    const rgbMatch = colorValue.match(
      /rgb\((?<r>\d+),\s?(?<g>\d+),\s?(?<b>\d+)\)/i,
    );

    if (!rgbMatch?.groups) {
      throw new QueryParserError(`Unexpected color value: ${colorValue}`);
    }

    return {
      type: 'COLOR_FILTER',
      name: 'color',
      value: {
        r: Number(rgbMatch.groups.r),
        g: Number(rgbMatch.groups.g),
        b: Number(rgbMatch.groups.b),
      },
    };
  }

  private parseFilterExpressions(): Expression {
    const filters: Expression[] = [];

    while (
      this.matchToken(TokenType.FILTER_NAME) &&
      this.cursor < this.tokens.length
    ) {
      const filterName = this.previousToken.value;
      this.consumeToken(TokenType.COLON);

      if (filterName !== 'color') {
        filters.push({
          type: 'FILTER',
          name: filterName,
          value: this.consumeToken(TokenType.FILTER_VALUE).value,
        });

        continue;
      }

      filters.push(this.parseColorFilterExpression());
    }

    if (filters.length === 0) {
      throw new QueryParserError('Unexpected token or empty filter list');
    }

    // NOTE(nicholas-ramsey): Implicitly wrap adjacent filters in AND expression:
    // e.g. `category:"Family" family:"Fluent"` is equivalent to `category:"Family" & family:"Fluent"`
    return filters.length === 1
      ? filters[0]
      : filters.reduce((acc, filter) => ({
          type: 'AND',
          left: acc,
          right: filter,
        }));
  }

  private matchToken(...types: TokenType[]): boolean {
    if (this.checkToken(...types)) {
      this.advance();

      return true;
    }

    return false;
  }

  private checkToken(...types: TokenType[]): boolean {
    if (this.cursor >= this.tokens.length) return false;

    return types.includes(this.currentToken.type);
  }

  private advance(): IToken {
    return this.tokens[this.cursor++];
  }

  private get previousToken(): IToken {
    return this.tokens[this.cursor - 1];
  }

  private get currentToken(): IToken {
    return this.tokens[this.cursor];
  }

  private consumeToken(type: TokenType): IToken {
    if (this.checkToken(type)) return this.advance();

    throw new QueryParserError(
      `Expected token of type ${type}, but got ${this.currentToken?.type}`,
    );
  }
}
