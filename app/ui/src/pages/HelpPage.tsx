import { useState } from "react";
import { useLanguage } from "@/app/providers/LanguageProvider";
import { useAuth } from "@/app/providers/AuthProvider";
import {
  ChevronDown,
  ChevronUp,
  FileText,
  Target,
  Mail,
  Shield,
  UserCircle,
  CreditCard,
  MessageSquare,
  HelpCircle,
} from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const FAQ_DATA: FAQItem[] = [
  // Getting Started
  {
    category: "Getting Started",
    question: "How do I upload my child's IEP?",
    answer:
      'Navigate to "IEP Analyzer" from the sidebar, click "Upload IEP", and select your PDF file. The AI will automatically extract goals, services, accommodations, and school information from the document.',
  },
  {
    category: "Getting Started",
    question: "How is my child's profile created?",
    answer:
      "When you upload an IEP document, AskIEP automatically creates a child profile with extracted information including school name, district, address, and contact details. You can also manually create or edit a profile from the Child Profile page.",
  },
  {
    category: "Getting Started",
    question: "What file formats are supported for IEP upload?",
    answer:
      "AskIEP supports PDF and DOCX file formats. For best results, upload a clear, text-based PDF rather than a scanned image.",
  },
  // Goal Tracking
  {
    category: "Goal Tracking",
    question: "How is goal progress calculated?",
    answer:
      'Goal progress is based on the objectives defined in your child\'s most recent Annual IEP. The "expected progress" is calculated as the percentage of time elapsed between the IEP start and end dates. Actual progress is updated by you or your child\'s teacher.',
  },
  {
    category: "Goal Tracking",
    question: 'What does "behind expected" mean on my goal progress?',
    answer:
      "This means your child's actual progress percentage is lower than what would be expected based on the time elapsed in the IEP period. For example, if 60% of the IEP year has passed but only 40% progress is recorded, your child is 20% behind expected.",
  },
  // Letters & Advocacy
  {
    category: "Letters & Advocacy",
    question: "What types of letters can I generate?",
    answer:
      "You can generate IEP meeting requests, service dispute letters, progress report requests, accommodation requests, and more. The AI uses your child's profile and IEP data to personalize each letter.",
  },
  {
    category: "Letters & Advocacy",
    question: "How does the Advocacy Lab work?",
    answer:
      "The Advocacy Lab simulates IEP meetings and school conversations using AI. You can practice responding to different scenarios, receive feedback on your advocacy approach, and get suggested talking points based on your child's actual IEP data.",
  },
  // Compliance
  {
    category: "Compliance",
    question: "What is compliance tracking?",
    answer:
      "Service delivery tracking helps you monitor whether IEP services are being provided as planned. You can log service delivery, track missed sessions, and maintain organized records.",
  },
  {
    category: "Compliance",
    question: "How do I document school communications?",
    answer:
      'Use the Contact Log to record every call, email, and meeting with school staff. Include the date, contact person, method, and detailed notes. This creates an organized communication record for advocacy purposes.',
  },
  // Billing & Plans
  {
    category: "Billing & Plans",
    question: "What subscription plans are available?",
    answer:
      "AskIEP offers three tiers: Informed Parent (free) with basic IEP analysis and goal tracking, Prepared Parent with AI advocacy tools and unlimited letters, and Protected Parent with expert consultations and education rights resources.",
  },
  {
    category: "Billing & Plans",
    question: "How do I upgrade my plan?",
    answer:
      'Go to the Billing page from the sidebar, compare the plan tiers, and click "Upgrade" on your desired plan. You\'ll be taken to a secure Stripe checkout page to complete payment.',
  },
  {
    category: "Billing & Plans",
    question: "What is the early bird pricing?",
    answer:
      "Early bird pricing offers discounted rates for early subscribers. The regular prices are shown with a strikethrough next to the discounted price. This promotional pricing is available for a limited time.",
  },
  // Expert Consultations
  {
    category: "Expert Consultations",
    question: "How do I book an expert consultation?",
    answer:
      "Navigate to Expert Consultation from the sidebar, browse available time slots, select a date and time, and confirm your booking. You'll receive a calendar invite via email with a Google Meet link to join the session.",
  },
  {
    category: "Expert Consultations",
    question: "Can I cancel or reschedule a consultation?",
    answer:
      "Yes, you can cancel a booked consultation from the Expert Consultation page. The time slot will be released for others to book. You can then book a new slot at a different time.",
  },
  // Account & Settings
  {
    category: "Account & Settings",
    question: "How do I change the language?",
    answer:
      "Click the globe icon in the top navigation bar to toggle between English and Spanish. You can also change the language from the Settings page under Preferences.",
  },
  {
    category: "Account & Settings",
    question: "Is my data secure?",
    answer:
      "Yes. AskIEP uses Firebase Authentication for secure login, encrypts data in transit and at rest, and follows IDEA privacy requirements. Your child's information is never shared without your consent.",
  },
  {
    category: "Account & Settings",
    question: "How do I change my password?",
    answer:
      'Go to Settings from the sidebar, scroll to the "Change Password" section, enter your current password, then enter and confirm your new password. Passwords must be at least 8 characters with uppercase, lowercase, and a number.',
  },
];

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  "Getting Started": <FileText className="h-5 w-5" />,
  "Goal Tracking": <Target className="h-5 w-5" />,
  "Letters & Advocacy": <Mail className="h-5 w-5" />,
  Compliance: <Shield className="h-5 w-5" />,
  "Billing & Plans": <CreditCard className="h-5 w-5" />,
  "Expert Consultations": <UserCircle className="h-5 w-5" />,
  "Account & Settings": <MessageSquare className="h-5 w-5" />,
};

