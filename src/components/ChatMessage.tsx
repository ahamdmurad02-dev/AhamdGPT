import React from "react";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { motion } from "motion/react";
import { Part } from "@google/genai";

interface ChatMessageProps {
  role: "user" | "model";
  content?: string;
  parts?: Part[];
}

function removeEmojis(text: string) {
  return text.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '');
}

export function ChatMessage({ role, content, parts }: ChatMessageProps) {
  const isAssistant = role === "model";
  
  const textContent = removeEmojis(content || parts?.map(p => p.text || "").join("") || "");

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex w-full py-4 px-4 md:px-8 max-w-4xl mx-auto"
    >
      {isAssistant ? (
        <div className="flex justify-start items-start gap-4 w-full">
          <div className="w-8 h-8 bg-slate-700 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-bold text-white">AI</div>
          <div className="max-w-[85%] md:max-w-[80%] bg-slate-800/50 border border-slate-700 p-4 md:p-6 rounded-2xl rounded-tl-none relative group">
            <div className="text-slate-300 leading-relaxed text-sm md:text-base mb-2" dir="auto">
              <MarkdownRenderer content={textContent} />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex justify-end w-full">
          <div className="max-w-[85%] md:max-w-[70%] bg-blue-600 text-white p-4 rounded-2xl rounded-tr-none shadow-lg shadow-blue-900/20 flex flex-col gap-3">
            {parts?.map((part, index) => {
              if (part.inlineData) {
                const isImage = part.inlineData.mimeType.startsWith("image/");
                const isVideo = part.inlineData.mimeType.startsWith("video/");
                
                if (isImage) {
                  return (
                    <img 
                      key={index} 
                      src={`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`} 
                      alt="attachment" 
                      className="max-w-full rounded-xl"
                    />
                  );
                } else if (isVideo) {
                  return (
                    <video 
                      key={index} 
                      src={`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`} 
                      controls
                      className="max-w-full rounded-xl"
                    />
                  );
                } else {
                  return (
                    <div key={index} className="flex items-center justify-between bg-blue-700/50 p-3 rounded-lg border border-blue-500/30">
                      <span className="text-sm font-medium truncate max-w-[200px]" title="File">
                        File Attachment
                      </span>
                      <a 
                        download="attachment"
                        href={`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`}
                        className="text-xs bg-blue-500 hover:bg-blue-400 px-3 py-1.5 rounded-md transition-colors"
                      >
                        Download
                      </a>
                    </div>
                  );
                }
              }
              if (part.text) {
                return <div key={index} className="text-[15px] leading-relaxed text-right whitespace-pre-wrap" dir="auto">{removeEmojis(part.text)}</div>;
              }
              return null;
            }) || (
              <div className="text-[15px] leading-relaxed text-right whitespace-pre-wrap" dir="auto">{textContent}</div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
