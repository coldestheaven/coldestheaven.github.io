# coldestheaven.github.io

kuangyi 的 GitHub Pages 个人主页，内容已按主站 [kuangyi.art](https://kuangyi.art/)（游戏开发基地）定制。纯静态单文件站点，无需构建，推送到本仓库即可通过 `https://coldestheaven.github.io` 访问。

## 自定义指南

所有内容都在 [`index.html`](index.html) 一个文件里，直接用文本编辑器打开修改即可：

1. **主题颜色**：修改 `<style>` 开头的 `:root` 变量（`--accent`、`--accent-2`、`--gradient` 等）。
2. **名字与头像**：搜索 `kuangyi`、`KY`，替换为你想展示的名字/缩写；头像也可以换成 `<img>`。
3. **打字机文字**：在脚本中修改 `words` 数组。
4. **简介、技能、项目、经历**：页面已按游戏开发知识库填写；如需增删，直接编辑对应 `<section>`。
5. **邮箱**：搜索 `hello@example.com` 替换为真实邮箱（主站意见栏提交后会直达邮箱，也可以只保留意见栏链接）。
6. **链接**：主站 `https://kuangyi.art/`、笔记 `https://kuangyi.art/notes/#/`、看板 `https://kuangyi.art/stats/`、GitHub `https://github.com/coldestheaven`。
7. **分形画布**：`#fractal` 区块是纯 Canvas/JS 的曼德勃罗集；参数在脚本底部 `home`、`maxIter`、`palettes` 中调整。
8. **网站标题与描述**：修改 `<head>` 里的 `<title>`、`<meta name="description">` 和 og 标签。

## 本地预览

直接双击 `index.html` 用浏览器打开即可，或在仓库目录运行任意静态服务器：

```bash
python -m http.server 8000
```

然后访问 http://localhost:8000 。
