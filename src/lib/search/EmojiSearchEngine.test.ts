import { describe, it, expect, vi, beforeEach, test, Mocked } from 'vitest';
import { IEmoji, EmojiFamily, IEmojiStyle } from '@/lib/emojis/EmojiTypes';
import { EmojiIndexer } from '@/lib/search/EmojiIndexer';
import { Expression, QueryParser } from '@/lib/search/QueryParser';
import { IEmojiMetadataReader } from '@/lib/emojis/EmojiTypes';
import { EmojiSearchEngine } from '@/lib/search/EmojiSearchEngine';

const DEFAULT_STYLE: Omit<IEmojiStyle, 'colorPalette'> = {
  id: 'default',
  label: 'Default Emoji Style',
  url: '/emoji.png',
  group: 'Standard',
  isSvg: false,
  height: 32,
  width: 32,
  x: 0,
  y: 0,
};

const ALTERNATIVE_STYLE: Omit<IEmojiStyle, 'colorPalette'> = {
  id: 'alt',
  label: 'Alt Emoji Style',
  url: '/emoji.png',
  group: 'Alternative',
  isSvg: false,
  height: 32,
  width: 32,
  x: 1,
  y: 1,
};

const EMOJI_STYLE_FIXTURES: IEmojiStyle[] = [
  {
    ...DEFAULT_STYLE,
    colorPalette: [
      {
        hex: '#000000',
        rgb: [0, 0, 0],
        hsl: [0, 0, 0],
        CIELAB: [0, 0, 0],
        occurrences: 1,
      },
    ],
  },
  {
    ...DEFAULT_STYLE,
    colorPalette: [
      {
        hex: '#FF0000',
        rgb: [255, 0, 0],
        hsl: [0, 100, 50],
        CIELAB: [53.23, 80.1, 67.22],
        occurrences: 1,
      },
    ],
  },
  {
    ...DEFAULT_STYLE,
    colorPalette: [
      {
        hex: '#0000FF',
        rgb: [0, 0, 255],
        hsl: [240, 100, 50],
        CIELAB: [32.3, 79.19, -107.86],
        occurrences: 1,
      },
    ],
  },
  {
    ...ALTERNATIVE_STYLE,
    colorPalette: [
      {
        hex: '#333333',
        rgb: [51, 51, 51],
        hsl: [0, 0, 20],
        CIELAB: [21.2, 0, 0],
        occurrences: 1,
      },
    ],
  },
];

const EMOJI_FIXTURES: IEmoji[] = [
  {
    id: 'emoji1',
    cldr: 'grinning face',
    group: 'Smileys & Emotion',
    keywords: ['face', 'smile', 'happy'],
    tts: 'grinning face',
    family: EmojiFamily.FLUENT_UI.toString(),
    familyVersion: '1.0',
    glyph: '😀',
    styles: {
      default: EMOJI_STYLE_FIXTURES[0],
    },
    defaultStyle: 'default',
  },
  {
    id: 'emoji2',
    cldr: 'sad face',
    group: 'Smileys & Emotion',
    keywords: ['face', 'sad', 'unhappy'],
    tts: 'sad face',
    family: EmojiFamily.FLUENT_UI.toString(),
    familyVersion: '1.0',
    glyph: '😢',
    styles: {
      default: EMOJI_STYLE_FIXTURES[1],
    },
    defaultStyle: 'default',
  },
  {
    id: 'emoji3',
    cldr: 'apple',
    group: 'Food & Drink',
    keywords: ['fruit', 'apple'],
    tts: 'apple',
    family: EmojiFamily.FLUENT_UI.toString(),
    familyVersion: '1.0',
    glyph: '🍎',
    styles: {
      default: EMOJI_STYLE_FIXTURES[2],
    },
    defaultStyle: 'default',
  },
  {
    id: 'emoji4',
    cldr: 'shuffle_tracks',
    group: 'Symbols',
    keywords: ['fruit', 'apple'],
    tts: 'shuffle tracks',
    family: EmojiFamily.FLUENT_UI.toString(),
    familyVersion: '1.0',
    glyph: '🔀',
    styles: {
      alt: EMOJI_STYLE_FIXTURES[3],
    },
    defaultStyle: 'alt',
  },
];

