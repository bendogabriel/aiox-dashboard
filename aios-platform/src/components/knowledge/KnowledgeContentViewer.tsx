import { useCallback, useState, useMemo } from 'react';
import { FileText, File, X, Copy, Check, Code2, FileJson, FileCode } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { CockpitCard, CockpitButton, Badge } from '../ui';
import { MarkdownRenderer } from '../chat/MarkdownRenderer';
import {
  useKnowledgeFileContent,
  formatFileSize,
  FILE_TYPE_COLORS,
} from '../../hooks/useKnowledge';

// ── Extension → SyntaxHighlighter language map ──

const EXT_TO_LANG: Record<string, string> = {
  ts: 'typescript',
  tsx: 'tsx',
  js: 'javascript',
  jsx: 'jsx',
  mjs: 'javascript',
  cjs: 'javascript',
  json: 'json',
  yaml: 'yaml',
  yml: 'yaml',
  css: 'css',
  scss: 'scss',
  html: 'html',
  xml: 'xml',
  sh: 'bash',
  sql: 'sql',
  toml: 'toml',
  txt: 'text',
};

// Extensions that get syntax highlighted (non-markdown)
const CODE_EXTENSIONS = new Set(Object.keys(EXT_TO_LANG).filter((e) => e !== 'txt'));

// Extensions that get the markdown renderer
const MARKDOWN_EXTENSIONS = new Set(['md']);

// ── File type icon selector ──

function FileIcon({ extension }: { extension: string }) {
  if (MARKDOWN_EXTENSIONS.has(extension)) return <FileText size={16} />;
  if (extension === 'json') return <FileJson size={16} />;
  if (CODE_EXTENSIONS.has(extension)) return <FileCode size={16} />;
  return <File size={16} />;
}

// ── Syntax-highlighted code viewer ──

function CodeViewer({ content, language }: { content: string; language: string }) {
  return (
    <SyntaxHighlighter
      style={oneDark}
      language={language}
      showLineNumbers
      lineNumberStyle={{
        minWidth: '3em',
        paddingRight: '1em',
        color: 'rgba(255,255,255,0.2)',
        fontSize: '11px',
        userSelect: 'none',
      }}
      customStyle={{
        margin: 0,
        padding: '1rem',
        borderRadius: 0,
        fontSize: '13px',
        lineHeight: '1.6',
        background: 'rgba(0, 0, 0, 0.3)',
        border: 'none',
      }}
      codeTagProps={{
        style: {
          fontFamily: 'var(--font-family-mono, ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace)',
        },
      }}
    >
      {content}
    </SyntaxHighlighter>
  );
}

// ── Plain text viewer ──

function PlainTextViewer({ content }: { content: string }) {
  return (
    <pre className="text-sm whitespace-pre-wrap font-mono p-4 text-secondary leading-relaxed">
      {content}
    </pre>
  );
}

// ── Content renderer (dispatches by file type) ──

function ContentRenderer({ content, extension }: { content: string; extension: string }) {
  // Markdown files → rich rendering
  if (MARKDOWN_EXTENSIONS.has(extension)) {
    return <MarkdownRenderer content={content} className="px-2" />;
  }

  // Code files → syntax highlighting
  if (CODE_EXTENSIONS.has(extension)) {
    const language = EXT_TO_LANG[extension] || 'text';
    return <CodeViewer content={content} language={language} />;
  }

  // Everything else → plain text
  return <PlainTextViewer content={content} />;
}

// ── View mode toggle for markdown files ──

type ViewMode = 'rendered' | 'source';

// ── Main component ──

interface KnowledgeContentViewerProps {
  filePath: string | null;
  onClose: () => void;
}

