import { readdir, rm } from 'fs/promises';
import { join } from 'path';

const emojiAssetsBasePath = 'scripts/assets/';

(async () => {
  const assetDirectories = (await readdir(emojiAssetsBasePath)).filter(
    (path) => path != '.gitkeep',
  );

  for (const assetDirectory of assetDirectories) {
    await rm(join(emojiAssetsBasePath, assetDirectory), {
      recursive: true,
      force: true,
    });
  }
})();
