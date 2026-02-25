import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bot, Send, User } from "lucide-react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Message = {
  role: "agent" | "user";
  content: string;
};

export default function AgentInteraction() {
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: "agent", 
      content: "Hello. I am the Rental Rights Assistant. I can help you identify legal violations in your lease or maintenance situation. Briefly describe your issue." 
    }
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    
    const newMessages = [
      ...messages, 
      { role: "user", content: input } as Message
    ];
    setMessages(newMessages);
    setInput("");

    // Simulate agent response
    setTimeout(() => {
      setMessages([
        ...newMessages,
        { 
          role: "agent", 
          content: "I understand. Based on what you've described, this may be a violation of the 'Implied Warranty of Habitability'. Would you like me to draft a formal demand letter citing this statute?" 
        } as Message
      ]);
    }, 1500);
  };

  return (
    <div className="container mx-auto px-4 py-8 h-[calc(100vh-140px)] flex flex-col max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">AI Rights Agent</h1>
        <p className="text-slate-600">Get immediate answers about your tenancy rights.</p>
      </div>

      <div className="flex-1 glass-card rounded-xl overflow-hidden flex flex-col shadow-xl">
        <ScrollArea className="flex-1 p-6 bg-slate-50/50">
          <div className="space-y-6">
            {messages.map((m, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={i} 
                className={`flex gap-4 ${m.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <Avatar className="h-10 w-10 border border-slate-200">
                  {m.role === "agent" ? (
                    <div className="bg-slate-800 w-full h-full flex items-center justify-center text-white">
                      <Bot size={20} />
                    </div>
                  ) : (
                    <div className="bg-white w-full h-full flex items-center justify-center text-slate-700">
                      <User size={20} />
                    </div>
                  )}
                </Avatar>
                
                <div className={`p-4 rounded-xl max-w-[80%] text-sm leading-relaxed shadow-sm ${
                  m.role === "agent" 
                    ? "bg-white border border-slate-200 text-slate-800" 
                    : "bg-slate-800 text-white"
                }`} style={{ fontFamily: 'var(--font-chat)' }}>
                  {m.role === "agent" ? (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>,
                        ul: ({children}) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
                        ol: ({children}) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
                        li: ({children}) => <li className="mb-1">{children}</li>,
                        strong: ({children}) => <strong className="font-bold">{children}</strong>,
                        table: ({children}) => (
                          <div className="overflow-x-auto my-3 rounded-lg border border-slate-200">
                            <table className="min-w-full text-sm border-collapse">{children}</table>
                          </div>
                        ),
                        thead: ({children}) => <thead className="bg-slate-100">{children}</thead>,
                        tbody: ({children}) => <tbody>{children}</tbody>,
                        tr: ({children}) => <tr className="border-b border-slate-200">{children}</tr>,
                        th: ({children}) => <th className="px-3 py-2 text-left font-semibold bg-slate-100 border-b border-slate-200 whitespace-nowrap">{children}</th>,
                        td: ({children}) => <td className="px-3 py-2 border-b border-slate-100 whitespace-nowrap">{children}</td>,
                      }}
                    >
                      {m.content}
                    </ReactMarkdown>
                  ) : (
                    m.content
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </ScrollArea>

        <div className="p-4 bg-white border-t border-slate-200 flex gap-3">
          <Input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your issue (e.g., 'My AC has been broken for 2 weeks')..." 
            className="flex-1 h-12 bg-slate-50 border-slate-200 focus-visible:ring-slate-400"
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <Button onClick={handleSend} size="icon" className="h-12 w-12 bg-slate-900 hover:bg-slate-800">
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
