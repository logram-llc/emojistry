import { describe, expect, test } from 'vitest';
import { EmojiMapper, ICLDRData, IEmojiDataSource } from './EmojiMapper';
import { IFilteredAnnotationResults } from '@/lib/family-builders/unicode/CLDRReader';
import EMOJI_DATASOURCE from 'emoji-datasource/emoji_pretty.json' with { type: 'json' };

/**
 * Stub factory for CLDRData
 */
function CLDRDataStubFactory(
  returnValues: Record<
    string,
    { type?: string | null; results: IFilteredAnnotationResults }
  >,
) {
  class CLDRDataStub implements ICLDRData {
    findAnnotations(
      codePoint: string,
      type?: string | null,
    ): IFilteredAnnotationResults {
      const foundAnnotationResults = returnValues[codePoint];

      return foundAnnotationResults
        ? {
            annotations: foundAnnotationResults.results.annotations.filter(
              (annotation) => annotation.type === type,
            ),
            locales: foundAnnotationResults.results.locales,
          }
        : {
            annotations: [] as Pick<
              IFilteredAnnotationResults,
              'annotations'
            >['annotations'],
            locales: [],
          };
    }
  }
  return new CLDRDataStub();
}

const EMOJI_DATASOURCE_FIXTURES: IEmojiDataSource[] = [
  {
    name: 'GRINNING FACE',
    unified: '1F600',
    non_qualified: null,
    docomo: null,
    au: null,
    softbank: null,
    google: null,
    image: '1f600.png',
    sheet_x: 0,
    sheet_y: 0,
    short_name: 'grinning',
    short_names: ['grinning'],
    text: null,
    texts: [],
    category: 'Smileys & Emotion',
    subcategory: 'face-smiling',
    sort_order: 1,
    added_in: '1.0',
    has_img_apple: true,
    has_img_google: true,
    has_img_twitter: true,
    has_img_facebook: true,
    skin_variations: {
      '1F3FB': {
        unified: '1F600-1F3FB',
        non_qualified: null,
        image: '1f600-1f3fb.png',
        sheet_x: 1,
        sheet_y: 1,
        added_in: '1.0',
        has_img_apple: true,
        has_img_google: true,
        has_img_twitter: true,
        has_img_facebook: true,
      },
    },
  },
  {
    name: 'GRINNING FACE WITH SMILING EYES',
    unified: '1F601',
    non_qualified: null,
    docomo: null,
    au: null,
    softbank: null,
    google: null,
    image: '1f601.png',
    sheet_x: 0,
    sheet_y: 1,
    short_name: 'beaming',
    short_names: ['beaming'],
    text: null,
    texts: [],
    category: 'Smileys & Emotion',
    subcategory: 'face-smiling',
    sort_order: 2,
    added_in: '1.0',
    has_img_apple: true,
    has_img_google: true,
    has_img_twitter: true,
    has_img_facebook: true,
    skin_variations: {},
  },
  {
    name: 'HANDSHAKE',
    unified: '1F91D',
    non_qualified: null,
    docomo: null,
    au: null,
    softbank: null,
    google: null,
    image: '1f91d.png',
    sheet_x: 40,
    sheet_y: 13,
    short_name: 'handshake',
    short_names: ['handshake'],
    text: 'handshake',
    texts: ['handshake'],
    category: 'People & Body',
    subcategory: 'hands',
    sort_order: 207,
    added_in: '3.0',
    has_img_apple: true,
    has_img_google: true,
    has_img_twitter: true,
    has_img_facebook: true,
    skin_variations: {
      '1F3FB': {
        unified: '1F91D-1F3FB',
        non_qualified: null,
        image: '1f91d-1f3fb.png',
        sheet_x: 40,
        sheet_y: 14,
        added_in: '14.0',
        has_img_apple: true,
        has_img_google: true,
        has_img_twitter: true,
        has_img_facebook: true,
      },
    },
  },
  {
    name: 'SPARKLING HEART',
    unified: '1F496',
    non_qualified: null,
    docomo: 'E6EC',
    au: 'EAA6',
    softbank: null,
    google: 'FEB10',
    image: '1f496.png',
    sheet_x: 28,
    sheet_y: 6,
    short_name: 'sparkling_heart',
    short_names: ['sparkling_heart'],
    text: null,
    texts: null,
    category: 'Smileys & Emotion',
    subcategory: 'heart',
    sort_order: 133,
    added_in: '0.6',
    has_img_apple: true,
    has_img_google: true,
    has_img_twitter: true,
    has_img_facebook: true,
  },
];

