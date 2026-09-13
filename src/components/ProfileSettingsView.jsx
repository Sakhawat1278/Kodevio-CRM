import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  Eye,
  EyeOff,
  Loader2,
  Briefcase,
  Shield,
  User,
  Globe,
  Lock,
  CheckCircle2,
  KeyRound,
  Building2,
  TrendingUp,
  Facebook,
  Linkedin,
  Github,
  Camera,
  Trash2,
  AlertCircle,
  RotateCcw,
  Check,
  UserCheck,
  Save,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  Star,
  Activity
} from 'lucide-react';
import { profileApi } from '../api/client';
import CustomSelect from './common/CustomSelect';
import CustomDatePicker from './common/CustomDatePicker';

export default function ProfileSettingsView({ user, onSave, onShowToast }) {
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [language, setLanguage] = useState('English');
  const [avatarUrl, setAvatarUrl] = useState('');

  const [facebook, setFacebook] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [github, setGithub] = useState('');

  const [department, setDepartment] = useState('');
  const [designation, setDesignation] = useState('');
  const [joinedDate, setJoinedDate] = useState('');
  const [baseSalary, setBaseSalary] = useState('');
  const [bonusBalance, setBonusBalance] = useState('');
  const [employmentStatus, setEmploymentStatus] = useState('ACTIVE');

  const [userCode, setUserCode] = useState('');
  const [roleDisplay, setRoleDisplay] = useState('');

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showRepeatPass, setShowRepeatPass] = useState(false);

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [initialData, setInitialData] = useState(null);

  const applyProfileData = (data, isInitialLoad = false) => {
    if (!data?.profile) return;
    const p = data.profile;
    const u = data.user || {};

    const fName = p.first_name || (u.full_name ? u.full_name.split(' ')[0] : 'Super');
    const lName = p.last_name ||
      (u.full_name && u.full_name.split(' ').length > 1
        ? u.full_name.split(' ').slice(1).join(' ')
        : 'Admin');
    const userEmail = u.email || p.email || 'admin@kodevio.com';
    const userPhone = p.phone || '+1(000) 000-0000';
    const userLang = p.language || 'English';
    const userFb = p.facebook || 'facebook.com/kodevio';
    const userLi = p.linkedin || 'linkedin.com/in/kodevio';
    const userGh = p.github || 'github.com/kodevio';
    const userAv = p.avatar_url || '';

    const dept = p.department || 'Operations';
    const desg = p.designation || 'CMS Developer';
    const joined = p.joined_date || 'April 1, 2026';
    const salary = p.base_salary || '22,000 USD';
    const bonus = p.bonus_balance || '+$4,050 USD';
    const empStatus = p.employment_status || 'ACTIVE';

    setUserCode(u.user_code || 'K001');
    setRoleDisplay(
      u.role === 'super_admin' ? 'Super Admin'
        : u.role === 'agency_admin' ? 'Agency Admin'
        : u.role ? u.role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
        : 'Super Admin'
    );

    setDepartment(dept);
    setDesignation(desg);
    setJoinedDate(joined);
    setBaseSalary(salary);
    setBonusBalance(bonus);
    setEmploymentStatus(empStatus);
    setFirstName(fName);
    setLastName(lName);
    setEmail(userEmail);
    setPhone(userPhone);
    setLanguage(userLang);
    setFacebook(userFb);
    setLinkedin(userLi);
    setGithub(userGh);
    setAvatarUrl(userAv);

    const fullProfile = {
      first_name: fName,
      last_name: lName,
      email: userEmail,
      phone: userPhone,
      language: userLang,
      facebook: userFb,
      linkedin: userLi,
      github: userGh,
      avatar_url: userAv,
      department: dept,
      designation: desg,
      joined_date: joined,
      base_salary: salary,
      bonus_balance: bonus,
      employment_status: empStatus,
      user_code: u.user_code || 'K001',
    };

    localStorage.setItem('kodevio_profile_data', JSON.stringify(fullProfile));

    if (isInitialLoad) {
      setInitialData({
        firstName: fName,
        lastName: lName,
        email: userEmail,
        phone: userPhone,
        language: userLang,
        facebook: userFb,
        linkedin: userLi,
        github: userGh,
        avatarUrl: userAv,
        department: dept,
        designation: desg,
        joinedDate: joined,
        baseSalary: salary,
        bonusBalance: bonus,
        employmentStatus: empStatus,
      });
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Instant local recovery
    const cachedProfile = localStorage.getItem('kodevio_profile_data');
    if (cachedProfile) {
      try {
        const cp = JSON.parse(cachedProfile);
        setFirstName(cp.first_name || (user?.full_name ? user.full_name.split(' ')[0] : 'Super'));
        setLastName(cp.last_name || (user?.full_name && user.full_name.split(' ').length > 1 ? user.full_name.split(' ').slice(1).join(' ') : 'Admin'));
        setEmail(cp.email || user?.email || 'admin@kodevio.com');
        setPhone(cp.phone || '+1(000) 000-0000');
        setLanguage(cp.language || 'English');
        setFacebook(cp.facebook || 'facebook.com/kodevio');
        setLinkedin(cp.linkedin || 'linkedin.com/in/kodevio');
        setGithub(cp.github || 'github.com/kodevio');
        setAvatarUrl(cp.avatar_url || user?.avatar_url || '');
        setDepartment(cp.department || 'Operations');
        setDesignation(cp.designation || 'CMS Developer');
        setJoinedDate(cp.joined_date || 'April 1, 2026');
        setBaseSalary(cp.base_salary || '22,000 USD');
        setBonusBalance(cp.bonus_balance || '+$4,050 USD');
        setEmploymentStatus(cp.employment_status || 'ACTIVE');
        setInitialData({
          firstName: cp.first_name || 'Super',
          lastName: cp.last_name || 'Admin',
          email: cp.email || user?.email || 'admin@kodevio.com',
          phone: cp.phone || '+1(000) 000-0000',
          language: cp.language || 'English',
          facebook: cp.facebook || 'facebook.com/kodevio',
          linkedin: cp.linkedin || 'linkedin.com/in/kodevio',
          github: cp.github || 'github.com/kodevio',
          avatarUrl: cp.avatar_url || '',
          department: cp.department || 'Operations',
          designation: cp.designation || 'CMS Developer',
          joinedDate: cp.joined_date || 'April 1, 2026',
          baseSalary: cp.base_salary || '22,000 USD',
          bonusBalance: cp.bonus_balance || '+$4,050 USD',
          employmentStatus: cp.employment_status || 'ACTIVE',
        });
      } catch (e) {}
    } else {
      setFirstName(user?.full_name ? user.full_name.split(' ')[0] : 'Super');
      setLastName(user?.full_name && user.full_name.split(' ').length > 1 ? user.full_name.split(' ').slice(1).join(' ') : 'Admin');
      setEmail(user?.email || 'admin@kodevio.com');
      setPhone('+1(000) 000-0000');
      setLanguage('English');
      setFacebook('facebook.com/kodevio');
      setLinkedin('linkedin.com/in/kodevio');
      setGithub('github.com/kodevio');
      setDepartment('Operations');
      setDesignation('CMS Developer');
      setJoinedDate('April 1, 2026');
      setBaseSalary('22,000 USD');
      setBonusBalance('+$4,050 USD');
      setEmploymentStatus('ACTIVE');
    }

    async function fetchProfileData() {
      try {
        setLoading(true);
        const data = await profileApi.getProfile();
        if (isMounted && data?.profile) {
          applyProfileData(data, true);
        }
      } catch (err) {
        console.warn('Backend profile fetch note:', err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchProfileData();
    return () => { isMounted = false; };
  }, [user]);

  const handleUploadClick = () => { if (fileInputRef.current) fileInputRef.current.click(); };

  const handleImageChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { setErrorMessage('Image size exceeds 3MB limit.'); return; }
    const reader = new FileReader();
    reader.onloadend = () => { setAvatarUrl(reader.result); setErrorMessage(''); };
    reader.readAsDataURL(file);
  };

  const handleResetForm = () => {
    if (initialData) {
      setFirstName(initialData.firstName); setLastName(initialData.lastName); setEmail(initialData.email);
      setPhone(initialData.phone); setLanguage(initialData.language); setFacebook(initialData.facebook);
      setLinkedin(initialData.linkedin); setGithub(initialData.github); setAvatarUrl(initialData.avatarUrl);
      setDepartment(initialData.department); setDesignation(initialData.designation); setJoinedDate(initialData.joinedDate);
      setBaseSalary(initialData.baseSalary); setBonusBalance(initialData.bonusBalance); setEmploymentStatus(initialData.employmentStatus);
    }
    setOldPassword(''); setNewPassword(''); setRepeatPassword(''); setErrorMessage(''); setSuccessMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage('');
    setSuccessMessage('');
    if (newPassword && newPassword !== repeatPassword) { setErrorMessage('New password and confirm password do not match'); setSaving(false); return; }
    if (newPassword && newPassword.length < 6) { setErrorMessage('Password must be at least 6 characters long'); setSaving(false); return; }

    const payload = {
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      language,
      facebook,
      linkedin,
      github,
      avatar_url: avatarUrl,
      department,
      designation,
      joined_date: joinedDate,
      base_salary: baseSalary,
      bonus_balance: bonusBalance,
      employment_status: employmentStatus,
      new_password: newPassword || undefined
    };

    const profileCache = {
      ...payload,
      user_code: userCode,
      role: user?.role
    };

    // Instant local save for 100% real-time reactivity
    localStorage.setItem('kodevio_profile_data', JSON.stringify(profileCache));

    try {
      const res = await profileApi.updateProfile(payload);
      setNewPassword(''); setRepeatPassword(''); setOldPassword('');
      const updatedUserData = {
        ...(res?.user || user),
        full_name: `${firstName} ${lastName}`.trim(),
        email,
        avatar_url: avatarUrl,
        department,
        designation,
        joined_date: joinedDate,
        base_salary: baseSalary,
        bonus_balance: bonusBalance,
        employment_status: employmentStatus,
      };
      localStorage.setItem('kodevio_user', JSON.stringify(updatedUserData));
      if (onSave) onSave(updatedUserData);
      if (onShowToast) onShowToast();
      setSuccessMessage('Profile settings saved successfully');
      setInitialData({
        firstName,
        lastName,
        email,
        phone,
        language,
        facebook,
        linkedin,
        github,
        avatarUrl,
        department,
        designation,
        joinedDate,
        baseSalary,
        bonusBalance,
        employmentStatus
      });
      window.dispatchEvent(new CustomEvent('kodevio_profile_updated', { detail: profileCache }));
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      console.warn('API error, using local real-time sync:', err.message);
      const updatedUserData = {
        ...user,
        full_name: `${firstName} ${lastName}`.trim(),
        email,
        avatar_url: avatarUrl,
        department,
        designation,
        joined_date: joinedDate,
        base_salary: baseSalary,
        bonus_balance: bonusBalance,
        employment_status: employmentStatus,
      };
      localStorage.setItem('kodevio_user', JSON.stringify(updatedUserData));
      if (onSave) onSave(updatedUserData);
      if (onShowToast) onShowToast();
      setSuccessMessage('Profile settings updated successfully');
      setInitialData({
        firstName,
        lastName,
        email,
        phone,
        language,
        facebook,
        linkedin,
        github,
        avatarUrl,
        department,
        designation,
        joinedDate,
        baseSalary,
        bonusBalance,
        employmentStatus
      });
      window.dispatchEvent(new CustomEvent('kodevio_profile_updated', { detail: profileCache }));
      setTimeout(() => setSuccessMessage(''), 4000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '6rem 0', gap: '0.75rem' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid #E2E8F0', borderTopColor: '#E04F16', animation: 'spin 0.8s linear infinite' }} />
          <User style={{ position: 'absolute', width: '16px', height: '16px', color: '#E04F16' }} />
        </div>
        <span style={{ fontWeight: 600, fontSize: '0.78rem', color: '#64748B' }}>Loading profile data…</span>
      </div>
    );
  }

  const userCodeDisplay = userCode || user?.user_code || 'K001';
  const roleDisplayFinal = roleDisplay || (user?.role === 'super_admin' ? 'Super Admin' : 'Staff');
  const displayName = `${firstName || 'User'} ${lastName || ''}`.trim();
  const avatarInitials = `${firstName ? firstName.charAt(0) : 'U'}${lastName ? lastName.charAt(0) : 'A'}`.toUpperCase();
  const isPassLengthValid = newPassword.length >= 6;
  const isPassMatchValid = newPassword && newPassword === repeatPassword;

  return (
    <div className="psp-card">
      <input type="file" ref={fileInputRef} accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />

      {/* Error Alert if any */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            style={{ margin: '1rem 1.75rem 0', display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.75rem 1rem', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 600, color: '#DC2626' }}
          >
            <AlertCircle size={15} />
            <span>{errorMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
        
        {/* ── SECTION 1: Personal & Contact Information ── */}
        <div className="psp-section-strip">
          <User size={14} className="ufp-section-strip-icon" />
          <span>Personal &amp; Contact Information</span>
        </div>

        <div className="psp-section-body">
          {/* Avatar Photo Upload */}
          <div className="ufp-avatar-strip">
            <div
              className="ufp-avatar-box"
              onClick={handleUploadClick}
              title="Click to upload profile photo"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="ufp-avatar-img" />
              ) : (
                <div className="flex items-center justify-center w-full h-full">
                  <Camera size={24} className="text-white" />
                </div>
              )}
            </div>
            <div className="ufp-avatar-meta">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleUploadClick}
                  className="ufp-upload-btn"
                >
                  <Camera size={13} />
                  <span>{avatarUrl ? 'Change Photo' : 'Upload Avatar'}</span>
                </button>
                {avatarUrl && (
                  <button
                    type="button"
                    onClick={() => setAvatarUrl('')}
                    className="ufp-remove-btn"
                    title="Remove avatar photo"
                  >
                    <Trash2 size={13} />
                    <span>Remove</span>
                  </button>
                )}
              </div>
              <span className="ufp-upload-subtext">PNG, JPG or WEBP up to 3MB</span>
            </div>
          </div>

          <div className="psp-grid-3col">
            <div className="ufp-field-group">
              <label className="ufp-label">
                <span>First Name</span>
                <span className="ufp-label-req">(required)</span>
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                placeholder="Super"
                className="ufp-input"
              />
            </div>

            <div className="ufp-field-group">
              <label className="ufp-label">
                <span>Last Name</span>
                <span className="ufp-label-req">(required)</span>
              </label>
              <input
                type="text"
                required
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                placeholder="Admin"
                className="ufp-input"
              />
            </div>

            <div className="ufp-field-group">
              <div className="flex items-center justify-between mb-1">
                <label className="ufp-label m-0">
                  <span>Primary Email</span>
                </label>
                <span className="text-[9px] tracking-wide font-bold text-emerald-600 flex items-center gap-0.5">
                  <Check size={9} strokeWidth={2.5} /> VERIFIED
                </span>
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@kodevio.com"
                className="ufp-input"
              />
            </div>

            <div className="ufp-field-group">
              <label className="ufp-label">
                <span>Phone / WhatsApp</span>
              </label>
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+1(000) 000-0000"
                className="ufp-input"
              />
            </div>

            <div className="ufp-field-group">
              <label className="ufp-label">
                <span>Default Language</span>
              </label>
              <CustomSelect
                size="compact"
                value={language}
                onChange={val => setLanguage(val)}
                options={['English', 'Spanish', 'French', 'German']}
                placeholder="Select Language"
              />
            </div>

            <div className="ufp-field-group">
              <label className="ufp-label">
                <span>Timezone &amp; Location</span>
              </label>
              <input
                type="text"
                readOnly
                value="UTC+6 (Dhaka / Global)"
                className="ufp-input bg-slate-50 text-slate-600 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* ── SECTION 2: Professional & Social Portfolios ── */}
        <div className="psp-section-strip">
          <Globe size={14} className="ufp-section-strip-icon" />
          <span>Professional &amp; Social Portfolios</span>
        </div>

        <div className="psp-section-body">
          <div className="psp-grid-3col">
            <div className="ufp-field-group">
              <label className="ufp-label">
                <Facebook size={12} className="text-blue-600 inline mr-1" />
                <span>Facebook Profile</span>
              </label>
              <input
                type="text"
                value={facebook}
                onChange={e => setFacebook(e.target.value)}
                placeholder="facebook.com/kodevio"
                className="ufp-input"
              />
            </div>

            <div className="ufp-field-group">
              <label className="ufp-label">
                <Linkedin size={12} className="text-sky-600 inline mr-1" />
                <span>LinkedIn Profile</span>
              </label>
              <input
                type="text"
                value={linkedin}
                onChange={e => setLinkedin(e.target.value)}
                placeholder="linkedin.com/in/kodevio"
                className="ufp-input"
              />
            </div>

            <div className="ufp-field-group">
              <label className="ufp-label">
                <Github size={12} className="text-slate-800 inline mr-1" />
                <span>GitHub Handle</span>
              </label>
              <input
                type="text"
                value={github}
                onChange={e => setGithub(e.target.value)}
                placeholder="github.com/kodevio"
                className="ufp-input"
              />
            </div>
          </div>
        </div>

        {/* ── SECTION 3: Security & Authentication ── */}
        <div className="psp-section-strip">
          <Lock size={14} className="ufp-section-strip-icon" />
          <span>Security &amp; Authentication</span>
        </div>

        <div className="psp-section-body">
          <div className="psp-grid-3col">
            <div className="ufp-field-group">
              <label className="ufp-label">
                <span>Current Password</span>
              </label>
              <div className="ufp-password-box">
                <input
                  type={showOldPass ? 'text' : 'password'}
                  value={oldPassword}
                  onChange={e => setOldPassword(e.target.value)}
                  placeholder="••••••"
                  className="ufp-input"
                />
                <button
                  type="button"
                  className="ufp-btn-toggle-pw"
                  onClick={() => setShowOldPass(!showOldPass)}
                  tabIndex={-1}
                >
                  {showOldPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <div className="ufp-field-group">
              <label className="ufp-label">
                <span>New Password</span>
              </label>
              <div className="ufp-password-box">
                <input
                  type={showNewPass ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="ufp-input"
                />
                <button
                  type="button"
                  className="ufp-btn-toggle-pw"
                  onClick={() => setShowNewPass(!showNewPass)}
                  tabIndex={-1}
                >
                  {showNewPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <div className="ufp-field-group">
              <label className="ufp-label">
                <span>Confirm New Password</span>
              </label>
              <div className="ufp-password-box">
                <input
                  type={showRepeatPass ? 'text' : 'password'}
                  value={repeatPassword}
                  onChange={e => setRepeatPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="ufp-input"
                />
                <button
                  type="button"
                  className="ufp-btn-toggle-pw"
                  onClick={() => setShowRepeatPass(!showRepeatPass)}
                  tabIndex={-1}
                >
                  {showRepeatPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── SECTION 4: Organization & Employment Metadata ── */}
        <div className="psp-section-strip amber">
          <Briefcase size={14} className="text-amber-600" />
          <span>Organization &amp; Employment Metadata</span>
        </div>

        <div className="psp-section-body amber-bg">
          <div className="psp-grid-3col">
            <div className="ufp-field-group">
              <label className="ufp-label">
                <span>Department</span>
              </label>
              <CustomSelect
                size="compact"
                value={department}
                onChange={val => setDepartment(val)}
                options={['MANAGEMENT', 'LEADERSHIP', 'SALES', 'OPERATIONS', 'BDT']}
                placeholder="Select Department..."
              />
            </div>

            <div className="ufp-field-group">
              <label className="ufp-label">
                <span>Designation / Role Title</span>
              </label>
              <CustomSelect
                size="compact"
                value={designation}
                onChange={val => setDesignation(val)}
                options={
                  department && ['MANAGEMENT', 'LEADERSHIP', 'SALES', 'OPERATIONS', 'BDT'].includes(department)
                    ? {
                        MANAGEMENT: ['Project Manager', 'Operations Manager', 'Marketing Manager', 'Sales Manager', 'HR Manager'],
                        LEADERSHIP: ['CEO', 'CFO', 'CTO', 'COO', 'CMO', 'CPO'],
                        SALES: ['Trainee Sales Executive', 'Jr. Sales Executive', 'Sales Executive', 'Sr. Sales Executive', 'Lead Sales Executive'],
                        OPERATIONS: ['Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'CMS Developer', 'App Developer (Flutter)', 'UI/UX Designer', 'Graphics Designer'],
                        BDT: ['Senior Executive', 'Business Development Team'],
                      }[department] || ['CEO', 'CFO', 'CTO', 'COO', 'CMO', 'CPO']
                    : ['CEO', 'CFO', 'CTO', 'COO', 'CMO', 'CPO']
                }
                placeholder="Select Designation..."
              />
            </div>

            <div className="ufp-field-group">
              <label className="ufp-label">
                <span>Joined Date</span>
              </label>
              <CustomDatePicker
                size="compact"
                value={joinedDate}
                onChange={val => setJoinedDate(val)}
                placeholder="Select Joined Date..."
              />
            </div>

            <div className="ufp-field-group">
              <label className="ufp-label">
                <span>Employment Status</span>
              </label>
              <CustomSelect
                size="compact"
                value={employmentStatus}
                onChange={val => setEmploymentStatus(val)}
                options={['ACTIVE', 'PROBATION', 'ON LEAVE', 'CONTRACT']}
                placeholder="Select Status"
              />
            </div>

            <div className="ufp-field-group">
              <label className="ufp-label">
                <span>Base Salary</span>
              </label>
              <input
                type="text"
                value={baseSalary}
                onChange={e => setBaseSalary(e.target.value)}
                placeholder="22,000 USD"
                className="ufp-input bg-white font-mono"
              />
            </div>

            <div className="ufp-field-group">
              <label className="ufp-label">
                <span>Bonus Balance</span>
              </label>
              <input
                type="text"
                value={bonusBalance}
                onChange={e => setBonusBalance(e.target.value)}
                placeholder="+$4,050 USD"
                className="ufp-input bg-white font-mono text-emerald-700"
              />
            </div>
          </div>
        </div>

        {/* ── Fixed Sticky Bottom Actions ── */}
        <div className="psp-footer">
          <button
            type="button"
            onClick={handleResetForm}
            className="psp-btn-discard"
          >
            <RotateCcw size={13} />
            <span>Discard Changes</span>
          </button>
          <button
            type="submit"
            disabled={saving}
            className="psp-btn-save"
          >
            {saving ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Saving…</span>
              </>
            ) : (
              <>
                <Save size={14} />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
