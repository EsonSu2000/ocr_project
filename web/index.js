// import { default as wasm, OcrEngineInit, OcrEngine } from "./wasm/dist/ocrs.js";

// 在文件开头添加 Worker 初始化
const worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
let workerReady = false;

// wasm().then(async () => {
(() => {
    const uploadArea = document.querySelector('.upload-area');
    const fileInput = document.getElementById('fileInput');
    const preview = document.getElementById('preview');
    const textInput = document.getElementById('textInput');
    const submitButton = document.getElementById('submitButton');
    const resetButton = document.getElementById('resetButton');
    const progressContainer = document.querySelector('.progress-container');
    const progressBar = document.querySelector('.progress-bar');
    const progressText = document.querySelector('.progress-text');
    let inputFile;
    // 点击上传区域触发文件选择
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });

    // 处理拖拽
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#666';
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.borderColor = '#ccc';
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#ccc';
        const file = e.dataTransfer.files[0];
        handleFile(file);
    });

    // 处理文件选择
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        handleFile(file);
    });

    // 处理文件并预览
    function handleFile (file) {
        if (!file) return;

        if (!file.type.match('image/png') && !file.type.match('image/jpeg')) {
            alert('请上传 PNG 或 JPG 格式的图片！');
            return;
        }
        inputFile = file;
        const reader = new FileReader();
        reader.onload = (e) => {
            preview.src = e.target.result;
            preview.style.display = 'block';
            uploadArea.style.display = 'none';
        };
        reader.readAsDataURL(file);
    }

    // 重置按钮点击事件
    resetButton.addEventListener('click', () => {
        preview.src = '';
        preview.style.display = 'none';
        uploadArea.style.display = 'block';
        textInput.value = '';
        fileInput.value = '';
        inputFile = null;
        document.querySelector('.preview-draw_area').innerHTML = '';
    });

    submitButton.addEventListener('click', async () => {
        if (!workerReady) {
            alert('系统还未准备就绪，请稍候...');
            return;
        }

        const keywords = textInput.value.split(',');
        // 显示进度条
        progressContainer.style.display = 'block';
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += 2;
            if (progress <= 98) {
                progressBar.style.width = `${progress}%`;
                progressText.textContent = `${progress}%`;
            } else {
                clearInterval(progressInterval);
            }
        }, 400);

        // inputFile 转 imageData
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.src = preview.src;
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            // 发送数据到 Worker 处理
            worker.postMessage({
                type: 'recognize',
                imageData,
                keywords
            });
        };
    });
    worker.onmessage = (e) => {
        if (e.data.type === 'ready') {
            workerReady = true;
        } else if (e.data.type === 'result') {
            const { result, imageData } = e.data;
            progressBar.style.width = `100%`;
            progressText.textContent = `100%`;
            drawRect(imageData, result);
            setTimeout(() => {
                progressContainer.style.display = 'none';
                // progressBar.style.width = '0%';
                // progressText.textContent = '0%';
            }, 500);
        } else if (e.data.type === 'error') {
            console.error('Worker error:', e.data.error);
            alert('处理过程中发生错误：' + e.data.error);
        }
    };
    // 找到关键字的位置初始化canvas 并指定位置绘制多边形
    function drawRect (imgData, rects) {
        document.querySelector('.preview-draw_area').innerHTML = '';
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = imgData.width;
        canvas.height = imgData.height;
        ctx.putImageData(imgData, 0, 0);
        for (let i = 0; i < rects.length; i++) {
            const rect = rects[i];
            console.log(rect)
            ctx.beginPath();
            // 根据四个点 [x0, y0, ... x3, y3] 画矩形
            ctx.moveTo(rect[0], rect[1]);
            ctx.lineTo(rect[2], rect[3]);
            ctx.lineTo(rect[4], rect[5]);
            ctx.lineTo(rect[6], rect[7]);
            ctx.lineTo(rect[0], rect[1]);
            // 画边框
            ctx.strokeStyle = 'green';
            ctx.stroke();
        }
        document.querySelector('.preview-draw_area').appendChild(canvas);
    }
})();

