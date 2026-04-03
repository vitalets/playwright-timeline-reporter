/**
 * Minimal JSON streaming helper. Writes objects to disk without buffering the full payload.
 * Supports simple templating so callers can wrap the array (e.g. `{ "data": [] }`).
 */
import fs from 'node:fs';
import path from 'node:path';
import { finished } from 'node:stream/promises';

const DEFAULT_PLACEHOLDER = '// __JSONL_DATA__';

export interface JsonStreamOptions {
  /**
   * Destination file path where the stream will be written.
   */
  filePath: string;
  /**
   * Template containing the placeholder.
   * Defaults to a plain JSON array.
   */
  template?: string;
  /**
   * Placeholder token used inside the template where JSON lines will be injected.
   */
  placeholder?: string;
}

export class JsonStream {
  private stream: fs.WriteStream | null = null;
  private firstChunk = true;
  private readonly prefix: string;
  private readonly suffix: string;
  private readonly filePath: string;

  constructor(options: JsonStreamOptions) {
    const placeholder = options.placeholder ?? DEFAULT_PLACEHOLDER;
    const template = options.template ?? `[\n${placeholder}\n]\n`;
    const { prefix, suffix } = splitTemplate(template, placeholder);
    this.filePath = options.filePath;
    this.prefix = prefix;
    this.suffix = suffix;
  }

  open() {
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    this.stream = fs.createWriteStream(this.filePath, { flags: 'w' });
    this.stream.write(this.prefix);
  }

  write(entry: unknown) {
    if (!this.stream) return;
    const prefix = this.firstChunk ? '' : ',\n';
    this.stream.write(prefix + jsonStringifyForHtml(entry));
    this.firstChunk = false;
  }

  async close(suffixData?: Record<string, unknown>) {
    if (!this.stream) return;
    // todo: make injecton more reliable.
    // Currently it may break if the suffix contains keys in unexpected places.
    const suffix = this.buildSuffix(suffixData);
    this.stream.end(suffix);
    await finished(this.stream);
  }

  private buildSuffix(suffixData: Record<string, unknown> = {}) {
    let suffix = this.suffix;
    Object.keys(suffixData).forEach((key) => {
      const strValue = jsonStringifyForHtml(suffixData[key]);
      suffix = suffix.replace(key, strValue);
    });
    return suffix;
  }
}

function splitTemplate(template: string, placeholder: string): { prefix: string; suffix: string } {
  const idx = template.indexOf(placeholder);
  if (idx === -1) {
    throw new Error(`JsonStream template must contain placeholder "${placeholder}"`);
  }
  return {
    prefix: template.slice(0, idx),
    suffix: template.slice(idx + placeholder.length),
  };
}

function jsonStringifyForHtml(data: unknown) {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c') // prevent </script> tag termination
    .replace(/>/g, '\\u003e') // extra hardening
    .replace(/&/g, '\\u0026') // avoid HTML entity parsing
    .replace(/\u2028/g, '\\u2028') // old JS line separator
    .replace(/\u2029/g, '\\u2029'); // old JS paragraph separator
}
