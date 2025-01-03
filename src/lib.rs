use anyhow::anyhow;
use rten::Model;
use rten_imageproc::RotatedRect;
use rten_tensor::prelude::*;
use rten_tensor::NdTensor;

mod detection;
mod errors;
mod geom_util;
mod layout_analysis;
mod log;
mod preprocess;
mod recognition;

#[cfg(test)]
mod test_util;

mod text_items;

#[cfg(target_arch = "wasm32")]
mod wasm_api;

use detection::{TextDetector, TextDetectorParams};
use layout_analysis::find_text_lines;
use preprocess::prepare_image;
use recognition::{RecognitionOpt, TextRecognizer};

pub use preprocess::{DimOrder, ImagePixels, ImageSource, ImageSourceError};
pub use recognition::DecodeMethod;
pub use text_items::{TextChar, TextItem, TextLine, TextWord};

// 注意 "E" 前面的符号应该是欧元符号。
const DEFAULT_ALPHABET: &str = " 0123456789!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~EABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

/// OCR 引擎实例的配置。
#[derive(Default)]
pub struct OcrEngineParams {
    /// 用于检测图像中文本词的模型。
    pub detection_model: Option<Model>,

    /// 用于识别图像中文本行的模型。
    ///
    /// 如果使用自定义模型，你可能需要调整
    /// [`alphabet`](Self::alphabet) 以匹配。
    pub recognition_model: Option<Model>,

    /// 启用调试日志记录。
    pub debug: bool,

    /// 文本识别模型输出的解码方法。
    pub decode_method: DecodeMethod,

    /// 文本识别使用的字母表。
    ///
    /// 如果你使用自定义识别模型并修改了字母表，这将很有用。
    /// 如果未指定，则会使用与 [原始模型](https://github.com/robertknight/ocrs-models) 训练时相同的默认字母表。
    pub alphabet: Option<String>,

    /// 文本识别模型可能产生的字符集。
    ///
    /// 这在你需要文本识别模型只生成预定义字符集中的文本时很有用，
    /// 例如只包含数字或小写字母。
    ///
    /// 如果未设置此选项，文本识别可能会生成字母表中的任何字符。
    pub allowed_chars: Option<String>,
}

/// 检测并识别图像中的文本。
///
/// OcrEngine 使用机器学习模型来检测文本，分析布局并识别图像中的文本。
pub struct OcrEngine {
    detector: Option<TextDetector>,
    recognizer: Option<TextRecognizer>,
    debug: bool,
    decode_method: DecodeMethod,
    alphabet: String,

    /// 在 `alphabet` 中被排除在识别输出之外的字符索引。
    /// 请参见 [`OcrEngineParams::allowed_chars`]。
    excluded_char_labels: Option<Vec<usize>>,
}

/// 用于 OCR 分析的输入图像。实例由 [OcrEngine::prepare_input] 创建
pub struct OcrInput {
    /// 归一化的像素值 [BLACK_VALUE, BLACK_VALUE + 1.] 的 CHW 张量。
    pub(crate) image: NdTensor<f32, 3>,
}

impl OcrEngine {
    /// 根据给定的配置构造一个新的引擎。
    pub fn new(params: OcrEngineParams) -> anyhow::Result<OcrEngine> {
        let detector = params
            .detection_model
            .map(|model| TextDetector::from_model(model, Default::default()))
            .transpose()?;
        let recognizer = params
            .recognition_model
            .map(TextRecognizer::from_model)
            .transpose()?;

        let alphabet = params
            .alphabet
            .unwrap_or_else(|| DEFAULT_ALPHABET.to_string());

        let excluded_char_labels = params.allowed_chars.map(|allowed_characters| {
            alphabet
                .chars()
                .enumerate()
                .filter_map(|(index, char)| {
                    if !allowed_characters.contains(char) {
                        // 索引 `0` 保留给 CTC 空字符，`i + 1` 用于训练标签，
                        // 表示 `alphabet` 字符串中索引 `i` 的字符。
                        //
                        // 参见 https://github.com/robertknight/ocrs-models/blob/3d98fc655d6fd4acddc06e7f5d60a55b55748a48/ocrs_models/datasets/util.py#L113
                        Some(index + 1)
                    } else {
                        None
                    }
                })
                .collect::<Vec<_>>()
        });

        Ok(OcrEngine {
            detector,
            recognizer,
            alphabet,
            excluded_char_labels,
            debug: params.debug,
            decode_method: params.decode_method,
        })
    }

    /// 预处理图像以便使用引擎的其他方法。
    pub fn prepare_input(&self, image: ImageSource) -> anyhow::Result<OcrInput> {
        Ok(OcrInput {
            image: prepare_image(image),
        })
    }

