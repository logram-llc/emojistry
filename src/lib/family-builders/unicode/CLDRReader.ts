import { XMLParser } from 'fast-xml-parser';
import { readFile } from 'fs/promises';

interface ICLDRLocale {
  language: string;
  territory: string;
}

interface ILDMLIdentityElement {
  language?: object;
  territory?: object;
}

// NOTE(nicholas-ramsey): You can read more about the LDML spec here: https://unicode.org/reports/tr35/
// LDML - The specification of the XML format used for CLDR data, including the interpretation of the CLDR data
interface ICLDRRootElement {
  ldml: {
    identity?: ILDMLIdentityElement;
    annotations?: {
      annotation: string[];
    };
  };
}

export interface IFilteredAnnotationResults {
  locales: ICLDRLocale[];
  annotations: { text: string; codePoint: string; type?: string | undefined }[];
}

export class CLDRReader {
  /**
   * Parses the `identity` element's `language` and `territory` children.
   */
  private parseLDMLIdentity(root: ICLDRRootElement): ICLDRLocale | null {
    const languageType = root.ldml?.identity?.language?.['@_type'];
    const territoryType = root.ldml?.identity?.language?.['@_type'];
    if (languageType) {
      return {
        language: languageType,
        territory: territoryType,
      };
    }

    return null;
  }

  async loadMultiple(annotationsPaths: string[]): Promise<CLDRData> {
    const combinedRoot: ICLDRRootElement = {
      ldml: {
        annotations: { annotation: [] },
      },
    };
    const languages: Set<ICLDRLocale> = new Set();

    for (const annotationPath of annotationsPaths) {
      const annotationsXml = await readFile(annotationPath, 'utf-8');
      const root: ICLDRRootElement = new XMLParser({
        attributeNamePrefix: '@_',
        ignoreAttributes: false,
      }).parse(annotationsXml);

      const parsedIdentity = this.parseLDMLIdentity(root);
      if (parsedIdentity) {
        languages.add(parsedIdentity);
      }

      const annotations = root.ldml?.annotations?.annotation || [];
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      combinedRoot.ldml.annotations!.annotation.push(...annotations);
    }

    return new CLDRData(combinedRoot, Array.from(languages));
  }

  async load(annotationsPath: string): Promise<CLDRData> {
    const annotationsXml = await readFile(annotationsPath, 'utf-8');
    const root: ICLDRRootElement = new XMLParser().parse(annotationsXml);
    const parsedIdentity = this.parseLDMLIdentity(root);

    return new CLDRData(root, parsedIdentity ? [parsedIdentity] : []);
  }
}

export class CLDRData {
  private _root: ICLDRRootElement;
  private _locales: ICLDRLocale[];

  constructor(root: ICLDRRootElement, identities: ICLDRLocale[]) {
    this._root = root;
    this._locales = identities;
  }

  findAnnotations(
    codePoint: string,
    type?: string | null,
  ): IFilteredAnnotationResults {
    const annotations = this._root?.ldml?.annotations?.annotation || [];

    const filteredAnnotations = annotations.filter((annotation) => {
      const cpMatches = codePoint ? annotation['@_cp'] === codePoint : true;
      const typeMatches = type ? annotation['@_type'] === type : true;

      return cpMatches && typeMatches;
    });

    return {
      locales: this._locales,
      annotations: filteredAnnotations.map((annotation) => ({
        text: annotation['#text'],
        codePoint: annotation['@_cp'],
        type: annotation['@_type'],
      })),
    };
  }
}
