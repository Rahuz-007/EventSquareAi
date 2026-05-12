import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Lock, Save, Camera } from 'lucide-react';
import { useForm } from 'react-hook-form';
import useAuthStore from '../../store/authStore';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';

const ProfilePage = () => {
  const { user, updateUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues: { name: user?.name, phone: user?.phone, avatar: user?.avatar } });
  const { register: regPw, handleSubmit: handlePw, formState: { errors: pwErrors }, reset: resetPw } = useForm();

  const onProfileSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await authAPI.updateProfile(data);
      updateUser(res.data);
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(err.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const onPasswordSubmit = async (data) => {
    if (data.newPassword !== data.confirmPassword) { toast.error('Passwords do not match'); return; }
    setPwLoading(true);
    try {
      await authAPI.changePassword({ currentPassword: data.currentPassword, newPassword: data.newPassword });
      toast.success('Password changed successfully!');
      resetPw();
    } catch (err) {
      toast.error(err.message || 'Failed to change password');
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white">My Profile</h1>
        <p className="text-slate-400 text-sm">Manage your account settings</p>
      </div>

      {/* Avatar */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center text-white text-3xl font-black shadow-glow-primary">
              {user?.avatar ? <img src={user.avatar} alt="Avatar" className="w-full h-full rounded-2xl object-cover" /> : user?.name?.charAt(0)?.toUpperCase()}
            </div>
          </div>
          <div>
            <h2 className="text-white font-bold text-lg">{user?.name}</h2>
            <p className="text-slate-400 text-sm">{user?.email}</p>
            <span className="badge-primary mt-1 capitalize">{user?.role}</span>
          </div>
        </div>
      </div>

      {/* Profile form */}
      <div className="glass-card p-6">
        <h3 className="text-white font-bold mb-5">Personal Information</h3>
        <form onSubmit={handleSubmit(onProfileSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-2">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input {...register('name', { required: true })} className="input-dark pl-10" placeholder="Full name" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-2">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input {...register('phone')} className="input-dark pl-10" placeholder="+91 98765 43210" type="tel" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-2">Avatar URL</label>
            <div className="relative">
              <Camera className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input {...register('avatar')} className="input-dark pl-10" placeholder="https://..." type="url" />
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary py-3 px-6 flex items-center gap-2 disabled:opacity-50">
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save size={16} /> Save Changes</>}
          </button>
        </form>
      </div>

      {/* Password change */}
      <div className="glass-card p-6">
        <h3 className="text-white font-bold mb-5">Change Password</h3>
        <form onSubmit={handlePw(onPasswordSubmit)} className="space-y-4">
          {[
            { name: 'currentPassword', label: 'Current Password' },
            { name: 'newPassword', label: 'New Password', rules: { minLength: { value: 8, message: 'Min 8 characters' } } },
            { name: 'confirmPassword', label: 'Confirm New Password' },
          ].map(({ name, label, rules = {} }) => (
            <div key={name}>
              <label className="block text-sm text-slate-300 mb-2">{label}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input {...regPw(name, { required: true, ...rules })} type="password" className="input-dark pl-10" placeholder="••••••••" />
              </div>
              {pwErrors[name] && <p className="text-red-400 text-xs mt-1">{pwErrors[name].message || `${label} is required`}</p>}
            </div>
          ))}
          <button type="submit" disabled={pwLoading} className="btn-secondary py-3 px-6 flex items-center gap-2 disabled:opacity-50">
            {pwLoading ? <div className="w-4 h-4 border-2 border-primary-400/30 border-t-primary-400 rounded-full animate-spin" /> : <><Lock size={16} /> Update Password</>}
          </button>
        </form>
      </div>

      {/* Account info */}
      <div className="glass-card p-6">
        <h3 className="text-white font-bold mb-4">Account Details</h3>
        <div className="space-y-3">
          {[
            { label: 'Email', value: user?.email },
            { label: 'Role', value: user?.role, capitalize: true },
            { label: 'Member Since', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A' },
            { label: 'Account Status', value: user?.isActive ? 'Active' : 'Inactive' },
          ].map(({ label, value, capitalize }) => (
            <div key={label} className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="text-slate-400 text-sm">{label}</span>
              <span className={`text-white text-sm font-medium ${capitalize ? 'capitalize' : ''}`}>{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
