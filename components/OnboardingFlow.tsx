'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  User,
  Building2,
  Briefcase,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  Loader2,
  Zap,
  Target,
  Search,
  BarChart3,
  Mail,
} from 'lucide-react';

const INDUSTRIES = [
  'Marketing & Advertising',
  'Software & Technology',
  'Real Estate',
  'Healthcare',
  'Financial Services',
  'E-commerce & Retail',
  'Consulting',
  'Education',
  'Manufacturing',
  'Legal Services',
  'Other',
];

const COMPANY_SIZES = [
  { value: 'solo', label: 'Just me', description: 'Solo entrepreneur' },
  { value: '2-10', label: '2–10', description: 'Small team' },
  { value: '11-50', label: '11–50', description: 'Growing company' },
  { value: '51-200', label: '51–200', description: 'Mid-size' },
  { value: '201+', label: '201+', description: 'Enterprise' },
];

const ROLES = [
  { value: 'founder', label: 'Founder / CEO', icon: Zap },
  { value: 'sales', label: 'Sales / BD', icon: Target },
  { value: 'marketing', label: 'Marketing', icon: BarChart3 },
  { value: 'operations', label: 'Operations', icon: Search },
  { value: 'other', label: 'Other', icon: Briefcase },
];

const REFERRAL_SOURCES = [
  'Google Search',
  'Social Media',
  'Friend / Colleague',
  'Blog / Article',
  'YouTube',
  'Other',
];

const TOTAL_STEPS = 4;

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 80 : -80,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -80 : 80,
    opacity: 0,
  }),
};

