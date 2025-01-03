use wasm_bindgen::prelude::*;

use rten::ops;
use rten::{Model, ModelOptions, OpRegistry};

use crate::{ImageSource, OcrEngine as BaseOcrEngine, OcrEngineParams, OcrInput, TextItem};
use rten_imageproc::{min_area_rect, BoundingRect, PointF};
use rten_tensor::prelude::*;
use web_sys::console;

/// 用于构建 [OcrEngine] 的选项。
#[wasm_bindgen]
pub struct OcrEngineInit {
    detection_model: Option<Model>,
    recognition_model: Option<Model>,
}

impl Default for OcrEngineInit {
    fn default() -> OcrEngineInit {
        OcrEngineInit::new()
    }
}

#[wasm_bindgen]
impl OcrEngineInit {
    #[wasm_bindgen(constructor)]
    pub fn new() -> OcrEngineInit {
        OcrEngineInit {
            detection_model: None,
            recognition_model: None,
        }
    }

    fn op_registry() -> OpRegistry {
        let mut reg = OpRegistry::new();

        // 注册OCR模型当前使用的所有操作符。
        reg.register_op::<ops::Add>();
        reg.register_op::<ops::AveragePool>();
        reg.register_op::<ops::Cast>();
        reg.register_op::<ops::Concat>();
        reg.register_op::<ops::ConstantOfShape>();
        reg.register_op::<ops::Conv>();
        reg.register_op::<ops::ConvTranspose>();
        reg.register_op::<ops::GRU>();
        reg.register_op::<ops::Gather>();
        reg.register_op::<ops::LogSoftmax>();
        reg.register_op::<ops::MatMul>();
        reg.register_op::<ops::MaxPool>();
        reg.register_op::<ops::Pad>();
        reg.register_op::<ops::Relu>();
        reg.register_op::<ops::Reshape>();
        reg.register_op::<ops::Shape>();
        reg.register_op::<ops::Sigmoid>();
        reg.register_op::<ops::Slice>();
        reg.register_op::<ops::Transpose>();
        reg.register_op::<ops::Unsqueeze>();

        reg
    }

    /// 加载用于文本检测的模型。
    #[wasm_bindgen(js_name = setDetectionModel)]
    pub fn set_detection_model(&mut self, data: Vec<u8>) -> Result<(), String> {
        let model = ModelOptions::with_ops(Self::op_registry())
            .load(data)
            .map_err(|e| e.to_string())?;
        self.detection_model = Some(model);
        Ok(())
    }

    /// 加载用于文本识别的模型。
    #[wasm_bindgen(js_name = setRecognitionModel)]
    pub fn set_recognition_model(&mut self, data: Vec<u8>) -> Result<(), String> {
        let model = ModelOptions::with_ops(Self::op_registry())
            .load(data)
            .map_err(|e| e.to_string())?;
        self.recognition_model = Some(model);
        Ok(())
    }
}

/// OcrEngine 是用于在 WebAssembly 中执行 OCR 的主要 API。
#[wasm_bindgen]
pub struct OcrEngine {
    engine: BaseOcrEngine,
}

#[wasm_bindgen]
impl OcrEngine {
    /// 使用 `init` 提供的模型和其他设置构造一个新的 `OcrEngine`。
    ///
    /// 要在图像中检测文本，`init` 必须设置了检测模型。
    /// 要识别文本，`init` 必须设置了识别模型。
    #[wasm_bindgen(constructor)]
    pub fn new(init: OcrEngineInit) -> Result<OcrEngine, String> {
        let OcrEngineInit {
            detection_model,
            recognition_model,
        } = init;
        let engine = BaseOcrEngine::new(OcrEngineParams {
            detection_model,
            recognition_model,
            ..Default::default()
        })
        .map_err(|e| e.to_string())?;
        Ok(OcrEngine { engine })
    }

    /// 使用 OCR 引擎准备分析的图像。
    ///
    /// 图像是按行主序、通道最后的像素数组。这与
    /// [ImageData](https://developer.mozilla.org/en-US/docs/Web/API/ImageData)
    /// API 的格式匹配。支持的通道组合是 RGB 和 RGBA。通道的数量从 `data` 的长度中推断。
    #[wasm_bindgen(js_name = loadImage)]
    pub fn load_image(&self, width: u32, height: u32, data: &[u8]) -> Result<Image, String> {
        let image_source =
            ImageSource::from_bytes(data, (width, height)).map_err(|err| err.to_string())?;
        self.engine
            .prepare_input(image_source)
            .map(|input| Image { input })
            .map_err(|e| e.to_string())
    }

