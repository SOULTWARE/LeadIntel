'use client';

import { motion } from 'framer-motion';
import { Mail, MessageSquare, HelpCircle, Clock, Building, PhoneCall, Sparkles } from 'lucide-react';

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
    <main className="relative z-10 max-w-6xl mx-auto px-6 pt-20 pb-32">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="space-y-16"
      >
        {/* Header */}
        <section className="text-center space-y-6 max-w-2xl mx-auto">
          <motion.div
            variants={itemVariants}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-600 rounded-full text-xs font-black uppercase tracking-widest border border-purple-100"
          >
            <Mail size={14} />
            Contact Us
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="text-4xl md:text-5xl font-black text-slate-900 leading-tight tracking-tight"
          >
            Let&apos;s{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
              talk.
            </span>
          </motion.h1>

          <motion.p variants={itemVariants} className="text-lg text-slate-500 leading-relaxed">
            Have questions about Lead Intel Pro? We&apos;d love to hear from you. Our team typically responds within 24
            hours.
          </motion.p>
        </section>

        {/* Contact Methods */}
        <motion.section variants={itemVariants} className="grid md:grid-cols-3 gap-6">
          {contactMethods.map((method, index) => (
            <a
              key={index}
              href={method.href}
              className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-lg hover:border-purple-200 transition-all group"
            >
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-purple-600 transition-colors">
                <method.icon size={22} className="text-purple-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-1">{method.title}</h3>
              <p className="text-sm text-slate-500 mb-3">{method.description}</p>
              <div className="text-purple-600 font-bold text-sm">{method.contact}</div>
            </a>
          ))}
        </motion.section>

        {/* Info Grid */}
        <motion.section variants={itemVariants} className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Clock size={18} className="text-purple-600" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.4em] text-slate-400">Response time</p>
                  <p className="text-lg font-black text-slate-900">Under 24 hours</p>
                </div>
              </div>
              <p className="text-slate-600 mt-4">
                Our inboxes are reviewed every weekday. Enterprise customers receive priority handling and direct Slack
                access.
              </p>
            </div>
          </div>

          <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-8 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <Sparkles size={18} className="text-purple-600" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.4em] text-slate-400">Company info</p>
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
