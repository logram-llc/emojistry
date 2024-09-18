import { describe, expect, it } from 'vitest';
import { QueryParser } from './QueryParser';

describe('QueryParser', () => {
  it('should return simple search filter expression', () => {
    const queryParser = new QueryParser();

    expect(queryParser.parse('Anyone reading this?')).toStrictEqual({
      type: 'SEARCH_FILTER',
      query: 'Anyone reading this?',
    });
  });

  it('should return simple filter expression', () => {
    const queryParser = new QueryParser();

    expect(queryParser.parse('FILTER_NAME_name:"Hi"')).toStrictEqual({
      name: 'FILTER_NAME_name',
      type: 'FILTER',
      value: 'Hi',
    });
  });

  it('should return simple AND filter expression', () => {
    const queryParser = new QueryParser();

    expect(
      queryParser.parse('category:"Family Fun" & family:"Fluent UI"'),
    ).toStrictEqual({
      type: 'AND',
      left: {
        name: 'category',
        type: 'FILTER',
        value: 'Family Fun',
      },
      right: {
        name: 'family',
        type: 'FILTER',
        value: 'Fluent UI',
      },
    });
  });

  it('should handle implicit AND filter expressions', () => {
    const queryParser = new QueryParser();

    expect(
      queryParser.parse('category:"Family Fun" family:"Fluent UI"'),
    ).toStrictEqual({
      type: 'AND',
      left: {
        name: 'category',
        type: 'FILTER',
        value: 'Family Fun',
      },
      right: {
        name: 'family',
        type: 'FILTER',
        value: 'Fluent UI',
      },
    });
  });

  it('should return grouped filters with OR expression', () => {
    const queryParser = new QueryParser();

    expect(
      queryParser.parse(
        '(category:"Family Fun" | category:"Nature") & family:"Fluent"',
      ),
    ).toStrictEqual({
      left: {
        expression: {
          left: {
            name: 'category',
            type: 'FILTER',
            value: 'Family Fun',
          },
          right: {
            name: 'category',
            type: 'FILTER',
            value: 'Nature',
          },
          type: 'OR',
        },
        type: 'GROUP',
      },
      right: {
        name: 'family',
        type: 'FILTER',
        value: 'Fluent',
      },
      type: 'AND',
    });
  });

  it.skip('should return grouped filters with OR expression with implicit AND', () => {
    // TODO(nicholas-ramsey)
    const queryParser = new QueryParser();

    expect(
      queryParser.parse(
        '(category:"Family Fun" | category:"Nature") family:"Fluent"',
      ),
    ).toStrictEqual({
      left: {
        expression: {
          left: {
            name: 'category',
            type: 'FILTER',
            value: 'Family Fun',
          },
          right: {
            name: 'category',
            type: 'FILTER',
            value: 'Nature',
          },
          type: 'OR',
        },
        type: 'GROUP',
      },
      right: {
        name: 'family',
        type: 'FILTER',
        value: 'Fluent',
      },
      type: 'AND',
    });
  });
});
