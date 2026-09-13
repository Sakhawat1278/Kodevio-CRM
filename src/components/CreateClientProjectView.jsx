import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  FolderPlus,
  DollarSign,
  Calendar,
  Clock,
  User,
  ShieldCheck,
  Globe,
  Tag,
  FileText,
  CheckCircle,
  ExternalLink,
  Layers,
  Sparkles,
  RotateCcw,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Code,
  Link,
  Heading,
  Save,
  Briefcase
} from 'lucide-react';
import CustomSelect from './common/CustomSelect';
import CustomDatePicker from './common/CustomDatePicker';
import { projectsApi } from '../api/client';

const defaultSalesPersons = [
  {
    name: 'MD Motiur Rahman Emon',
    id: '10022',
    designation: 'Jr. Sales Executive',
    phone: '+1 (555) 876-5432',
    avatarInitials: 'MMRE',
    department: 'SALES'
  },
  {
    name: 'Marcus Chen',
    id: 'EMP003',
    designation: 'Sales Manager',
    phone: '+880 1711-000003',
    avatarInitials: 'MC',
    department: 'SALES'
  },
  {
    name: 'Nina Roberts',
    id: 'EMP004',
    designation: 'Senior Sales Executive',
    phone: '+880 1711-000004',
    avatarInitials: 'NR',
    department: 'SALES'
  },
  {
    name: 'Sakhawat Hossain Sohan',
    id: '10023',
    designation: 'Sales Lead',
    phone: '+880 1712-345678',
    avatarInitials: 'SHS',
    department: 'SALES'
  },
  {
    name: 'Sophia Vance',
    id: '10024',
    designation: 'Client Relationship Closer',
    phone: '+1 (555) 321-9876',
    avatarInitials: 'SV',
    department: 'SALES'
  },
  {
    name: 'Alex Carter',
    id: '10025',
    designation: 'Strategic Accounts Sales Lead',
    phone: '+44 20 7946 0912',
    avatarInitials: 'AC',
    department: 'SALES'
  }
];

const defaultProjectManagers = [
  {
    name: 'Priya Sharma',
    id: 'EMP002',
    designation: 'Lead Project Manager'
  },
  {
    name: 'David Kim',
    id: 'EMP005',
    designation: 'Senior Project Manager'
  },
  {
    name: 'Sarah Jenkins',
    id: 'EMP008',
    designation: 'Technical Project Manager'
  },
  {
    name: 'MD Motiur Rahman Emon',
    id: '10022',
    designation: 'Project Delivery Lead'
  }
];

