# coldestheaven.github.io

「游戏开发基地」的 GitHub Pages 页面，现在是一个**炸弹人小游戏**页面：全屏可玩、手机也能玩，背景是分形图案。纯静态单文件，无需构建，推送到本仓库即可通过 `https://coldestheaven.github.io` 访问。

## 页面内容

- `#game`：炸弹人游戏区（页面第一屏），支持全屏模式
- 首屏：简短标题、打字机效果、全屏开玩按钮与主站入口
- `#bgFractal`：全站固定的分形底板（低分辨率、低透明度，上盖暗色遮罩）
- 导航只保留「首页」「游戏」；原来的站点介绍、主题、功能、分形、反馈区块已移除，相关内容请访问 [kuangyi.art](https://kuangyi.art/)

## 自定义指南

所有内容都在 [`index.html`](index.html) 一个文件里，直接用文本编辑器打开修改即可：

1. **主题颜色**：修改 `<style>` 开头的 `:root` 变量（`--accent`、`--accent-2`、`--gradient` 等）。
2. **标题文字**：搜索 `游戏开发基地`、`Game Dev Base`、`GDB`，替换站点名与缩写。
3. **打字机文字**：在脚本中修改 `words` 数组。
4. **游戏规则**：`#game` 区块是纯 Canvas 实现的小游戏，逻辑与绘制都在脚本底部的独立 IIFE 中 —— 敌人数量随关卡递增，炸砖块有几率掉落 F 火力 / B 炸弹 / S 加速道具。
5. **全屏**：首屏「全屏开玩 🎮」、HUD「⛶ 全屏游玩」和「开始游戏」都会进入全屏；CSS 铺满视口（iOS 也生效），支持的浏览器再叠加原生 Fullscreen API；右上角 ✕ 或 Esc 退出。
6. **分形底板**：脚本中「全站分形底板」IIFE 独立于交互分形区块，调整迭代次数 `iter`、中心 `cx`、范围 `span` 和 `stops` 配色即可。
7. **链接**：主站 `https://kuangyi.art/`、GitHub `https://github.com/coldestheaven`。
8. **网站标题与描述**：修改 `<head>` 里的 `<title>`、`<meta name="description">` 和 og 标签。

## 本地预览

直接双击 `index.html` 用浏览器打开即可，或在仓库目录运行任意静态服务器：

```bash
python -m http.server 8000
```

然后访问 http://localhost:8000 。
