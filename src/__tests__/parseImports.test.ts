import { describe, it, expect } from "vitest";
import { parseImports } from "../extension";

describe("parseImports", () => {
  it("should parse simple import statement", () => {
    const code = `import os`;
    const result = parseImports(code);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      moduleName: "os",
      isRelative: false,
    });
  });

  it("should parse multiple imports on one line", () => {
    const code = `import os, sys, json`;
    const result = parseImports(code);

    expect(result).toHaveLength(3);
    expect(result.map((i) => i.moduleName)).toEqual(["os", "sys", "json"]);
  });

  it("should parse from ... import statement", () => {
    const code = `from collections import defaultdict`;
    const result = parseImports(code);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      moduleName: "collections",
      isRelative: false,
    });
  });

  it("should parse relative import (single dot)", () => {
    const code = `from . import module`;
    const result = parseImports(code);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      moduleName: ".",
      isRelative: true,
    });
  });

  it("should parse relative import (double dot)", () => {
    const code = `from .. import something`;
    const result = parseImports(code);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      moduleName: "..",
      isRelative: true,
    });
  });

  it("should parse relative import with parent package name", () => {
    const code = `from ..parent import something`;
    const result = parseImports(code);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      moduleName: "..parent",
      isRelative: true,
    });
  });

  it("should parse relative import with module name", () => {
    const code = `from .submodule import func`;
    const result = parseImports(code);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      moduleName: ".submodule",
      isRelative: true,
    });
  });

  it("should parse import with alias", () => {
    const code = `import numpy as np`;
    const result = parseImports(code);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      moduleName: "numpy",
      isRelative: false,
    });
  });

  it("should ignore non-import lines", () => {
    const code = `
x = 1
import os
# this is a comment
y = 2
from sys import path
`;
    const result = parseImports(code);

    expect(result).toHaveLength(2);
    expect(result.map((i) => i.moduleName)).toEqual(["os", "sys"]);
  });

  it("should handle inline comments", () => {
    const code = `import os  # operating system`;
    const result = parseImports(code);

    expect(result).toHaveLength(1);
    expect(result[0].moduleName).toBe("os");
  });

  it("should parse multi-line import with parentheses", () => {
    const code = `from typing import (
    Dict,
    List,
    Optional
)`;
    const result = parseImports(code);

    // Only the first line "from typing import (" is parsed before parenthesis closes
    // This is expected behavior - we detect the module from the first line
    expect(result).toHaveLength(1);
    expect(result[0].moduleName).toBe("typing");
  });

  it("should calculate correct positions", () => {
    const code = `import os`;
    const result = parseImports(code);

    expect(result[0].startChar).toBe(7); // position of 'os' after 'import '
    expect(result[0].length).toBe(2); // length of 'os'
    expect(result[0].line).toBe(0);
  });

  it("should calculate correct positions for from import", () => {
    const code = `from os import path`;
    const result = parseImports(code);

    expect(result[0].startChar).toBe(5); // position of 'os'
    expect(result[0].length).toBe(2);
  });

  it("should handle dotted imports", () => {
    // Note: The regex only matches single module names, not dotted paths
    // This test documents the current behavior
    const code = `from django.db import models`;
    const result = parseImports(code);

    // Currently doesn't match dotted imports like 'django.db'
    // Only matches simple identifiers: [a-zA-Z_]\w*
    expect(result).toHaveLength(0);
  });

  it("should handle empty input", () => {
    const result = parseImports("");
    expect(result).toHaveLength(0);
  });

  it("should handle file with no imports", () => {
    const code = `
def hello():
    print("world")

x = 42
`;
    const result = parseImports(code);
    expect(result).toHaveLength(0);
  });

  // ============ 额外边界情况测试 ============

  it("should handle mixed imports with and without alias", () => {
    // import xxx, yyy as zzz, aaa
    const code = `import os, sys as s, json`;
    const result = parseImports(code);

    expect(result).toHaveLength(3);
    expect(result.map((i) => i.moduleName)).toEqual(["os", "sys", "json"]);
  });

  it("should handle dotted module in import statement", () => {
    // import xxx.yyy - takes first part
    const code = `import os.path`;
    const result = parseImports(code);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      moduleName: "os",
      isRelative: false,
    });
  });

  it("should handle from import with multiple names", () => {
    // from xxx import a, b, c - only care about module name
    const code = `from collections import defaultdict, OrderedDict, Counter`;
    const result = parseImports(code);

    expect(result).toHaveLength(1);
    expect(result[0].moduleName).toBe("collections");
  });

  it("should handle same-line parentheses import", () => {
    const code = `from typing import (Dict, List)`;
    const result = parseImports(code);

    expect(result).toHaveLength(1);
    expect(result[0].moduleName).toBe("typing");
  });

  it("should handle indented import (inside function/class)", () => {
    const code = `def foo():
    import os`;
    const result = parseImports(code);

    // Note: current regex requires line start with 'import'
    // This test documents current behavior
    expect(result).toHaveLength(0);
  });

  it("should handle multiple import statements", () => {
    const code = `import os
import sys
from json import dumps`;
    const result = parseImports(code);

    expect(result).toHaveLength(3);
    expect(result.map((i) => i.moduleName)).toEqual(["os", "sys", "json"]);
  });

  it("should handle comment after import with no space", () => {
    const code = `import os#comment`;
    const result = parseImports(code);

    expect(result).toHaveLength(1);
    expect(result[0].moduleName).toBe("os");
  });

  it("should calculate correct position for aliased import", () => {
    const code = `import numpy as np`;
    const result = parseImports(code);

    expect(result[0]).toMatchObject({
      moduleName: "numpy",
      startChar: 7,
      length: 5, // "numpy".length = 5
    });
  });

  it("should handle multiple dotted imports", () => {
    const code = `import os.path, json.tool`;
    const result = parseImports(code);

    expect(result).toHaveLength(2);
    expect(result.map((i) => i.moduleName)).toEqual(["os", "json"]);
  });

  it("should handle whitespace around import", () => {
    const code = `  import os  `;
    const result = parseImports(code);

    // Note: current implementation uses line.match(/^import/) which won't match indented imports
    // This documents current behavior - indented imports are NOT supported
    expect(result).toHaveLength(0);
  });

  it("should handle from import with dotted module", () => {
    // from xxx.yyy import zzz - currently NOT supported
    const code = `from os.path import join`;
    const result = parseImports(code);

    // The regex only matches simple identifiers
    expect(result).toHaveLength(0);
  });

  it("should correctly identify line numbers for multiple imports", () => {
    const code = `import os
import sys
import json`;
    const result = parseImports(code);

    expect(result.map((i) => i.line)).toEqual([0, 1, 2]);
  });
});
