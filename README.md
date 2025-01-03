# 项目名称
# rust web 文本识别

## 项目简介
这是一个基于[ocrs](https://github.com/robertknight/ocrs)的OCR文字识别应用。ocrs是一个使用Rust开发的现代化OCR引擎,可以从图片中提取文字。

## 主要特性
- 支持多种图片格式的文字识别
- 基于机器学习,识别准确度高
- 支持批量处理
- 简单易用的命令行界面
- 支持WebAssembly

## 语言支持
⚠️ **重要提示:**
- 目前仅支持英文文字识别
- 其他语言（如中文、日文等）的识别可能会出现异常或错误结果
- 为获得最佳识别效果，请确保输入图片中仅包含英文文字

## 技术栈
- Rust
- ocrs OCR引擎
- WebAssembly
- http-server

## 使用方法
###基本用法
项目启动
```bash
npx http-server ./web
```
rust打包
```bash
wasm-pack build  --out-dir web/wasm/dist --target web --reference-types --weak-refs
```


## 已知问题
- 非英文字符的识别可能导致程序异常或崩溃
- 混合语言文本的识别效果不理想
- 建议在使用前确认图片内容仅包含英文文字

## 致谢
本项目基于以下开源项目:
- [ocrs](https://github.com/robertknight/ocrs) - Rust实现的现代化OCR引擎