export function HelpPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const categories = Array.from(new Set(FAQ_DATA.map((f) => f.category)));
  const filtered = activeCategory
    ? FAQ_DATA.filter((f) => f.category === activeCategory)
    : FAQ_DATA;

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-4 md:p-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <HelpCircle className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">
            {t.help?.title ?? "Help Center"}
          </h1>
        </div>
        <p className="text-muted-foreground text-lg">
          {t.help?.subtitle ??
            "Find answers to common questions about AskIEP"}
        </p>
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2 justify-center">
        <button
          onClick={() => setActiveCategory(null)}
          className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            activeCategory === null
              ? "bg-primary text-primary-foreground"
              : "bg-muted hover:bg-muted/80 text-foreground"
          }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() =>
              setActiveCategory(activeCategory === cat ? null : cat)
            }
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              activeCategory === cat
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted/80 text-foreground"
            }`}
          >
            {CATEGORY_ICONS[cat]}
            {cat}
          </button>
        ))}
      </div>

      {/* FAQ Accordion */}
      <div className="space-y-3">
        {filtered.map((item, idx) => {
          const globalIdx = FAQ_DATA.indexOf(item);
          const isOpen = openIndex === globalIdx;
          return (
            <div
              key={globalIdx}
              className="rounded-lg border bg-card shadow-sm overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : globalIdx)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground">
                    {CATEGORY_ICONS[item.category]}
                  </span>
                  <div>
                    <p className="font-medium text-sm">{item.question}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.category}
                    </p>
                  </div>
                </div>
                {isOpen ? (
                  <ChevronUp className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                )}
              </button>
              {isOpen && (
                <div className="px-4 pb-4 pt-0">
                  <div className="ml-8 text-sm text-muted-foreground leading-relaxed border-t pt-3">
                    {item.answer}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Contact support card */}
      <div className="rounded-lg border bg-card p-6 text-center space-y-3">
        <h2 className="text-lg font-semibold">
          {t.help?.cantFindAnswer ?? "Can't find what you're looking for?"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t.help?.useChat ??
            "Use the support chat in the bottom-right corner to ask questions or raise a support ticket."}
        </p>
      </div>
    </div>
  );
}
