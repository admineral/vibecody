import { parseSync } from '@swc/core';
import { Project, SourceFile, Node, JSDocableNode } from 'ts-morph';
import { ComponentType, PropMetadata } from '../types';
import * as path from 'path';

// SWC AST node types
interface SWCNode {
  type: string;
  [key: string]: unknown;
}

// Removed unused interfaces - ImportDeclaration and ExportDeclaration
// These are handled inline in the walker functions

interface Program extends SWCNode {
  type: 'Module' | 'Script';
  body: SWCNode[];
}

export interface ParsedComponent {
  name: string;
  type: ComponentType;
  file: string;
  isClientComponent: boolean;
  imports: string[];
  exports: string[];
  props?: PropMetadata[];
  description?: string;
}

export class ASTAnalyzer {
  private project: Project;
  
  constructor(tsConfigPath?: string) {
    this.project = new Project({
      tsConfigFilePath: tsConfigPath,
      skipAddingFilesFromTsConfig: true,
    });
  }

  async analyzeFile(filePath: string, content: string): Promise<ParsedComponent | null> {
    // Skip non-JavaScript/TypeScript files
    if (filePath.endsWith('.json') || filePath.endsWith('.md') || filePath.endsWith('.mdx')) {
      return null;
    }

    // Detect if content likely contains JSX
    // Look for JSX patterns: <Component, </div>, self-closing tags, or JSX fragments
    const hasJSXContent = /<[A-Z][A-Za-z0-9]*[\s>\/]|<\/[a-zA-Z]+>|<[a-z]+\s+[a-zA-Z-]+=/m.test(content) || 
                          /<>|<\/>/.test(content);
    
    // Determine syntax and JSX settings
    const isTypeScript = filePath.endsWith('.ts') || filePath.endsWith('.tsx');
    const isJSXFile = filePath.endsWith('.tsx') || filePath.endsWith('.jsx');
    const needsJSX = isJSXFile || (filePath.endsWith('.js') && hasJSXContent);
    
    try {
      
      // Quick parse with SWC for imports/exports
      // Note: When tsx is true, we must use 'typescript' syntax
      const ast = parseSync(content, {
        syntax: (isTypeScript || needsJSX) ? 'typescript' : 'ecmascript',
        tsx: needsJSX,
      }) as unknown as Program;

      // Check for "use client" directive
      const isClientComponent = this.hasUseClientDirective(ast);
      
      // Extract basic metadata
      const imports = this.extractImports(ast);
      const exports = this.extractExports(ast);
      const componentName = this.extractComponentName(ast, path.basename(filePath));

      // Determine component type based on file path and content
      const type = this.determineComponentType(filePath, ast);

      // For components, use ts-morph for detailed prop analysis
      let props: PropMetadata[] = [];
      let description: string | undefined;

      if (type === ComponentType.COMPONENT || type === ComponentType.PAGE) {
        const sourceFile = this.project.createSourceFile(filePath, content, { overwrite: true });
        props = this.extractProps(sourceFile, componentName);
        description = this.extractDescription(sourceFile);
      }

      return {
        name: componentName,
        type,
        file: filePath,
        isClientComponent,
        imports,
        exports,
        props,
        description,
      };
          } catch (error) {
        // If parsing fails, try again with JSX enabled (for .js files)
        if (filePath.endsWith('.js') && !needsJSX) {
          try {
            const ast = parseSync(content, {
              syntax: 'typescript',
              tsx: true,
            }) as unknown as Program;
          
          // Continue with the same analysis logic
          const isClientComponent = this.hasUseClientDirective(ast);
          const imports = this.extractImports(ast);
          const exports = this.extractExports(ast);
          const componentName = this.extractComponentName(ast, path.basename(filePath));
          const type = this.determineComponentType(filePath, ast);
          
          return {
            name: componentName,
            type,
            file: filePath,
            isClientComponent,
            imports,
            exports,
            props: [],
            description: undefined,
          };
        } catch (retryError) {
          console.warn(`Failed to analyze ${filePath} even with JSX enabled:`, retryError);
          return null;
        }
      }
      
      console.warn(`Failed to analyze ${filePath}:`, error);
      return null;
    }
  }

