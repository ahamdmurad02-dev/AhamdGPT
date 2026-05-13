import React, { useState, useRef, useEffect } from "react";
import { Content, Part } from "@google/genai";
import { sendMessageStream } from "./services/geminiService";
import { ChatMessage } from "./components/ChatMessage";
import { ChatInput } from "./components/ChatInput";
import { Terminal, Plus, LogOut } from "lucide-react";
import { auth, loginWithGoogle, logout, loginWithEmail, registerWithEmail } from "./services/firebase";
import { onAuthStateChanged, User } from "firebase/auth";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [messages, setMessages] = useState<Content[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentResponse, setCurrentResponse] = useState("");
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [authError, setAuthError] = useState("");
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthChecking(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, currentResponse]);

  const handleLogin = async () => {
    try {
      setAuthError("");
      setIsAuthLoading(true);
      await loginWithGoogle();
    } catch (error: any) {
      console.error(error);
      setAuthError(error.message || "Failed to sign in with Google");
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setIsAuthLoading(true);
    
    try {
      if (isLoginMode) {
        await loginWithEmail(email, password);
      } else {
        await registerWithEmail(email, password);
      }
    } catch (error: any) {
      console.error(error);
      setAuthError(error.message || "Authentication failed");
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleSubmit = async (imageBase64?: string | null, mimeType?: string | null) => {
    if ((!input.trim() && !imageBase64) || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    
    // Add the image to the genai structure if present
    const imagePart = imageBase64 && mimeType 
      ? { inlineData: { data: imageBase64, mimeType } } 
      : null;

    const newParts: Part[] = [];
    if (userMessage) newParts.push({ text: userMessage });
    if (imagePart) newParts.push(imagePart);

    // Add user message to history
    const updatedHistory: Content[] = [...messages, { role: "user", parts: newParts }];
    setMessages(updatedHistory);
    setIsLoading(true);
    setCurrentResponse("");

    try {
      await sendMessageStream(
        messages,
        userMessage,
        imagePart,
        (chunk) => {
          setCurrentResponse((prev) => prev + chunk);
        },
        (fullText) => {
          setMessages((prev) => [
            ...prev,
            { role: "model", parts: [{ text: fullText }] }
          ]);
          setCurrentResponse("");
          setIsLoading(false);
        },
        (error) => {
          console.error("Error generating response", error);
          setMessages((prev) => [
            ...prev,
            { role: "model", parts: [{ text: "```text\nAn error occurred while generating the response. Please try again.\n```" }] }
          ]);
          setCurrentResponse("");
          setIsLoading(false);
        }
      );
    } catch (error) {
      setIsLoading(false);
    }
  };

  const handleStop = () => {
    setIsLoading(false);
    if (currentResponse) {
      setMessages((prev) => [
        ...prev,
        { role: "model", parts: [{ text: currentResponse }] }
      ]);
      setCurrentResponse("");
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setCurrentResponse("");
    setInput("");
    setIsLoading(false);
  };

  if (authChecking) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0B0E14] text-slate-200">
        <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0B0E14] text-slate-200 font-sans">
        <div className="max-w-md w-full p-8 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col items-center">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-600/20">
            <span className="text-3xl font-bold text-white tracking-widest pl-1">A</span>
          </div>
          <h1 className="text-2xl font-bold mb-2">Welcome to AhamdGPT</h1>
          <p className="text-slate-400 text-center mb-6">
            Your intelligent assistant for coding, design prompts, and more. Log in to start creating.
          </p>

          {authError && (
            <div className="w-full mb-4 p-3 rounded bg-red-900/30 border border-red-800 text-red-300 text-sm">
              {authError}
            </div>
          )}

          <form onSubmit={handleEmailAuth} className="w-full flex flex-col gap-4 mb-6">
            <div>
              <label className="text-xs text-slate-400 font-bold mb-1 block uppercase">Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 font-bold mb-1 block uppercase">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
            <button 
              type="submit"
              disabled={isAuthLoading}
              className="w-full py-3 px-4 mt-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isAuthLoading ? "Please wait..." : (isLoginMode ? "Sign In" : "Create Account")}
            </button>
          </form>

          <div className="w-full flex items-center gap-4 mb-6">
            <div className="h-px bg-slate-800 flex-1"></div>
            <span className="text-xs text-slate-500 uppercase font-semibold">Or continue with</span>
            <div className="h-px bg-slate-800 flex-1"></div>
          </div>

          <button 
            onClick={handleLogin}
            disabled={isAuthLoading}
            type="button"
            className="w-full py-3 px-4 bg-white text-slate-900 rounded-xl font-bold hover:bg-slate-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google
          </button>

          <p className="mt-6 text-sm text-slate-400">
            {isLoginMode ? "Don't have an account? " : "Already have an account? "}
            <button 
              onClick={() => setIsLoginMode(!isLoginMode)}
              className="text-blue-500 hover:text-blue-400 font-semibold"
              type="button"
            >
              {isLoginMode ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#0B0E14] text-slate-200 font-sans">
      {/* Sidebar - hidden on mobile, visible on md */}
      <aside className="hidden md:flex w-72 bg-[#151921] border-r border-slate-800 flex-col">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="font-bold text-white">A</span>
            </div>
            <h1 className="text-xl font-semibold tracking-tight">AhamdGPT <span className="text-blue-500">Pro Ultra</span></h1>
          </div>
        </div>
        <div className="flex-1 p-4 overflow-hidden">
          <button 
            onClick={startNewChat}
            className="w-full py-2.5 mb-6 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-colors text-white"
          >
            <span>+ New Chat</span>
          </button>
          
          <nav className="space-y-4">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-2">Recent History</div>
            {messages.length > 0 ? (
              <div className="px-3 py-2 bg-slate-800/50 border-l-2 border-blue-500 rounded-r-lg text-sm text-slate-200 cursor-pointer truncate" dir="auto">
                {messages[0]?.parts?.[0]?.text || "Chat Session"}
              </div>
            ) : (
              <div className="px-3 py-2 text-slate-500 text-sm italic">
                No recent chats
              </div>
            )}
          </nav>
        </div>
        
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 bg-slate-800/40 p-3 rounded-xl">
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName || "User"} className="w-10 h-10 rounded-full" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-emerald-400 flex items-center justify-center font-bold text-white uppercase">
                {user.email?.charAt(0) || "U"}
              </div>
            )}
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-sm font-medium text-white truncate">{user.displayName || user.email}</span>
              <span className="text-[10px] text-emerald-400 font-mono leading-tight mt-0.5">PRO SUBSCRIPTION</span>
            </div>
            <button onClick={logout} className="text-slate-500 hover:text-slate-300 transition-colors ml-auto p-1" title="Sign Out">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative w-full">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-4 md:px-8 bg-[#0B0E14]/80 backdrop-blur-md z-10 w-full relative">
          <div className="flex items-center gap-4">
            <div className="md:hidden flex items-center gap-2 mr-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="font-bold text-white tracking-widest pl-0.5">A</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] sm:text-xs font-mono text-slate-400 truncate">WEB SEARCH INTEGRATION ACTIVE</span>
            </div>
          </div>
        </header>

        {/* Chat Content */}
        <div className="flex-1 overflow-y-auto scroll-smooth">
          {messages.length === 0 && !isLoading && !currentResponse ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-[#0B0E14] relative overflow-hidden">
              {/* Background elements */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] opacity-[0.10] pointer-events-none">
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-600 to-emerald-600 blur-3xl filter" />
              </div>
              
              <div className="relative z-10 flex flex-col items-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl mb-6 ring-1 ring-blue-500/20">
                  <Terminal className="h-8 w-8 text-emerald-400" />
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-br from-slate-100 to-slate-400 bg-clip-text text-transparent mb-3">
                  كيف يمكنني مساعدتك اليوم؟
                </h1>
                <p className="text-slate-400 max-w-md mx-auto mb-8 text-sm md:text-base leading-relaxed">
                  أنا رفيقك في البرمجة والتطوير. جاهز لكتابة الأكواد، طرح الأفكار، أو تقديم أحدث المعلومات.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl px-4">
                  {[
                    "اكتب كود React لإنشاء واجهة Dashboard",
                    "أريد فكرة مشروع تخرج معمارية باستخدام Python",
                    "كيف أربط Firebase مع تطبيقي؟",
                    "أعطني Prompt لـ Midjourney لصورة مدينة مستقبلي"
                  ].map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setInput(suggestion);
                      }}
                      className="flex text-right flex-col p-4 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-800 hover:border-slate-700 transition-all text-sm text-slate-300 hover:text-slate-100"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="pb-40 pt-4 flex flex-col space-y-2">
              {messages.map((message, idx) => (
                <ChatMessage 
                  key={idx} 
                  role={message.role as "user" | "model"} 
                  parts={message.parts} 
                />
              ))}
              
              {currentResponse && (
                <ChatMessage role="model" content={currentResponse} />
              )}
              
              {isLoading && !currentResponse && (
                <div className="flex w-full py-4 px-4 md:px-8 max-w-4xl mx-auto">
                  <div className="flex justify-start items-start gap-4 w-full">
                    <div className="w-8 h-8 bg-slate-700 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-bold text-white">AI</div>
                    <div className="max-w-[85%] md:max-w-[80%] bg-slate-800/50 border border-slate-700 p-4 md:p-6 rounded-2xl rounded-tl-none">
                      <div className="flex gap-1 items-center h-full">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={bottomRef} className="h-px" />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="absolute bottom-0 left-0 right-0 pt-10 pb-6 px-4 md:px-6 bg-gradient-to-t from-[#0B0E14] via-[#0B0E14]/95 to-transparent pointer-events-none z-10 w-full flex justify-center">
          <div className="pointer-events-auto max-w-4xl w-full flex flex-col items-center">
            {/* Quick Actions */}
            <div className="flex flex-wrap justify-center gap-2 mb-3 w-full">
              <button
                onClick={startNewChat}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-full text-xs font-medium border border-slate-700/50 backdrop-blur-sm transition-colors"
              >
                <span>✨</span> New Chat
              </button>
              <button
                onClick={() => setInput("أحتاج مساعدة في كتابة كود: ")}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-full text-xs font-medium border border-slate-700/50 backdrop-blur-sm transition-colors"
              >
                <span>💻</span> Code
              </button>
              <button
                onClick={() => setInput("أريد تصميم صورة تحتوي على: ")}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-full text-xs font-medium border border-slate-700/50 backdrop-blur-sm transition-colors"
              >
                <span>🎨</span> Image
              </button>
              <button
                onClick={() => setInput("اكتب لي Prompt احترافي لـ ")}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-full text-xs font-medium border border-slate-700/50 backdrop-blur-sm transition-colors"
              >
                <span>🧠</span> Prompt
              </button>
              <button
                onClick={() => setInput("أعطني فكرة مشروع برمجي جديد ")}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-full text-xs font-medium border border-slate-700/50 backdrop-blur-sm transition-colors"
              >
                <span>🚀</span> Idea
              </button>
            </div>
            
            <div className="w-full">
              <ChatInput 
                input={input}
                setInput={setInput}
                onSubmit={handleSubmit}
                isLoading={isLoading}
                onStop={handleStop}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
