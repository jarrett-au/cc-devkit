# cc-devkit TUI 实现研究记录

## 技术调研

### TUI 库对比

#### blessed ✅ **最终选择**
**仓库：** https://github.com/chjj/blessed
**版本：** ^2.0.0
**决策日期：** 2025-01-27

**优点：**
- 功能丰富，API 完整
- 成熟稳定，社区活跃（8.5k+ stars）
- 支持复杂布局和高级功能
- 良好的跨平台支持（Windows/Linux/macOS）
- 内建事件系统，易于处理交互
- 丰富的文档和示例
- 支持颜色、样式、鼠标等高级特性
- 自动处理终端兼容性问题

**缺点：**
- 较重的依赖（~20 依赖包）
- API 相对复杂，学习曲线存在
- 文档较分散，需要查看示例代码
- 包体积较大（~500kb）

**适用场景：** 需要复杂布局和高级功能

**评估结论：** ⭐⭐⭐⭐⭐ 功能强大，适合本项目需求

**选择理由：**
1. **功能完整性：** 支持所有需求的功能（Tab页、列表、搜索框、进度条等）
2. **跨平台兼容：** 自动处理不同终端的兼容性问题
3. **成熟稳定：** 经过大量项目验证，社区活跃
4. **开发效率：** 丰富的组件和事件系统，减少开发时间
5. **可选依赖：** 作为 optionalDependencies，不影响零依赖原则

#### ink
**仓库：** https://github.com/vadimdemedes/ink

**优点：**
- React 风格，组件化开发
- 类型安全（TypeScript 支持）
- 现代化开发体验
- 易于测试

**缺点：**
- 需要 React 知识
- 运行时依赖较重（React + ReactDOM）
- 渲染性能可能不如原生方案
- 学习曲线对非 React 开发者陡峭

**适用场景：** 团队熟悉 React，需要组件化

**评估结论：** ⭐⭐⭐ 现代化但重量级

#### terminal-kit
**仓库：** https://github.com/cronvel/terminal-kit

**优点：**
- 性能优秀
- API 设计合理
- 跨平台支持好
- 文档详细
- 相对轻量

**缺点：**
- 社区相对较小
- 某些高级功能支持有限
- 更新频率较低

**适用场景：** 性能要求高，需要跨平台

**评估结论：** ⭐⭐⭐⭐ 平衡的选择

#### 原生实现（Node.js built-in modules）
**方案：** 使用 `readline`, `stdout` 等原生模块

**优点：**
- 完全零依赖
- 轻量级
- 完全控制

**缺点：**
- 需要处理大量底层细节
- 终端兼容性需自行处理
- 开发成本高
- 维护成本高

**适用场景：** 需要完全零依赖，功能简单

**评估结论：** ⭐⭐ 零依赖但开发成本高

### 其他发现

#### 颜色处理
**库：** chalk, ansi-colors

**发现：**
- 终端颜色支持检测复杂
- 需要处理 TERM 环境变量
- Windows 需要特殊处理

**建议：** 使用 chalk 进行颜色检测和处理

#### YAML 解析
**库：** js-yaml, yaml

**发现：**
- frontmatter 需要特殊处理
- 简单的 key-value 可用正则提取

**建议：** 对于简单的 description 提取，用正则即可

## 架构设计

### 模块结构

```
cc-devkit/
├── bin/
│   └── cc-devkit.js           # 主入口
├── lib/
│   ├── tui/                   # TUI 模块
│   │   ├── index.js           # TUI 主入口
│   │   ├── screen.js          # 屏幕管理
│   │   ├── pages/             # 页面组件
│   │   │   ├── type-select.js # 类型选择页
│   │   │   ├── content-select.js # 内容选择页
│   │   │   ├── summary.js     # 确认摘要页
│   │   │   └── help.js        # 帮助页
│   │   ├── widgets/           # UI 组件
│   │   │   ├── list.js        # 列表组件
│   │   │   ├── checkbox.js    # 复选框组件
│   │   │   ├── search.js      # 搜索框组件
│   │   │   ├── progress.js    # 进度条组件
│   │   │   └── dialog.js      # 对话框组件
│   │   ├── input.js           # 输入处理
│   │   ├── state.js           # 状态管理
│   │   ├── renderer.js        # 渲染器
│   │   └── utils.js           # 工具函数
│   ├── scanner.js             # 文件扫描
│   ├── parser.js              # YAML 解析
│   └── sync.js                # 同步逻辑（已有）
└── docs/
    ├── tui-spec.md            # TUI 规格文档
    └── plans/                 # 规划文档
```

