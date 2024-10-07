import { IEmoji } from '@/lib/emojis/EmojiTypes';
import { UrlManager } from './UrlManager';

const DEFAULT_SEO = {
  title: 'Fluent Emoji | Emojistry',
  description:
    "An emoji catalog for power users, browse Microsoft's Fluent Emoji library",
};

class SeoManager {
  private setTitle(title: string): void {
    const titleElem = document.querySelector('title');
    if (titleElem !== null) {
      titleElem.textContent = title;
    }

    [
      document.querySelector('meta[property="og:title"]'),
      document.querySelector('meta[name="twitter:title"]'),
    ]
      .filter((elem) => elem !== null)
      .forEach((elem) => elem.setAttribute('content', title));
  }

  private setDescription(description: string): void {
    [
      document.querySelector('meta[name="description"]'),
      document.querySelector('meta[property="og:description"]'),
      document.querySelector('meta[name="twitter:description"]'),
    ]
      .filter((elem) => elem !== null)
      .forEach((elem) => elem.setAttribute('content', description));
  }

  private setCanonicalUrl(path: string): void {
    const url = new URL(path, window.location.href);

    const canonicalUrlElem = document.querySelector('link[rel="canonical"]');
    canonicalUrlElem?.setAttribute('href', url.href);

    const ogUrlElem = document.querySelector('meta[property="og:url"]');
    ogUrlElem?.setAttribute('content', url.href);
  }

  setDefaults(): void {
    this.setTitle(DEFAULT_SEO.title);
    this.setDescription(DEFAULT_SEO.description);
    this.setCanonicalUrl('/');
  }

  setEmoji(emoji: IEmoji | null): void {
    if (emoji === null) {
      this.setDefaults();
      return;
    }

    this.setTitle(`${emoji.glyph} ${emoji.tts} ${emoji.family} | Emojistry`);
    this.setDescription(
      `The ${emoji.tts} (${emoji.glyph}) emoji from the ${emoji.family} family. Keywords: ${emoji.keywords.map((k) => k.replaceAll('-', ' ')).join(', ')}`,
    );
    this.setCanonicalUrl(UrlManager.getEmojiPath(emoji));
  }

  setFamily(family: string | null): void {
    if (!family) {
      this.setDefaults();
      return;
    }

    this.setTitle(`${family} | Emojistry`);
    this.setDescription(`${family} | An emoji catalog for power users`);
    this.setCanonicalUrl(UrlManager.getFamilyPath(family));
  }
}

export { SeoManager };