    /// 检测图像中的文本词。
    ///
    /// 返回检测到的每个词的旋转边界矩形的无序列表。
    pub fn detect_words(&self, input: &OcrInput) -> anyhow::Result<Vec<RotatedRect>> {
        if let Some(detector) = self.detector.as_ref() {
            detector.detect_words(input.image.view(), self.debug)
        } else {
            Err(anyhow!("检测模型未加载"))
        }
    }

    /// 检测图像中的文本像素。
    ///
    /// 返回一个 (H, W) 张量，指示输入图像中每个像素是文本词一部分的概率。
    /// 这是一个有用的调试 API。使用 [detect_words](OcrEngine::detect_words)
    /// 可以获取包含文本词的旋转边界框的更高级 API。
    pub fn detect_text_pixels(&self, input: &OcrInput) -> anyhow::Result<NdTensor<f32, 2>> {
        if let Some(detector) = self.detector.as_ref() {
            detector.detect_text_pixels(input.image.view(), self.debug)
        } else {
            Err(anyhow!("检测模型未加载"))
        }
    }

    /// 执行布局分析以将词分组为行，并按阅读顺序排序。
    ///
    /// `words` 是 [OcrEngine::detect_words] 找到的文本词矩形的无序列表。
    /// 结果是按阅读顺序排序的行列表。每一行是按阅读顺序排序的词边界矩形序列。
    pub fn find_text_lines(
        &self,
        _input: &OcrInput,
        words: &[RotatedRect],
    ) -> Vec<Vec<RotatedRect>> {
        find_text_lines(words)
    }

    /// 识别图像中的文本行。
    ///
    /// `lines` 是 [OcrEngine::find_text_lines] 生成的图像中的文本行框的有序列表。
    ///
    /// 输出是输入图像区域对应的 [TextLine] 列表。条目可以是 `None` 如果给定行中未找到文本。
    pub fn recognize_text(
        &self,
        input: &OcrInput,
        lines: &[Vec<RotatedRect>],
    ) -> anyhow::Result<Vec<Option<TextLine>>> {
        if let Some(recognizer) = self.recognizer.as_ref() {
            recognizer.recognize_text_lines(
                input.image.view(),
                lines,
                RecognitionOpt {
                    debug: self.debug,
                    decode_method: self.decode_method,
                    alphabet: &self.alphabet,
                    excluded_char_labels: self.excluded_char_labels.as_deref(),
                },
            )
        } else {
            Err(anyhow!("识别模型未加载"))
        }
    }

    /// 准备图像以便输入到文本行识别模型。
    ///
    /// 此方法存在以帮助调试识别问题，通过暴露 [OcrEngine::recognize_text] 在将其输入到识别模型之前所做的预处理。
    /// 使用 [OcrEngine::recognize_text] 以识别文本。
    ///
    /// `line` 是文本行的 [RotatedRect] 序列。
    ///
    /// 返回一个灰度 (H, W) 图像，像素值在 [-0.5, 0.5]。
    pub fn prepare_recognition_input(
        &self,
        input: &OcrInput,
        line: &[RotatedRect],
    ) -> anyhow::Result<NdTensor<f32, 2>> {
        let Some(recognizer) = self.recognizer.as_ref() else {
            return Err(anyhow!("识别模型未加载"));
        };
        let line_image = recognizer.prepare_input(input.image.view(), line);
        Ok(line_image)
    }

    /// 返回应用于文本检测模型输出的置信度阈值以确定像素是否为文本。
    pub fn detection_threshold(&self) -> f32 {
        self.detector
            .as_ref()
            .map(|detector| detector.threshold())
            .unwrap_or(TextDetectorParams::default().text_threshold)
    }

    /// 方便的 API 以提取图像中的所有文本为单个字符串。
    pub fn get_text(&self, input: &OcrInput) -> anyhow::Result<String> {
        let word_rects = self.detect_words(input)?;
        let line_rects = self.find_text_lines(input, &word_rects);
        let text = self
            .recognize_text(input, &line_rects)?
            .into_iter()
            .filter_map(|line| line.map(|l| l.to_string()))
            .collect::<Vec<_>>()
            .join("\n");
        Ok(text)
    }
}

#[cfg(test)]
mod tests {
    use std::error::Error;
    use std::ops::RangeFull;

    use rten::model_builder::{ModelBuilder, ModelFormat, OpType};
    use rten::ops::{MaxPool, Transpose};
    use rten::Dimension;
    use rten::Model;
    use rten_imageproc::{fill_rect, BoundingRect, Rect, RectF, RotatedRect};
    use rten_tensor::prelude::*;
    use rten_tensor::{NdTensor, NdTensorView, Tensor};

    use super::{DimOrder, ImageSource, OcrEngine, OcrEngineParams, DEFAULT_ALPHABET};