### 数据流

```
用户输入
  ↓
Input Handler (input.js)
  ↓
State Manager (state.js)
  ↓
Page Component (pages/*)
  ↓
Renderer (renderer.js)
  ↓
Terminal Output
```

### 状态管理

```javascript
// 全局状态结构
{
  currentPage: 'type-select', // type-select, content-select, summary, help
  previousPage: null,

  // Step 1: 类型选择状态
  typeSelect: {
    selectedTypes: [] // ['commands', 'skills', 'mcp']
  },

  // Step 2: 内容选择状态
  contentSelect: {
    currentTab: 'commands', // commands, skills, mcp
    searchQuery: '',
    scrollTop: 0,
    selections: {
      commands: [],  // 选中的项
      skills: [],
      mcp: []
    }
  },

  // 数据缓存
  data: {
    commands: [],
    skills: [],
    mcp: []
  },

  // 同步状态
  sync: {
    inProgress: false,
    progress: 0,
    total: 0,
    currentFile: '',
    errors: []
  }
}
```

## 关键技术点

### 1. YAML Frontmatter 解析

**需求：** 从 markdown 文件提取 description 字段

**实现：**
```javascript
function extractDescription(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');

  // 匹配 YAML frontmatter
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return '';

  // 提取 description
  const yaml = match[1];
  const descMatch = yaml.match(/description:\s*(.+)$/m);
  return descMatch ? descMatch[1].trim() : '';
}
```

**发现：**
- 简单场景无需引入 js-yaml 库
- 正则表达式足够处理 key-value 对
- 需要处理多行描述（后续优化）

### 2. 终端颜色检测

**需求：** 自动检测终端是否支持颜色

**实现：**
```javascript
function supportsColor() {
  // 检查环境变量
  if (process.env.NO_COLOR || process.env.CC_DEVKIT_NO_COLOR) {
    return false;
  }

  // 检测 TERM
  const term = process.env.TERM || '';
  if (term.includes('dumb') || term === 'unknown') {
    return false;
  }

  // Windows 特殊处理
  if (process.platform === 'win32') {
    return true; // Windows 10+ 支持
  }

  // 检查是否在 TTY
  return process.stdout.isTTY;
}
```

**发现：**
- 需要考虑多种因素
- 环境变量可以覆盖
- Windows 10+ 终端支持良好

### 3. 虚拟滚动

**需求：** 支持 100+ 项时的流畅滚动

**实现思路：**
```javascript
class VirtualList {
  constructor(items, viewportHeight) {
    this.items = items;
    this.viewportHeight = viewportHeight;
    this.scrollTop = 0;
    this.itemHeight = 1; // 每项占 1 行
  }

  getVisibleItems() {
    const start = Math.floor(this.scrollTop / this.itemHeight);
    const end = start + this.viewportHeight;
    return this.items.slice(start, end);
  }
}
```

**发现：**
- 虚拟滚动是性能优化的关键
- 实现复杂度适中
- 需要精确计算可见区域

### 4. 冲突检测

**需求：** 检测目标位置的文件冲突

**实现：**
```javascript
function detectConflicts(sourceItems, targetDir) {
  const conflicts = [];

  sourceItems.forEach(item => {
    const targetPath = path.join(targetDir, item.relativePath);
    if (fs.existsSync(targetPath)) {
      conflicts.push({
        item: item,
        existingPath: targetPath,
        type: 'file' // 或 'directory'
      });
    }
  });

  return conflicts;
}
```