  private hasUseClientDirective(ast: Program): boolean {
    // Check first node for "use client" directive
    if (ast.body && ast.body.length > 0) {
      const firstNode = ast.body[0] as SWCNode & {
        expression?: { type: string; value?: string };
      };
      if (firstNode.type === 'ExpressionStatement' && 
          firstNode.expression?.type === 'StringLiteral' &&
          firstNode.expression.value === 'use client') {
        return true;
      }
    }
    return false;
  }

  private extractImports(ast: Program): string[] {
    const imports: string[] = [];
    
    this.walkAST(ast, (node) => {
      if (node.type === 'ImportDeclaration') {
        // Extract imported names
        const specifiers = node.specifiers as Array<{
          type: string;
          local: { value: string };
          imported?: { value: string };
        }> | undefined;
        specifiers?.forEach((spec) => {
          if (spec.type === 'ImportDefaultSpecifier') {
            imports.push(spec.local.value);
          } else if (spec.type === 'ImportSpecifier') {
            imports.push(spec.imported?.value || spec.local.value);
          }
        });
      }
    });

    return [...new Set(imports)];
  }

  private extractExports(ast: Program): string[] {
    const exports: string[] = [];
    
    this.walkAST(ast, (node) => {
      if (node.type === 'ExportNamedDeclaration' || node.type === 'ExportDefaultDeclaration') {
        const exportNode = node as SWCNode & {
          declaration?: {
            type: string;
            identifier?: { value: string };
            declarations?: Array<{
              id?: { value: string };
            }>;
          };
        };
        if (exportNode.declaration) {
          if (exportNode.declaration.type === 'FunctionDeclaration' && exportNode.declaration.identifier) {
            exports.push(exportNode.declaration.identifier.value);
          } else if (exportNode.declaration.type === 'VariableDeclaration') {
            const declarations = exportNode.declaration.declarations;
            declarations?.forEach((decl) => {
              if (decl.id?.value) {
                exports.push(decl.id.value);
              }
            });
          }
        }
      }
    });

    return [...new Set(exports)];
  }

