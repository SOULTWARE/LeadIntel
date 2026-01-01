'use client';

import { motion } from 'framer-motion';
import { Mail, MessageSquare, HelpCircle, Clock, Send, Building } from 'lucide-react';
import { useState } from 'react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'general',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setSubmitted(true);
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

        {/* Contact Form Section */}
        <motion.section variants={itemVariants} className="grid md:grid-cols-2 gap-12">
          {/* Form */}
          <div className="bg-white rounded-3xl p-8 md:p-10 border border-slate-100 shadow-lg">
            {submitted ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Send size={28} className="text-green-600" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-3">Message Sent!</h3>
                <p className="text-slate-500">
                  Thanks for reaching out. We&apos;ll get back to you within 24 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-bold text-slate-700 mb-2">
                    Your Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none transition-all"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-bold text-slate-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none transition-all"
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-bold text-slate-700 mb-2">
                    Subject
                  </label>
                  <select
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none transition-all bg-white"
                  >
                    <option value="general">General Inquiry</option>
                    <option value="support">Technical Support</option>
                    <option value="sales">Sales Question</option>
                    <option value="billing">Billing Issue</option>
                    <option value="feedback">Product Feedback</option>
                    <option value="partnership">Partnership</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-bold text-slate-700 mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    required
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none transition-all resize-none"
                    placeholder="Tell us how we can help..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      Send Message
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Info */}
          <div className="space-y-8">
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Clock size={18} className="text-purple-600" />
                </div>
                <h3 className="text-lg font-black text-slate-900">Response Time</h3>
              </div>
              <p className="text-slate-600">
                Our team typically responds to all inquiries within <strong>24 hours</strong> during business days.
                Urgent support requests are prioritized.
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Building size={18} className="text-purple-600" />
                </div>
                <h3 className="text-lg font-black text-slate-900">Company Info</h3>
              </div>
              <div className="space-y-2 text-slate-600">
                <p><strong>Lead Intel Pro</strong></p>
                <p>A product by Soultware</p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
                  <HelpCircle size={18} className="text-white" />
                </div>
                <h3 className="text-lg font-black text-slate-900">Need Quick Help?</h3>
              </div>
              <p className="text-slate-600 mb-4">
                Check out our documentation and FAQ for instant answers to common questions.
              </p>
              <a href="#" className="text-purple-600 font-bold hover:underline">
                View Documentation →
              </a>
            </div>
          </div>
        </motion.section>
      </motion.div>
    </main>
  );
}
