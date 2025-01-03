/* tslint:disable */
/* eslint-disable */
/**
 * 已检测但未识别的文本行。
 *
 * 这包含文本的位置信息，但不包含字符串内容。
 */
export class DetectedLine {
  private constructor();
  free(): void;
  rotatedRect(): RotatedRect;
  words(): (RotatedRect)[];
}
/**
 * 可以作为输入传递给 `OcrEngine.loadImage` 的预处理图像。
 */
export class Image {
  private constructor();
  free(): void;
  /**
   * 返回图像中的通道数。
   */
  channels(): number;
  /**
   * 返回图像的宽度。
   */
  width(): number;
  /**
   * 返回图像的高度。
   */
  height(): number;
  /**
   * 以按行主序、通道最后的顺序返回图像数据。
   */
  data(): Uint8Array;
}
/**
 * OcrEngine 是用于在 WebAssembly 中执行 OCR 的主要 API。
 */
export class OcrEngine {
  free(): void;
  /**
   * 使用 `init` 提供的模型和其他设置构造一个新的 `OcrEngine`。
   *
   * 要在图像中检测文本，`init` 必须设置了检测模型。
   * 要识别文本，`init` 必须设置了识别模型。
   */
  constructor(init: OcrEngineInit);
  /**
   * 使用 OCR 引擎准备分析的图像。
   *
   * 图像是按行主序、通道最后的像素数组。这与
   * [ImageData](https://developer.mozilla.org/en-US/docs/Web/API/ImageData)
   * API 的格式匹配。支持的通道组合是 RGB 和 RGBA。通道的数量从 `data` 的长度中推断。
   */
  loadImage(width: number, height: number, data: Uint8Array): Image;
  /**
   * 在图像中检测文本。
   *
   * 返回找到的文本行列表。这些可以传递给 `recognizeText` 来识别字符。
   */
  detectText(image: Image): (DetectedLine)[];
  /**
   * 识别之前用 `detectText` 检测到的文本。
   *
   * 返回可以用于查询文本和每个行的边界框的 `TextLine` 对象列表。
   */
  recognizeText(image: Image, lines: (DetectedLine)[]): (TextLine)[];
  /**
   * 在图像中检测和识别文本。
   *
   * 返回一个包含按阅读顺序找到的所有文本的单个字符串。
   */
  getText(image: Image): string;
  /**
   * 在图像中检测和识别文本。
   *
   * 返回可以用于查询文本和每个行的边界框的 `TextLine` 对象列表。
   */
  getTextLines(image: Image): (TextLine)[];
  /**
   * 查找图像中关键词的位置。
   */
  findKeywordPosition(image: Image, keywords: (string)[]): (TextWord)[];
}
/**
 * 用于构建 [OcrEngine] 的选项。
 */
export class OcrEngineInit {
  free(): void;
  constructor();
  /**
   * 加载用于文本检测的模型。
   */
  setDetectionModel(data: Uint8Array): void;
  /**
   * 加载用于文本识别的模型。
   */
  setRecognitionModel(data: Uint8Array): void;
}
export class RotatedRect {
  private constructor();
  free(): void;
  /**
   * 返回这个矩形的四个角的 X 和 Y 坐标数组，排列为 `[x0, y0, ... x3, y3]`。
   */
  corners(): Float32Array;
  /**
   * 返回这个旋转矩形的轴对齐边界矩形的坐标。
   *
   * 结果是一个 `[left, top, right, bottom]` 坐标数组。
   */
  boundingRect(): Float32Array;
}
/**
 * 由 `TextWord` 序列形成的文本行。
 */
export class TextLine {
  private constructor();
  free(): void;
  text(): string;
  words(): (TextWord)[];
}
/**
 * 包含已识别字符的边界框和文本的 `TextWord`。
 */
export class TextWord {
  private constructor();
  free(): void;
  json(): string;
  text(): string;
  /**
   * 返回包含此单词字符的定向边界矩形。
   */
  rotatedRect(): RotatedRect;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_ocrengineinit_free: (a: number, b: number) => void;
  readonly ocrengineinit_new: () => number;
  readonly ocrengineinit_setDetectionModel: (a: number, b: number, c: number) => [number, number];
  readonly ocrengineinit_setRecognitionModel: (a: number, b: number, c: number) => [number, number];
  readonly __wbg_ocrengine_free: (a: number, b: number) => void;
  readonly ocrengine_new: (a: number) => [number, number, number];
  readonly ocrengine_loadImage: (a: number, b: number, c: number, d: number, e: number) => [number, number, number];
  readonly ocrengine_detectText: (a: number, b: number) => [number, number, number, number];
  readonly ocrengine_recognizeText: (a: number, b: number, c: number, d: number) => [number, number, number, number];
  readonly ocrengine_getText: (a: number, b: number) => [number, number, number, number];
  readonly ocrengine_getTextLines: (a: number, b: number) => [number, number, number, number];
  readonly ocrengine_findKeywordPosition: (a: number, b: number, c: number, d: number) => [number, number, number, number];
  readonly __wbg_image_free: (a: number, b: number) => void;
  readonly image_channels: (a: number) => number;
  readonly image_width: (a: number) => number;
  readonly image_height: (a: number) => number;
  readonly image_data: (a: number) => [number, number];
  readonly __wbg_rotatedrect_free: (a: number, b: number) => void;
  readonly rotatedrect_corners: (a: number) => [number, number];
  readonly rotatedrect_boundingRect: (a: number) => [number, number];
  readonly __wbg_detectedline_free: (a: number, b: number) => void;
  readonly detectedline_rotatedRect: (a: number) => number;
  readonly detectedline_words: (a: number) => [number, number];
  readonly __wbg_textword_free: (a: number, b: number) => void;
  readonly textword_json: (a: number) => [number, number];
  readonly textword_text: (a: number) => [number, number];
  readonly textword_rotatedRect: (a: number) => number;
  readonly __wbg_textline_free: (a: number, b: number) => void;
  readonly textline_text: (a: number) => [number, number];
  readonly textline_words: (a: number) => [number, number];
  readonly __wbindgen_export_0: WebAssembly.Table;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __externref_table_dealloc: (a: number) => void;
  readonly __externref_drop_slice: (a: number, b: number) => void;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly __externref_table_alloc: () => number;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
