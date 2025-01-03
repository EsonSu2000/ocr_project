let wasm;

let WASM_VECTOR_LEN = 0;

let cachedUint8ArrayMemory0 = null;

function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

const cachedTextEncoder = (typeof TextEncoder !== 'undefined' ? new TextEncoder('utf-8') : { encode: () => { throw Error('TextEncoder not available') } } );

const encodeString = (typeof cachedTextEncoder.encodeInto === 'function'
    ? function (arg, view) {
    return cachedTextEncoder.encodeInto(arg, view);
}
    : function (arg, view) {
    const buf = cachedTextEncoder.encode(arg);
    view.set(buf);
    return {
        read: arg.length,
        written: buf.length
    };
});

function passStringToWasm0(arg, malloc, realloc) {

    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length, 1) >>> 0;
        getUint8ArrayMemory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;

    const mem = getUint8ArrayMemory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }

    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
        const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
        const ret = encodeString(arg, view);

        offset += ret.written;
        ptr = realloc(ptr, len, offset, 1) >>> 0;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

function isLikeNone(x) {
    return x === undefined || x === null;
}

let cachedDataViewMemory0 = null;

function getDataViewMemory0() {
    if (cachedDataViewMemory0 === null || cachedDataViewMemory0.buffer.detached === true || (cachedDataViewMemory0.buffer.detached === undefined && cachedDataViewMemory0.buffer !== wasm.memory.buffer)) {
        cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
    }
    return cachedDataViewMemory0;
}

const cachedTextDecoder = (typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-8', { ignoreBOM: true, fatal: true }) : { decode: () => { throw Error('TextDecoder not available') } } );

if (typeof TextDecoder !== 'undefined') { cachedTextDecoder.decode(); };

function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

function passArray8ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 1, 1) >>> 0;
    getUint8ArrayMemory0().set(arg, ptr / 1);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

function takeFromExternrefTable0(idx) {
    const value = wasm.__wbindgen_export_0.get(idx);
    wasm.__externref_table_dealloc(idx);
    return value;
}

function _assertClass(instance, klass) {
    if (!(instance instanceof klass)) {
        throw new Error(`expected instance of ${klass.name}`);
    }
}

function getArrayJsValueFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    const mem = getDataViewMemory0();
    const result = [];
    for (let i = ptr; i < ptr + 4 * len; i += 4) {
        result.push(wasm.__wbindgen_export_0.get(mem.getUint32(i, true)));
    }
    wasm.__externref_drop_slice(ptr, len);
    return result;
}

function addToExternrefTable0(obj) {
    const idx = wasm.__externref_table_alloc();
    wasm.__wbindgen_export_0.set(idx, obj);
    return idx;
}

function passArrayJsValueToWasm0(array, malloc) {
    const ptr = malloc(array.length * 4, 4) >>> 0;
    const mem = getDataViewMemory0();
    for (let i = 0; i < array.length; i++) {
        mem.setUint32(ptr + 4 * i, addToExternrefTable0(array[i]), true);
    }
    WASM_VECTOR_LEN = array.length;
    return ptr;
}

function getArrayU8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}

let cachedFloat32ArrayMemory0 = null;

function getFloat32ArrayMemory0() {
    if (cachedFloat32ArrayMemory0 === null || cachedFloat32ArrayMemory0.byteLength === 0) {
        cachedFloat32ArrayMemory0 = new Float32Array(wasm.memory.buffer);
    }
    return cachedFloat32ArrayMemory0;
}

function getArrayF32FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getFloat32ArrayMemory0().subarray(ptr / 4, ptr / 4 + len);
}

const DetectedLineFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_detectedline_free(ptr >>> 0, 1));
/**
 * 已检测但未识别的文本行。
 *
 * 这包含文本的位置信息，但不包含字符串内容。
 */
