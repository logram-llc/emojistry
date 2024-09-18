import { EmojiIndexer } from './EmojiIndexer';
import {
  QueryParser,
  Expression,
  IAndExpression,
  IOrExpression,
  INotExpression,
  IFilterExpression,
  ISearchFilterExpression,
  IColorFilterExpression,
  isHexColorExpression,
} from './QueryParser';
import { EmojiFamily, IEmoji } from '@/lib/emojis/EmojiTypes';
import {
  EmojiMetadataReader,
  normalizeCldr,
} from '@/lib/emojis/EmojiMetadataReader';
import { IEmojiMetadataReader } from '@/lib/emojis/EmojiTypes';
import { hexToRgb, rgbToCIELab, deltaE94 } from '@/ColorUtils';

export type ValidFilterName =
  | 'keyword'
  | 'family'
  | 'id'
  | 'group'
  | 'style'
  | 'color';

export interface IQueryParser {
  parse(query: string): Expression;
}

export class EmojiSearchEngine {
  private emojiIndexer: EmojiIndexer;
  private queryParser: IQueryParser;
  private emojiRepository: IEmojiMetadataReader;

  constructor(
    emojiIndexer: EmojiIndexer,
    queryParser?: IQueryParser,
    emojiRepository?: IEmojiMetadataReader,
  ) {
    this.emojiIndexer = emojiIndexer;
    this.queryParser = queryParser ?? new QueryParser();
    this.emojiRepository = emojiRepository ?? new EmojiMetadataReader();
  }

  private evaluate(expr: Expression, results: IEmoji[]): IEmoji[] {
    switch (expr.type) {
      case 'AND':
        return this.evaluateAndExpression(expr, results);
      case 'OR':
        return this.evaluateOrExpression(expr, results);
      case 'NOT':
        return this.evaluateNotExpression(expr, results);
      case 'FILTER':
        return this.evaluateFilterExpression(expr, results);
      case 'COLOR_FILTER':
        return this.evaluateColorFilterExpression(expr, results);
      case 'SEARCH_FILTER':
        return this.evaluateSearchFilterExpression(expr, results);
    }

    throw new Error('Encountered unhandled expression');
  }

  private evaluateAndExpression(
    expr: IAndExpression,
    results: IEmoji[],
  ): IEmoji[] {
    const leftResult = this.evaluate(expr.left, results);
    const rightResult = this.evaluate(expr.right, results);

    return this.intersection(leftResult, rightResult);
  }

  private evaluateOrExpression(
    expr: IOrExpression,
    results: IEmoji[],
  ): IEmoji[] {
    const leftResult = this.evaluate(expr.left, results);
    const rightResult = this.evaluate(expr.right, results);

    return this.union(leftResult, rightResult);
  }

  private evaluateNotExpression(
    expr: INotExpression,
    results: IEmoji[],
  ): IEmoji[] {
    const negatedResults = this.evaluate(expr.expression, results);
    const negatedResultsById = Object.fromEntries(
      negatedResults.map((result) => [result.id, result]),
    );

    return results.filter(
      (result) => !Object.hasOwn(negatedResultsById, result.id),
    );
  }

  private evaluateColorFilterExpression(
    expr: IColorFilterExpression,
    results: IEmoji[],
  ): IEmoji[] {
    // NOTE(nicholas-ramsey): Beyond a certain ΔE (10-20), the visual color difference becomes substantial. `9` is somewhat
    // arbitrary here and may be controversial. See https://stackoverflow.com/a/58038022.
    const deltaE94SimilarityTolerance = 9;
    const rgb = isHexColorExpression(expr.value)
      ? hexToRgb(expr.value.hex)
      : [expr.value.r, expr.value.g, expr.value.b];

    if (rgb === null) {
      return []; // TODO(j-ramsey): Throw syntax error instead
    }

    const comparisonCIELAB = rgbToCIELab(rgb[0], rgb[1], rgb[2]);

    return results.filter((result) =>
      Object.values(result.styles).some((style) =>
        style.colorPalette.some(
          (color) =>
            deltaE94(color.CIELAB, comparisonCIELAB) <=
            deltaE94SimilarityTolerance,
        ),
      ),
    );
  }

  private evaluateFilterExpression(
    expr: IFilterExpression,
    results: IEmoji[],
  ): IEmoji[] {
    switch (expr.name) {
      case 'keyword' as ValidFilterName:
        return results.filter((result) =>
          result.keywords
            .map((keyword) => keyword.toLowerCase())
            .includes(expr.value.toLowerCase()),
        );
      case 'family' as ValidFilterName:
        return results.filter(
          (result) => result.family.toLowerCase() === expr.value.toLowerCase(),
        );
      case 'id' as ValidFilterName:
        return results.filter((result) => result.id === expr.value);
      case 'group' as ValidFilterName:
        return results.filter(
          (result) => result.group.toLowerCase() === expr.value.toLowerCase(),
        );
      case 'style' as ValidFilterName:
        return results.filter((result) =>
          Object.values(result.styles).some((style) =>
            [
              style.label.toLowerCase(),
              style.id.toLowerCase(),
              style.group.toLowerCase(),
            ].includes(expr.value.toLowerCase()),
          ),
        );
    }

    throw new Error('Invalid filter name');
  }

  private evaluateSearchFilterExpression(
    expr: ISearchFilterExpression,
    results: IEmoji[],
  ): IEmoji[] {
    const searchResults = this.emojiIndexer.search(expr.query);
    const cldrsInSearchResults = new Set<string>(
      Object.values(searchResults)
        .map((searchResult) => searchResult.result)
        .flat()
        .map(normalizeCldr),
    );

    return results.filter((result) => cldrsInSearchResults.has(result.cldr));
  }

  private intersection(left: IEmoji[], right: IEmoji[]): IEmoji[] {
    const results: IEmoji[] = [];
    const leftByIds: Record<string, IEmoji> = Object.fromEntries(
      left.map((result) => [result.id, result]),
    );

    right.forEach((result) => {
      if (Object.hasOwn(leftByIds, result.id)) {
        results.push(result);
      }
    });

    return results;
  }

  private union(left: IEmoji[], right: IEmoji[]): IEmoji[] {
    return Array.from(new Set([...left, ...right]));
  }

  async search(query: string, family: EmojiFamily): Promise<IEmoji[]> {
    const allEmojisByCldr = Object.values(
      await this.emojiRepository.all(family),
    );

    return this.evaluate(this.queryParser.parse(query), allEmojisByCldr);
  }
}
