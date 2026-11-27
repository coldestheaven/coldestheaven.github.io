# coldestheaven.github.io

「游戏开发基地」的 GitHub Pages 页面：一个**浏览器小游戏站**，首页是游戏列表，每款游戏独占一个页面。纯静态、无构建、无外部依赖，推送到本仓库即可通过 `https://coldestheaven.github.io` 访问。

## 页面结构

| 文件 | 说明 |
| --- | --- |
| `index.html` | 游戏列表首页，列出六款游戏，支持按类型筛选并显示「最近游玩」 |
| `bomber.html` + `bomber.js` | 炸弹人：放炸弹、炸砖块、躲爆炸、消灭敌人，道具与关卡递增 |
| `tank.html` + `tank.js` | 坦克大战：消灭敌军、炸开砖墙、守住基地，逐关递增 |
| `sim.html` + `sim.js` | 模拟经营：点击顾客结账、提价/装修/雇助手升级、每天结算房租 |
| `tetris.html` + `tetris.js` | 俄罗斯方块：7-bag 随机、旋转、幽灵落点、消行与等级加速 |
| `g2048.html` + `game2048.js` | 2048：方向键/滑动合并数字，最高分存本地 |
| `memory.html` + `memory.js` | 记忆翻牌：4x4 共 8 对，记录步数与最佳用时 |
| `style.css` | 全站样式（主题变量、游戏外壳、全屏模式、响应式） |
| `common.js` | 通用脚本：导航、菜单、滚动进度、全屏管理、游戏筛选/切换、最近游玩记录 |

每款游戏都支持电脑键盘与手机触屏，右上角「⛶ 全屏游玩」进入全屏（iOS 用 CSS 铺满，其他浏览器再叠加原生全屏），✕ 或 Esc 退出。背景是纯 CSS 绘制的流动极光渐变与淡网格。首页可按「全部 / 动作 / 益智 / 经营」筛选，并会标记最近玩过的游戏；游戏页底部有玩法说明与「上一款 / 下一款」快捷切换。

## 自定义指南

1. **主题颜色**：修改 `style.css` 中 `:root` 变量（`--accent`、`--accent-2` 等）。
2. **站点名称**：搜索 `Game Dev Base`、`GDB`，替换站点名与缩写。
3. **游戏规则**：分别修改 `bomber.js` / `tank.js` / `sim.js` / `tetris.js` / `game2048.js` / `memory.js` 里的对应 IIFE（绘制与逻辑都在其中）。
4. **页面背景**：`style.css` 顶部 `body::before` / `body::after` 绘制流动极光渐变与淡网格，修改渐变颜色或 `aurora` 动画即可。
5. **增加游戏**：复制任一 `*.html` 页面、编写独立 JS，在 `index.html` 的游戏列表和所有页面的导航中加一项，并在 `common.js` 顶部的 `GAMES` 数组里补一条（用于筛选、最近游玩与上一款/下一款切换）。
6. **标题与描述**：修改各页面 `<head>` 里的 `<title>` 与 `<meta name="description">`。

原个人站点内容请访问 [kuangyi.art](https://kuangyi.art/)。

## 本地预览

直接双击 `index.html` 用浏览器打开即可，或在仓库目录运行任意静态服务器：

```bash
python -m http.server 8000
```

然后访问 http://localhost:8000 。