export class DetectedLine {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(DetectedLine.prototype);
        obj.__wbg_ptr = ptr;
        DetectedLineFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    static __unwrap(jsValue) {
        if (!(jsValue instanceof DetectedLine)) {
            return 0;
        }
        return jsValue.__destroy_into_raw();
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        DetectedLineFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_detectedline_free(ptr, 0);
    }
    /**
     * @returns {RotatedRect}
     */
    rotatedRect() {
        const ret = wasm.detectedline_rotatedRect(this.__wbg_ptr);
        return RotatedRect.__wrap(ret);
    }
    /**
     * @returns {(RotatedRect)[]}
     */
    words() {
        const ret = wasm.detectedline_words(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
}

const ImageFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_image_free(ptr >>> 0, 1));
/**
 * 可以作为输入传递给 `OcrEngine.loadImage` 的预处理图像。
 */
export class Image {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Image.prototype);
        obj.__wbg_ptr = ptr;
        ImageFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        ImageFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_image_free(ptr, 0);
    }
    /**
     * 返回图像中的通道数。
     * @returns {number}
     */
    channels() {
        const ret = wasm.image_channels(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * 返回图像的宽度。
     * @returns {number}
     */
    width() {
        const ret = wasm.image_width(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * 返回图像的高度。
     * @returns {number}
     */
    height() {
        const ret = wasm.image_height(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * 以按行主序、通道最后的顺序返回图像数据。
     * @returns {Uint8Array}
     */
    data() {
        const ret = wasm.image_data(this.__wbg_ptr);
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
}

const OcrEngineFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_ocrengine_free(ptr >>> 0, 1));
/**
 * OcrEngine 是用于在 WebAssembly 中执行 OCR 的主要 API。
 */
export class OcrEngine {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        OcrEngineFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_ocrengine_free(ptr, 0);
    }
    /**
     * 使用 `init` 提供的模型和其他设置构造一个新的 `OcrEngine`。
     *
     * 要在图像中检测文本，`init` 必须设置了检测模型。
     * 要识别文本，`init` 必须设置了识别模型。
     * @param {OcrEngineInit} init
     */
    constructor(init) {
        _assertClass(init, OcrEngineInit);
        var ptr0 = init.__destroy_into_raw();
        const ret = wasm.ocrengine_new(ptr0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        this.__wbg_ptr = ret[0] >>> 0;
        OcrEngineFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * 使用 OCR 引擎准备分析的图像。
     *
     * 图像是按行主序、通道最后的像素数组。这与
     * [ImageData](https://developer.mozilla.org/en-US/docs/Web/API/ImageData)
     * API 的格式匹配。支持的通道组合是 RGB 和 RGBA。通道的数量从 `data` 的长度中推断。
     * @param {number} width
     * @param {number} height
     * @param {Uint8Array} data
     * @returns {Image}
     */
    loadImage(width, height, data) {
        const ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.ocrengine_loadImage(this.__wbg_ptr, width, height, ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return Image.__wrap(ret[0]);
    }
    /**
     * 在图像中检测文本。
     *
     * 返回找到的文本行列表。这些可以传递给 `recognizeText` 来识别字符。
     * @param {Image} image
     * @returns {(DetectedLine)[]}
     */
    detectText(image) {
        _assertClass(image, Image);
        const ret = wasm.ocrengine_detectText(this.__wbg_ptr, image.__wbg_ptr);
        if (ret[3]) {
            throw takeFromExternrefTable0(ret[2]);
        }
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * 识别之前用 `detectText` 检测到的文本。
     *
     * 返回可以用于查询文本和每个行的边界框的 `TextLine` 对象列表。
     * @param {Image} image
     * @param {(DetectedLine)[]} lines
     * @returns {(TextLine)[]}
     */
    recognizeText(image, lines) {
        _assertClass(image, Image);
        const ptr0 = passArrayJsValueToWasm0(lines, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.ocrengine_recognizeText(this.__wbg_ptr, image.__wbg_ptr, ptr0, len0);
        if (ret[3]) {
            throw takeFromExternrefTable0(ret[2]);
        }
        var v2 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v2;
    }
    /**
     * 在图像中检测和识别文本。
     *
     * 返回一个包含按阅读顺序找到的所有文本的单个字符串。
     * @param {Image} image
     * @returns {string}
     */
    getText(image) {
        let deferred2_0;
        let deferred2_1;
        try {
            _assertClass(image, Image);
            const ret = wasm.ocrengine_getText(this.__wbg_ptr, image.__wbg_ptr);
            var ptr1 = ret[0];
            var len1 = ret[1];
            if (ret[3]) {
                ptr1 = 0; len1 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred2_0 = ptr1;
            deferred2_1 = len1;
            return getStringFromWasm0(ptr1, len1);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
    /**
     * 在图像中检测和识别文本。
     *
     * 返回可以用于查询文本和每个行的边界框的 `TextLine` 对象列表。
     * @param {Image} image
     * @returns {(TextLine)[]}
     */
    getTextLines(image) {
        _assertClass(image, Image);
        const ret = wasm.ocrengine_getTextLines(this.__wbg_ptr, image.__wbg_ptr);
        if (ret[3]) {
            throw takeFromExternrefTable0(ret[2]);
        }
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * 查找图像中关键词的位置。
     * @param {Image} image
     * @param {(string)[]} keywords
     * @returns {(TextWord)[]}
     */
    findKeywordPosition(image, keywords) {
        _assertClass(image, Image);
        const ptr0 = passArrayJsValueToWasm0(keywords, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.ocrengine_findKeywordPosition(this.__wbg_ptr, image.__wbg_ptr, ptr0, len0);
        if (ret[3]) {
            throw takeFromExternrefTable0(ret[2]);
        }
        var v2 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v2;
    }
}

const OcrEngineInitFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_ocrengineinit_free(ptr >>> 0, 1));
/**
 * 用于构建 [OcrEngine] 的选项。
 */
export class OcrEngineInit {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        OcrEngineInitFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_ocrengineinit_free(ptr, 0);
    }
    constructor() {
        const ret = wasm.ocrengineinit_new();
        this.__wbg_ptr = ret >>> 0;
        OcrEngineInitFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * 加载用于文本检测的模型。
     * @param {Uint8Array} data
     */
    setDetectionModel(data) {
        const ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.ocrengineinit_setDetectionModel(this.__wbg_ptr, ptr0, len0);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * 加载用于文本识别的模型。
     * @param {Uint8Array} data
     */
    setRecognitionModel(data) {
        const ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.ocrengineinit_setRecognitionModel(this.__wbg_ptr, ptr0, len0);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
}

const RotatedRectFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_rotatedrect_free(ptr >>> 0, 1));

export class RotatedRect {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(RotatedRect.prototype);
        obj.__wbg_ptr = ptr;
        RotatedRectFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        RotatedRectFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_rotatedrect_free(ptr, 0);
    }
    /**
     * 返回这个矩形的四个角的 X 和 Y 坐标数组，排列为 `[x0, y0, ... x3, y3]`。
     * @returns {Float32Array}
     */
    corners() {
        const ret = wasm.rotatedrect_corners(this.__wbg_ptr);
        var v1 = getArrayF32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * 返回这个旋转矩形的轴对齐边界矩形的坐标。
     *
     * 结果是一个 `[left, top, right, bottom]` 坐标数组。
     * @returns {Float32Array}
     */
    boundingRect() {
        const ret = wasm.rotatedrect_boundingRect(this.__wbg_ptr);
        var v1 = getArrayF32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
}

const TextLineFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_textline_free(ptr >>> 0, 1));
/**
 * 由 `TextWord` 序列形成的文本行。
 */
export class TextLine {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(TextLine.prototype);
        obj.__wbg_ptr = ptr;
        TextLineFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        TextLineFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_textline_free(ptr, 0);
    }
    /**
     * @returns {string}
     */
    text() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.textline_text(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {(TextWord)[]}
     */
    words() {
        const ret = wasm.textline_words(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
}

const TextWordFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_textword_free(ptr >>> 0, 1));
/**
 * 包含已识别字符的边界框和文本的 `TextWord`。
 */
export class TextWord {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(TextWord.prototype);
        obj.__wbg_ptr = ptr;
        TextWordFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        TextWordFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_textword_free(ptr, 0);
    }
    /**
     * @returns {string}
     */
    json() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.textword_json(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {string}
     */
    text() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.textword_text(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * 返回包含此单词字符的定向边界矩形。
     * @returns {RotatedRect}
     */
    rotatedRect() {
        const ret = wasm.textword_rotatedRect(this.__wbg_ptr);
        return RotatedRect.__wrap(ret);
    }
}

async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);

            } catch (e) {
                if (module.headers.get('Content-Type') != 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else {
                    throw e;
                }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);

    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };

        } else {
            return instance;
        }
    }
}

function __wbg_get_imports() {
    const imports = {};
    imports.wbg = {};
    imports.wbg.__wbg_detectedline_new = function(arg0) {
        const ret = DetectedLine.__wrap(arg0);
        return ret;
    };
    imports.wbg.__wbg_detectedline_unwrap = function(arg0) {
        const ret = DetectedLine.__unwrap(arg0);
        return ret;
    };
    imports.wbg.__wbg_log_5f82480ac7a101b6 = function(arg0, arg1) {
        console.log(arg0, arg1);
    };
    imports.wbg.__wbg_rotatedrect_new = function(arg0) {
        const ret = RotatedRect.__wrap(arg0);
        return ret;
    };
    imports.wbg.__wbg_textline_new = function(arg0) {
        const ret = TextLine.__wrap(arg0);
        return ret;
    };
    imports.wbg.__wbg_textword_new = function(arg0) {
        const ret = TextWord.__wrap(arg0);
        return ret;
    };
    imports.wbg.__wbindgen_init_externref_table = function() {
        const table = wasm.__wbindgen_export_0;
        const offset = table.grow(4);
        table.set(0, undefined);
        table.set(offset + 0, undefined);
        table.set(offset + 1, null);
        table.set(offset + 2, true);
        table.set(offset + 3, false);
        ;
    };
    imports.wbg.__wbindgen_string_get = function(arg0, arg1) {
        const obj = arg1;
        const ret = typeof(obj) === 'string' ? obj : undefined;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbindgen_string_new = function(arg0, arg1) {
        const ret = getStringFromWasm0(arg0, arg1);
        return ret;
    };
    imports.wbg.__wbindgen_throw = function(arg0, arg1) {
        throw new Error(getStringFromWasm0(arg0, arg1));
    };

    return imports;
}

function __wbg_init_memory(imports, memory) {

}

function __wbg_finalize_init(instance, module) {
    wasm = instance.exports;
    __wbg_init.__wbindgen_wasm_module = module;
    cachedDataViewMemory0 = null;
    cachedFloat32ArrayMemory0 = null;
    cachedUint8ArrayMemory0 = null;


    wasm.__wbindgen_start();
    return wasm;
}

function initSync(module) {
    if (wasm !== undefined) return wasm;


    if (typeof module !== 'undefined') {
        if (Object.getPrototypeOf(module) === Object.prototype) {
            ({module} = module)
        } else {
            console.warn('using deprecated parameters for `initSync()`; pass a single object instead')
        }
    }

    const imports = __wbg_get_imports();

    __wbg_init_memory(imports);

    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }

    const instance = new WebAssembly.Instance(module, imports);

    return __wbg_finalize_init(instance, module);
}

async function __wbg_init(module_or_path) {
    if (wasm !== undefined) return wasm;


    if (typeof module_or_path !== 'undefined') {
        if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
            ({module_or_path} = module_or_path)
        } else {
            console.warn('using deprecated parameters for the initialization function; pass a single object instead')
        }
    }

    if (typeof module_or_path === 'undefined') {
        module_or_path = new URL('ocrs_bg.wasm', import.meta.url);
    }
    const imports = __wbg_get_imports();

    if (typeof module_or_path === 'string' || (typeof Request === 'function' && module_or_path instanceof Request) || (typeof URL === 'function' && module_or_path instanceof URL)) {
        module_or_path = fetch(module_or_path);
    }

    __wbg_init_memory(imports);

    const { instance, module } = await __wbg_load(await module_or_path, imports);

    return __wbg_finalize_init(instance, module);
}

export { initSync };
export default __wbg_init;
