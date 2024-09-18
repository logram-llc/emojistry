import { EmojiMetadataReader } from '@/lib/emojis/EmojiMetadataReader';
import {
  EmojiFamily,
  IEmoji,
  IEmojiMetadataReader,
} from '@/lib/emojis/EmojiTypes';

class UrlManager {
  private emojiRepository: IEmojiMetadataReader;

  constructor(emojiRepository?: IEmojiMetadataReader) {
    this.emojiRepository = emojiRepository ?? new EmojiMetadataReader();
  }

  static getFamilyPath(family: string): string {
    // TODO: Should IEmoji store the EmojiFamily enum value?
    const normalFamily = family.toUpperCase().replaceAll(' ', '_');
    return `/${encodeURIComponent(normalFamily)}`;
  }

  static getEmojiPath(emoji: IEmoji): string {
    const familyPath = UrlManager.getFamilyPath(emoji.family);
    const path = `${familyPath}/${encodeURIComponent(emoji.cldr)}`;
    return path;
  }

  async getEmoji(): Promise<IEmoji | null> {
    const path = window.location.pathname.slice(1); // Remove first slash
    if (!path) {
      return null;
    }

    const [family, cldr] = path.split('/');
    const decodedCldr = decodeURIComponent(cldr);
    const decodedFamily = decodeURIComponent(family);

    if (!decodedFamily || !decodedCldr) {
      return null;
    }

    const emoji = await this.emojiRepository.get(
      decodedFamily as EmojiFamily,
      decodedCldr,
    );
    return emoji ? emoji : null;
  }

  setEmoji(emoji: IEmoji | null): void {
    if (emoji === null) {
      window.history.pushState({}, '', '/');
      return;
    }

    const path = UrlManager.getEmojiPath(emoji);
    window.history.pushState({}, '', path);
  }

  setFamily(family: string | null): void {
    if (family === null) {
      window.history.pushState({}, '', '/');
      return;
    }

    const path = UrlManager.getFamilyPath(family);
    window.history.pushState({}, '', path);
  }
}

export { UrlManager };
