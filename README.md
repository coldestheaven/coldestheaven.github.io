# coldestheaven.github.io

我的 GitHub Pages 个人主页。纯静态单文件站点，无需构建，直接推送到本仓库即可通过 `https://coldestheaven.github.io` 访问。

## 自定义指南

所有内容都在 [`index.html`](index.html) 一个文件里，直接用文本编辑器打开修改即可：

1. **主题颜色**：修改 `<style>` 开头的 `:root` 变量（`--accent`、`--accent-2`、`--gradient` 等）。
2. **头像文字**：找到 `<div class="avatar-card">`，把 `CH` 换成你的名字缩写，或者替换成一整块 `<img>`。
3. **打字机文字**：在脚本中修改 `words` 数组（`开发者`、`创造者`……）。
4. **个人简介、数据、技能、项目、经历**：搜索 `示例项目`、`hello@example.com`、`2023` 等占位文字，替换成你自己的内容。
5. **社交链接**：搜索 `https://github.com/coldestheaven` 和 `mailto:hello@example.com` 批量替换为你的真实链接。
6. **网站标题与描述**：修改 `<head>` 里的 `<title>`、`<meta name="description">` 和 og 标签。

## 本地预览

直接双击 `index.html` 用浏览器打开即可，或在仓库目录运行任意静态服务器，例如：

```bash
python -m http.server 8000
```

然后访问 http://localhost:8000 。
