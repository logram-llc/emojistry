export interface ISpritesheetEmoji {
  height: number;
  width: number;
  x: number;
  y: number;
  pixelRatio: number;
}

export interface ISpritesheetGeneratorArgs {
  outputPath: string;
  imagesInputPath: string;
}

export interface ISpritesheetGenerator {
  generate({
    outputPath,
    imagesInputPath,
  }: ISpritesheetGeneratorArgs): Promise<Record<string, ISpritesheetEmoji>>;
}
