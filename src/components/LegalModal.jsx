import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, FileText } from 'lucide-react';
import logoImg from '../assets/logo';

export default function LegalModal({ isOpen, initialTab = 'terms', onClose }) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'terms' | 'privacy'

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="modal-overlay" onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="legal-modal-card"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="modal-close-icon-btn"
            title="Close"
          >
            <X size={16} />
          </button>

          {/* Top Brand & Title */}
          <div className="legal-modal-header">
            <div className="flex items-center gap-2 mb-2">
              <img src={logoImg} alt="Kodevio Logo" className="w-6 h-6 object-contain" />
              <span className="font-extrabold text-slate-900 text-lg">Kodevio Limited</span>
            </div>

            {/* Tab Switcher */}
            <div className="legal-tabs-bar">
              <button
                type="button"
                className={`legal-tab-btn ${activeTab === 'terms' ? 'active' : ''}`}
                onClick={() => setActiveTab('terms')}
              >
                <FileText size={14} />
                <span>Terms of Use</span>
              </button>
              <button
                type="button"
                className={`legal-tab-btn ${activeTab === 'privacy' ? 'active' : ''}`}
                onClick={() => setActiveTab('privacy')}
              >
                <ShieldCheck size={14} />
                <span>Privacy Policy</span>
              </button>
            </div>
          </div>

          {/* Modal Content Body */}
          <div className="legal-content-body custom-scrollbar">
            <AnimatePresence mode="wait">
              {activeTab === 'terms' ? (
                <motion.div
                  key="terms-content"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  className="legal-text-stack"
                >
                  <p className="legal-effective-date">Last Updated: August 2026</p>

                  <section className="legal-section">
                    <h4>1. Acceptance of Terms</h4>
                    <p>
                      By accessing or using Kodevio Agency OS, provided by Kodevio Limited, you agree to be bound by these Terms of Use and all applicable laws and regulations.
                    </p>
                  </section>

                  <section className="legal-section">
                    <h4>2. Agency OS Services & Fiverr Automation</h4>
                    <p>
                      Kodevio Agency OS automates agency workflows, buyer brief processing, and order management across designated platforms. You agree to use the services solely for lawful agency operations.
                    </p>
                  </section>

                  <section className="legal-section">
                    <h4>3. User Account Security</h4>
                    <p>
                      Workspace access is restricted to authorized Kodevio Limited team members. You are responsible for maintaining confidentiality of credentials and for all activities under your account.
                    </p>
                  </section>

                  <section className="legal-section">
                    <h4>4. Intellectual Property</h4>
                    <p>
                      All software, designs, graphics, and proprietary automation systems provided within Kodevio Agency OS remain the sole property of Kodevio Limited.
                    </p>
                  </section>

                  <section className="legal-section">
                    <h4>5. Contact & Support</h4>
                    <p>
                      For questions regarding these Terms, contact our workspace administration at <strong className="text-slate-900">admin@kodevio.com</strong>.
                    </p>
                  </section>
                </motion.div>
              ) : (
                <motion.div
                  key="privacy-content"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  className="legal-text-stack"
                >
                  <p className="legal-effective-date">Last Updated: August 2026</p>

                  <section className="legal-section">
                    <h4>1. Data Collection & Usage</h4>
                    <p>
                      Kodevio Limited collects work email addresses, agency workspace credentials, and automation configuration settings necessary to deliver order dispatching and analytics.
                    </p>
                  </section>

                  <section className="legal-section">
                    <h4>2. Data Security & Storage</h4>
                    <p>
                      All credentials, buyer brief data, and communications are encrypted at rest and in transit using enterprise-grade PostgreSQL security standards.
                    </p>
                  </section>

                  <section className="legal-section">
                    <h4>3. Third-Party Integrations</h4>
                    <p>
                      Data shared with integrated platforms (such as Fiverr buyer APIs or notification webhooks) is strictly limited to information required for order fulfillment.
                    </p>
                  </section>

                  <section className="legal-section">
                    <h4>4. Your Privacy Rights</h4>
                    <p>
                      Authorized workspace users may request data export or deletion at any time by contacting your system administrator.
                    </p>
                  </section>

                  <section className="legal-section">
                    <h4>5. Policy Updates</h4>
                    <p>
                      Kodevio Limited reserves the right to update this policy. Material updates will be notified in-app prior to taking effect.
                    </p>
                  </section>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer Action */}
          <div className="legal-modal-footer">
            <button
              type="button"
              onClick={onClose}
              className="folk-primary-btn legal-close-btn"
            >
              I Understand
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
