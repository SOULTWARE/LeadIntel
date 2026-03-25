'use client';

import { motion } from 'framer-motion';
import { FileText, AlertTriangle, Scale, CreditCard, Ban, Shield, RefreshCw, Globe } from 'lucide-react';

export default function TermsOfServicePage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const sections = [
    {
      icon: FileText,
      title: '1. Acceptance of Terms',
      content: `By accessing or using Lead Intel Pro ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of the terms, you do not have permission to access the Service. These Terms apply to all visitors, users, and others who access or use the Service.`,
    },
    {
      icon: Shield,
      title: '2. Description of Service',
      content: `Lead Intel Pro is a lead intelligence platform that provides tools for discovering, analyzing, and managing business leads. Our services include verified business data sourcing through licensed providers, AI-powered lead enhancement, email discovery, and lead management features. We reserve the right to modify or discontinue any part of our services at any time.`,
    },
    {
      icon: Scale,
      title: '3. User Responsibilities',
      content: `You are responsible for maintaining the confidentiality of your account credentials. You agree to use the Service only for lawful purposes and in accordance with these Terms. You must not use the Service to violate any applicable laws or regulations, including data protection and privacy laws. You are solely responsible for how you use the leads and data obtained through our Service.`,
    },
    {
      icon: Ban,
      title: '4. Prohibited Uses',
      content: `You may not use Lead Intel Pro for: sending unsolicited spam or bulk communications; scraping data for resale without authorization; violating anti-spam laws (CAN-SPAM, GDPR, etc.); harassment, stalking, or any illegal activities; attempting to reverse engineer or compromise our systems; sharing account access with unauthorized parties; exceeding rate limits or abusing platform resources.`,
    },
    {
      icon: CreditCard,
      title: '5. Payment Terms',
      content: `Subscription fees are billed in advance on a monthly basis. All payments are non-refundable except as required by law. Usage allowances reset at the start of each billing cycle. Unused monthly allowances do not roll over. Add-on purchases are one-time and available until used or expired. We reserve the right to change pricing with 30 days notice.`,
    },
    {
      icon: RefreshCw,
      title: '6. Cancellation & Termination',
      content: `You may cancel your subscription at any time through your account settings. Cancellation takes effect at the end of the current billing period. We may terminate or suspend your account immediately for Terms violations. Upon termination, your right to use the Service will cease immediately. Data may be deleted 30 days after account termination.`,
    },
    {
      icon: AlertTriangle,
      title: '7. Disclaimers & Limitations',
      content: `The Service is provided "as is" without warranties of any kind. We do not guarantee the accuracy, completeness, or quality of data received from licensed providers or public records. Email discovery success rates may vary. We are not liable for any indirect, incidental, or consequential damages. Our total liability is limited to the amount you paid in the 12 months preceding any claim.`,
    },
    {
      icon: Globe,
      title: '8. Governing Law',
      content: `These Terms shall be governed by the laws of the jurisdiction in which Lead Intel Pro operates, without regard to conflict of law principles. Any disputes arising from these Terms or the Service shall be resolved in the courts of that jurisdiction. By using the Service, you consent to this jurisdiction and venue.`,
    },
  ];

  return (
    <main className="relative z-10 mx-auto flex w-full max-w-[1680px] flex-col gap-20 px-6 pb-32 pt-16 lg:px-8">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="space-y-10"
      >
        {/* Header */}
        <section className="mx-auto max-w-4xl space-y-6 rounded-[2.5rem] border border-white/70 bg-white/75 p-8 text-center shadow-[0_24px_80px_-40px_rgba(15,23,42,0.32)] backdrop-blur-2xl md:p-12">
          <motion.div
            variants={itemVariants}
            className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.35em] text-indigo-600"
          >
            <FileText size={14} />
            Terms of Service
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="text-4xl font-black leading-tight tracking-tight text-slate-900 md:text-5xl"
          >
            Terms of{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              Service
            </span>
          </motion.h1>

          <motion.p variants={itemVariants} className="mx-auto max-w-2xl text-lg leading-relaxed text-slate-500">
            Please read these Terms of Service carefully before using our platform. By using Lead Intel Pro, you agree
            to these terms.
          </motion.p>

          <motion.p variants={itemVariants} className="text-sm text-slate-400">
            Effective Date: December 24, 2025
          </motion.p>
        </section>

        {/* Sections */}
        {sections.map((section, index) => (
          <motion.section key={index} variants={itemVariants} className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_18px_60px_-36px_rgba(15,23,42,0.25)] backdrop-blur-xl md:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100">
                <section.icon size={18} className="text-indigo-600" />
              </div>
              <div className="space-y-3">
                <h2 className="text-xl font-black text-slate-900">{section.title}</h2>
                <p className="text-slate-600 leading-relaxed">{section.content}</p>
              </div>
            </div>
          </motion.section>
        ))}

        {/* Changes Notice */}
        <motion.section variants={itemVariants} className="rounded-[2.5rem] border border-slate-900/90 bg-slate-950 p-8 text-white shadow-[0_32px_120px_-48px_rgba(15,23,42,0.65)] md:p-10">
          <h2 className="text-xl font-black mb-4">Changes to Terms</h2>
          <p className="text-slate-300 leading-relaxed">
            We reserve the right to modify these Terms at any time. We will provide notice of material changes by
            posting the new Terms on this page and updating the &quot;Effective Date&quot; above. Your continued use of the
            Service after any such changes constitutes your acceptance of the new Terms. We encourage you to review
            these Terms periodically.
          </p>
        </motion.section>

        {/* Contact */}
        <motion.section variants={itemVariants} className="text-center">
          <p className="text-slate-500">
            Questions about our Terms of Service?{' '}
            <a href="mailto:legal@leadintelpro.com" className="text-indigo-600 font-bold hover:underline">
              Contact our legal team
            </a>
          </p>
        </motion.section>
      </motion.div>
    </main>
  );
}