    /// 在图像中检测文本。
    ///
    /// 返回找到的文本行列表。这些可以传递给 `recognizeText` 来识别字符。
    #[wasm_bindgen(js_name = detectText)]
    pub fn detect_text(&self, image: &Image) -> Result<Vec<DetectedLine>, String> {
        let words = self
            .engine
            .detect_words(&image.input)
            .map_err(|e| e.to_string())?;
        Ok(self
            .engine
            .find_text_lines(&image.input, &words)
            .into_iter()
            .map(|words| {
                DetectedLine::new(
                    words
                        .into_iter()
                        .map(|word| RotatedRect { rect: word })
                        .collect(),
                )
            })
            .collect())
    }

    /// 识别之前用 `detectText` 检测到的文本。
    ///
    /// 返回可以用于查询文本和每个行的边界框的 `TextLine` 对象列表。
    #[wasm_bindgen(js_name = recognizeText)]
    pub fn recognize_text(
        &self,
        image: &Image,
        lines: Vec<DetectedLine>,
    ) -> Result<Vec<TextLine>, String> {
        let lines: Vec<Vec<rten_imageproc::RotatedRect>> = lines
            .iter()
            .map(|line| {
                let words: Vec<rten_imageproc::RotatedRect> =
                    line.words.iter().map(|word| word.rect).collect();
                words
            })
            .collect();

        let text_lines = self
            .engine
            .recognize_text(&image.input, &lines)
            .map_err(|e| e.to_string())?
            .into_iter()
            .map(|line| {
                line.map(|line| TextLine { line: Some(line) })
                    .unwrap_or(TextLine { line: None })
            })
            .collect();
        Ok(text_lines)
    }

    /// 在图像中检测和识别文本。
    ///
    /// 返回一个包含按阅读顺序找到的所有文本的单个字符串。
    #[wasm_bindgen(js_name = getText)]
    pub fn get_text(&self, image: &Image) -> Result<String, String> {
        self.engine
            .get_text(&image.input)
            .map_err(|e| e.to_string())
    }

    /// 在图像中检测和识别文本。
    ///
    /// 返回可以用于查询文本和每个行的边界框的 `TextLine` 对象列表。
    #[wasm_bindgen(js_name = getTextLines)]
    pub fn get_text_lines(&self, image: &Image) -> Result<Vec<TextLine>, String> {
        let words = self
            .engine
            .detect_words(&image.input)
            .map_err(|e| e.to_string())?;
        let lines = self.engine.find_text_lines(&image.input, &words);
        let text_lines = self
            .engine
            .recognize_text(&image.input, &lines)
            .map_err(|e| e.to_string())?
            .into_iter()
            .map(|line| {
                line.map(|line| TextLine { line: Some(line) })
                    .unwrap_or(TextLine { line: None })
            })
            .collect();
        Ok(text_lines)
    }
    #[wasm_bindgen(js_name = findKeywordPosition)]
    /// 查找图像中关键词的位置。
    pub fn find_keyword_position(
        &self,
        image: &Image,
        keywords: Vec<String>,
    ) -> anyhow::Result<Vec<TextWord>, String> {
        // 检测图像中的单词
        let words = self
            .engine
            .detect_words(&image.input)
            .map_err(|e| e.to_string())?;
        // console
        // console::log_2(&"words".into(), &format!("{:?}", words).into());

        // 找到图像中的文本行
        let lines = self.engine.find_text_lines(&image.input, &words);
        // console::log_2(&"lines".into(), &format!("{:?}", lines).into());
        // 识别图像中的文本行
        // 识别的结果是一个 TextLine 列表
        let text_lines = self
            .engine
            .recognize_text(&image.input, &lines)
            .map_err(|e| e.to_string())?;
        // let text_lines_str: Vec<String> = text_lines.iter().map(|line| line.as_ref().map_or("None".to_string(), |l| l.to_string())).collect();
        // console::log_2(&"text_lines".into(), &format!("{:?}", text_lines_str).into());
        // 找到关键词的位置
        let mut key_words_position = Vec::new();
        for line in text_lines {
            if let Some(line) = line {
                let matched_words: Vec<TextWord> = line
                    .words()
                    .filter(|w| {
                        let word_text = w.to_string().to_lowercase();
                        keywords
                            .iter()
                            .any(|k| word_text.to_lowercase().contains(k))
                    })
                    .map(|w| TextWord {
                        text: w.to_string(),
                        rect: RotatedRect {
                            rect: w.rotated_rect(),
                        },
                    })
                    .collect();
                let matched_words_str: Vec<String> = matched_words
                    .iter()
                    .map(|w| w.json())
                    .collect();

                // console::log_2(
                //     &"matched_words".into(),
                //     &format!("{:?}", matched_words_str).into(),
                // );
                key_words_position.push(matched_words);
            }
        }
        Ok(key_words_position.into_iter().flatten().collect())
    }
}