    /// 生成一个用于 OCR 处理的 CHW 输入图像。
    ///
    /// 结果是一个黑色的 RGB 图像，除了包含 `n_words` 个白色填充矩形的一行。
    fn gen_test_image(n_words: usize) -> NdTensor<f32, 3> {
        let mut image = NdTensor::zeros([3, 100, 200]);

        for word_idx in 0..n_words {
            for chan_idx in 0..3 {
                fill_rect(
                    image.slice_mut([chan_idx]),
                    Rect::from_tlhw(30, (word_idx * 70) as i32, 20, 50),
                    1.,
                );
            }
        }

        image
    }

    /// 创建一个虚假的文本检测模型。
    ///
    /// 接受一个 [-0.5, 0.5] 值的 CHW 输入张量，并加上 +0.5 偏置以生成输出“概率图”。
    fn fake_detection_model() -> Model {
        let mut gb = ModelBuilder::new(ModelFormat::V1);

        let input_id = gb.add_value(
            "input",
            Some(&[
                Dimension::Symbolic("batch".to_string()),
                Dimension::Fixed(1),
                // 实际模型使用较大的输入 (800x600)。虚假模型使用较小的输入以加快测试速度。
                Dimension::Fixed(200),
                Dimension::Fixed(100),
            ]),
        );
        gb.add_input(input_id);

        let output_id = gb.add_value("output", None);
        gb.add_output(output_id);

        let bias = Tensor::from_scalar(0.5);
        let bias_id = gb.add_constant(bias.view());
        gb.add_operator(
            "add",
            OpType::Add,
            &[Some(input_id), Some(bias_id)],
            &[output_id],
        );

        let model_data = gb.finish();
        Model::load(model_data).unwrap()
    }

    /// 创建一个虚假的文本识别模型。
    ///
    /// 这接受一个 C=1, H=64 的 NCHW 输入并返回一个形状为 `[W / 4, N, C]` 的输出。
    /// 在实际模型中，最后一个维度是每个类标签的日志概率。在虚假模型中，我们只是将输入的每一列重新解释为概率向量。
    ///
    /// 返回一个 `(model, alphabet)` 元组。
    fn fake_recognition_model() -> (Model, String) {
        let mut gb = ModelBuilder::new(ModelFormat::V1);

        let output_columns = 64;
        let input_id = gb.add_value(
            "input",
            Some(&[
                Dimension::Symbolic("batch".to_string()),
                Dimension::Fixed(1),
                Dimension::Fixed(output_columns),
                Dimension::Symbolic("seq".to_string()),
            ]),
        );
        gb.add_input(input_id);

        // MaxPool 以将宽度缩小 1/4: NCHW => NCHW/4
        let pool_out = gb.add_value("max_pool_out", None);
        gb.add_operator(
            "max_pool",
            OpType::MaxPool(MaxPool {
                kernel_size: [1, 4],
                padding: [0, 0, 0, 0].into(),
                strides: [1, 4],
            }),
            &[Some(input_id)],
            &[pool_out],
        );

        // Squeeze 以移除通道维度: NCHW/4 => NHW/4
        let squeeze_axes = Tensor::from_vec(vec![1]);
        let squeeze_axes_id = gb.add_constant(squeeze_axes.view());
        let squeeze_out = gb.add_value("squeeze_out", None);
        gb.add_operator(
            "squeeze",
            OpType::Squeeze,
            &[Some(pool_out), Some(squeeze_axes_id)],
            &[squeeze_out],
        );

        // Transpose: NHW/4 => W/4NH
        let transpose_out = gb.add_value("transpose_out", None);
        gb.add_operator(
            "transpose",
            OpType::Transpose(Transpose {
                perm: Some(vec![2, 0, 1]),
            }),
            &[Some(squeeze_out)],
            &[transpose_out],
        );

        gb.add_output(transpose_out);

        let model_data = gb.finish();
        let model = Model::load(model_data).unwrap();
        let alphabet = DEFAULT_ALPHABET.chars().take(output_columns - 1).collect();

        (model, alphabet)
    }

    /// 返回由 `gen_test_image(3)` 生成的图像的预期词位置。
    ///
    /// 输出框比输入图像中的略大。这是因为实际的检测模型被训练成预测的框比真实框略小，
    /// 以在相邻框之间创建间隙。在后期处理中会扩展模型输出中的连接组件以恢复正确的框。
    fn expected_word_boxes() -> Vec<RectF> {
        let [top, height] = [27, 25];
        [
            Rect::from_tlhw(top, -3, height, 56).to_f32(),
            Rect::from_tlhw(top, 66, height, 57).to_f32(),
            Rect::from_tlhw(top, 136, height, 57).to_f32(),
        ]
        .into()
    }

