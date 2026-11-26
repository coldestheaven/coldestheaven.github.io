# coldestheaven.github.io

「游戏开发基地」的 GitHub Pages 站点页面，内容与主站 [kuangyi.art](https://kuangyi.art/) 一致：只介绍站点、笔记与功能，不做个人介绍。纯静态单文件，无需构建，推送到本仓库即可通过 `https://coldestheaven.github.io` 访问。

## 自定义指南

所有内容都在 [`index.html`](index.html) 一个文件里，直接用文本编辑器打开修改即可：

1. **主题颜色**：修改 `<style>` 开头的 `:root` 变量（`--accent`、`--accent-2`、`--gradient` 等）。
2. **标题文字**：搜索 `游戏开发基地`、`Game Dev Base`、`GDB`，替换站点名与缩写。
3. **打字机文字**：在脚本中修改 `words` 数组（当前是 `Unreal 笔记`、`Unity 笔记` 等）。
4. **栏目内容**：`index.html` 里的 `<section>` 分别对应站点介绍、内容主题、站点功能、分形画布与意见反馈，直接改文字即可。
5. **链接**：主站 `https://kuangyi.art/`、笔记 `https://kuangyi.art/notes/#/`、看板 `https://kuangyi.art/stats/`、GitHub `https://github.com/coldestheaven`。
6. **分形画布**：`#fractal` 区块是纯 Canvas/JS 的曼德勃罗集；参数在脚本底部 `home`、`maxIter`、`palettes` 中调整。
7. **网站标题与描述**：修改 `<head>` 里的 `<title>`、`<meta name="description">` 和 og 标签。

## 本地预览

直接双击 `index.html` 用浏览器打开即可，或在仓库目录运行任意静态服务器：

```bash
python -m http.server 8000
```

然后访问 http://localhost:8000 。
