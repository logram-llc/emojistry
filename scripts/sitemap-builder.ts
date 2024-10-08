import { EmojiMetadataReader } from '../src/lib/emojis/EmojiMetadataReader';
import { EmojiFamily } from '../src/lib/emojis/EmojiTypes';
import { UrlManager } from '../src/lib/UrlManager';
import {
  EnumChangefreq,
  simpleSitemapAndIndex,
  SitemapItemLoose,
} from 'sitemap';
import { join } from 'path';

const DOMAIN_NAME = process.env.VITE_DOMAIN_NAME;

if (!DOMAIN_NAME) {
  throw new Error('The env var `VITE_DOMAIN_NAME` is required');
}

const BASE_URL = `https://${DOMAIN_NAME}`;

(async () => {
  console.log(`Building sitemap.xml...`);

  const emojiRepo = new EmojiMetadataReader();
  const urls: SitemapItemLoose[] = [
    { url: BASE_URL, changefreq: EnumChangefreq.MONTHLY },
  ];

  for (const emojiFamily of Object.values(EmojiFamily)) {
    urls.push({
      url: UrlManager.getFamilyPath(emojiFamily),
      changefreq: EnumChangefreq.YEARLY,
    });

    const emojis = await emojiRepo.all(emojiFamily);
    Object.values(emojis).forEach((emoji) => {
      urls.push({
        url: UrlManager.getEmojiPath(emoji),
        changefreq: EnumChangefreq.YEARLY,
      });
    });
  }

  await simpleSitemapAndIndex({
    hostname: BASE_URL,
    destinationDir: join(__dirname, '..', 'public'),
    sourceData: urls,
  });

  console.log('Built sitemap.xml');
})();