describe('EmojiSearchEngine', () => {
  let mockEmojiIndexer: Partial<Mocked<EmojiIndexer>>;
  let mockQueryParser: Partial<Mocked<QueryParser>>;
  let mockEmojiRepository: IEmojiMetadataReader;
  let searchEngine: EmojiSearchEngine;

  beforeEach(() => {
    mockEmojiIndexer = {
      search: vi.fn().mockReturnValue({}),
      export: vi.fn(),
      addEmojiDocument: vi.fn(),
    };
    mockQueryParser = {
      parse: vi
        .fn()
        .mockReturnValue({ type: 'FILTER', name: 'keyword', value: 'happy' }),
    };

    mockEmojiRepository = {
      all: vi
        .fn()
        .mockResolvedValue(
          Object.fromEntries(
            EMOJI_FIXTURES.map((emojiFixture) => [
              emojiFixture.id,
              emojiFixture,
            ]),
          ),
        ),
    } as unknown as IEmojiMetadataReader;

    searchEngine = new EmojiSearchEngine(
      mockEmojiIndexer as unknown as EmojiIndexer,
      mockQueryParser as unknown as QueryParser,
      mockEmojiRepository,
    );
  });

  it('should handle keyword filter AND expressions', async () => {
    mockQueryParser.parse = vi.fn().mockReturnValue({
      type: 'AND',
      left: { type: 'FILTER', name: 'keyword', value: 'face' },
      right: { type: 'FILTER', name: 'keyword', value: 'smile' },
    });

    const results = await searchEngine.search(
      'keyword:"face" & keyword:"smile"',
      EmojiFamily.FLUENT_UI,
    );

    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('emoji1');
  });

  it('should handle keyword filter OR expressions', async () => {
    mockQueryParser.parse = vi.fn().mockReturnValue({
      type: 'OR',
      left: { type: 'FILTER', name: 'keyword', value: 'face' },
      right: { type: 'FILTER', name: 'keyword', value: 'smile' },
    });

    const results = await searchEngine.search(
      'keyword:"face" | keyword:"smile"',
      EmojiFamily.FLUENT_UI,
    );

    expect(results).toHaveLength(2);

    const resultIds = results.map((result) => result.id);
    expect(resultIds).toContain('emoji2');
    expect(resultIds).toContain('emoji1');
  });

  test.each([
    {
      searchQuery: 'keyword:"face"',
      mockQueryParserReturnValue: {
        type: 'FILTER',
        name: 'keyword',
        value: 'face',
      } as Expression,
      expectedIds: [EMOJI_FIXTURES[0].id, EMOJI_FIXTURES[1].id],
    },
    {
      searchQuery: `family:"${EmojiFamily.FLUENT_UI}"`,
      mockQueryParserReturnValue: {
        type: 'FILTER',
        name: 'family',
        value: EmojiFamily.FLUENT_UI.toString(),
      } as Expression,
      expectedIds: [
        EMOJI_FIXTURES[0].id,
        EMOJI_FIXTURES[1].id,
        EMOJI_FIXTURES[2].id,
        EMOJI_FIXTURES[3].id,
      ],
    },
    {
      searchQuery: `id:"${EMOJI_FIXTURES[3].id}"`,
      mockQueryParserReturnValue: {
        type: 'FILTER',
        name: 'id',
        value: EMOJI_FIXTURES[3].id,
      } as Expression,
      expectedIds: [EMOJI_FIXTURES[3].id],
    },
    {
      searchQuery: `group:"${EMOJI_FIXTURES[2].group}"`,
      mockQueryParserReturnValue: {
        type: 'FILTER',
        name: 'group',
        value: EMOJI_FIXTURES[2].group,
      } as Expression,
      expectedIds: [EMOJI_FIXTURES[2].id],
    },
  ])(
    'should handle group, family, id, and keyword filter expressions',
    async ({
      searchQuery,
      mockQueryParserReturnValue,
      expectedIds,
    }: {
      searchQuery: string;
      mockQueryParserReturnValue: Expression;
      expectedIds: string[];
    }) => {
      mockQueryParser.parse = vi
        .fn()
        .mockReturnValue(mockQueryParserReturnValue);

      const results = await searchEngine.search(
        searchQuery,
        EmojiFamily.FLUENT_UI,
      );

      expect(results).toHaveLength(expectedIds.length);

      const resultIds = results.map((result) => result.id);

      for (const expectedId of expectedIds) {
        expect(resultIds).toContain(expectedId);
      }
    },
  );

  test.each([
    {
      searchQuery: `color:"${
        EMOJI_FIXTURES[3].styles[EMOJI_FIXTURES[3].defaultStyle].colorPalette[0]
          .hex
      }"`,
      mockQueryParserReturnValue: {
        type: 'COLOR_FILTER',
        name: 'color',
        value: {
          hex: EMOJI_FIXTURES[3].styles[EMOJI_FIXTURES[3].defaultStyle]
            .colorPalette[0].hex,
        },
      } as Expression,
      expectedIds: [EMOJI_FIXTURES[3].id],
    },
    // NOTE(nicholas-ramsey): Should have no results, not similar to any colors.
    {
      searchQuery: 'color:"#777777"',
      mockQueryParserReturnValue: {
        type: 'COLOR_FILTER',
        name: 'color',
        value: {
          hex: '#777777',
        },
      } as Expression,
      expectedIds: [],
    },
    {
      searchQuery: `color:"rgb(${EMOJI_FIXTURES[3].styles[
        EMOJI_FIXTURES[3].defaultStyle
      ].colorPalette[0].rgb.join(', ')})"`,
      mockQueryParserReturnValue: {
        type: 'COLOR_FILTER',
        name: 'color',
        value: {
          r: EMOJI_FIXTURES[3].styles[EMOJI_FIXTURES[3].defaultStyle]
            .colorPalette[0].rgb[0],
          g: EMOJI_FIXTURES[3].styles[EMOJI_FIXTURES[3].defaultStyle]
            .colorPalette[0].rgb[1],
          b: EMOJI_FIXTURES[3].styles[EMOJI_FIXTURES[3].defaultStyle]
            .colorPalette[0].rgb[2],
        },
      } as Expression,
      expectedIds: [EMOJI_FIXTURES[3].id],
    },
    // NOTE(nicholas-ramsey): Should have no results, not similar to any colors.
    {
      searchQuery: 'color:"rgb(210, 210, 210)"',
      mockQueryParserReturnValue: {
        type: 'COLOR_FILTER',
        name: 'color',
        value: {
          r: 210,
          g: 210,
          b: 210,
        },
      } as Expression,
      expectedIds: [],
    },
  ])(
    'color filter expressions should filter by rgb and hex',
    async ({
      searchQuery,
      mockQueryParserReturnValue,
      expectedIds,
    }: {
      searchQuery: string;
      mockQueryParserReturnValue: Expression;
      expectedIds: string[];
    }) => {
      mockQueryParser.parse = vi
        .fn()
        .mockReturnValue(mockQueryParserReturnValue);

      const results = await searchEngine.search(
        searchQuery,
        EmojiFamily.FLUENT_UI,
      );

      expect(results).toHaveLength(expectedIds.length);

      const resultIds = results.map((result) => result.id);

      for (const expectedId of expectedIds) {
        expect(resultIds).toContain(expectedId);
      }
    },
  );

  test.each([
    {
      searchQuery: `style:"${
        EMOJI_FIXTURES[3].styles[EMOJI_FIXTURES[3].defaultStyle].group
      }"`,
      mockQueryParserReturnValue: {
        type: 'FILTER',
        name: 'style',
        value: EMOJI_FIXTURES[3].styles[EMOJI_FIXTURES[3].defaultStyle].group,
      } as Expression,
      expectedIds: [EMOJI_FIXTURES[3].id],
    },
    {
      searchQuery: `style:"${
        EMOJI_FIXTURES[3].styles[EMOJI_FIXTURES[3].defaultStyle].id
      }"`,
      mockQueryParserReturnValue: {
        type: 'FILTER',
        name: 'style',
        value: EMOJI_FIXTURES[3].styles[EMOJI_FIXTURES[3].defaultStyle].id,
      } as Expression,
      expectedIds: [EMOJI_FIXTURES[3].id],
    },
    {
      searchQuery: `style:"${
        EMOJI_FIXTURES[3].styles[EMOJI_FIXTURES[3].defaultStyle].label
      }"`,
      mockQueryParserReturnValue: {
        type: 'FILTER',
        name: 'style',
        value: EMOJI_FIXTURES[3].styles[EMOJI_FIXTURES[3].defaultStyle].label,
      } as Expression,
      expectedIds: [EMOJI_FIXTURES[3].id],
    },
    {
      searchQuery: `style:"${EMOJI_FIXTURES[3].styles[
        EMOJI_FIXTURES[3].defaultStyle
      ].label.toUpperCase()}"`,
      mockQueryParserReturnValue: {
        type: 'FILTER',
        name: 'style',
        value:
          EMOJI_FIXTURES[3].styles[
            EMOJI_FIXTURES[3].defaultStyle
          ].label.toUpperCase(),
      } as Expression,
      expectedIds: [EMOJI_FIXTURES[3].id],
    },
    // NOTE(nicholas-ramsey): Should have no results, no matching styles.
    {
      searchQuery: 'style:"nonexistent"',
      mockQueryParserReturnValue: {
        type: 'FILTER',
        name: 'style',
        value: 'nonexistent',
      } as Expression,
      expectedIds: [],
    },
  ])(
    'style filter expression should filter by style.group, style.label, and style.id',
    async ({
      searchQuery,
      mockQueryParserReturnValue,
      expectedIds,
    }: {
      searchQuery: string;
      mockQueryParserReturnValue: Expression;
      expectedIds: string[];
    }) => {
      mockQueryParser.parse = vi
        .fn()
        .mockReturnValue(mockQueryParserReturnValue);

      const results = await searchEngine.search(
        searchQuery,
        EmojiFamily.FLUENT_UI,
      );

      expect(results).toHaveLength(expectedIds.length);

      const resultIds = results.map((result) => result.id);

      for (const expectedId of expectedIds) {
        expect(resultIds).toContain(expectedId);
      }
    },
  );
});
