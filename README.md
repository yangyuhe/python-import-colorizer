# Python Import Colorizer

[![GitHub](https://img.shields.io/badge/GitHub-yangyuhe/python--import--colorizer-blue?logo=github)](https://github.com/yangyuhe/python-import-colorizer)
[![VS Code Marketplace](https://img.shields.io/badge/VS%20Code-Marketplace-blue?logo=visualstudiocode)](https://marketplace.visualstudio.com/items?itemName=hexiang.python-import-colorizer)

English | [中文](./README.zh.md)

A VS Code extension that colorizes Python imports by source: **local** or **external** at a glance.

## Features

### Core Features

- **Auto-detect Import Types**: Automatically analyzes `import` and `from ... import` statements in Python files
- **Distinguish Local/External Imports**:
  - **Local imports** (cyan/green): Relative imports (e.g., `from .xxx import`) and modules defined in the workspace
  - **External imports** (yellow/brown): Third-party libraries and Python standard library modules
- **Real-time Updates**: Automatically updates colorization when file content changes (with 300ms debounce)
- **Smart Caching**: Workspace module list is cached for 10 seconds, invalidated on file changes

### Supported Import Syntax

```python
# Relative imports → Local (cyan/green)
from . import module
from ..parent_module import something
from .submodule import func

# Workspace local modules → Local (cyan/green)
from my_local_module import MyClass
import my_utils

# Third-party/standard library → External (yellow/brown)
import numpy as np
from collections import defaultdict
from django.db import models
```

### Default Color Scheme

| Import Type | Dark+ Theme | Light+ Theme |
|-------------|-------------|--------------|
| Local | `#4EC9B0` (cyan) | `#4EC9B0` (green) |
| External | `#DCDCAA` (yellow) | `#DCDCAA` (brown) |

## Configuration

The extension supports customizable colors via VS Code settings:

### How to Configure

1. Open Settings: `Cmd+,` (Mac) or `Ctrl+,` (Windows/Linux)
2. Search for **Python Import Colorizer**
3. Modify the following settings:

| Setting | Default | Description |
|---------|---------|-------------|
| `pythonImportColorizer.localImportColor` | `#4EC9B0` | Color for local imports |
| `pythonImportColorizer.externalImportColor` | `#DCDCAA` | Color for external imports |

### Via settings.json

You can also edit `settings.json` directly:

```json
{
  "pythonImportColorizer.localImportColor": "#4EC9B0",
  "pythonImportColorizer.externalImportColor": "#DCDCAA"
}
```

### Color Formats

All valid CSS color formats are supported:

```json
{
  "pythonImportColorizer.localImportColor": "#FF5733",
  "pythonImportColorizer.externalImportColor": "rgb(0, 128, 255)"
}
```

> 💡 Changes take effect immediately, no VS Code restart required.

## Installation

### Install from VSIX

1. Download the `python-import-colorizer-0.0.1.vsix` file
2. Press `Cmd+Shift+P` in VS Code to open the command palette
3. Type and select **Extensions: Install from VSIX...**
4. Select the downloaded `.vsix` file
5. Restart VS Code

### Build from Source

```bash
# Clone the repository
git clone https://github.com/yangyuhe/python-import-colorizer.git
cd python-import-colorizer

# Install dependencies
pnpm install

# Compile TypeScript
pnpm run compile

# Package VSIX
npx @vscode/vsce package

# Install the generated .vsix file
code --install-extension python-import-colorizer-0.0.1.vsix
```

## Usage

1. **Open a Python file**: The extension activates automatically when you open a `.py` file
2. **View the colorized imports**: Import statements are automatically colorized
3. **No configuration needed**: Semantic highlighting is enabled by default

### Prerequisites

Ensure semantic highlighting is enabled in VS Code settings (the extension configures this automatically):

```json
{
  "editor.semanticHighlighting.enabled": true
}
```

### Workspace Module Detection

The extension scans the workspace root directory to identify local modules:

- All `.py` files (without extension) are recognized as local modules
- Directories containing `__init__.py` are recognized as local packages

For example, given this workspace structure:

```
my_project/
├── utils.py          # → import utils will be colorized as local
├── models/
│   └── __init__.py   # → import models will be colorized as local
└── main.py
```

## Development

```bash
# Compile
pnpm run compile

# Watch mode
pnpm run watch

# Run tests
pnpm test

# Debug
# Press F5 to launch Extension Development Host
```

## License

MIT
