import { useNavigate } from "react-router-dom";
import { useAuth } from "@/app/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import logo from "@/logo.png";
import {
  FileSearch,
  Target,
  Mail,
  Scale,
  CheckSquare,
  Gavel,
  UserCircle,
  MessageSquare,
  ArrowRight,
  Heart,
  Shield,
  Lightbulb,
  GraduationCap,
  Users,
  Sparkles,
  ChevronDown,
  Phone,
  MapPin,
  Globe,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const FEATURES = [
  {
    icon: FileSearch,
    title: "IEP Analyzer",
    desc: "Upload and analyze your child's IEP document with AI-powered insights. Get plain-language explanations of goals, services, and accommodations.",
  },
  {
    icon: Target,
    title: "Goal Progress Tracking",
    desc: "Monitor your child's IEP goals over time. Visualize progress, set milestones, and stay on top of every benchmark.",
  },
  {
    icon: Mail,
    title: "Letter Writer",
    desc: "Generate professional, well-organized letters to schools and districts in seconds. Request evaluations, communicate effectively, and advocate with confidence.",
  },
  {
    icon: Scale,
    title: "Advocacy Lab",
    desc: "AI-powered advocacy coaching that helps you prepare for IEP meetings, understand your rights, and develop effective strategies.",
  },
  {
    icon: CheckSquare,
    title: "Service Delivery Tracker",
    desc: "Stay on top of IEP timelines and commitments. Log deadlines, track follow-ups, and monitor whether agreed-upon services are being delivered.",
  },
  {
    icon: Gavel,
    title: "Rights & Resources",
    desc: "Access AI-guided educational information on special education rights. Learn about IDEA, Section 504, and state-specific processes.",
  },
  {
    icon: UserCircle,
    title: "Expert Consultation",
    desc: "Book one-on-one sessions with special education experts who can review your child's IEP and provide personalized guidance.",
  },
  {
    icon: MessageSquare,
    title: "Contact Log",
    desc: "Keep a detailed record of every interaction with your child's school team. Timestamp emails, calls, and meetings so nothing falls through the cracks.",
  },
];

const STATS = [
  { value: "6.5M+", label: "Children with IEPs in the U.S." },
  { value: "70%", label: "Parents feel unprepared for IEP meetings" },
  { value: "50%", label: "IEPs may benefit from a closer review" },
  { value: "24/7", label: "AI-powered support available" },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const goToApp = () =>
    navigate(isAuthenticated ? "/dashboard" : "/login");

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* ── Navbar ─────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <img src={logo} alt="AskIEP" className="h-9 w-9" />
            <span className="text-xl font-bold" style={{ color: "#7FB89E" }}>
              AskIEP
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#mission" className="hover:text-foreground transition-colors">Mission</a>
            <a href="#impact" className="hover:text-foreground transition-colors">Impact</a>
            <a href="#about" className="hover:text-foreground transition-colors">About</a>
            <a href="#contact" className="hover:text-foreground transition-colors">Contact</a>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Button onClick={() => navigate("/dashboard")}>
                Go to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate("/login")}>
                  Sign In
                </Button>
                <Button onClick={() => navigate("/register")}>
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/10 pointer-events-none" />
        <div className="absolute top-20 right-0 w-96 h-96 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-accent/10 blur-3xl pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-6 py-24 md:py-36 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-8">
            <Sparkles className="h-4 w-4" />
            AI-Powered Special Education Advocacy
          </div>

          <h1 className="mx-auto max-w-4xl text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1]">
            Every Child Deserves the{" "}
            <span className="text-primary">Right Education</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg md:text-xl text-muted-foreground leading-relaxed">
            AskIEP empowers parents, advocates, and educators with AI-driven tools
            to navigate the special education process, understand IEP documents,
            and support every child's future.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="text-base px-8 py-6" onClick={goToApp}>
              Start For Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-base px-8 py-6"
              onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
            >
              See How It Works
              <ChevronDown className="ml-2 h-5 w-5" />
            </Button>
          </div>

          {/* Stats bar */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-primary">{s.value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────── */}
      <section id="features" className="py-24 bg-muted/30">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">
              Platform Features
            </p>
            <h2 className="mt-3 text-3xl md:text-4xl font-bold">
              Everything You Need to Advocate for Your Child
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              From analyzing IEP documents to booking expert consultations, AskIEP
              provides a comprehensive toolkit for special education advocacy.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="group rounded-xl border border-border bg-card p-6 transition-all hover:shadow-lg hover:border-primary/30 hover:-translate-y-1"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Vision / Mission / Purpose ─────────────────────────── */}
      <section id="mission" className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">
              Why We Exist
            </p>
            <h2 className="mt-3 text-3xl md:text-4xl font-bold">
              Our Vision, Mission &amp; Purpose
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {/* Vision */}
            <div className="relative rounded-2xl border border-border bg-card p-8 text-center overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary/50" />
              <div className="mx-auto mb-5 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Lightbulb className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold">Our Vision</h3>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                A world where every child with special needs receives a truly individualized,
                high-quality education — and no parent ever feels alone navigating the process.
              </p>
            </div>

            {/* Mission */}
            <div className="relative rounded-2xl border border-border bg-card p-8 text-center overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 to-primary" />
              <div className="mx-auto mb-5 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Shield className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold">Our Mission</h3>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                To democratize special education advocacy by putting AI-powered education rights information,
                document analysis, and expert guidance into the hands of every family — regardless
                of income or background.
              </p>
            </div>

            {/* Purpose */}
            <div className="relative rounded-2xl border border-border bg-card p-8 text-center overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary/50" />
              <div className="mx-auto mb-5 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Heart className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold">Our Purpose</h3>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Behind every IEP is a child with dreams. We exist to close the knowledge gap
                so parents can confidently collaborate with schools to secure the services,
                accommodations, and future their children deserve.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Impact / Future of Kids ────────────────────────────── */}
      <section id="impact" className="py-24 bg-muted/30">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-12 md:grid-cols-2 items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-primary">
                Shaping Tomorrow
              </p>
              <h2 className="mt-3 text-3xl md:text-4xl font-bold leading-tight">
                How AskIEP Is Impacting the Future of Children
              </h2>
              <p className="mt-6 text-muted-foreground leading-relaxed">
                The quality of a child's IEP directly shapes their educational trajectory,
                career readiness, and life outcomes. Yet many parents need additional support
                and resources to fully participate in the IEP process.
              </p>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                AskIEP changes this by making advocacy accessible. When parents are informed
                and empowered, the entire IEP team works better together — and children receive
                the services that unlock their full potential.
              </p>

              <div className="mt-8 space-y-4">
                {[
                  "Better IEPs lead to better outcomes — academically, socially, and emotionally",
                  "Early identification of gaps helps ensure services are delivered on time",
                  "Informed parents strengthen the IEP team, uplifting entire communities",
                  "Data-driven progress tracking keeps children on the path to independence",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <div className="mt-1 flex-shrink-0 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
                      <ArrowRight className="h-3 w-3 text-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Visual card stack */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-border bg-card p-6 text-center shadow-sm">
                <GraduationCap className="mx-auto h-10 w-10 text-primary mb-3" />
                <p className="text-2xl font-bold text-primary">3x</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Higher graduation rates with proper IEP services
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card p-6 text-center shadow-sm mt-6">
                <Users className="mx-auto h-10 w-10 text-primary mb-3" />
                <p className="text-2xl font-bold text-primary">1 in 7</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Students receive special education services
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card p-6 text-center shadow-sm">
                <Shield className="mx-auto h-10 w-10 text-primary mb-3" />
                <p className="text-2xl font-bold text-primary">IDEA</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Federal special education services guarantee a free appropriate education
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card p-6 text-center shadow-sm mt-6">
                <Heart className="mx-auto h-10 w-10 text-primary mb-3" />
                <p className="text-2xl font-bold text-primary">100%</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Every child deserves a champion in their corner
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── About Us ───────────────────────────────────────────── */}
      <section id="about" className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">
              About Us
            </p>
            <h2 className="mt-3 text-3xl md:text-4xl font-bold">
              Built by Parents, for Parents
            </h2>
            <p className="mt-6 text-muted-foreground leading-relaxed">
              AskIEP was born from lived experience. Our founders navigated the special education
              process firsthand and understood how complex it can be for families. We saw that
              parents who have access to the right information and resources are better equipped
              to partner with schools on their child's behalf.
            </p>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              That's why we built AskIEP — an AI-powered platform that gives every parent
              the knowledge of a special education expert, the tools of a professional advocate,
              and the support of a caring community. Because every family deserves the resources
              to be an effective partner in their child's education.
            </p>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Our team combines expertise in special education services, artificial intelligence,
              and product design to build tools that are powerful yet simple enough for any parent
              to use. We are educators, engineers, advocates, and above all — parents who believe
              every child can thrive.
            </p>
          </div>
        </div>
      </section>

      {/* ── CTA Banner ─────────────────────────────────────────── */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold">
            Ready to Advocate for Your Child?
          </h2>
          <p className="mt-4 text-lg opacity-90">
            Join thousands of parents who are taking control of their child's education.
            Start using AskIEP today — it's free to get started.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              variant="secondary"
              className="text-base px-8 py-6"
              onClick={goToApp}
            >
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-base px-8 py-6 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
              onClick={() => navigate("/plans")}
            >
              View Plans
            </Button>
          </div>
        </div>
      </section>

      {/* ── Contact Us ─────────────────────────────────────────── */}
      <section id="contact" className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">
              Get In Touch
            </p>
            <h2 className="mt-3 text-3xl md:text-4xl font-bold">Contact Us</h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Have questions about AskIEP or need help with your child's IEP?
              We'd love to hear from you.
            </p>
          </div>

          <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-6 text-center">
              <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Phone className="h-6 w-6" />
              </div>
              <h3 className="font-semibold">Email Us</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                support@askiep.com
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 text-center">
              <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Globe className="h-6 w-6" />
              </div>
              <h3 className="font-semibold">Website</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                www.askiep.com
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 text-center">
              <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <MapPin className="h-6 w-6" />
              </div>
              <h3 className="font-semibold">Location</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                United States
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="border-t border-border bg-muted/30 py-12">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img src={logo} alt="AskIEP" className="h-8 w-8" />
              <span className="text-lg font-bold" style={{ color: "#7FB89E" }}>
                AskIEP
              </span>
            </div>

            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#features" className="hover:text-foreground transition-colors">Features</a>
              <a href="#mission" className="hover:text-foreground transition-colors">Mission</a>
              <a href="#about" className="hover:text-foreground transition-colors">About</a>
              <a href="#contact" className="hover:text-foreground transition-colors">Contact</a>
              <a href="/terms" className="hover:text-foreground transition-colors">Terms of Service</a>
              <a href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</a>
            </div>

            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} AskIEP. All rights reserved.
            </p>
          </div>
          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground text-center leading-relaxed max-w-3xl mx-auto">
              AskIEP is an AI-powered parent education and IEP organization platform. It provides informational
              and educational content related to special education services — it does not provide legal advice and is not a
              substitute for consultation with a licensed attorney. AI-generated outputs are for informational
              purposes only and should be verified with qualified professionals.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