  private determineComponentType(filePath: string, ast: Program): ComponentType {
    const normalizedPath = filePath.replace(/\\/g, '/');
    
    // App Router special files
    if (normalizedPath.match(/\/app\/.*\/page\.(tsx|jsx|ts|js)$/)) {
      return ComponentType.PAGE;
    }
    if (normalizedPath.match(/\/app\/.*\/layout\.(tsx|jsx|ts|js)$/)) {
      return ComponentType.LAYOUT;
    }
    if (normalizedPath.match(/\/app\/.*\/(loading|error|not-found|template)\.(tsx|jsx|ts|js)$/)) {
      return ComponentType.PAGE;
    }
    
    // API routes
    if (normalizedPath.match(/\/app\/.*\/route\.(ts|js)$/)) {
      return ComponentType.UTILITY;
    }
    
    // Check for hooks
    const hasHookExport = this.hasHookPattern(ast);
    if (hasHookExport || normalizedPath.includes('/hooks/')) {
      return ComponentType.HOOK;
    }
    
    // Context providers
    if (normalizedPath.includes('/context/') || this.hasContextPattern(ast)) {
      return ComponentType.CONTEXT;
    }
    
    // Utilities and configs
    if (normalizedPath.match(/\/(lib|utils|helpers|config|services)\//) ||
        normalizedPath.match(/\.(config|constants)\./)) {
      return ComponentType.UTILITY;
    }
    
    // Default to component if it has JSX
    if (this.hasJSXReturn(ast)) {
      return ComponentType.COMPONENT;
    }
    
    return ComponentType.UTILITY;
  }

  private extractProps(sourceFile: SourceFile, componentName: string): PropMetadata[] {
    const props: PropMetadata[] = [];
    
    // Find the component
    const component = sourceFile.getFunction(componentName) || 
                     sourceFile.getVariableDeclaration(componentName);
    
    if (!component) return props;

    // Look for Props interface or type
    const propsType = sourceFile.getInterface(`${componentName}Props`) ||
                     sourceFile.getTypeAlias(`${componentName}Props`);
    
    if (propsType) {
      if (Node.isInterfaceDeclaration(propsType)) {
        propsType.getProperties().forEach(prop => {
          props.push({
            name: prop.getName(),
            type: prop.getType().getText(),
            required: !prop.hasQuestionToken(),
            description: this.getJSDocComment(prop),
          });
        });
      }
    }
    
    return props;
  }

  private extractComponentName(ast: Program, fileName: string): string {
    let componentName = '';
    
    // Look for default export
    this.walkAST(ast, (node) => {
      if (node.type === 'ExportDefaultDeclaration') {
        const exportNode = node as SWCNode & {
          declaration?: {
            type: string;
            identifier?: { value: string };
            value?: string;
          };
        };
        if (exportNode.declaration) {
          if (exportNode.declaration.type === 'FunctionDeclaration' && exportNode.declaration.identifier) {
            componentName = exportNode.declaration.identifier.value;
          } else if (exportNode.declaration.type === 'Identifier' && exportNode.declaration.value) {
            componentName = exportNode.declaration.value;
          }
        }
      }
    });
    
    // Fallback to filename
    if (!componentName) {
      componentName = fileName.replace(/\.(tsx?|jsx?)$/, '');
      componentName = componentName.charAt(0).toUpperCase() + componentName.slice(1);
    }
    
    return componentName;
  }

  private walkAST(node: SWCNode, callback: (node: SWCNode) => void) {
    callback(node);
    
    Object.keys(node).forEach(key => {
      const value = node[key];
      if (value && typeof value === 'object') {
        if (Array.isArray(value)) {
          value.forEach(child => {
            if (child && typeof child === 'object' && 'type' in child) {
              this.walkAST(child as SWCNode, callback);
            }
          });
        } else if ('type' in value) {
          this.walkAST(value as SWCNode, callback);
        }
      }
    });
  }

  private hasJSXReturn(ast: Program): boolean {
    let hasJSX = false;
    
    this.walkAST(ast, (node) => {
      if (node.type === 'JSXElement' || node.type === 'JSXFragment') {
        hasJSX = true;
      }
    });
    
    return hasJSX;
  }

  private hasHookPattern(ast: Program): boolean {
    let hasHook = false;
    
    this.walkAST(ast, (node) => {
      if (node.type === 'FunctionDeclaration' || node.type === 'VariableDeclaration') {
        const declNode = node as SWCNode & {
          identifier?: { value: string };
        };
        if (declNode.identifier?.value?.startsWith('use')) {
          hasHook = true;
        }
      }
    });
    
    return hasHook;
  }

  private hasContextPattern(ast: Program): boolean {
    let hasContext = false;
    
    this.walkAST(ast, (node) => {
      if (node.type === 'CallExpression') {
        const callNode = node as SWCNode & {
          callee?: { value: string };
        };
        if (callNode.callee?.value === 'createContext') {
          hasContext = true;
        }
      }
    });
    
    return hasContext;
  }

  private extractDescription(sourceFile: SourceFile): string | undefined {
    // Look for file-level JSDoc comment
    const leadingCommentRanges = sourceFile.getLeadingCommentRanges();
    
    if (leadingCommentRanges.length > 0) {
      const firstComment = leadingCommentRanges[0].getText();
      if (firstComment.startsWith('/**')) {
        return this.parseJSDocDescription(firstComment);
      }
    }
    
    return undefined;
  }

  private getJSDocComment(node: Node): string | undefined {
    // Check if node has JSDoc support
    if ('getJsDocs' in node && typeof node.getJsDocs === 'function') {
      const jsDocs = (node as unknown as JSDocableNode).getJsDocs();
      if (jsDocs.length > 0) {
        return jsDocs[0].getDescription().trim();
      }
    }
    return undefined;
  }

  private parseJSDocDescription(comment: string): string {
    const lines = comment.split('\n');
    const description: string[] = [];
    
    for (const line of lines) {
      const cleaned = line.replace(/^\s*\*\s?/, '').trim();
      if (cleaned && !cleaned.startsWith('@')) {
        description.push(cleaned);
      }
    }
    
    return description.join(' ').trim();
  }
} 