export function KnowledgeContentViewer({ filePath, onClose }: KnowledgeContentViewerProps) {
  const { data: fileContent, isLoading } = useKnowledgeFileContent(filePath);
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('rendered');

  const extension = fileContent?.extension || '';
  const isMarkdown = MARKDOWN_EXTENSIONS.has(extension);

  const handleCopy = useCallback(() => {
    if (fileContent?.content) {
      navigator.clipboard.writeText(fileContent.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [fileContent]);

  // Line count for source files
  const lineCount = useMemo(() => {
    if (!fileContent?.content) return 0;
    return fileContent.content.split('\n').length;
  }, [fileContent]);

  if (!filePath) {
    return (
      <CockpitCard className="flex-1 flex flex-col items-center justify-center">
        <FileText size={40} className="mb-3 text-tertiary opacity-30" />
        <p className="text-sm text-secondary">Selecione um arquivo</p>
        <p className="text-xs text-tertiary mt-1">
          Clique em um arquivo na lista para visualizar seu conteúdo
        </p>
      </CockpitCard>
    );
  }

  return (
    <CockpitCard className="flex-1 flex flex-col !p-0 overflow-hidden">
      {/* File Header */}
      <div className="flex items-center justify-between p-3 border-b border-glass-border">
        <div className="flex items-center gap-2 min-w-0">
          <span className={FILE_TYPE_COLORS[extension] || 'text-tertiary'}>
            <FileIcon extension={extension} />
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-medium text-primary truncate">
              {fileContent?.name || filePath.split('/').pop()}
            </h3>
            <div className="flex items-center gap-2 text-[10px] text-tertiary">
              {fileContent?.size !== undefined && <span>{formatFileSize(fileContent.size)}</span>}
              {extension && (
                <Badge variant="subtle" size="sm">.{extension}</Badge>
              )}
              {lineCount > 0 && (
                <span>{lineCount} linhas</span>
              )}
              {fileContent?.modified && (
                <span>{new Date(fileContent.modified).toLocaleDateString('pt-BR')}</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* View mode toggle for markdown */}
          {isMarkdown && fileContent?.content && (
            <div className="flex items-center gap-0.5 bg-white/5 rounded-none p-0.5 mr-1">
              <CockpitButton
                variant={viewMode === 'rendered' ? 'default' : 'ghost'}
                size="sm"
                className="h-6 px-2 text-[10px] gap-1"
                onClick={() => setViewMode('rendered')}
              >
                <FileText size={11} />
                Preview
              </CockpitButton>
              <CockpitButton
                variant={viewMode === 'source' ? 'default' : 'ghost'}
                size="sm"
                className="h-6 px-2 text-[10px] gap-1"
                onClick={() => setViewMode('source')}
              >
                <Code2 size={11} />
                Source
              </CockpitButton>
            </div>
          )}
          <CockpitButton
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleCopy}
            aria-label="Copiar conteúdo"
          >
            {copied ? <Check size={14} className="text-[var(--color-status-success)]" /> : <Copy size={14} />}
          </CockpitButton>
          <CockpitButton variant="ghost" size="icon" className="h-7 w-7" onClick={onClose} aria-label="Fechar">
            <X size={14} />
          </CockpitButton>
        </div>
      </div>

      {/* File Content */}
      <div className="flex-1 overflow-y-auto glass-scrollbar">
        {isLoading ? (
          <div className="flex items-center justify-center py-12 gap-2 text-tertiary text-sm">
            <div className="animate-spin h-4 w-4 border-2 border-[var(--aiox-lime)] border-t-transparent rounded-full" />
            Carregando...
          </div>
        ) : fileContent?.content ? (
          isMarkdown && viewMode === 'source' ? (
            <CodeViewer content={fileContent.content} language="markdown" />
          ) : (
            <div className="p-4">
              <ContentRenderer content={fileContent.content} extension={extension} />
            </div>
          )
        ) : (
          <div className="text-center py-8 text-tertiary text-sm">
            Não foi possível carregar o conteúdo
          </div>
        )}
      </div>
    </CockpitCard>
  );
}
