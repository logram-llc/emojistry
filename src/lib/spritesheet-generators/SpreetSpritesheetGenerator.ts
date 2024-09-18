import { readFile } from 'fs/promises';
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
    try {
      const { stdout } = await execAsync(
        `spreet --retina ${imagesInputPath} ${outputPath}`,
      );
      console.log(`spreet: ${stdout || 'Done'}`);
    } catch (error) {
      console.error(
        `spreet: ${error.stderr?.toString() || error.message || 'Error'}`,
      );
      process.exit(1);
    }

    return JSON.parse(
      await readFile(`${outputPath}.json`, { encoding: 'utf8' }),
    );
  }
}
