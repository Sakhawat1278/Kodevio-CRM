import React from 'react';
import { X, Zap, ShieldCheck, Bot, BarChart3, ArrowRight } from 'lucide-react';

export default function LearnMoreModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-xl" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          <X size={18} />
        </button>

        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-3">
            <Zap size={14} /> Fiverr Pro Agency Automation OS
          </div>
          <h3 className="text-2xl font-extrabold text-white">
            Designed for High-Volume Freelance Agencies
          </h3>
          <p className="text-sm text-slate-400 mt-2">
            Automate orders, streamline client communication, and track revenue seamlessly.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
              <Bot size={20} />
            </div>
            <h4 className="font-bold text-white text-sm mb-1">AI Gig Dispatcher</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Automatically routes incoming Fiverr buyer briefs to available specialized team members.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="w-9 h-9 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-3">
              <BarChart3 size={20} />
            </div>
            <h4 className="font-bold text-white text-sm mb-1">Live Profit Analytics</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Track gig completion velocity, net margins, customer review ratings, and queue status.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="w-9 h-9 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center mb-3">
              <Zap size={20} />
            </div>
            <h4 className="font-bold text-white text-sm mb-1">Auto-Delivery Bot</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Attach finished client deliverables with dynamic template notes and automated follow-ups.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="w-9 h-9 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center mb-3">
              <ShieldCheck size={20} />
            </div>
            <h4 className="font-bold text-white text-sm mb-1">Enterprise Security</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Encrypted API key storage, role-based sub-account access, and PostgreSQL audit logging.
            </p>
          </div>
        </div>

        <button onClick={onClose} className="submit-btn">
          <span>Get Started Now</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
