import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function TermsOfServicePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-8">
          Effective Date: March 14, 2026 &middot; Version 2.0
        </p>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold">1. Acceptance of Terms</h2>
            <p>
              By accessing or using AskIEP ("the Platform"), you agree to be bound by these Terms of Service
              ("Terms"). If you do not agree, do not use the Platform. AskIEP reserves the right to update
              these Terms at any time. Continued use constitutes acceptance of any changes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">2. Platform Description</h2>
            <p>
              AskIEP is an AI-powered parent education and IEP organization platform. It provides
              informational and educational content related to special education, including tools
              for document analysis, communication logging, meeting preparation, and educational
              resource access.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">3. Not Legal Advice</h2>
            <p>
              <strong>AskIEP does not provide legal advice.</strong> All content, AI-generated outputs,
              letters, analysis, and guidance provided through the Platform are for informational and
              educational purposes only. No content on this Platform creates an attorney-client relationship.
              The Platform is not a substitute for consultation with a licensed attorney.
            </p>
            <p>
              If you need legal advice regarding your child's IEP, special education rights, due process,
              or any other legal matter, consult a licensed attorney in your state.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">4. AI-Generated Content Disclaimer</h2>
            <p>
              AskIEP uses artificial intelligence to analyze documents, generate letters, provide
              informational guidance, and create practice scenarios. AI-generated outputs:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Are for informational purposes only</li>
              <li>May contain inaccuracies or omissions</li>
              <li>Should be verified with qualified professionals before reliance</li>
              <li>Do not constitute legal, medical, or professional advice</li>
              <li>Do not create any professional-client relationship</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold">5. Expert Consultations</h2>
            <p>
              AskIEP may offer access to special education advocates, educators, and consultants.
              These individuals are not attorneys and do not provide legal representation. Consultations
              are educational and informational in nature and do not create an attorney-client relationship.
              Credential types and qualifications are disclosed on the booking page.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">6. User Responsibilities</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>You must be the parent or legal guardian of the child whose records you upload, or have written authorization to do so.</li>
              <li>You are responsible for the accuracy of the information you provide.</li>
              <li>You agree not to upload records for children you do not have legal authority over.</li>
              <li>You must not use the Platform for any unlawful purpose.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold">7. Intellectual Property</h2>
            <p>
              All content, features, and functionality of the Platform are owned by AskIEP and are
              protected by copyright, trademark, and other intellectual property laws. You retain
              ownership of the documents and data you upload.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">8. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, AskIEP and its affiliates shall not be liable
              for any indirect, incidental, special, consequential, or punitive damages arising from
              your use of the Platform, including but not limited to decisions made based on AI-generated
              content or informational guidance.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">9. Disclaimer of Warranties</h2>
            <p>
              The Platform is provided "as is" and "as available" without warranties of any kind,
              whether express or implied. AskIEP does not warrant that AI outputs are accurate,
              complete, or suitable for any particular purpose.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">10. Termination</h2>
            <p>
              AskIEP may terminate or suspend your account at any time for violation of these Terms.
              You may delete your account at any time by contacting support. Upon termination, your
              right to use the Platform ceases immediately.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">11. Governing Law</h2>
            <p>
              These Terms are governed by and construed in accordance with the laws of the State of
              Texas, United States, without regard to conflict of law principles.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">12. Contact</h2>
            <p>
              For questions about these Terms, contact us at: <strong>support@askiep.com</strong>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
