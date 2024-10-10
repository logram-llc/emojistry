import { readFile, rm } from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';
import {
  ISpritesheetEmoji,
  ISpritesheetGenerator,
  ISpritesheetGeneratorArgs,
} from './SpritesheetTypes';

const execAsync = promisify(exec);

export class SpreetSpritesheetGenerator implements ISpritesheetGenerator {
  async generate({
    outputPath,
    imagesInputPath,
  }: ISpritesheetGeneratorArgs): Promise<Record<string, ISpritesheetEmoji>> {
    // NOTE(nicholas-ramsey): Spreet creates the PNG spritesheet based off of `outputPath`.
    // It appends the `.png` file extension.
    const spritesheetPngPath = `${outputPath}.png`;

    const { stdout: spreetStdout } = await execAsync(
      `spreet --retina ${imagesInputPath} ${outputPath}`,
    );
    console.log(`spreet: ${spreetStdout || 'Done'}`);

    const { stdout: cwebpStdout } = await execAsync(
      `cwebp -quiet -m 6 -mt -exact -near_lossless 60 -z 9 ${spritesheetPngPath} -o ${outputPath}.webp`,
    );
    console.log(`cwebp: ${cwebpStdout || 'Done'}`);

    rm(spritesheetPngPath, { force: true });

    return JSON.parse(
      await readFile(`${outputPath}.json`, { encoding: 'utf8' }),
    );
  }
}
