import { describe, expect, it } from 'vitest';
import { Tokenizer } from './Tokenizer';

describe('Tokenizer', () => {
  it('should return simple SEARCH_FILTER token', () => {
    const tokenizer = new Tokenizer();

    expect(tokenizer.tokenize('Are you reading this?')).toStrictEqual([
      { type: 'SEARCH_FILTER_STRING', value: 'Are you reading this?' },
    ]);
  });

  it('should return simple FILTER tokens', () => {
    const tokenizer = new Tokenizer();

    expect(tokenizer.tokenize('FILTER_NAME_name:"Hi"')).toStrictEqual([
      { type: 'FILTER_NAME', value: 'FILTER_NAME_name' },
      { type: 'COLON', value: ':' },
      { type: 'FILTER_VALUE', value: 'Hi' },
    ]);
  });

  it('should return FILTER_NAME name with space', () => {
    const tokenizer = new Tokenizer();

    expect(
      tokenizer.tokenize('FILTER_NAME_name:"Hi, Thales of Miletus!"'),
    ).toStrictEqual([
      { type: 'FILTER_NAME', value: 'FILTER_NAME_name' },
      { type: 'COLON', value: ':' },
      { type: 'FILTER_VALUE', value: 'Hi, Thales of Miletus!' },
    ]);
  });

  it('should return multiple FILTER_NAME names', () => {
    const tokenizer = new Tokenizer();

    expect(
      tokenizer.tokenize('category:"Summer Fun" family:"Fluent UI"'),
    ).toStrictEqual([
      { type: 'FILTER_NAME', value: 'category' },
      { type: 'COLON', value: ':' },
      { type: 'FILTER_VALUE', value: 'Summer Fun' },
      { type: 'FILTER_NAME', value: 'family' },
      { type: 'COLON', value: ':' },
      { type: 'FILTER_VALUE', value: 'Fluent UI' },
    ]);
  });

  it('should return FILTER_NAME name with AND symbol in filter name', () => {
    const tokenizer = new Tokenizer();

    expect(tokenizer.tokenize('FILTER_NAME&_name:"Yum"')).toStrictEqual([
      { type: 'FILTER_NAME', value: 'FILTER_NAME&_name' },
      { type: 'COLON', value: ':' },
      { type: 'FILTER_VALUE', value: 'Yum' },
    ]);
  });

  it('should return filter with AND expression', () => {
    const tokenizer = new Tokenizer();

    expect(
      tokenizer.tokenize('category:"Family Fun" & family:"Fluent UI"'),
    ).toStrictEqual([
      { type: 'FILTER_NAME', value: 'category' },
      { type: 'COLON', value: ':' },
      { type: 'FILTER_VALUE', value: 'Family Fun' },
      { type: 'AND', value: '&' },
      { type: 'FILTER_NAME', value: 'family' },
      { type: 'COLON', value: ':' },
      { type: 'FILTER_VALUE', value: 'Fluent UI' },
    ]);
  });

  it('should return grouped filters with OR expression', () => {
    const tokenizer = new Tokenizer();

    expect(
      tokenizer.tokenize(
        '(category:"Family Fun" | category:"Nature") & family:"Fluent"',
      ),
    ).toStrictEqual([
      { type: 'LEFT_PARENTHESIS', value: '(' },
      { type: 'FILTER_NAME', value: 'category' },
      { type: 'COLON', value: ':' },
      { type: 'FILTER_VALUE', value: 'Family Fun' },
      { type: 'OR', value: '|' },
      { type: 'FILTER_NAME', value: 'category' },
      { type: 'COLON', value: ':' },
      { type: 'FILTER_VALUE', value: 'Nature' },
      { type: 'RIGHT_PARENTHESIS', value: ')' },
      { type: 'AND', value: '&' },
      { type: 'FILTER_NAME', value: 'family' },
      { type: 'COLON', value: ':' },
      { type: 'FILTER_VALUE', value: 'Fluent' },
    ]);
  });
});
