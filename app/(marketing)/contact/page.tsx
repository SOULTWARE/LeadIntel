'use client';

import { motion } from 'framer-motion';
import { Mail, MessageSquare, HelpCircle, Clock, Sparkles } from 'lucide-react';

export default function ContactPage() {

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const contactMethods = [
    {
      icon: Mail,
      title: 'Email Support',
      description: 'Get help with your account or technical issues',
      contact: 'support@leadintelpro.com',
      href: 'mailto:support@leadintelpro.com',
    },
    {
      icon: MessageSquare,
      title: 'Sales Inquiries',
      description: 'Questions about pricing or enterprise plans',
      contact: 'sales@leadintelpro.com',
      href: 'mailto:sales@leadintelpro.com',
    },
    {
      icon: HelpCircle,
      title: 'General Questions',
      description: 'Partnerships, press, and other inquiries',
      contact: 'hello@leadintelpro.com',
      href: 'mailto:hello@leadintelpro.com',
    },
  ];

  return (
    <main className="relative z-10 mx-auto flex w-full max-w-[1680px] flex-col gap-20 px-6 pb-32 pt-16 lg:px-8">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="space-y-16"
      >
        {/* Header */}
        <section className="mx-auto max-w-4xl space-y-6 rounded-[2.5rem] border border-white/70 bg-white/75 p-8 text-center shadow-[0_24px_80px_-40px_rgba(15,23,42,0.32)] backdrop-blur-2xl md:p-12">
          <motion.div
            variants={itemVariants}
            className="inline-flex items-center gap-2 rounded-full border border-violet-100 bg-violet-50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.35em] text-violet-600"
          >
            <Mail size={14} />
            Contact Us
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="text-4xl font-black leading-tight tracking-tight text-slate-900 md:text-5xl"
          >
            Let&apos;s{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-fuchsia-600">
              talk.
            </span>
          </motion.h1>

          <motion.p variants={itemVariants} className="text-lg text-slate-500 leading-relaxed">
            Have questions about Lead Intel Pro? We&apos;d love to hear from you. Our team typically responds within 24
            hours.
          </motion.p>
        </section>

        {/* Contact Methods */}
        <motion.section variants={itemVariants} className="grid gap-6 md:grid-cols-3">
          {contactMethods.map((method, index) => (
            <a
              key={index}
              href={method.href}
              className="group rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_18px_60px_-36px_rgba(15,23,42,0.25)] transition-all hover:-translate-y-1 hover:shadow-xl backdrop-blur-xl"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 transition-colors group-hover:bg-violet-600">
                <method.icon size={22} className="text-violet-600 transition-colors group-hover:text-white" />
              </div>
              <h3 className="mb-1 text-lg font-black text-slate-900">{method.title}</h3>
              <p className="mb-3 text-sm text-slate-500">{method.description}</p>
              <div className="text-sm font-black text-violet-600">{method.contact}</div>
            </a>
          ))}
        </motion.section>

        {/* Info Grid */}
        <motion.section variants={itemVariants} className="grid gap-8 md:grid-cols-2">
          <div className="space-y-6">
            <div className="rounded-[2rem] border border-white/70 bg-white/80 p-8 shadow-[0_18px_60px_-36px_rgba(15,23,42,0.25)] backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100">
                  <Clock size={18} className="text-violet-600" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Response time</p>
                  <p className="text-lg font-black text-slate-900">Under 24 hours</p>
                </div>
              </div>
              <p className="text-slate-600 mt-4">
                Our inboxes are reviewed every weekday. Enterprise customers receive priority handling and direct Slack
                access.
              </p>
            </div>
          </div>

          <div className="space-y-4 rounded-[2rem] border border-white/70 bg-white/80 p-8 shadow-[0_18px_60px_-36px_rgba(15,23,42,0.25)] backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100">
                <Sparkles size={18} className="text-violet-600" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Company info</p>
                <p className="text-lg font-black text-slate-900">Lead Intel Pro</p>
              </div>
            </div>
            <p className="text-slate-600">
              Built by Soultware. For security reasons we don&apos;t publish office addresses publicly—reach out through any
              of the inboxes above and we&apos;ll share details as needed.
            </p>
          </div>
        </motion.section>
      </motion.div>
    </main>
  );
}
