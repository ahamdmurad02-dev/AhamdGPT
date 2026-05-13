import React, { useState } from "react";
import { createPortal } from "react-dom";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Check, Copy, Download, X } from "lucide-react";
import { cn } from "@/src/lib/utils";

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const downloadImage = (url: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = "AhamdGPT-image.png";
    a.click();
  };

  return (
    <>
      <div dir="auto" className="prose prose-invert max-w-none break-words
        prose-p:leading-relaxed prose-pre:p-0 prose-pre:bg-transparent prose-pre:m-0
        prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
        prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:bg-slate-700/50 prose-code:font-normal prose-code:text-slate-200 prose-code:before:content-none prose-code:after:content-none">
        <Markdown
          remarkPlugins={[remarkGfm]}
          components={{
            img(props) {
              if (!props.src || props.src === "") return null;
              return (
                <div className="relative group inline-block my-4">
                  <img
                    {...props}
                    className="max-w-full rounded-lg cursor-pointer border border-slate-700 hover:opacity-90 transition-opacity"
                    onClick={() => setPreviewImage(props.src || null)}
                    alt={props.alt || "Generated Image"}
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (props.src) downloadImage(props.src);
                    }}
                    className="absolute top-2 right-2 bg-slate-900/80 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity text-white hover:bg-slate-800"
                    title="تحميل الصورة"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              );
            },
            code(props) {
              const { children, className, node, ...rest } = props;
              const match = /language-(\w+)/.exec(className || "");
              const language = match ? match[1] : "";
              const isInline = !match;

              if (isInline) {
                return (
                  <code {...rest} className={className}>
                    {children}
                  </code>
                );
              }

              const codeString = String(children).replace(/\n$/, "");

              return <CodeBlock language={language} value={codeString} />;
            },
          }}
        >
          {content}
        </Markdown>
      </div>

      {previewImage && createPortal(
        <div 
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setPreviewImage(null)}
        >
          <button 
            className="absolute top-4 right-4 text-white p-2.5 bg-slate-800/80 rounded-full hover:bg-slate-700 transition-colors shadow-lg"
            onClick={() => setPreviewImage(null)}
            title="إغلاق"
          >
            <X className="w-6 h-6" />
          </button>
          <button 
            className="absolute top-4 right-16 text-white p-2.5 bg-blue-600/80 rounded-full hover:bg-blue-600 transition-colors shadow-lg"
            onClick={(e) => {
              e.stopPropagation();
              downloadImage(previewImage);
            }}
            title="تحميل الصورة"
          >
            <Download className="w-6 h-6" />
          </button>
          <img 
            src={previewImage} 
            className="max-w-[95vw] max-h-[90vh] object-contain rounded-lg shadow-2xl" 
            onClick={(e) => e.stopPropagation()}
            alt="Preview"
          />
        </div>,
        document.body
      )}
    </>
  );
}

function CodeBlock({ language, value }: { language: string; value: string }) {
  const [hasCopied, setHasCopied] = React.useState(false);

  const onCopy = React.useCallback(() => {
    navigator.clipboard.writeText(value);
    setHasCopied(true);
    setTimeout(() => {
      setHasCopied(false);
    }, 2000);
  }, [value]);

  const onDownload = React.useCallback(() => {
    const blob = new Blob([value], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = language ? `file.${language}` : "file.txt";
    a.click();
    URL.revokeObjectURL(url);
  }, [value, language]);

  return (
    <div className="relative my-4 flex flex-col rounded-xl border border-slate-700 bg-slate-900/50 overflow-hidden shadow-lg shadow-black/20">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700 text-slate-400 text-xs font-mono">
        <span>{language || "text"}</span>
        <div className="flex items-center gap-3">
          <button
            onClick={onCopy}
            className="flex items-center gap-1.5 hover:text-slate-100 transition-colors"
          >
            {hasCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{hasCopied ? "Copied!" : "Copy"}</span>
          </button>
          <button
            onClick={onDownload}
            className="flex items-center gap-1.5 hover:text-slate-100 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download</span>
          </button>
        </div>
      </div>
      <div className="p-4 overflow-x-auto text-sm">
        <SyntaxHighlighter
          {...{
            language,
            style: vscDarkPlus,
            PreTag: "div",
            customStyle: {
              margin: 0,
              padding: 0,
              background: "transparent",
            },
            codeTagProps: {
              style: {
                fontFamily: "var(--font-mono)",
                fontSize: "13px",
              },
            },
          }}
        >
          {value}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