// Test fixtures
const CLDR_DATA_FIXTURES = {
  '😀': {
    results: {
      locales: [{ language: 'en', territory: 'US' }],
      annotations: [{ text: 'grinning face | smile', codePoint: '😀' }],
    },
  },
  '😁': {
    results: {
      locales: [{ language: 'en', territory: 'US' }],
      annotations: [
        {
          text: 'beaming face with smiling eyes',
          codePoint: '😁',
        },
      ],
    },
  },
  '💖': {
    results: {
      locales: [{ language: 'en', territory: 'US' }],
      annotations: [
        {
          text: 'sparkling heart',
          codePoint: '💖',
          type: 'tts',
        },
      ],
    },
  },
  '🤝': {
    results: {
      locales: [{ language: 'en', territory: 'US' }],
      annotations: [
        {
          text: 'two hands',
          codePoint: '🤝',
          type: 'tts',
        },
        {
          text: 'bleh',
          codePoint: '🤝',
        },
      ],
    },
  },
};

describe('EmojiMapper / EmojiDataMap', () => {
  test.each([
    {
      cldrData: CLDR_DATA_FIXTURES,
      codePoint: '😀',
      expectedResults: {
        keywords: [
          ...CLDR_DATA_FIXTURES['😀'].results.annotations[0].text.split(' | '),
          EMOJI_DATASOURCE_FIXTURES[0].subcategory,
        ],
        tts: [],
      },
    },
    {
      cldrData: CLDR_DATA_FIXTURES,
      codePoint: '😁',
      expectedResults: {
        keywords: [
          CLDR_DATA_FIXTURES['😁'].results.annotations[0].text,
          EMOJI_DATASOURCE_FIXTURES[1].subcategory,
        ],
        tts: [],
      },
    },
    {
      cldrData: CLDR_DATA_FIXTURES,
      codePoint: '💖',
      expectedResults: {
        keywords: [EMOJI_DATASOURCE_FIXTURES[3].subcategory],
        tts: [CLDR_DATA_FIXTURES['💖'].results.annotations[0].text],
      },
    },
    {
      cldrData: CLDR_DATA_FIXTURES,
      codePoint: '🤝',
      expectedResults: {
        keywords: [
          CLDR_DATA_FIXTURES['🤝'].results.annotations[1].text,
          EMOJI_DATASOURCE_FIXTURES[2].subcategory,
        ],
        tts: [CLDR_DATA_FIXTURES['🤝'].results.annotations[0].text],
      },
    },
  ])(
    'should construct keywords and tts from EmojiDatasource and CLDR annotations for $codePoint',
    async ({ cldrData, codePoint, expectedResults }) => {
      // Arrange
      const cldrDataStub = CLDRDataStubFactory(cldrData);

      const emojiMapper = new EmojiMapper(
        cldrDataStub,
        EMOJI_DATASOURCE_FIXTURES,
      );

      // Act
      const emojiDataMap = await emojiMapper.build();
      const emojiData = emojiDataMap.getEmojiByCodepoint(codePoint);

      // Assert
      expect(
        emojiData?.keywords.sort(),
        'expected keywords to match',
      ).toStrictEqual(expectedResults.keywords.sort());
      expect(emojiData?.tts.sort(), 'expected tts to match').toStrictEqual(
        expectedResults.tts.sort(),
      );
    },
  );

  describe('getEmojiByCodepointMatch', () => {
    test.each([
      {
        startingStr: '#',
        expectedMatchUnified: '0023-FE0F-20E3',
      },
      {
        startingStr: '0',
        expectedMatchUnified: '0030-FE0F-20E3',
      },
      {
        startingStr: '🫳🏾',
        expectedMatchUnified: '1FAF3',
      },
      {
        startingStr: '#⃣',
        expectedMatchUnified: '0023-FE0F-20E3',
      },
      {
        startingStr: '0⃣',
        expectedMatchUnified: '0030-FE0F-20E3',
      },
    ])(
      '[integration] should find emojis based on starting string of $startingStr',
      async ({
        startingStr,
        expectedMatchUnified,
      }: {
        startingStr: string;
        expectedMatchUnified: string;
      }) => {
        // Arrange
        const cldrDataStub = CLDRDataStubFactory({});

        const emojiMapper = new EmojiMapper(cldrDataStub, EMOJI_DATASOURCE);

        // Act
        const emojiDataMap = await emojiMapper.build();
        const emojiData = emojiDataMap.getEmojiByCodepointMatch(startingStr);

        // Assert
        expect(emojiData?.unified).toStrictEqual(expectedMatchUnified);
      },
    );
  });
});
