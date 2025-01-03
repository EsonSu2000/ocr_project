import { default as wasm, OcrEngineInit, OcrEngine } from "./wasm/dist/ocrs.js";

// 初始化 wasm
wasm().then(() => {
  self.postMessage({ type: 'ready' });
});

// 初始化 OcrEngine 模型设置
async function initOcrEngine() {
    const engineInit = new OcrEngineInit();
    const [detectionModel, recognitionModel] = await loadModel();
    engineInit.setDetectionModel(detectionModel);
    engineInit.setRecognitionModel(recognitionModel);
    return engineInit;
}

// 加载模型
function loadModel() {
    const detectionPath = './models/text-detection.rten';
    const recognitionPath = './models/text-recognition.rten';
    return Promise.all([
        fetch(detectionPath).then(response => response.arrayBuffer()).then(buffer => new Uint8Array(buffer)),
        fetch(recognitionPath).then(response => response.arrayBuffer()).then(buffer => new Uint8Array(buffer))
    ]);
}

// 处理消息
self.onmessage = async function(e) {
    if (e.data.type === 'recognize') {
        const { imageData, keywords } = e.data;
        const engineInit = await initOcrEngine();
        const orcEngine = new OcrEngine(engineInit);
        const ocrInput = orcEngine.loadImage(imageData.width, imageData.height, imageData.data);
        const result = orcEngine.findKeywordPosition(ocrInput, keywords);
        let temp = result.map   (item => item.rotatedRect().corners());
        self.postMessage({ type: 'result', result: temp, imageData });
    }
};