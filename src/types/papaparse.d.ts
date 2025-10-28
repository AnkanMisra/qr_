declare module "papaparse" {
  export interface ParseError {
    message: string;
    row?: number;
  }

  export interface ParseMeta {
    fields?: string[];
    delimiter: string;
    linebreak: string;
    aborted: boolean;
    truncated: boolean;
    cursor: number;
  }

  export interface ParseResult<T> {
    data: T[];
    errors: ParseError[];
    meta: ParseMeta;
  }

  export interface ParseConfig<T> {
    header?: boolean;
    skipEmptyLines?: boolean | "greedy";
    complete?: (results: ParseResult<T>) => void;
    error?: (error: ParseError) => void;
  }

  interface PapaStatic {
    parse<T>(input: File | string, config: ParseConfig<T>): void;
  }

  const Papa: PapaStatic;
  export type { ParseConfig, ParseError, ParseResult };
  export default Papa;
}
