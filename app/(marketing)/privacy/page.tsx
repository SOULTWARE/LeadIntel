'use client';

import { motion } from 'framer-motion';
import { Shield, Lock, Eye, Database, Mail, Trash2 } from 'lucide-react';

export default function PrivacyPolicyPage() {
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
      icon: Database,
      title: 'Information We Collect',
      content: [
        'Account information (email, name) when you register',
        'Usage data and analytics to improve our services',
        'Lead data you scrape and store within the platform',
        'Payment information processed securely through our payment provider',
      ],
    },
    {
      icon: Eye,
      title: 'How We Use Your Information',
      content: [
        'To provide and maintain our lead intelligence services',
        'To process transactions and send related information',
        'To send technical notices, updates, and support messages',
        'To monitor and analyze usage trends and improve the platform',
        'To detect, prevent, and address technical issues',
      ],
    },
    {
      icon: Shield,
      title: 'Data Protection',
      content: [
        'All data is encrypted in transit using TLS 1.3',
        'Database encryption at rest for sensitive information',
        'Regular security audits and penetration testing',
        'Access controls and authentication for all team members',
        'Compliant with GDPR and other privacy regulations',
      ],
    },
    {
      icon: Lock,
      title: 'Data Sharing',
      content: [
        'We do not sell your personal information to third parties',
        'Data may be shared with service providers essential to operations',
        'We may disclose information when required by law',
        'Business transfers may include transfer of user data',
      ],
    },
    {
      icon: Mail,
      title: 'Communications',
      content: [
        'Transactional emails related to your account and service',
        'Optional marketing communications (you can opt-out anytime)',
        'Important service announcements and security updates',
      ],
    },
    {
      icon: Trash2,
      title: 'Data Retention & Deletion',
      content: [
        'Account data retained while your account is active',
        'You can request deletion of your data at any time',
        'Some data may be retained for legal or compliance purposes',
        'Backups are purged within 30 days of deletion request',
      ],
    },
  ];

  return (
    <main className="relative z-10 mx-auto flex w-full max-w-[1680px] flex-col gap-20 px-6 pb-32 pt-16 lg:px-8">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="space-y-12"
      >
        {/* Header */}
        <section className="mx-auto max-w-4xl space-y-6 rounded-[2.5rem] border border-white/70 bg-white/75 p-8 text-center shadow-[0_24px_80px_-40px_rgba(15,23,42,0.32)] backdrop-blur-2xl md:p-12">
          <motion.div
            variants={itemVariants}
            className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.35em] text-blue-600"
          >
            <Shield size={14} />
            Privacy Policy
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="text-4xl font-black leading-tight tracking-tight text-slate-900 md:text-5xl"
          >
            Your privacy is{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
              our priority.
            </span>
          </motion.h1>

          <motion.p variants={itemVariants} className="mx-auto max-w-2xl text-lg leading-relaxed text-slate-500">
            We are committed to protecting your personal information and being transparent about what data we collect
            and how we use it.
          </motion.p>

          <motion.p variants={itemVariants} className="text-sm text-slate-400">
            Last updated: December 24, 2025
          </motion.p>
        </section>

        {/* Introduction */}
        <motion.section variants={itemVariants} className="rounded-[2rem] border border-white/70 bg-white/80 p-8 shadow-[0_18px_60px_-36px_rgba(15,23,42,0.25)] backdrop-blur-xl">
          <p className="text-slate-600 leading-relaxed">
            This Privacy Policy describes how Lead Intel Pro (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) collects, uses, and shares
            information about you when you use our website, applications, and services (collectively, the &quot;Services&quot;).
            By using our Services, you agree to the collection and use of information in accordance with this policy.
          </p>
        </motion.section>

        {/* Sections */}
        {sections.map((section, index) => (
          <motion.section key={index} variants={itemVariants} className="space-y-4 rounded-[2rem] border border-white/70 bg-white/75 p-8 shadow-[0_18px_60px_-36px_rgba(15,23,42,0.25)] backdrop-blur-xl">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100">
                <section.icon size={20} className="text-blue-600" />
              </div>
              <h2 className="text-2xl font-black text-slate-900">{section.title}</h2>
            </div>
            <ul className="space-y-3 pl-16">
              {section.content.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-slate-600">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full shrink-0 mt-2" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.section>
        ))}

        {/* Your Rights */}
        <motion.section variants={itemVariants} className="rounded-[2.5rem] border border-slate-900/90 bg-slate-950 p-8 text-white shadow-[0_32px_120px_-48px_rgba(15,23,42,0.65)] md:p-10">
          <h2 className="text-2xl font-black mb-6">Your Rights</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              'Right to access your personal data',
              'Right to correct inaccurate data',
              'Right to delete your data',
              'Right to data portability',
              'Right to restrict processing',
              'Right to object to processing',
              'Right to withdraw consent',
              'Right to lodge a complaint',
            ].map((right, i) => (
              <div key={i} className="flex items-center gap-3 text-slate-300">
                <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0" />
                {right}
              </div>
            ))}
          </div>
        </motion.section>

        {/* Contact */}
        <motion.section variants={itemVariants} className="rounded-[2.5rem] border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 p-10 text-center shadow-[0_18px_60px_-36px_rgba(15,23,42,0.25)]">
          <h2 className="text-2xl font-black text-slate-900 mb-4">Questions about privacy?</h2>
          <p className="text-slate-600 mb-6">
            If you have any questions about this Privacy Policy, please contact us.
          </p>
          <a
            href="mailto:privacy@leadintelpro.com"
            className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 font-black text-white transition-colors hover:bg-blue-700"
          >
            <Mail size={18} />
            privacy@leadintelpro.com
          </a>
        </motion.section>
      </motion.div>
    </main>
  );
}