**发现：**
- 需要在同步前扫描目标目录
- 批量处理比逐个处理更高效
- 需要用户确认如何解决冲突

## 依赖管理策略

### 方案 1: 可选依赖（推荐）

**实现：**
```json
{
  "peerDependencies": {
    "blessed": "^2.0.0"
  },
  "optionalDependencies": {
    "blessed": "^2.0.0"
  }
}
```

**用法：**
```javascript
let tui;
try {
  tui = require('./lib/tui');
} catch (e) {
  console.log('TUI not available, using CLI mode');
}
```

**优点：**
- 保持零依赖原则（TUI 可选）
- 用户可选择是否安装 TUI
- 向后兼容

**缺点：**
- 需要优雅降级

### 方案 2: 独立包

**创建：** `cc-devkit-tui` 包

**优点：**
- 完全分离关注点
- 核心包保持零依赖
- 可独立发布和版本管理

**缺点：**
- 需要维护两个包
- 增加复杂度

### 方案 3: 原生实现

**实现：** 使用 Node.js 原生模块

**优点：**
- 完全零依赖
- 完全控制

**缺点：**
- 开发成本高
- 需要处理大量底层细节
- 跨平台兼容性难保证

**推荐：** 方案 1（可选依赖）

## 性能考虑

### 渲染性能

**挑战：**
- 100+ 项列表的渲染
- 实时搜索的响应速度
- 终端重绘开销

**优化策略：**
1. 虚拟滚动：仅渲染可见项
2. 增量渲染：仅更新变化部分
3. 防抖：搜索输入防抖（100-200ms）
4. 缓存：描述信息缓存

### 内存使用

**考虑：**
- 数据缓存 vs 实时加载
- 历史状态保留

**优化：**
- 一次性加载（50-100 项可接受）
- 不保留不必要的历史状态
- 及时清理临时数据

## 未解决的问题

### 待讨论

1. **MCP 配置合并策略**
   - 现有逻辑：浅合并，同名 server 覆盖
   - TUI 中是否需要显示合并预览？
   - 是否需要支持选择合并策略？

2. **备份策略集成**
   - 现有逻辑：自动备份到 `~/.cc-devkit/backups/`
   - TUI 中是否需要显示备份信息？
   - 是否允许用户恢复备份？

3. **权限处理**
   - 文件只读时的处理
   - 需要管理员权限时的提示

4. **进度取消**
   - 同步过程中是否允许用户取消？
   - 取消后的清理逻辑

## Blessed 使用示例和实现细节

### 基础使用

**初始化屏幕：**
```javascript
const blessed = require('blessed');

// 创建屏幕对象
const screen = blessed.screen({
  smartCSR: true,
  title: 'cc-devkit TUI',
  fullUnicode: true, // 支持 emoji
  autoPadding: true
});

// 退出处理
screen.key(['escape', 'q', 'C-c'], function(ch, key) {
  return process.exit(0);
});

// 渲染屏幕
screen.render();
```

**创建列表组件：**
```javascript
const list = blessed.list({
  parent: screen,
  label: ' Commands ',
  top: '2',
  left: '2',
  width: '80%',
  height: '70%',
  keys: true,
  vi: true, // 启用 Vim 键位
  mouse: true,
  style: {
    fg: 'white',
    bg: 'black',
    selected: {
      fg: 'black',
      bg: 'cyan'
    },
    item: {
      hover: {
        bg: 'blue'
      }
    }
  },
  items: [
    '⬜ git-commit      Commit staged changes',
    '⬜ git-push        Push commits to remote',
    '☑  npm-install     Install npm dependencies'
  ]
});

// 处理选择事件
list.on('select', function(item) {
  console.log('Selected:', item.getText());
});
```