export default function CreateClientProjectView({
  client,
  sellerProfiles = [],
  onBack,
  onProjectCreated,
  onShowToast
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [salesPersonList, setSalesPersonList] = useState(defaultSalesPersons);
  const [projectManagerList, setProjectManagerList] = useState(defaultProjectManagers);

  const [selectedSalesPerson, setSelectedSalesPerson] = useState(() => {
    const clientSalesName = client?.sales_person_name || 'MD Motiur Rahman Emon';
    const found = defaultSalesPersons.find(
      (sp) => sp.name.toLowerCase() === clientSalesName.toLowerCase()
    );
    if (found) return found;
    return {
      name: clientSalesName,
      id: '10022',
      designation: 'Jr. Sales Executive',
      phone: client?.phone || '+1 (555) 876-5432',
      avatarInitials: clientSalesName.split(' ').map(n => n[0]).join('').slice(0, 4).toUpperCase(),
      department: 'SALES'
    };
  });

  // Load customized team members from database (strictly filtering Sales vs Project Managers)
  useEffect(() => {
    try {
      const stored = localStorage.getItem('kodevio_users_db');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // 1. Sales Department Team Members ONLY
          const salesUsers = parsed
            .filter((u) => {
              const dept = (u.department || '').trim().toUpperCase();
              const role = (u.role || '').trim().toLowerCase();
              const desig = (u.designation || '').trim().toLowerCase();
              return (
                dept === 'SALES' ||
                role === 'sales_executive' ||
                role === 'sales_manager' ||
                role.includes('sales') ||
                desig.includes('sales')
              );
            })
            .map((u, i) => ({
              name: u.full_name || u.name || 'Sales Executive',
              id: u.user_code || u.userCode || `100${25 + i}`,
              designation: u.designation || (u.role ? u.role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Sales Executive'),
              phone: u.phone || '+1 (555) 876-5432',
              avatarInitials: (u.full_name || u.name || 'SE').split(' ').map(n => n[0]).join('').slice(0, 4).toUpperCase(),
              department: 'SALES'
            }));

          const combinedSales = [...defaultSalesPersons];
          salesUsers.forEach((su) => {
            if (su.name && !combinedSales.some((c) => c.name.toLowerCase() === su.name.toLowerCase())) {
              combinedSales.push(su);
            }
          });
          setSalesPersonList(combinedSales);

          // 2. Project Managers Only
          const pmUsers = parsed
            .filter((u) => u.role === 'project_manager' || (u.designation && u.designation.toLowerCase().includes('project manager')) || (u.role && u.role.includes('project')))
            .map((u) => ({
              name: u.full_name || u.name,
              id: u.user_code || u.id,
              designation: u.designation || 'Project Manager'
            }));

          const combinedPMs = [...defaultProjectManagers];
          pmUsers.forEach((pu) => {
            if (pu.name && !combinedPMs.some((c) => c.name.toLowerCase() === pu.name.toLowerCase())) {
              combinedPMs.push(pu);
            }
          });
          setProjectManagerList(combinedPMs);

          const clientSalesName = client?.sales_person_name || 'MD Motiur Rahman Emon';
          const match = combinedSales.find(c => c.name.toLowerCase() === clientSalesName.toLowerCase());
          if (match) {
            setSelectedSalesPerson(match);
          }
        }
      }
    } catch (e) {
      console.warn('Note loading users in CreateClientProjectView:', e);
    }
  }, [client?.sales_person_name]);

  // Form State with client's assigned sales executive preselected, Project Manager unselected with placeholder
  const [formData, setFormData] = useState({
    title: '',
    orderNumber: `FO${Math.floor(10000000 + Math.random() * 90000000)}`,
    orderSource: '',
    category: '',
    projectManager: '',
    serviceLine: '',
    milestone: '',
    startDate: '',
    deliveryDate: '',
    budget: '',
    currency: '',
    percentage: '20',
    deliveryAmount: '0.00',
    scopeDescription: ''
  });

  const handleSalesPersonChange = (salesName) => {
    const found = salesPersonList.find((s) => s.name === salesName) || {
      name: salesName,
      id: `100${Math.floor(20 + Math.random() * 80)}`,
      designation: 'Sales Executive',
      phone: '+1 (555) 000-0000',
      avatarInitials: salesName.split(' ').map(n => n[0]).join('').slice(0, 4).toUpperCase()
    };
    setSelectedSalesPerson(found);
  };

  // Dynamic automatic calculation of Delivery Amount based on Budget and Percentage
  useEffect(() => {
    const budgetNum = parseFloat(formData.budget) || 0;
    const percentageNum = parseFloat(formData.percentage) || 0;
    if (budgetNum > 0) {
      const computedNet = budgetNum - (budgetNum * (percentageNum / 100));
      setFormData((prev) => ({
        ...prev,
        deliveryAmount: computedNet >= 0 ? computedNet.toFixed(2) : '0.00'
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        deliveryAmount: '0.00'
      }));
    }
  }, [formData.budget, formData.percentage]);

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  // Dynamic Deadline Duration Calculation based on Start & Delivery Date
  const calculateDeadlineDuration = () => {
    if (!formData.startDate && !formData.deliveryDate) {
      return {
        text: 'Select dates',
        sub: 'Choose start & delivery dates to compute turnaround time',
        isReady: false,
        isNegative: false
      };
    }
    if (!formData.startDate) {
      return {
        text: 'Pending Start Date',
        sub: 'Please select project start date',
        isReady: false,
        isNegative: false
      };
    }
    if (!formData.deliveryDate) {
      return {
        text: 'Pending Delivery Date',
        sub: 'Please select target delivery deadline',
        isReady: false,
        isNegative: false
      };
    }

    const start = new Date(formData.startDate + 'T00:00:00');
    const end = new Date(formData.deliveryDate + 'T00:00:00');
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        text: 'Invalid Timeline',
        sub: `Delivery date is ${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'} before start date`,
        isReady: false,
        isNegative: true
      };
    }
    if (diffDays === 0) {
      return {
        text: 'Same Day Delivery',
        sub: 'Turnaround within 24 hours',
        isReady: true,
        isNegative: false
      };
    }
    if (diffDays === 1) {
      return {
        text: '1 Day Turnaround',
        sub: '24 hour fast-track delivery schedule',
        isReady: true,
        isNegative: false
      };
    }
    return {
      text: `${diffDays} Days Timeline`,
      sub: `${diffDays}-day delivery window from ${new Date(formData.startDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} to ${new Date(formData.deliveryDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      isReady: true,
      isNegative: false
    };
  };

  // Scope formatting helper
  const handleFormatText = (prefix, suffix = '') => {
    const textarea = document.getElementById('project-scope-textarea');
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = formData.scopeDescription;
    const selectedText = text.substring(start, end) || 'text';
    const replacement = `${prefix}${selectedText}${suffix}`;
    const newText = text.substring(0, start) + replacement + text.substring(end);
    handleFieldChange('scopeDescription', newText);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!formData.title.trim()) {
      alert('Please provide a Project Title');
      return;
    }

    setIsSubmitting(true);
    const budgetVal = parseFloat(formData.budget) || 0;
    const deliveryVal = parseFloat(formData.deliveryAmount) || 0;

    const newProject = {
      id: `PRJ-${Math.floor(100 + Math.random() * 900)}`,
      projectCode: `${(formData.category || 'PRJ').substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
      title: formData.title.trim().toUpperCase(),
      orderNumber: formData.orderNumber,
      fiverrOrderId: formData.orderNumber,
      orderSource: formData.orderSource || 'Direct Offer',
      category: (formData.category || 'Web Development').toUpperCase(),
      serviceLine: formData.serviceLine || 'Frontend & Full Stack',
      service: (formData.serviceLine || 'FRONTEND').toUpperCase(),
      projectManager: formData.projectManager || 'Super Admin',
      salesPerson: selectedSalesPerson ? selectedSalesPerson.name : 'MD Motiur Rahman Emon',
      salesPersonId: selectedSalesPerson ? selectedSalesPerson.id : '10022',
      salesHandler: {
        name: selectedSalesPerson ? selectedSalesPerson.name : 'MD Motiur Rahman Emon',
        initials: selectedSalesPerson?.avatarInitials?.slice(0, 2) || 'MM',
        color: '#A855F7',
        id: selectedSalesPerson?.id || '10022'
      },
      opsHandler: {
        name: formData.projectManager || 'Super Admin',
        initials: (formData.projectManager || 'SA').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
        color: '#10B981'
      },
      devAssignees: [
        { name: 'MIR', initials: 'MT', color: '#3B82F6', designation: 'Frontend Developer' }
      ],
      milestone: (formData.milestone || 'Single Milestone').toUpperCase(),
      startDate: formData.startDate,
      deadlineDate: formData.deliveryDate,
      deliveryDate: formData.deliveryDate,
      budget: budgetVal,
      totalAmount: budgetVal,
      currency: formData.currency || 'USD',
      percentage: parseFloat(formData.percentage) || 20,
      deliveryAmount: deliveryVal,
      earnedAmount: deliveryVal,
      scopeDescription: formData.scopeDescription,
      notes: formData.scopeDescription,
      clientName: client?.name || 'Client',
      clientUsername: client?.username || client?.fiverr_username || 'client',
      clientId: client?.id,
      fiverrProfile: (client?.source_profile || 'Kodevio Software Studio').toUpperCase(),
      status: 'IN PROGRESS',
      priority: 'HIGH',
      createdAt: new Date().toISOString()
    };

    try {
      await projectsApi.createProject(newProject);
      try {
        const saved = localStorage.getItem('kodevio_projects_db');
        const list = saved ? JSON.parse(saved) : [];
        const updatedList = [newProject, ...(Array.isArray(list) ? list.filter(p => p.id !== newProject.id) : [])];
        localStorage.setItem('kodevio_projects_db', JSON.stringify(updatedList));
      } catch (e) {}
    } catch (err) {
      console.warn('Backend sync note:', err);
    }

    if (onProjectCreated) {
      onProjectCreated(newProject);
    }

    if (onShowToast) {
      onShowToast();
    }

    setIsSubmitting(false);
    if (onBack) {
      onBack();
    }
  };

  // Option Lists
  const orderSourceOptions = [
    'Fiverr',
    'Fiverr Pro Brief',
    'Upwork',
    'Direct Website',
    'Custom Offer',
    'Direct Outreach',
    'LinkedIn',
    'Referral'
  ];

  const categoryOptions = [
    'Web Development',
    'Mobile App',
    'Design',
    'Marketing',
    'SEO',
    'CMS',
    'Tips',
    'B2B - BD',
    'B2B - Global',
    'B2G - BD',
    'B2G - Global',
    'Other'
  ];

  const projectManagerOptions = projectManagerList.map((pm) => pm.name);

  const serviceLineOptions = [
    'UI/UX',
    'Frontend',
    'Backend',
    'Deployment',
    'UI/UX & Frontend',
    'UI/UX & Backend',
    'UI/UX & Deployment',
    'Frontend & Backend',
    'Frontend & Deployment',
    'Backend & Deployment',
    'UI/UX & Frontend & Backend',
    'UI/UX & Frontend & Deployment',
    'UI/UX & Backend & Deployment',
    'Frontend & Backend & Deployment',
    'UI/UX & Frontend & Backend & Deployment',
    'Wix',
    'Shopify',
    'Webflow',
    'WordPress',
    'SquareSpace',
    'Other'
  ];

  const milestoneOptions = [
    'Single Milestone',
    'Milestone 1 — Wireframes & UI Design',
    'Milestone 2 — Frontend Integration',
    'Milestone 3 — Backend & APIs',
    'Milestone 4 — Final QA & Handover',
    'Monthly Retainer'
  ];

  const currencyOptions = ['USD', 'EUR', 'GBP', 'CAD', 'AUD'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18 }}
      className="cpv-wrapper"
      style={{ minHeight: 'calc(100vh - 54px)', flex: 1, display: 'flex', flexDirection: 'column', width: '100%' }}
    >
      {/* 1. TOP CLIENT CONTEXT BANNER - Seamless Edge-to-Edge Strip */}
      <div className="cpv-context-banner">
        {/* Sales Executive Segment - Fully Dynamic & Changeable */}
        <div className="cpv-context-segment cpv-sales-segment">
          <div className="cpv-sales-avatar">
            <span>{selectedSalesPerson ? selectedSalesPerson.avatarInitials : 'SP'}</span>
          </div>
          <div className="cpv-segment-body">
            <div className="cpv-segment-tag-row">
              <span className="cpv-segment-tag text-blue-600">SALES PERSON</span>
              <span className="cpv-id-pill">{selectedSalesPerson ? selectedSalesPerson.id : '---'}</span>
            </div>
            
            <div className="cpv-sales-select-box">
              <CustomSelect
                value={selectedSalesPerson ? selectedSalesPerson.name : ''}
                onChange={handleSalesPersonChange}
                options={salesPersonList.map((s) => s.name)}
                placeholder="Select Sales Executive..."
              />
            </div>

            <div className="cpv-segment-sub">
              <span className="text-slate-500 font-medium">
                {selectedSalesPerson ? selectedSalesPerson.designation : 'Select sales executive'}
              </span>
              {selectedSalesPerson && (
                <>
                  <span className="cpv-meta-dot">•</span>
                  <span className="text-blue-600 font-semibold">{selectedSalesPerson.phone}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Client Profile Segment */}
        <div className="cpv-context-segment">
          <div className="cpv-segment-body">
            <div className="cpv-segment-tag-row">
              <span className="cpv-segment-tag text-indigo-600">CLIENT INFORMATION</span>
              <span className="cpv-platform-pill bg-indigo-50 text-indigo-700 border-indigo-200">FIVERR</span>
            </div>
            <h4 className="cpv-segment-title">@{client?.username || client?.fiverr_username || 'sophia_vanguard'}</h4>
            <div className="cpv-segment-sub">
              <span className="text-slate-400 font-bold uppercase text-[10px]">EMAIL</span>
              <span className="text-slate-700 font-semibold">{client?.email || 'sophia@vanguard.co'}</span>
            </div>
          </div>
        </div>

        {/* Source Profile Segment */}
        <div className="cpv-context-segment cpv-segment-last">
          <div className="cpv-segment-body">
            <div className="cpv-segment-tag-row">
              <span className="cpv-segment-tag text-emerald-600">SOURCE PROFILE</span>
              <span className="cpv-platform-pill bg-emerald-50 text-emerald-700 border-emerald-200">FIVERR</span>
            </div>
            <h4 className="cpv-segment-title">{client?.source_profile || 'Kodevio Software Studio'}</h4>
            <div className="cpv-segment-sub">
              <span className="text-slate-400 font-bold uppercase text-[10px]">PROFILE URL</span>
              <a
                href={client?.inbox_link || `https://www.fiverr.com/${client?.source_profile || 'Kodevio'}`}
                target="_blank"
                rel="noopener noreferrer"
                className="cpv-source-link"
              >
                <span>https://www.fiverr.com/{client?.source_profile || 'Kodevio'}</span>
                <ExternalLink size={11} />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* 2. FORM BODY - 2-COLUMN SIDE-BY-SIDE ROW */}
      <form
        onSubmit={handleSubmit}
        className="cpv-form-container"
        style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
      >
        <div className="cpv-two-col-layout" style={{ flex: 1 }}>
          {/* LEFT COLUMN: Essentials (Matching Image 1) */}
          <div className="cpv-section-card cpv-left-col">
            <div className="cpv-section-header">
              <div className="cpv-section-title-box">
                <div className="cpv-section-icon-badge icon-indigo">
                  <FolderPlus size={15} />
                </div>
                <div>
                  <h3 className="cpv-section-title">ESSENTIALS</h3>
                  <p className="cpv-section-sub">Core project identification, category, timeline, and financials</p>
                </div>
              </div>
            </div>

            <div className="cpv-form-grid">
              {/* Row 1: Title & Order Number */}
              <div className="cpv-field-group">
                <label className="cpv-label">
                  Project Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => handleFieldChange('title', e.target.value)}
                  placeholder="e.g. Website Redesign"
                  className="cpv-input font-bold"
                />
              </div>

              <div className="cpv-field-group">
                <label className="cpv-label">
                  Order Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.orderNumber}
                  onChange={(e) => handleFieldChange('orderNumber', e.target.value)}
                  placeholder="e.g. FO892014A9"
                  className="cpv-input font-mono font-bold text-slate-800"
                />
              </div>

              {/* Row 2: Order Source (Full Width) */}
              <div className="cpv-field-group cpv-col-span-2">
                <label className="cpv-label">
                  Order Source <span className="text-rose-500">*</span>
                </label>
                <CustomSelect
                  value={formData.orderSource}
                  onChange={(val) => handleFieldChange('orderSource', val)}
                  options={orderSourceOptions}
                  placeholder="Select Order Source"
                />
              </div>

              {/* Row 3: Project Manager & Category */}
              <div className="cpv-field-group">
                <label className="cpv-label">
                  Project Manager <span className="text-rose-500">*</span>
                </label>
                <CustomSelect
                  value={formData.projectManager}
                  onChange={(val) => handleFieldChange('projectManager', val)}
                  options={projectManagerOptions}
                  placeholder="Select Project Manager"
                />
              </div>

              <div className="cpv-field-group">
                <label className="cpv-label">
                  Category <span className="text-rose-500">*</span>
                </label>
                <CustomSelect
                  value={formData.category}
                  onChange={(val) => handleFieldChange('category', val)}
                  options={categoryOptions}
                  placeholder="Select Category"
                />
              </div>

              {/* Row 4: Service Line & Milestone */}
              <div className="cpv-field-group">
                <label className="cpv-label">
                  Service Line <span className="text-rose-500">*</span>
                </label>
                <CustomSelect
                  value={formData.serviceLine}
                  onChange={(val) => handleFieldChange('serviceLine', val)}
                  options={serviceLineOptions}
                  placeholder="Select Service Line"
                />
              </div>

              <div className="cpv-field-group">
                <label className="cpv-label">
                  Milestone <span className="text-rose-500">*</span>
                </label>
                <CustomSelect
                  value={formData.milestone}
                  onChange={(val) => handleFieldChange('milestone', val)}
                  options={milestoneOptions}
                  placeholder="Select Milestone"
                />
              </div>

              {/* Row 5: Start Date, Delivery Date */}
              <div className="cpv-field-group">
                <label className="cpv-label">Start Date</label>
                <CustomDatePicker
                  value={formData.startDate}
                  onChange={(val) => handleFieldChange('startDate', val)}
                  placeholder="Start Date"
                />
              </div>

              <div className="cpv-field-group">
                <label className="cpv-label">
                  Delivery Date <span className="text-rose-500">*</span>
                </label>
                <CustomDatePicker
                  value={formData.deliveryDate}
                  onChange={(val) => handleFieldChange('deliveryDate', val)}
                  placeholder="Target Deadline"
                />
              </div>

              {/* Row 6: Redesigned Clean Deadline Duration Banner */}
              <div className="cpv-field-group cpv-col-span-2">
                <label className="cpv-label">Deadline Duration</label>
                {(() => {
                  const duration = calculateDeadlineDuration();
                  return (
                    <div
                      className={`cpv-deadline-box ${
                        duration.isNegative
                          ? 'is-negative'
                          : duration.isReady
                          ? 'is-ready'
                          : 'is-pending'
                      }`}
                    >
                      <div className="cpv-deadline-left">
                        <div className="cpv-deadline-icon">
                          <Clock size={13} />
                        </div>
                        <div className="cpv-deadline-info">
                          <span className="cpv-deadline-main">{duration.text}</span>
                          <span className="cpv-deadline-sub">{duration.sub}</span>
                        </div>
                      </div>

                      {duration.isReady && (
                        <span className="cpv-deadline-status-pill">
                          Active Timeline
                        </span>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Row 7: Budget & Currency */}
              <div className="cpv-field-group">
                <label className="cpv-label">
                  Budget <span className="text-rose-500">*</span>
                </label>
                <div className="cpv-input-prefix-box">
                  <span className="cpv-input-prefix">$</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.budget}
                    onChange={(e) => handleFieldChange('budget', e.target.value)}
                    placeholder="0.00"
                    className="cpv-input cpv-input-has-prefix font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="cpv-field-group">
                <label className="cpv-label">Currency</label>
                <CustomSelect
                  value={formData.currency}
                  onChange={(val) => handleFieldChange('currency', val)}
                  options={currencyOptions}
                  placeholder="Select Currency"
                />
              </div>

              {/* Row 8: Percentage (%) & Delivery Amount */}
              <div className="cpv-field-group">
                <label className="cpv-label">Percentage (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.percentage}
                  onChange={(e) => handleFieldChange('percentage', e.target.value)}
                  placeholder="20"
                  className="cpv-input font-bold text-slate-800"
                />
              </div>

              <div className="cpv-field-group">
                <label className="cpv-label">
                  Delivery Amount <span className="text-rose-500">*</span>
                </label>
                <div className="cpv-input-prefix-box cpv-delivery-amount-box">
                  <span className="cpv-input-prefix text-emerald-700">$</span>
                  <input
                    type="text"
                    readOnly
                    value={formData.deliveryAmount}
                    className="cpv-input cpv-input-has-prefix font-extrabold text-emerald-800 bg-emerald-50/60 border-emerald-300"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Project Scope & Description (Matching Image 2) */}
          <div className="cpv-section-card cpv-right-col">
            <div className="cpv-section-header">
              <div className="cpv-section-title-box">
                <div className="cpv-section-icon-badge icon-emerald">
                  <FileText size={15} />
                </div>
                <div>
                  <h3 className="cpv-section-title">Project Scope & Description</h3>
                  <p className="cpv-section-sub">Comprehensive brief, functional requirements, and milestone objectives</p>
                </div>
              </div>
            </div>

            {/* Scope Editor Toolbar & Workspace */}
            <div className="cpv-editor-wrapper cpv-editor-full-height">
              <div className="cpv-editor-toolbar">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleFormatText('**', '**')}
                    className="cpv-toolbar-btn"
                    title="Bold"
                  >
                    <Bold size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFormatText('*', '*')}
                    className="cpv-toolbar-btn"
                    title="Italic"
                  >
                    <Italic size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFormatText('<u>', '</u>')}
                    className="cpv-toolbar-btn"
                    title="Underline"
                  >
                    <Underline size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFormatText('~~', '~~')}
                    className="cpv-toolbar-btn"
                    title="Strikethrough"
                  >
                    <Strikethrough size={13} />
                  </button>
                </div>

                <div className="cpv-toolbar-divider" />

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleFormatText('### ')}
                    className="cpv-toolbar-btn"
                    title="Heading"
                  >
                    <Heading size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFormatText('- ')}
                    className="cpv-toolbar-btn"
                    title="Bullet List"
                  >
                    <List size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFormatText('1. ')}
                    className="cpv-toolbar-btn"
                    title="Numbered List"
                  >
                    <ListOrdered size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFormatText('`', '`')}
                    className="cpv-toolbar-btn"
                    title="Code Inline"
                  >
                    <Code size={13} />
                  </button>
                </div>

                <div className="cpv-toolbar-divider" />

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleFormatText('[Link Title](', ')')}
                    className="cpv-toolbar-btn"
                    title="Insert Link"
                  >
                    <Link size={13} />
                  </button>
                </div>
              </div>

              {/* Scope Textarea */}
              <textarea
                id="project-scope-textarea"
                value={formData.scopeDescription}
                onChange={(e) => handleFieldChange('scopeDescription', e.target.value)}
                placeholder="Start typing project description, technical scope, milestones, deliverables, tech stack, and staging links..."
                className="cpv-scope-textarea cpv-textarea-expand"
              />

              <div className="cpv-editor-footer">
                <span className="text-[11px] text-slate-500">Markdown formatting supported</span>
                <span className="text-[11px] font-semibold text-slate-600">
                  {formData.scopeDescription.length} characters
                </span>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* 3. STICKY ACTION FOOTER */}
      <div className="cpv-sticky-footer">
        <div className="cpv-footer-left">
          <button
            type="button"
            onClick={onBack}
            className="cdp-btn-discard"
            title="Return to Client Details"
          >
            <ArrowLeft size={13} />
            <span>Cancel</span>
          </button>
        </div>

        <div className="cpv-footer-right">
          <button
            type="button"
            onClick={() => {
              setFormData({
                title: '',
                orderNumber: `FO${Math.floor(10000000 + Math.random() * 90000000)}`,
                orderSource: client?.source || 'Fiverr',
                category: client?.category || 'Web Development',
                projectManager: client?.sales_person_name || 'MD Motiur Rahman Emon',
                serviceLine: 'Frontend & Full Stack',
                milestone: 'Single Milestone',
                startDate: new Date().toISOString().split('T')[0],
                deliveryDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
                budget: '1200',
                currency: 'USD',
                percentage: '20',
                deliveryAmount: '960',
                scopeDescription: ''
              });
            }}
            className="cdp-btn-discard"
            title="Reset form fields"
          >
            <RotateCcw size={13} />
            <span>Reset Form</span>
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="cdp-btn-save-primary"
            title="Submit project creation"
          >
            <Save size={14} />
            <span>{isSubmitting ? 'Creating Project…' : 'Create Project'}</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
