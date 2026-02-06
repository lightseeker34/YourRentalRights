import { motion } from "framer-motion";
import { EditableText } from "@/components/editable-text";

export default function Privacy() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <EditableText
          contentKey="privacy-title"
          defaultValue="Privacy Policy"
          as="h1"
          className="text-4xl font-extrabold text-slate-900 mb-6 tracking-tight"
        />
        <p className="text-slate-500 mb-8">Last updated: January 2026</p>

        <div className="prose prose-slate max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Your Privacy Is Our Priority</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              We take your privacy extremely seriously. Your personal information and documentation are yours alone. We are committed to ensuring that YourRentalRights.com remains a safe, private resource for tenants.
            </p>
            <ul className="list-disc pl-6 space-y-2 text-slate-600">
              <li><strong>No Data Brokers</strong> — We never sell, share, or distribute your information to data brokers, advertisers, or any third parties.</li>
              <li><strong>Your Data Stays With You</strong> — Information you upload never leaves your account unless you explicitly request it (for example, to generate a letter or export your records).</li>
              <li><strong>Zero Monetization of Your Data</strong> — We do not monetize your personal information in any way. Your evidence and documentation exist solely to help you protect your rights.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Information You Provide</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              To power our advocacy tools, you may choose to provide:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-slate-600">
              <li>Account information (name, email address, phone number)</li>
              <li>Rental property details and landlord information</li>
              <li>Documentation you upload (photos, documents, communications)</li>
              <li>Incident reports and maintenance logs</li>
              <li>Communications with our AI assistant</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">How We Use Your Information</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              We use the information you provide solely to deliver our services:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-slate-600">
              <li>Provide, maintain, and improve our advocacy tools</li>
              <li>Help you document rental issues and generate legal notices</li>
              <li>Analyze your situation against applicable housing laws</li>
              <li>Send you updates about your cases and account</li>
              <li>Respond to your comments, questions, and requests</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Data Security</h2>
            <p className="text-slate-600 leading-relaxed">
              We take reasonable measures to help protect your personal information from loss, theft, misuse, 
              unauthorized access, disclosure, alteration, and destruction. Your data is encrypted in transit 
              and at rest, and access is limited to authorized personnel only.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Your Rights</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              You have the right to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-slate-600">
              <li>Access your personal information</li>
              <li>Correct inaccurate or incomplete data</li>
              <li>Request deletion of your data</li>
              <li>Export your data in a portable format</li>
              <li>Opt out of marketing communications</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Contact Us</h2>
            <p className="text-slate-600 leading-relaxed">
              If you have any questions about this Privacy Policy, please contact us through our Contact page 
              or email us at privacy@yourrentalrights.com.
            </p>
          </section>
        </div>
      </motion.div>
    </div>
  );
}
