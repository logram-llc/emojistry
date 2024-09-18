export enum TokenType {
  AND = 'AND',
  OR = 'OR',
  NOT = 'NOT',
  LEFT_PARENTHESIS = 'LEFT_PARENTHESIS',
  RIGHT_PARENTHESIS = 'RIGHT_PARENTHESIS',
  SEARCH_FILTER_STRING = 'SEARCH_FILTER_STRING',
  FILTER_NAME = 'FILTER_NAME',
  FILTER_VALUE = 'FILTER_VALUE',
  COLON = 'COLON',
}

export interface IToken {
  type: TokenType;
  value: string;
}

export const AND_TOKEN: IToken = {
  type: TokenType.AND,
  value: '&',
};

export const OR_TOKEN: IToken = {
  type: TokenType.OR,
  value: '|',
};

export const NOT_TOKEN: IToken = {
  type: TokenType.NOT,
  value: '!',
};

export const LEFT_PARENTHESIS_TOKEN: IToken = {
  type: TokenType.LEFT_PARENTHESIS,
  value: '(',
};

export const RIGHT_PARENTHESIS_TOKEN: IToken = {
  type: TokenType.RIGHT_PARENTHESIS,
  value: ')',
};

export const COLON_TOKEN: IToken = {
  type: TokenType.COLON,
  value: ':',
};

export class TokenizerError extends Error {
  // NOTE(nicholas-ramsey): Credit to Adam Coster (https://adamcoster.com/blog/javascript-custom-errors) because I am lazy.
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  constructor(message: string, asserter?: Function) {
    super(message);

    Error.captureStackTrace?.(this, asserter || this.constructor);
  }
}

export class Tokenizer {
  private query: string = '';
  private cursor = 0;
  private tokens: IToken[] = [];

  tokenize(query: string): IToken[] {
    this.query = query;
    this.cursor = 0;
    this.tokens = [];

    while (this.cursor < this.query.length) {
      const char = this.currentChar;

      if ([' ', '\t', '\n'].includes(char)) {
        this.advance();
        continue;
      }

      if (char === LEFT_PARENTHESIS_TOKEN.value) {
        this.tokens.push(LEFT_PARENTHESIS_TOKEN);
        this.advance();
        continue;
      }

      if (char === RIGHT_PARENTHESIS_TOKEN.value) {
        this.tokens.push(RIGHT_PARENTHESIS_TOKEN);
        this.advance();
        continue;
      }

      if (char === COLON_TOKEN.value) {
        this.tokens.push(COLON_TOKEN);
        this.advance();
        continue;
      }

      if (char === '"') {
        this.tokens.push(this.consumeFilterValue());
        continue;
      }

      if (char === AND_TOKEN.value) {
        this.tokens.push(AND_TOKEN);
        this.advance();
        continue;
      }

      if (char === OR_TOKEN.value) {
        this.tokens.push(OR_TOKEN);
        this.advance();
        continue;
      }

      if (char === NOT_TOKEN.value) {
        this.tokens.push(NOT_TOKEN);
        this.advance();
        continue;
      }

      this.tokens.push(this.consumeFilterNameOrString());
    }

    return this.tokens;
  }

  private consumeFilterValue(): IToken {
    let value = '';
    this.advance(); // Skip the opening quote

    while (this.cursor < this.query.length && this.currentChar !== '"') {
      value += this.currentChar;
      this.advance();
    }

    if (this.currentChar !== '"') {
      throw new TokenizerError('Unterminated quoted string');
    }

    this.advance(); // skip the closing quote

    return { type: TokenType.FILTER_VALUE, value };
  }

  private consumeFilterNameOrString(): IToken {
    let value = '';

    while (
      this.cursor < this.query.length &&
      ![
        COLON_TOKEN.value,
        LEFT_PARENTHESIS_TOKEN.value,
        RIGHT_PARENTHESIS_TOKEN.value,
        NOT_TOKEN.value,
        OR_TOKEN.value,
        '"',
      ].includes(this.currentChar)
    ) {
      value += this.currentChar;
      this.advance();
    }

    if (this.currentChar === COLON_TOKEN.value) {
      return { type: TokenType.FILTER_NAME, value };
    }

    return { type: TokenType.SEARCH_FILTER_STRING, value };
  }

  private get currentChar(): string {
    return this.query[this.cursor];
  }

  private advance(): string {
    this.cursor++;

    return this.currentChar;
  }
}
