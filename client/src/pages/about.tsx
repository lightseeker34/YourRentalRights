import { motion } from "framer-motion";
import { Shield, Scale, Users, FileCheck } from "lucide-react";
import { EditableText } from "@/components/editable-text";

export default function About() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <EditableText
          contentKey="about-title"
          defaultValue="About Us"
          as="h1"
          className="text-4xl font-extrabold text-slate-900 mb-6 tracking-tight"
        />
        <EditableText
          contentKey="about-subtitle"
          defaultValue="We are dedicated to leveling the playing field between institutional landlords and everyday renters. When corporate landlords ignore the law, we help you enforce it."
          as="p"
          className="text-xl text-slate-600 mb-12 leading-relaxed"
        />

        <div className="grid md:grid-cols-2 gap-12 mb-16">
          <div>
            <EditableText
              contentKey="about-mission-title"
              defaultValue="Our Mission"
              as="h2"
              className="text-2xl font-bold text-slate-800 mb-4"
            />
            <EditableText
              contentKey="about-mission-text1"
              defaultValue="Institutional landlords own millions of homes across the country. They have armies of lawyers and automated systems designed to maximize profit at the expense of livability."
              as="p"
              className="text-slate-600 leading-relaxed mb-6"
            />
            <EditableText
              contentKey="about-mission-text2"
              defaultValue="YourRentalRights.com gives you the tools to fight back. By aggregating complaints, identifying legal violations automatically, and generating professional legal notices, we turn your evidence into leverage."
              as="p"
              className="text-slate-600 leading-relaxed"
            />
          </div>
          <div className="bg-slate-100 rounded-2xl p-8 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-slate-700" />
              Why We Exist
            </h3>
            <ul className="space-y-4">
              <li className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2 shrink-0" />
                <span className="text-slate-600">To stop illegal "junk fees" and hidden charges.</span>
              </li>
              <li className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2 shrink-0" />
                <span className="text-slate-600">To force timely repairs on essential services like HVAC and plumbing.</span>
              </li>
              <li className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2 shrink-0" />
                <span className="text-slate-600">To ensure security deposits are returned fairly.</span>
              </li>
              <li className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2 shrink-0" />
                <span className="text-slate-600">To provide renters with the same legal firepower as billion-dollar corporations.</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-16">
          <EditableText
            contentKey="about-howto-title"
            defaultValue="How It Works"
            as="h2"
            className="text-2xl font-bold text-slate-800 mb-10 text-center"
          />
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-center mx-auto mb-6">
                <FileCheck className="w-8 h-8 text-slate-700" />
              </div>
              <EditableText
                contentKey="about-step1-title"
                defaultValue="1. Document"
                as="h3"
                className="font-bold text-slate-900 mb-2"
              />
              <EditableText
                contentKey="about-step1-desc"
                defaultValue="Upload photos, emails, and maintenance logs. Our system organizes your evidence into a timeline."
                as="p"
                className="text-slate-600 text-sm"
              />
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-center mx-auto mb-6">
                <Scale className="w-8 h-8 text-slate-700" />
              </div>
              <EditableText
                contentKey="about-step2-title"
                defaultValue="2. Analyze"
                as="h3"
                className="font-bold text-slate-900 mb-2"
              />
              <EditableText
                contentKey="about-step2-desc"
                defaultValue="Our AI Agent compares your situation against local and state tenant laws to find violations."
                as="p"
                className="text-slate-600 text-sm"
              />
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-slate-700" />
              </div>
              <EditableText
                contentKey="about-step3-title"
                defaultValue="3. Act"
                as="h3"
                className="font-bold text-slate-900 mb-2"
              />
              <EditableText
                contentKey="about-step3-desc"
                defaultValue="Generate and send formal demand letters. Join class action investigations if applicable."
                as="p"
                className="text-slate-600 text-sm"
              />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