    #[test]
    fn test_ocr_engine_prepare_input() -> Result<(), Box<dyn Error>> {
        let image = gen_test_image(3 /* n_words */);
        let engine = OcrEngine::new(OcrEngineParams {
            detection_model: None,
            recognition_model: None,
            ..Default::default()
        })?;
        let input = engine.prepare_input(ImageSource::from_tensor(image.view(), DimOrder::Chw)?)?;

        let [chans, height, width] = input.image.shape();
        assert_eq!(chans, 1);
        assert_eq!(width, image.size(2));
        assert_eq!(height, image.size(1));

        Ok(())
    }

    #[test]
    fn test_ocr_engine_detect_words() -> Result<(), Box<dyn Error>> {
        let n_words = 3;
        let image = gen_test_image(n_words);
        let engine = OcrEngine::new(OcrEngineParams {
            detection_model: Some(fake_detection_model()),
            recognition_model: None,
            ..Default::default()
        })?;
        let input = engine.prepare_input(ImageSource::from_tensor(image.view(), DimOrder::Chw)?)?;
        let words = engine.detect_words(&input)?;

        assert_eq!(words.len(), n_words);

        let mut boxes: Vec<RectF> = words
            .into_iter()
            .map(|rotated_rect| rotated_rect.bounding_rect())
            .collect();
        boxes.sort_by_key(|b| [b.top() as i32, b.left() as i32]);

        assert_eq!(boxes, expected_word_boxes());

        Ok(())
    }

    // 使用一个虚假的识别模型测试识别。
    //
    // 虚假模型将输入图像的每一列视为字符类概率向量。预处理会将值从 [0, 1] 转换为 [-0.5, 0.5]。
    // CTC 解码会忽略类 0（因为它代表一个 CTC 空字符）和重复的字符。
    //
    // 将单个输入行填充为 "1"s 将生成一个单个字符的输出，
    // 该字符在字母表中的索引为行索引 - 1。即填充第一行生成 " "，填充第二行生成 "0"，
    // 依此类推，使用默认字母表。
    fn test_recognition(
        params: OcrEngineParams,
        image: NdTensorView<f32, 3>,
        expected_text: &str,
    ) -> Result<(), Box<dyn Error>> {
        let engine = OcrEngine::new(params)?;
        let input = engine.prepare_input(ImageSource::from_tensor(image.view(), DimOrder::Chw)?)?;

        // 创建一个包含单个填充图像的虚假输入行。
        let mut line_regions: Vec<Vec<RotatedRect>> = Vec::new();
        line_regions.push(
            [Rect::from_tlhw(0, 0, image.shape()[1] as i32, image.shape()[2] as i32).to_f32()]
                .map(RotatedRect::from_rect)
                .into(),
        );

        let lines = engine.recognize_text(&input, &line_regions)?;
        assert_eq!(lines.len(), line_regions.len());

        assert!(lines.get(0).is_some());
        let line = lines[0].as_ref().unwrap();
        assert_eq!(line.to_string(), expected_text);

        Ok(())
    }

    #[test]
    fn test_ocr_engine_recognize_lines() -> Result<(), Box<dyn Error>> {
        let mut image = NdTensor::zeros([1, 64, 32]);
        // 将字母表中字符 1 的概率（'0'）设置为 1，并将所有其他字符的概率设置为 0。
        image.slice_mut::<2,(RangeFull, i32, RangeFull)>((.., 2, ..)).fill(1.0);

        let (rec_model, alphabet) = fake_recognition_model();
        test_recognition(
            OcrEngineParams {
                detection_model: None,
                recognition_model: Some(rec_model),
                alphabet: Some(alphabet),
                ..Default::default()
            },
            image.view(),
            "0",
        )?;

        Ok(())
    }

    #[test]
    fn test_ocr_engine_filter_chars() -> Result<(), Box<dyn Error>> {
        let mut image = NdTensor::zeros([1, 64, 32]);

        // 将 "0" 的概率设置为 0.7，"1" 的概率设置为 0.3。
        image.slice_mut::<2,(RangeFull, i32, RangeFull)>((.., 2, ..)).fill(0.7);
        image.slice_mut::<3,(RangeFull, i32, RangeFull)>((.., 3, ..)).fill(0.3);

        let (rec_model, alphabet) = fake_recognition_model();
        test_recognition(
            OcrEngineParams {
                detection_model: None,
                recognition_model: Some(rec_model),
                alphabet: Some(alphabet),
                ..Default::default()
            },
            image.view(),
            "0",
        )?;

        // 再次运行识别，但排除 "0" 出现在输出中。
        let (rec_model, alphabet) = fake_recognition_model();
        test_recognition(
            OcrEngineParams {
                detection_model: None,
                recognition_model: Some(rec_model),
                alphabet: Some(alphabet),
                allowed_chars: Some("123456789".into()),
                ..Default::default()
            },
            image.view(),
            "1",
        )?;

        Ok(())
    }
}