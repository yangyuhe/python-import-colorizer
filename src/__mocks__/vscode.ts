// Mock vscode module for unit testing
export const window = {
  createTextEditorDecorationType: () => ({
    dispose: () => {},
  }),
  activeTextEditor: null,
  visibleTextEditors: [],
};

export const workspace = {
  getConfiguration: () => ({
    get: <T>(key: string, defaultValue: T) => defaultValue,
  }),
  getWorkspaceFolder: () => null,
  findFiles: () => Promise.resolve([]),
  onDidChangeTextDocument: () => ({ dispose: () => {} }),
  onDidCreateFiles: () => ({ dispose: () => {} }),
  onDidDeleteFiles: () => ({ dispose: () => {} }),
  onDidRenameFiles: () => ({ dispose: () => {} }),
  onDidChangeConfiguration: () => ({ dispose: () => {} }),
};

export class Range {
  constructor(
    public startLine: number,
    public startChar: number,
    public endLine: number,
    public endChar: number
  ) {}
}

export class RelativePattern {
  constructor(public base: any, public pattern: string) {}
}