/// 可以作为输入传递给 `OcrEngine.loadImage` 的预处理图像。
#[wasm_bindgen]
pub struct Image {
    input: OcrInput,
}

#[wasm_bindgen]
impl Image {
    /// 返回图像中的通道数。
    pub fn channels(&self) -> usize {
        self.input.image.size(0)
    }

    /// 返回图像的宽度。
    pub fn width(&self) -> usize {
        self.input.image.size(2)
    }

    /// 返回图像的高度。
    pub fn height(&self) -> usize {
        self.input.image.size(1)
    }

    /// 以按行主序、通道最后的顺序返回图像数据。
    pub fn data(&self) -> Vec<u8> {
        // 转换 CHW => HWC，将像素值从 [-0.5, 0.5] 转换回 [0, 255]。
        self.input
            .image
            .permuted([1, 2, 0])
            .iter()
            .map(|x| ((x + 0.5) * 255.) as u8)
            .collect()
    }
}

#[wasm_bindgen]
#[derive(Clone)]
pub struct RotatedRect {
    rect: rten_imageproc::RotatedRect,
}

#[wasm_bindgen]
impl RotatedRect {
    /// 返回这个矩形的四个角的 X 和 Y 坐标数组，排列为 `[x0, y0, ... x3, y3]`。
    pub fn corners(&self) -> Vec<f32> {
        self.rect
            .corners()
            .into_iter()
            .flat_map(|c| [c.x, c.y])
            .collect()
    }

    /// 返回这个旋转矩形的轴对齐边界矩形的坐标。
    ///
    /// 结果是一个 `[left, top, right, bottom]` 坐标数组。
    #[wasm_bindgen(js_name = boundingRect)]
    pub fn bounding_rect(&self) -> Vec<f32> {
        let br = self.rect.bounding_rect();
        [br.left(), br.top(), br.right(), br.bottom()].into()
    }
}

/// 已检测但未识别的文本行。
///
/// 这包含文本的位置信息，但不包含字符串内容。
#[wasm_bindgen]
#[derive(Clone)]
pub struct DetectedLine {
    words: Vec<RotatedRect>,
}

#[wasm_bindgen]
impl DetectedLine {
    fn new(words: Vec<RotatedRect>) -> DetectedLine {
        DetectedLine { words }
    }

    #[wasm_bindgen(js_name = rotatedRect)]
    pub fn rotated_rect(&self) -> RotatedRect {
        let points: Vec<PointF> = self
            .words
            .iter()
            .flat_map(|word| word.rect.corners().into_iter())
            .collect();
        let rect = min_area_rect(&points).expect("expected non-empty rect");
        RotatedRect { rect }
    }

    pub fn words(&self) -> Vec<RotatedRect> {
        self.words.clone()
    }
}

/// 包含已识别字符的边界框和文本的 `TextWord`。
#[wasm_bindgen]
#[derive(Clone)]
pub struct TextWord {
    rect: RotatedRect,
    text: String,
}

#[wasm_bindgen]
impl TextWord {
    pub fn json(&self) -> String {
        format!(
            r#"{{ "text": "{}", "rect": {{ "rect": {:?} }} }}"#,
            self.text, self.rect.rect
        )
    }
    pub fn text(&self) -> String {
        self.text.clone()
    }

    /// 返回包含此单词字符的定向边界矩形。
    #[wasm_bindgen(js_name = rotatedRect)]
    pub fn rotated_rect(&self) -> RotatedRect {
        self.rect.clone()
    }
}

/// 由 `TextWord` 序列形成的文本行。
#[wasm_bindgen]
#[derive(Clone)]
pub struct TextLine {
    line: Option<super::TextLine>,
}

#[wasm_bindgen]
impl TextLine {
    pub fn text(&self) -> String {
        self.line
            .as_ref()
            .map(|l| l.to_string())
            .unwrap_or_default()
    }

    pub fn words(&self) -> Vec<TextWord> {
        self.line
            .as_ref()
            .map(|l| {
                l.words()
                    .map(|w| TextWord {
                        text: w.to_string(),
                        rect: RotatedRect {
                            rect: w.rotated_rect(),
                        },
                    })
                    .collect()
            })
            .unwrap_or_default()
    }
}
