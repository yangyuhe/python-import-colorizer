# Python Import Colorizer

[![GitHub](https://img.shields.io/badge/GitHub-yangyuhe/python--import--colorizer-blue?logo=github)](https://github.com/yangyuhe/python-import-colorizer)
[![VS Code Marketplace](https://img.shields.io/badge/VS%20Code-Marketplace-blue?logo=visualstudiocode)](https://marketplace.visualstudio.com/items?itemName=hexiang.python-import-colorizer)

[English](./README.en.md) | 中文

一个 VS Code 插件，用于区分并着色 Python 导入语句：**本地导入**和**外部导入**一目了然。

## 功能介绍

### 核心功能

- **自动识别导入类型**：自动分析 Python 文件中的 `import` 和 `from ... import` 语句
- **区分本地/外部导入**：
  - **本地导入**（青色/绿色）：相对导入（如 `from .xxx import`）以及工作区中定义的模块
  - **外部导入**（黄色/棕色）：来自第三方库或 Python 标准库的模块
- **实时更新**：文件内容变化时自动更新着色（带防抖机制，300ms 延迟）
- **智能缓存**：工作区模块列表缓存 10 秒，文件变更时自动失效

### 支持的导入语法

```python
# 相对导入 → 本地（青色/绿色）
from . import module
from ..parent_module import something
from .submodule import func

# 工作区本地模块 → 本地（青色/绿色）
from my_local_module import MyClass
import my_utils

# 第三方库/标准库 → 外部（黄色/棕色）
import numpy as np
from collections import defaultdict
from django.db import models
```

### 默认颜色方案

| 导入类型 | Dark+ 主题 | Light+ 主题 |
|---------|-----------|------------|
| 本地导入 | `#4EC9B0` (青色) | `#4EC9B0` (绿色) |
| 外部导入 | `#DCDCAA` (黄色) | `#DCDCAA` (棕色) |

## 配置

插件支持自定义颜色，你可以在 VS Code 设置中修改：

### 设置方法

1. 打开设置：`Cmd+,` (Mac) 或 `Ctrl+,` (Windows/Linux)
2. 搜索 **Python Import Colorizer**
3. 修改以下配置项：

| 配置项 | 默认值 | 说明 |
|-------|--------|------|
| `pythonImportColorizer.localImportColor` | `#4EC9B0` | 本地导入的颜色 |
| `pythonImportColorizer.externalImportColor` | `#DCDCAA` | 外部导入的颜色 |

### 通过 settings.json 配置

也可以直接编辑 `settings.json`：

```json
{
  "pythonImportColorizer.localImportColor": "#4EC9B0",
  "pythonImportColorizer.externalImportColor": "#DCDCAA"
}
```

### 颜色格式

支持所有有效的 CSS 颜色格式：

```json
{
  "pythonImportColorizer.localImportColor": "#FF5733",     // 十六进制
  "pythonImportColorizer.externalImportColor": "rgb(0, 128, 255)"  // RGB
}
```

> 💡 配置修改后立即生效，无需重启 VS Code。

## 安装

### 从 VSIX 文件安装

1. 下载 `python-import-colorizer-0.0.1.vsix` 文件
2. 在 VS Code 中按 `Cmd+Shift+P` 打开命令面板
3. 输入并选择 **Extensions: Install from VSIX...**
4. 选择下载的 `.vsix` 文件
5. 重启 VS Code

### 从源码构建安装

```bash
# 克隆项目
git clone <repository-url>
cd python-import-colorizer

# 安装依赖
npm install

# 编译 TypeScript
npm run compile

# 打包 VSIX
npx @vscode/vsce package

# 安装生成的 .vsix 文件
code --install-extension python-import-colorizer-0.0.1.vsix
```

## 使用说明

1. **打开 Python 文件**：插件会在你打开 `.py` 文件时自动激活
2. **查看着色效果**：导入语句会自动着色
3. **无需配置**：插件默认启用语义高亮

### 前置条件

确保 VS Code 设置中启用了语义高亮（插件会自动配置）：

```json
{
  "editor.semanticHighlighting.enabled": true
}
```

### 工作区模块识别

插件会扫描当前工作区根目录来识别本地模块：

- 所有 `.py` 文件（不含扩展名）会被识别为本地模块
- 包含 `__init__.py` 的目录会被识别为本地包

例如，如果你的工作区结构如下：

```
my_project/
├── utils.py          # → import utils 会被着色为本地导入
├── models/
│   └── __init__.py   # → import models 会被着色为本地导入
└── main.py
```

## 开发

```bash
# 编译
npm run compile

# 监听模式编译
npm run watch

# 调试
# 按 F5 启动 Extension Development Host
```

## 许可证

MIT
