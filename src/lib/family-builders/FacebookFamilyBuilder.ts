import { join } from 'path';
import { EmojiWithoutSpritesheetInfo } from './BuilderTypes';

interface IHttpClientOptions {
  headers: Record<string, string>;
  url: string;
  method: string;
}

interface IHttpClient<TResponse> {
  get(options: IHttpClientOptions): Promise<TResponse>;
}

// class FacebookHttpClientAdapter {
//   get(options: IHttpClientOptions): Promise<Response> {
//     return fetch(options.url, {
//       headers: options.headers,
//       method: options.method,
//     });
//   }
// }

export class FacebookEmojiFetcher {
  private _BASE_URL = 'https://static.xx.fbcdn.net/images/emoji.php/v9';
  private _httpClient: IHttpClient<Response>;

  constructor(httpClient: IHttpClient<Response>) {
    this._httpClient = httpClient;
  }

  private getCodePointImageName(codePoint: string) {
    return `${codePoint}.png`;
  }

  private calculateChecksum(
    codePoint: string,
    pixelRatio: number,
    sizePixels: number,
  ): string {
    const CHECKSUM_BASE = 317426846;
    const MAX_UINT32 = 4294967295;
    const MAX_UINT8 = 255;

    const imageName = this.getCodePointImageName(codePoint);
    const path = join(pixelRatio.toString(), sizePixels.toString(), imageName);

    let checksum = CHECKSUM_BASE;

    for (let x = 0; x < path.length; x++) {
      checksum = (checksum << 5) - checksum + path.charCodeAt(x);
      checksum &= MAX_UINT32;
    }

    return (checksum & MAX_UINT8).toString(16);
  }

  async fetchEmoji(
    codePoint: string,
    pixelRatio: number,
    sizePixels: number,
  ): Promise<Blob> {
    const checksum = this.calculateChecksum(codePoint, pixelRatio, sizePixels);
    const url = join(
      this._BASE_URL,
      // NOTE(nicholas-ramsey): Facebook supports multiple emoji types. In particular,
      /*
        "f" -> FBEMOJI
        "t" -> EMOJI_3
        "e" -> FB_EMOJI_EXTENDED
        "z" -> MESSENGER
        "u" -> UNICODE
        "c" -> COMPOSITE (?)
      */
      't',
      checksum,
      pixelRatio.toString(),
      sizePixels.toString(),
      this.getCodePointImageName(codePoint),
    );

    const response = await this._httpClient.get({
      url,
      method: 'GET',
      headers: {
        Referer: 'https://www.facebook.com/',
        'User-Agent':
          'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
      },
    });

    if (response.status !== 200) {
      throw new Error(
        `Failed to fetch Facebook image for ${codePoint}: '${url}'`,
      );
    }

    return response.blob();
  }
}

export class FacebookFamilyBuilder {
  async build(): Promise<Record<string, EmojiWithoutSpritesheetInfo>> {
    //   const emojiUnicodeBlocks: [number, number][] = [
    //     // Emoticons (Smileys & People)
    //     [0x1f600, 0x1f64f],
    //     // Supplemental Symbols and Pictographs
    //     [0x1f900, 0x1f9ff],
    //     // Miscellaneous Symbols and Pictographs
    //     [0x1f300, 0x1f5ff],
    //     // Transport and Map Symbols
    //     [0x1f680, 0x1f6ff],
    //     // Symbols and Pictographs Extended-A
    //     [0x1fa70, 0x1faff],
    //     // Regional Indicator Symbols (used for flags)
    //     [0x1f1e6, 0x1f1ff],
    //     // Modifier Symbols (Skin tone modifiers)
    //     [0x1f3fb, 0x1f3ff],
    //     // Tags (used in emoji sequences, especially flags)
    //     [0xe0000, 0xe007f],
    //   ];
    // }
  }
}