**创建 Tab 切换：**
```javascript
// Tab 按钮容器
const tabBox = blessed.box({
  parent: screen,
  top: 0,
  left: 0,
  width: '100%',
  height: 1,
  style: {
    bg: 'blue'
  }
});

// 创建 Tab 按钮
const tabs = ['commands', 'skills', 'mcp'];
const tabButtons = tabs.map((tab, index) => {
  return blessed.button({
    parent: tabBox,
    left: index * 15,
    width: 12,
    height: 1,
    content: tab,
    style: {
      bg: 'blue',
      fg: 'white',
      focus: {
        bg: 'white',
        fg: 'blue'
      }
    }
  });
});

// Tab 内容容器
const tabContent = blessed.box({
  parent: screen,
  top: 2,
  left: 0,
  width: '100%',
  height: '80%-2'
});
```

**创建搜索框：**
```javascript
const searchBox = blessed.textbox({
  parent: screen,
  top: '85%',
  left: '2',
  width: '80%-4',
  height: 1,
  label: ' Search ',
  inputOnFocus: true,
  keys: true,
  mouse: true,
  style: {
    fg: 'white',
    bg: 'black',
    focus: {
      fg: 'black',
      bg: 'white'
    }
  }
});

// 实时搜索
searchBox.on('submit', function() {
  const query = searchBox.getValue();
  filterList(query);
});

searchBox.on('key', function(ch, key) {
  if (key.name === 'escape') {
    searchBox.clearValue();
    screen.render();
  }
});
```

**创建进度条：**
```javascript
const progressBar = blessed.progressbar({
  parent: screen,
  top: '90%',
  left: '2',
  width: '80%-4',
  height: 1,
  orientation: 'horizontal',
  style: {
    bar: {
      bg: 'green'
    },
    text: {
      fg: 'white'
    }
  },
  filled: 0,
  pch: '█' // 进度条字符
});

// 更新进度
function updateProgress(current, total) {
  const percent = (current / total) * 100;
  progressBar.setProgress(percent);
  screen.render();
}
```

**创建帮助弹窗：**
```javascript
function showHelp() {
  const help = blessed.form({
    parent: screen,
    label: ' Help - Keyboard Shortcuts ',
    top: 'center',
    left: 'center',
    width: '80%',
    height: '70%',
    keys: true,
    mouse: true,
    style: {
      fg: 'white',
      bg: 'blue',
      border: {
        fg: 'white'
      }
    }
  });

  const helpText = blessed.text({
    parent: help,
    content: `
Navigation:
  hjkl / Arrows   Move cursor
  Home/End        Jump to first/last item
  PageUp/Down     Scroll page
  Tab             Switch tabs

Selection:
  Space/Enter    Toggle selection
  a              Select all
  r              Reverse selection
  c              Clear all selections

Search:
  /              Enter search mode
  Esc            Exit search mode

Other:
  ?              Show this help
  Esc            Exit/Back
    `,
    top: 1,
    left: 1,
    width: '100%-2',
    height: '100%-2',
    scrollable: true
  });

  help.focus();
  screen.render();

  // 按 Esc 关闭帮助
  help.key(['escape', 'q'], function() {
    help.destroy();
    screen.render();
  });
}

// 绑定快捷键
screen.key('?', function() {
  showHelp();
});
```

### 状态管理示例

```javascript
// 全局状态
const state = {
  currentPage: 'type-select',
  selectedTypes: [],
  selections: {
    commands: [],
    skills: [],
    mcp: []
  },
  currentTab: 'commands',
  searchQuery: ''
};

// 状态更新函数
function updateState(path, value) {
  // 使用 lodash.set 或手动设置
  const keys = path.split('.');
  let obj = state;
  for (let i = 0; i < keys.length - 1; i++) {
    obj = obj[keys[i]];
  }
  obj[keys[keys.length - 1]] = value;

  // 触发重新渲染
  render();
}

// 渲染函数
function render() {
  // 根据状态更新 UI
  if (state.currentPage === 'type-select') {
    // 显示类型选择页面
  } else if (state.currentPage === 'content-select') {
    // 显示内容选择页面
  }
  screen.render();
}
```

