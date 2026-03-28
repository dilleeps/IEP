import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function PrivacyPolicyPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">
          Effective Date: March 14, 2026 &middot; Version 2.0
        </p>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold">1. Introduction</h2>
            <p>
              AskIEP ("we", "us", "our") is committed to protecting the privacy of our users and
              the children whose educational records are processed through our Platform. This Privacy
              Policy explains how we collect, use, store, and protect your information.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">2. Information We Collect</h2>
            <p><strong>Account Information:</strong> Name, email address, password (hashed), role, and authentication data.</p>
            <p><strong>Child Profile Data:</strong> Child's name, grade, school, disabilities, accommodations, and services — provided by the parent/guardian.</p>
            <p><strong>Educational Records:</strong> IEP documents, evaluations, progress reports, and related documents uploaded by the parent/guardian.</p>
            <p><strong>Usage Data:</strong> Communication logs, letters, goals, service delivery records, and consultation notes created within the Platform.</p>
            <p><strong>Technical Data:</strong> IP address, browser type, device information, and usage analytics for security and improvement purposes.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">3. FERPA Compliance</h2>
            <p>
              The Family Educational Rights and Privacy Act (FERPA) protects the privacy of student
              education records. AskIEP processes educational records only at the direction and with
              the consent of the parent or legal guardian. We act as a service provider to parents —
              not as a school or educational agency. Parents retain full control over their children's
              records and may request access, correction, or deletion at any time.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">4. COPPA Compliance</h2>
            <p>
              The Children's Online Privacy Protection Act (COPPA) applies to the collection of
              personal information from children under 13. AskIEP does not collect information
              directly from children. All child data is provided by the parent or legal guardian.
              The Platform is intended for use by parents, guardians, advocates, and educators —
              not by children.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">5. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>To provide and operate the Platform features (document analysis, goal tracking, letter generation, etc.)</li>
              <li>To process uploaded IEP documents using AI for analysis, summarization, and informational insights</li>
              <li>To facilitate expert consultations and communication tools</li>
              <li>To send service-related communications (account notifications, consultation confirmations)</li>
              <li>To improve the Platform and develop new features</li>
              <li>To maintain security, prevent fraud, and comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold">6. AI Data Processing</h2>
            <p>
              When you upload IEP documents or use AI-powered features, your data is processed by
              AI services (including Google Gemini) to generate analysis, summaries, and informational
              content. We do not use your personal data or your children's educational records to train
              AI models. AI processing is performed solely to provide you with the requested Platform features.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">7. Data Security</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Encryption in transit (TLS/HTTPS) and at rest</li>
              <li>Role-based access controls and Firebase Authentication</li>
              <li>Child-level data isolation between user accounts</li>
              <li>Monitoring, audit logging, and security alerting</li>
              <li>Operational access on a least-privilege basis</li>
              <li>Infrastructure hosted on Google Cloud Platform with SOC 2 compliance</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold">8. Data Retention & Deletion</h2>
            <p>
              We retain your data for as long as your account is active. You may request deletion of
              your account and all associated data at any time by contacting support@askiep.com. Upon
              receiving a verified deletion request, we will delete your personal data and your children's
              records within 30 days, except where retention is required by law.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">9. Data Sharing</h2>
            <p>We do not sell your personal data or your children's educational records. We may share data with:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>AI Service Providers:</strong> For document analysis and AI features (under data processing agreements)</li>
              <li><strong>Cloud Infrastructure:</strong> Google Cloud Platform for hosting and storage</li>
              <li><strong>Payment Processors:</strong> Stripe for subscription billing (we do not store credit card numbers)</li>
              <li><strong>Legal Requirements:</strong> When required by law, court order, or government request</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold">10. Your Rights</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Access and review your uploaded data</li>
              <li>Request corrections to inaccurate information</li>
              <li>Request deletion of your data</li>
              <li>Withdraw consent (note: some Platform features may become unavailable)</li>
              <li>Export your data in a portable format</li>
            </ul>
            <p className="mt-2">
              <strong>California Residents (CCPA/CPRA):</strong> You have the right to know what personal
              information we collect, request deletion, and opt out of the sale of personal information.
              We do not sell personal information. To exercise your rights, contact support@askiep.com.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">11. Data Breach Notification</h2>
            <p>
              If AskIEP confirms a breach that affects your personal or educational data, we will notify
              impacted users without undue delay and no later than 72 hours after confirmation, unless a
              shorter timeline is required by applicable law. Notifications will include what happened,
              data involved, mitigation steps, and support contacts.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">12. Children's Data Protection</h2>
            <p>
              We take the protection of children's data seriously. All children's educational records
              are stored with additional security measures including encryption, access isolation, and
              audit logging. Only the parent/guardian who uploaded the data (and authorized Platform
              administrators for support purposes) can access a child's records.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">13. Contact Us</h2>
            <p>
              For privacy-related questions or to exercise your rights, contact us at:
            </p>
            <p><strong>Email:</strong> support@askiep.com</p>
            <p><strong>Organization:</strong> AskIEP</p>
          </section>
        </div>
      </div>
    </div>
  );
}
