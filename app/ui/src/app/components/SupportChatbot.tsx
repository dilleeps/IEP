import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/app/providers/AuthProvider";
import { useLanguage } from "@/app/providers/LanguageProvider";
import { config } from "@/lib/config";
import {
  MessageCircle,
  X,
  Send,
  Ticket,
  Loader2,
  CheckCircle,
  Bot,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatMessage {
  id: string;
  role: "user" | "bot";
  text: string;
  timestamp: Date;
}

const FAQ_RESPONSES: Record<string, string> = {
  upload:
    'To upload an IEP, go to "IEP Analyzer" in the sidebar and click "Upload IEP". Select your PDF file and the AI will extract goals, services, and accommodations automatically.',
  goal: 'Goal progress is tracked on the "Goal Progress" page. Expected progress is calculated from your IEP dates. You can update actual progress manually or upload a newer IEP document.',
  letter:
    'The Letter Writer lets you generate professional advocacy letters. Go to "Letter Writer" in the sidebar, click "New Letter", select a template, and the AI will personalize it with your child\'s IEP data.',
  plan: "AskIEP offers 3 plans: Informed Parent (free), Prepared Parent ($9.99/mo), and Protected Parent ($29.99/mo). Visit the Billing page to compare and upgrade.",
  billing:
    "Manage your subscription from the Billing page. You can view your current plan, compare tiers, and upgrade using a secure Stripe checkout.",
  consultation:
    "Book an expert consultation from the Expert Consultation page. Browse available time slots, select one, and you'll receive a calendar invite with a Google Meet link.",
  password:
    'Go to Settings > Change Password. Enter your current password, then your new password (min 8 chars, uppercase, lowercase, and a number).',
  language:
    "Click the globe icon in the top navigation bar to switch between English and Spanish instantly.",
  compliance:
    "Use the Service Delivery Tracking page to monitor whether IEP services are being provided as planned. Log sessions, track missed appointments, and generate delivery reports.",
  contact:
    "Use the Contact Log to record every communication with school staff. Include date, person, method, and notes to build an organized communication record.",
  advocacy:
    "The Advocacy Lab simulates IEP meetings using AI. Practice your responses, get feedback, and prepare talking points based on your child's actual IEP data.",
  cancel:
    "You can cancel a booked consultation from the Expert Consultation page. The time slot will be released and you can rebook at a different time.",
  data: "Your data is secure. AskIEP uses Firebase Authentication, encrypts data in transit and at rest, and follows IDEA privacy requirements.",
  profile:
    "Your child's profile is auto-created when you upload an IEP. You can also manually create or edit profiles from the Child Profile page.",
};

function findBestResponse(message: string): string | null {
  const lower = message.toLowerCase();
  const keywords: [string[], string][] = [
    [["upload", "iep", "pdf", "document", "file"], "upload"],
    [["goal", "progress", "track", "expected"], "goal"],
    [["letter", "write", "draft", "formal"], "letter"],
    [["plan", "tier", "subscription", "free"], "plan"],
    [["bill", "payment", "pay", "upgrade", "stripe", "price"], "billing"],
    [["consult", "expert", "book", "appointment", "meet"], "consultation"],
    [["password", "change password", "reset"], "password"],
    [["language", "spanish", "english", "translate"], "language"],
    [["compliance", "idea", "service delivery"], "compliance"],
    [["contact", "log", "communication", "school"], "contact"],
    [["advocacy", "lab", "practice", "meeting", "simulate"], "advocacy"],
    [["cancel", "reschedule"], "cancel"],
    [["data", "secure", "privacy", "safe"], "data"],
    [["profile", "child", "school name"], "profile"],
  ];

  let bestMatch: string | null = null;
  let bestScore = 0;

  for (const [keys, responseKey] of keywords) {
    let score = 0;
    for (const kw of keys) {
      if (lower.includes(kw)) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = responseKey;
    }
  }

  return bestMatch && bestScore > 0
    ? FAQ_RESPONSES[bestMatch] ?? null
    : null;
}

export function SupportChatbot() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");
  const [ticketSending, setTicketSending] = useState(false);
  const [ticketSent, setTicketSent] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          role: "bot",
          text:
            t.help?.chatWelcome ??
            "Hi! I'm AskIEP Support Bot. Ask me anything about using the platform, or raise a support ticket if you need personalized help.",
          timestamp: new Date(),
        },
      ]);
    }
  }, [isOpen]);

  const addBotMessage = (text: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `bot-${Date.now()}`,
        role: "bot",
        text,
        timestamp: new Date(),
      },
    ]);
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: input.trim(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    // Find FAQ response
    setTimeout(() => {
      const response = findBestResponse(userMsg.text);
      if (response) {
        addBotMessage(response);
      } else {
        addBotMessage(
          t.help?.chatNoMatch ??
            "I'm not sure about that. You can browse our FAQ on the Help page, or raise a support ticket for personalized assistance."
        );
      }
    }, 500);
  };

  const handleSubmitTicket = async () => {
    if (!ticketSubject.trim() || !ticketMessage.trim()) return;
    setTicketSending(true);

    try {
      const token = sessionStorage.getItem("askiep.session");
      const session = token ? JSON.parse(token) : null;

      await fetch(config.api.resolveUrl("/api/v1/support/ticket"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.accessToken
            ? { Authorization: `Bearer ${session.accessToken}` }
            : {}),
        },
        body: JSON.stringify({
          subject: ticketSubject,
          message: ticketMessage,
          userEmail: user?.email ?? "anonymous",
          userName: user?.displayName ?? "Anonymous User",
        }),
      });

      setTicketSent(true);
      setTicketSubject("");
      setTicketMessage("");
      addBotMessage(
        t.help?.ticketSent ??
          "Your support ticket has been submitted! Our team will get back to you via email within 24 hours."
      );
      setTimeout(() => {
        setShowTicketForm(false);
        setTicketSent(false);
      }, 2000);
    } catch {
      addBotMessage(
        t.help?.ticketFailed ??
          "Failed to submit ticket. Please try again or email dilleeps@gmail.com directly."
      );
    } finally {
      setTicketSending(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all hover:scale-105"
        title={t.help?.chatTitle ?? "Support Chat"}
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col w-[380px] max-h-[520px] rounded-xl border bg-background shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between bg-primary px-4 py-3 text-primary-foreground">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          <span className="font-semibold text-sm">
            {t.help?.chatTitle ?? "AskIEP Support"}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              setShowTicketForm(true);
              setTicketSent(false);
            }}
            className="rounded-md p-1.5 hover:bg-primary-foreground/20 transition-colors"
            title={t.help?.raiseTicket ?? "Raise a Ticket"}
          >
            <Ticket className="h-4 w-4" />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-md p-1.5 hover:bg-primary-foreground/20 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Ticket Form */}
      {showTicketForm && (
        <div className="border-b bg-muted/50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-1.5">
              <Ticket className="h-4 w-4" />
              {t.help?.raiseTicket ?? "Raise a Support Ticket"}
            </h3>
            <button
              onClick={() => setShowTicketForm(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          {ticketSent ? (
            <div className="flex items-center gap-2 text-emerald-600 text-sm">
              <CheckCircle className="h-4 w-4" />
              {t.help?.ticketSuccess ?? "Ticket submitted successfully!"}
            </div>
          ) : (
            <>
              <input
                type="text"
                placeholder={t.help?.ticketSubject ?? "Subject"}
                value={ticketSubject}
                onChange={(e) => setTicketSubject(e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
              />
              <textarea
                placeholder={
                  t.help?.ticketDesc ??
                  "Describe your issue or question..."
                }
                value={ticketMessage}
                onChange={(e) => setTicketMessage(e.target.value)}
                rows={3}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              />
              <Button
                size="sm"
                onClick={handleSubmitTicket}
                disabled={
                  ticketSending ||
                  !ticketSubject.trim() ||
                  !ticketMessage.trim()
                }
                className="w-full"
              >
                {ticketSending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    {t.help?.submitting ?? "Submitting..."}
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5 mr-1.5" />
                    {t.help?.submitTicket ?? "Submit Ticket"}
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px] max-h-[320px]">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "bot" && (
              <div className="flex-shrink-0 h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="h-3.5 w-3.5 text-primary" />
              </div>
            )}
            <div
              className={`max-w-[75%] rounded-lg px-3 py-2 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              }`}
            >
              {msg.text}
            </div>
            {msg.role === "user" && (
              <div className="flex-shrink-0 h-7 w-7 rounded-full bg-muted flex items-center justify-center">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t.help?.chatPlaceholder ?? "Ask a question..."}
            className="flex-1 rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
          />
          <Button type="submit" size="icon" variant="default" disabled={!input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