export default function OnboardingFlow() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    companyName: '',
    industry: '',
    companySize: '',
    role: '',
    referralSource: '',
  });

  const goNext = () => {
    setDirection(1);
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  };

  const goBack = () => {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 1));
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.fullName.trim().length >= 2;
      case 2:
        return formData.role !== '';
      case 3:
        return formData.industry !== '';
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save onboarding data');
      }
      toast.success('Welcome aboard! Let\'s get started.');
      router.push('/sourcer');
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Something went wrong'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (
      e.key === 'Enter' &&
      e.target instanceof HTMLElement &&
      e.target.tagName !== 'TEXTAREA'
    ) {
      e.preventDefault();
      if (step < TOTAL_STEPS && canProceed()) goNext();
      else if (step === TOTAL_STEPS) handleSubmit();
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-30%] right-[-20%] w-[60%] h-[60%] bg-blue-100 rounded-full blur-[120px] opacity-40" />
        <div className="absolute bottom-[-20%] left-[-15%] w-[50%] h-[50%] bg-indigo-100 rounded-full blur-[120px] opacity-30" />
        <div className="absolute top-[20%] left-[10%] w-[30%] h-[30%] bg-emerald-50 rounded-full blur-[100px] opacity-30" />
      </div>

      <div className="relative z-10 w-full max-w-xl">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-center gap-2 text-2xl font-extrabold tracking-tighter mb-10"
        >
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
            <Zap size={18} fill="currentColor" />
          </div>
          LeadIntel<span className="text-blue-500">Pro</span>
        </motion.div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
              Step {step} of {TOTAL_STEPS}
            </span>
            <span className="text-xs font-bold text-slate-400">
              {Math.round((step / TOTAL_STEPS) * 100)}%
            </span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
            />
          </div>
        </div>

        {/* Card */}
        <div
          onKeyDown={handleKeyDown}
          className="bg-white border border-slate-200 rounded-[2rem] shadow-2xl shadow-slate-200/60 overflow-hidden"
        >
          <div className="p-10 min-h-[380px] flex flex-col">
            <AnimatePresence mode="wait" custom={direction}>
              {/* Step 1: Personal Info */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="flex-1 space-y-8"
                >
                  <div className="space-y-2">
                    <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
                      <User className="w-7 h-7 text-blue-600" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                      Let&apos;s get to know you
                    </h2>
                    <p className="text-slate-500 text-sm font-medium">
                      Tell us a bit about yourself so we can personalize your
                      experience.
                    </p>
                  </div>

                  <div className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            fullName: e.target.value,
                          }))
                        }
                        placeholder="John Doe"
                        autoFocus
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-200 transition-all placeholder:text-slate-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">
                        Company Name{' '}
                        <span className="text-slate-400 font-medium normal-case tracking-normal">
                          (optional)
                        </span>
                      </label>
                      <input
                        type="text"
                        value={formData.companyName}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            companyName: e.target.value,
                          }))
                        }
                        placeholder="Acme Inc."
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-200 transition-all placeholder:text-slate-300"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Role */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="flex-1 space-y-8"
                >
                  <div className="space-y-2">
                    <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
                      <Briefcase className="w-7 h-7 text-indigo-600" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                      What&apos;s your role?
                    </h2>
                    <p className="text-slate-500 text-sm font-medium">
                      This helps us tailor the features you see first.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {ROLES.map((r) => {
                      const Icon = r.icon;
                      const isSelected = formData.role === r.value;
                      return (
                        <button
                          key={r.value}
                          type="button"
                          onClick={() =>
                            setFormData((p) => ({ ...p, role: r.value }))
                          }
                          className={`flex items-center gap-4 px-5 py-4 rounded-2xl border-2 text-left transition-all duration-200 cursor-pointer ${
                            isSelected
                              ? 'border-indigo-500 bg-indigo-50/50 shadow-lg shadow-indigo-100/50'
                              : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                              isSelected
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-100 text-slate-400'
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                          <span
                            className={`text-sm font-bold ${
                              isSelected ? 'text-indigo-900' : 'text-slate-600'
                            }`}
                          >
                            {r.label}
                          </span>
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="ml-auto w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center"
                            >
                              <Check className="w-3.5 h-3.5 text-white" />
                            </motion.div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* Step 3: Industry & Company Size */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="flex-1 space-y-8"
                >
                  <div className="space-y-2">
                    <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4">
                      <Building2 className="w-7 h-7 text-emerald-600" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                      About your business
                    </h2>
                    <p className="text-slate-500 text-sm font-medium">
                      Help us understand your market so we can optimize lead
                      sourcing.
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">
                        Industry
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {INDUSTRIES.map((ind) => {
                          const isSelected = formData.industry === ind;
                          return (
                            <button
                              key={ind}
                              type="button"
                              onClick={() =>
                                setFormData((p) => ({ ...p, industry: ind }))
                              }
                              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                                isSelected
                                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100'
                                  : 'bg-slate-50 text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-100'
                              }`}
                            >
                              {ind}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">
                        Company Size
                      </label>
                      <div className="grid grid-cols-5 gap-2">
                        {COMPANY_SIZES.map((size) => {
                          const isSelected =
                            formData.companySize === size.value;
                          return (
                            <button
                              key={size.value}
                              type="button"
                              onClick={() =>
                                setFormData((p) => ({
                                  ...p,
                                  companySize: size.value,
                                }))
                              }
                              className={`flex flex-col items-center gap-1 px-3 py-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer ${
                                isSelected
                                  ? 'border-emerald-500 bg-emerald-50/50 shadow-md shadow-emerald-100/50'
                                  : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              <span
                                className={`text-sm font-black ${
                                  isSelected
                                    ? 'text-emerald-700'
                                    : 'text-slate-700'
                                }`}
                              >
                                {size.label}
                              </span>
                              <span className="text-[10px] font-bold text-slate-400">
                                {size.description}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 4: Referral + Ready */}
              {step === 4 && (
                <motion.div
                  key="step4"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="flex-1 space-y-8"
                >
                  <div className="space-y-2">
                    <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mb-4">
                      <Sparkles className="w-7 h-7 text-amber-500" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                      Almost there!
                    </h2>
                    <p className="text-slate-500 text-sm font-medium">
                      One last thing — how did you find us?
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">
                      How did you hear about us?{' '}
                      <span className="text-slate-400 font-medium normal-case tracking-normal">
                        (optional)
                      </span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {REFERRAL_SOURCES.map((src) => {
                        const isSelected = formData.referralSource === src;
                        return (
                          <button
                            key={src}
                            type="button"
                            onClick={() =>
                              setFormData((p) => ({
                                ...p,
                                referralSource: isSelected ? '' : src,
                              }))
                            }
                            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                              isSelected
                                ? 'bg-amber-500 text-white shadow-lg shadow-amber-100'
                                : 'bg-slate-50 text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-100'
                            }`}
                          >
                            {src}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Summary preview */}
                  <div className="bg-slate-50 rounded-2xl p-6 space-y-3 border border-slate-100">
                    <div className="text-xs font-black text-slate-400 uppercase tracking-widest">
                      Your Profile
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {formData.fullName && (
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-blue-500" />
                          <span className="text-sm font-bold text-slate-700">
                            {formData.fullName}
                          </span>
                        </div>
                      )}
                      {formData.companyName && (
                        <div className="flex items-center gap-2">
                          <Building2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-sm font-bold text-slate-700">
                            {formData.companyName}
                          </span>
                        </div>
                      )}
                      {formData.role && (
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
                          <span className="text-sm font-bold text-slate-700">
                            {ROLES.find((r) => r.value === formData.role)
                              ?.label ?? formData.role}
                          </span>
                        </div>
                      )}
                      {formData.industry && (
                        <div className="flex items-center gap-2">
                          <BarChart3 className="w-3.5 h-3.5 text-amber-500" />
                          <span className="text-sm font-bold text-slate-700">
                            {formData.industry}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* What's next */}
                  <div className="space-y-3">
                    <div className="text-xs font-black text-slate-400 uppercase tracking-widest">
                      What&apos;s next
                    </div>
                    <div className="flex flex-col gap-2">
                      {[
                        {
                          icon: Search,
                          text: 'Source leads from verified data',
                          color: 'text-blue-500',
                        },
                        {
                          icon: Sparkles,
                          text: 'AI-powered lead scoring',
                          color: 'text-indigo-500',
                        },
                        {
                          icon: Mail,
                          text: 'Discover & verify contact emails',
                          color: 'text-emerald-500',
                        },
                      ].map((item) => (
                        <div
                          key={item.text}
                          className="flex items-center gap-3"
                        >
                          <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center">
                            <item.icon className={`w-3.5 h-3.5 ${item.color}`} />
                          </div>
                          <span className="text-sm font-semibold text-slate-600">
                            {item.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="bg-slate-50/80 px-10 py-6 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={goBack}
              disabled={step === 1}
              className="px-6 py-3 rounded-xl border border-slate-200 text-slate-500 font-bold text-sm hover:bg-white transition-all disabled:opacity-0 disabled:pointer-events-none flex items-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            {step < TOTAL_STEPS ? (
              <button
                type="button"
                onClick={goNext}
                disabled={!canProceed()}
                className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center gap-2 group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
              >
                Continue
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-sm hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-200 flex items-center gap-2 group cursor-pointer disabled:opacity-70"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Get Started
                    <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Skip link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center mt-6"
        >
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            Skip for now
          </button>
        </motion.div>
      </div>
    </div>
  );
}
