import * as vscode from "vscode";

interface ImportInfo {
  moduleName: string;
  line: number;
  startChar: number;
  length: number;
  isRelative: boolean;
}

// Cache workspace local modules
let localModulesCache: Set<string> | null = null;
let localModulesCacheTime = 0;
const CACHE_TTL = 10000; // 10s

async function getLocalModules(
  workspaceFolder: vscode.Uri
): Promise<Set<string>> {
  const now = Date.now();
  if (localModulesCache && now - localModulesCacheTime < CACHE_TTL) {
    return localModulesCache;
  }

  const modules = new Set<string>();
  // Find .py files in workspace root
  const pyFiles = await vscode.workspace.findFiles(
    new vscode.RelativePattern(workspaceFolder, "*.py")
  );
  for (const uri of pyFiles) {
    const name = uri.path.split("/").pop()?.replace(/\.py$/, "");
    if (name && name !== "__init__") {
      modules.add(name);
    }
  }

  // Find directories with __init__.py (packages)
  const initFiles = await vscode.workspace.findFiles(
    new vscode.RelativePattern(workspaceFolder, "*/__init__.py")
  );
  for (const uri of initFiles) {
    const parts = uri.path.split("/");
    // Go up from __init__.py to get the package directory name
    const dirName = parts[parts.length - 2];
    if (dirName) {
      modules.add(dirName);
    }
  }

  localModulesCache = modules;
  localModulesCacheTime = now;
  return modules;
}

function parseImports(text: string): ImportInfo[] {
  const imports: ImportInfo[] = [];
  const lines = text.split("\n");

  let inParentheses = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Strip inline comments (rough, doesn't handle # inside strings)
    const commentIdx = line.indexOf("#");
    if (commentIdx >= 0) {
      line = line.substring(0, commentIdx);
    }

    const trimmed = line.trim();

    if (inParentheses) {
      // Inside multi-line import, skip until closing paren
      if (trimmed.includes(")")) {
        inParentheses = false;
      }
      continue;
    }

    // Skip empty / non-import lines
    if (!trimmed.startsWith("import ") && !trimmed.startsWith("from ")) {
      continue;
    }

    // Match: from .xxx import ... or from ..xxx import ... (relative)
    const relativeMatch = line.match(/^from\s+(\.+[a-zA-Z_]\w*)\s+import/);
    if (relativeMatch) {
      imports.push({
        moduleName: relativeMatch[1],
        line: i,
        startChar: line.indexOf(relativeMatch[1]),
        length: relativeMatch[1].length,
        isRelative: true,
      });
      if (line.includes("(") && !line.includes(")")) {
        inParentheses = true;
      }
      continue;
    }

    // Match: from . import ... (bare relative)
    const bareRelativeMatch = line.match(/^from\s+(\.+)\s+import/);
    if (bareRelativeMatch) {
      imports.push({
        moduleName: bareRelativeMatch[1],
        line: i,
        startChar: line.indexOf(bareRelativeMatch[1]),
        length: bareRelativeMatch[1].length,
        isRelative: true,
      });
      if (line.includes("(") && !line.includes(")")) {
        inParentheses = true;
      }
      continue;
    }

    // Match: from xxx import ...
    const fromMatch = line.match(/^from\s+([a-zA-Z_]\w*)\s+import/);
    if (fromMatch) {
      imports.push({
        moduleName: fromMatch[1],
        line: i,
        startChar: line.indexOf(fromMatch[1]),
        length: fromMatch[1].length,
        isRelative: false,
      });
      if (line.includes("(") && !line.includes(")")) {
        inParentheses = true;
      }
      continue;
    }

    // Match: import xxx, yyy, zzz
    const importMatch = line.match(/^import\s+(.+)/);
    if (importMatch) {
      const modules = importMatch[1].split(",");
      const baseOffset = line.indexOf("import ") + "import ".length;
      let offset = baseOffset;
      for (const mod of modules) {
        const modTrimmed = mod.trim();
        // Handle "import xxx as yyy" — take the module name before "as"
        const asMatch = modTrimmed.match(/^([a-zA-Z_]\w*)\s+as\s+/);
        const modName = asMatch ? asMatch[1] : modTrimmed.split(".")[0];
        if (/^[a-zA-Z_]\w*$/.test(modName)) {
          const charOffset = line.indexOf(modName, offset);
          imports.push({
            moduleName: modName,
            line: i,
            startChar: charOffset >= 0 ? charOffset : offset,
            length: modName.length,
            isRelative: false,
          });
          offset = (charOffset >= 0 ? charOffset : offset) + modName.length;
        }
      }
      continue;
    }
  }

  return imports;
}

async function classifyImport(
  moduleName: string,
  isRelative: boolean,
  document: vscode.TextDocument
): Promise<"importLocal" | "importExternal"> {
  if (isRelative) {
    return "importLocal";
  }

  const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
  if (workspaceFolder) {
    const localModules = await getLocalModules(workspaceFolder.uri);
    if (localModules.has(moduleName)) {
      return "importLocal";
    }
  }

  return "importExternal";
}

// Create decoration types for local and external imports
const localImportDecorationType = vscode.window.createTextEditorDecorationType({
  color: "#4EC9B0", // cyan (Dark+) / green (Light+)
});

const externalImportDecorationType =
  vscode.window.createTextEditorDecorationType({
    color: "#DCDCAA", // yellow (Dark+) / brown (Light+)
  });

async function updateDecorations(editor: vscode.TextEditor) {
  if (editor.document.languageId !== "python") {
    return;
  }

  const text = editor.document.getText();
  const imports = parseImports(text);

  const localRanges: vscode.Range[] = [];
  const externalRanges: vscode.Range[] = [];

  for (const imp of imports) {
    const type = await classifyImport(
      imp.moduleName,
      imp.isRelative,
      editor.document
    );
    const range = new vscode.Range(
      imp.line,
      imp.startChar,
      imp.line,
      imp.startChar + imp.length
    );
    if (type === "importLocal") {
      localRanges.push(range);
    } else {
      externalRanges.push(range);
    }
  }

  editor.setDecorations(localImportDecorationType, localRanges);
  editor.setDecorations(externalImportDecorationType, externalRanges);
}

// Debounce mechanism to avoid re-parsing on every keystroke
let updateTimeout: ReturnType<typeof setTimeout> | undefined;

function scheduleUpdate(editor: vscode.TextEditor) {
  if (updateTimeout) {
    clearTimeout(updateTimeout);
  }
  updateTimeout = setTimeout(() => {
    updateDecorations(editor);
  }, 300);
}

export function activate(context: vscode.ExtensionContext) {
  // Update decorations for the currently active editor
  if (vscode.window.activeTextEditor) {
    updateDecorations(vscode.window.activeTextEditor);
  }

  // Update decorations when switching to a different editor
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor) {
        updateDecorations(editor);
      }
    })
  );

  // Update decorations when the document content changes (with debounce)
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((event) => {
      const editor = vscode.window.activeTextEditor;
      if (editor && event.document === editor.document) {
        scheduleUpdate(editor);
      }
    })
  );

  // Invalidate local modules cache when files change
  context.subscriptions.push(
    vscode.workspace.onDidCreateFiles(() => {
      localModulesCache = null;
    }),
    vscode.workspace.onDidDeleteFiles(() => {
      localModulesCache = null;
    }),
    vscode.workspace.onDidRenameFiles(() => {
      localModulesCache = null;
    })
  );
}

export function deactivate() {}