### 事件处理模式

```javascript
// 键盘事件处理
screen.key(['up', 'k'], function() {
  list.up();
});

screen.key(['down', 'j'], function() {
  list.down();
});

screen.key(['space'], function() {
  const item = list.getItem(list.selected);
  toggleSelection(item);
});

screen.key(['a'], function() {
  if (state.searchQuery === '') {
    selectAll();
  } else {
    searchBox.setValue('a');
  }
});

// Vim 风格键位映射
const vimKeys = {
  'h': 'left',
  'j': 'down',
  'k': 'up',
  'l': 'right',
  'G': 'bottom',
  'g': 'top'
};

Object.entries(vimKeys).forEach(([key, action]) => {
  screen.key(key, function() {
    performAction(action);
  });
});
```

### 布局管理

```javascript
// 响应式布局
function createResponsiveLayout(screen) {
  const width = screen.width;
  const height = screen.height;

  // 根据屏幕尺寸调整布局
  if (width < 80) {
    // 窄屏模式：隐藏描述
    return createCompactLayout(screen);
  } else if (width < 100) {
    // 中等屏幕：截断描述
    return createMediumLayout(screen);
  } else {
    // 宽屏：显示完整信息
    return createFullLayout(screen);
  }
}

// 监听终端尺寸变化
screen.on('resize', function() {
  // 重新计算布局
  createResponsiveLayout(screen);
  screen.render();
});
```

### 颜色和样式

```javascript
// 颜色方案
const colors = {
  commands: 'cyan',
  skills: 'green',
  mcp: 'yellow',
  selected: 'white',
  warning: 'red',
  info: 'blue'
};

// 应用样式
function styleListItem(item, type) {
  item.style.fg = colors[type];
  if (item.selected) {
    item.style.bg = colors.selected;
    item.style.fg = 'black';
  }
}

// 检测颜色支持
if (blessed.colors.length === 0) {
  // 降级到黑白模式
  useBlackAndWhiteTheme();
} else {
  useColorTheme();
}
```

### 性能优化

```javascript
// 虚拟列表实现
class VirtualList {
  constructor(options) {
    this.screen = options.screen;
    this.items = options.items;
    this.itemHeight = options.itemHeight || 1;
    this.viewportHeight = options.viewportHeight;

    this.list = blessed.list({
      parent: this.screen,
      // ... 其他配置
    });

    this.scrollIndex = 0;
    this.updateVisibleItems();
  }

  updateVisibleItems() {
    const start = this.scrollIndex;
    const end = start + this.viewportHeight;
    const visible = this.items.slice(start, end);

    this.list.setItems(visible);
    this.screen.render();
  }

  scroll(direction) {
    if (direction === 'down' && this.scrollIndex < this.items.length - this.viewportHeight) {
      this.scrollIndex++;
    } else if (direction === 'up' && this.scrollIndex > 0) {
      this.scrollIndex--;
    }
    this.updateVisibleItems();
  }
}
```

## 参考资源

### Blessed 文档和示例
- 官方仓库：https://github.com/chjj/blessed
- API 文档：https://github.com/chjj/blessed#documentation
- 示例集合：https://github.com/chjj/blessed#examples
- Wiki：https://github.com/chjj/blessed/wiki

### Blessed 扩展
- blessed-contrib：https://github.com/yaronn/blessed-contrib（图表组件）
- blessed-xterm：https://github.com/mohd-akram/blessed-xterm（终端集成）

### 设计参考
- fzf: https://github.com/junegunn/fzf
- fpp: https://github.com/facebook/PathPicker
- peco: https://github.com/peco/peco

### Node.js TUI 最佳实践
- https://nodejs.org/api/readline.html
- https://github.com/microsoft/node-pty

---

**创建日期：** 2025-01-27
**最后更新：** 2025-01-27
**状态：** 持续更新
