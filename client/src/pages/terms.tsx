import { motion } from "framer-motion";
import { EditableText } from "@/components/editable-text";

export default function Terms() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <EditableText
          contentKey="terms-title"
          defaultValue="Terms of Service"
          as="h1"
          className="text-4xl font-extrabold text-slate-900 mb-6 tracking-tight"
        />
        <p className="text-slate-500 mb-8">Last updated: January 2026</p>

        <div className="prose prose-slate max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Acceptance of Terms</h2>
            <p className="text-slate-600 leading-relaxed">
              By accessing and using YourRentalRights.com, you agree to be bound by these Terms of Service. 
              If you do not agree to these terms, please do not use our services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Description of Service</h2>
            <p className="text-slate-600 leading-relaxed">
              YourRentalRights.com provides tools to help tenants document rental issues, track evidence, 
              and generate formal communications. Our AI-powered analysis is designed to help you understand 
              your rights under applicable housing laws.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Not Legal Advice</h2>
            <p className="text-slate-600 leading-relaxed">
              The information provided through YourRentalRights.com is for informational purposes only and 
              does not constitute legal advice. We are not a law firm, and use of our service does not create 
              an attorney-client relationship. For specific legal questions, please consult with a licensed 
              attorney in your jurisdiction.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">User Responsibilities</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              You agree to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-slate-600">
              <li>Provide accurate and truthful information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Use the service only for lawful purposes</li>
              <li>Not misrepresent yourself or your circumstances</li>
              <li>Not upload content that is defamatory, fraudulent, or illegal</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Limitation of Liability</h2>
            <p className="text-slate-600 leading-relaxed">
              YourRentalRights.com and its operators shall not be liable for any indirect, incidental, special, 
              consequential, or punitive damages arising from your use of the service. Our total liability 
              shall not exceed the amount you paid for the service in the past twelve months.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Changes to Terms</h2>
            <p className="text-slate-600 leading-relaxed">
              We may modify these Terms of Service at any time. We will notify you of any material changes 
              by posting the new terms on this page and updating the "Last updated" date.
            </p>
          </section>

          <section className="mb-8 p-6 bg-slate-100 rounded-lg border border-slate-200">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Disclaimers</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              YourRentalRights.com is a tenant advocacy resource and is not affiliated with American Homes 4 Rent, 
              Invitation Homes, or any other entity listed.
            </p>
            <p className="text-slate-600 leading-relaxed">
              BBB ratings and reviews are public data and trademarks of the Better Business Bureau.
            </p>
          </section>
        </div>
      </motion.div>
    </div>
  );
}
