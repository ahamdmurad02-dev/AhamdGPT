import React, { useRef, useEffect, useState } from "react";
import { Send, Square, Paperclip, X } from "lucide-react";
import { cn } from "@/src/lib/utils";

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  onSubmit: (imageBase64?: string | null, mimeType?: string | null) => void;
  isLoading: boolean;
  onStop: () => void;
}

export function ChatInput({ input, setInput, onSubmit, isLoading, onStop }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<{ url: string; base64: string; mimeType: string, name: string } | null>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if ((input.trim() || selectedFile) && !isLoading) {
        handleSubmitClick();
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        const base64Data = result.split(',')[1];
        setSelectedFile({ url: result, base64: base64Data, mimeType: file.type, name: file.name });
      };
      reader.readAsDataURL(file);
    }
    if (e.target) {
      e.target.value = '';
    }
  };

  const handleSubmitClick = () => {
    onSubmit(selectedFile ? selectedFile.base64 : null, selectedFile ? selectedFile.mimeType : null);
    setSelectedFile(null);
  };

  const renderFilePreview = () => {
    if (!selectedFile) return null;
    const isImage = selectedFile.mimeType.startsWith("image/");
    const isVideo = selectedFile.mimeType.startsWith("video/");

    return (
      <div className="mb-3 px-2">
        <div className="relative inline-block group">
          {isImage ? (
            <img 
              src={selectedFile.url} 
              alt="Attached preview" 
              className="h-20 w-20 object-cover rounded-xl border-2 border-slate-700 shadow-md"
            />
          ) : isVideo ? (
            <video 
              src={selectedFile.url} 
              className="h-20 w-auto max-w-[150px] object-cover rounded-xl border-2 border-slate-700 shadow-md"
            />
          ) : (
            <div className="h-20 w-32 bg-slate-800 rounded-xl border-2 border-slate-700 shadow-md flex flex-col items-center justify-center p-2">
              <span className="text-xs text-slate-300 text-center truncate w-full" title={selectedFile.name}>
                {selectedFile.name}
              </span>
            </div>
          )}
          <button
            onClick={() => setSelectedFile(null)}
            className="absolute -top-2 -right-2 bg-slate-800 text-white rounded-full p-1 border border-slate-600 shadow-sm opacity-100 transition-all hover:bg-slate-700 hover:scale-110"
            title="Remove file"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-4 md:px-6 relative">
      {renderFilePreview()}
      <div className="bg-[#1E293B] border border-slate-700 rounded-2xl p-2 shadow-2xl flex items-center gap-2">
        <input 
          type="file" 
          accept="*/*" 
          className="hidden" 
          ref={fileInputRef} 
          onChange={handleFileSelect}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-3 text-slate-400 hover:text-white transition-colors flex-shrink-0 rounded-xl hover:bg-slate-800"
          title="Upload Image"
          disabled={isLoading}
        >
          <Paperclip className="h-5 w-5" />
        </button>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          dir="auto"
          placeholder="اكتب سؤالك هنا للنقاش أو البرمجة أو توليد Prompts..."
          className="flex-1 bg-transparent border-none focus:ring-0 text-slate-200 outline-none text-sm py-2 px-2 resize-none max-h-[200px]"
          rows={1}
          autoFocus
        />
        
        {isLoading ? (
          <button
            onClick={onStop}
            className="bg-slate-700 text-white p-3 rounded-xl hover:bg-slate-600 transition-all flex items-center justify-center flex-shrink-0"
          >
            <Square className="h-5 w-5 fill-current" />
          </button>
        ) : (
          <button
            onClick={handleSubmitClick}
            disabled={(!input.trim() && !selectedFile)}
            className={cn(
              "p-3 rounded-xl transition-all flex items-center justify-center flex-shrink-0",
              (input.trim() || selectedFile)
                ? "bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-600/30"
                : "bg-slate-800 text-slate-500"
            )}
          >
            <Send className="h-5 w-5" />
          </button>
        )}
      </div>
      <div className="flex justify-center mt-3 gap-6">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
          <span className="text-[10px] text-slate-500 uppercase tracking-tighter">Safe Mode Enabled</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span className="text-[10px] text-slate-500 uppercase tracking-tighter">AhamdGPT Ready</span>
        </div>
      </div>
    </div>
  );
}
