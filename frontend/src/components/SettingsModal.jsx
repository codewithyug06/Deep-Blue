import React, { useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

// --- ICONS ---
const Icons = {
    User: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
    Lock: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
    Alert: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
    Check: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
    Close: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
};

const SettingsModal = ({ user, onClose, onLogout }) => {
    const [activeTab, setActiveTab] = useState('general');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // --- FORM STATES ---
    const [username, setUsername] = useState(user.username || '');
    const [email, setEmail] = useState(user.email || '');
    
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    
    const [deletePassword, setDeletePassword] = useState('');

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });
        try {
            await axios.post('http://localhost:8000/settings/update-profile', {
                user_id: user.id,
                new_username: username,
                new_email: email
            });
            setMessage({ type: 'success', text: 'Profile updated successfully.' });
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.detail || 'Update failed.' });
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmNewPassword) {
            setMessage({ type: 'error', text: 'New passwords do not match.' });
            return;
        }
        setLoading(true);
        setMessage({ type: '', text: '' });
        try {
            await axios.post('http://localhost:8000/settings/change-password', {
                user_id: user.id,
                old_password: currentPassword,
                new_password: newPassword
            });
            setMessage({ type: 'success', text: 'Security key updated.' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmNewPassword('');
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.detail || 'Change failed.' });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAccount = async (e) => {
        e.preventDefault();
        if (!window.confirm("Are you absolutely sure? This action is irreversible.")) return;
        
        setLoading(true);
        try {
            await axios.delete('http://localhost:8000/settings/delete-account', {
                data: { user_id: user.id, password: deletePassword }
            });
            alert("Account terminated.");
            onLogout();
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.detail || 'Termination failed.' });
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm font-sans" onClick={onClose}>
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-2xl bg-[#0a0f1e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[500px]"
            >
                {/* --- SIDEBAR TABS --- */}
                <div className="w-full md:w-48 bg-black/20 border-b md:border-b-0 md:border-r border-white/5 p-4 flex flex-row md:flex-col gap-2">
                    <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 px-2 hidden md:block">Settings</h2>
                    
                    <button onClick={() => { setActiveTab('general'); setMessage({type:'',text:''}); }} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${activeTab === 'general' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                        <Icons.User /> General
                    </button>
                    <button onClick={() => { setActiveTab('security'); setMessage({type:'',text:''}); }} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${activeTab === 'security' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                        <Icons.Lock /> Security
                    </button>
                    <div className="flex-grow md:flex-grow-0"></div>
                    <button onClick={() => { setActiveTab('danger'); setMessage({type:'',text:''}); }} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all mt-auto ${activeTab === 'danger' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'text-slate-400 hover:text-red-400 hover:bg-red-500/10'}`}>
                        <Icons.Alert /> Danger Zone
                    </button>
                </div>

                {/* --- CONTENT AREA --- */}
                <div className="flex-1 p-8 relative overflow-y-auto custom-scrollbar">
                    <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors">
                        <Icons.Close />
                    </button>

                    <h2 className="text-xl font-bold text-white mb-1 capitalize">{activeTab} Settings</h2>
                    <p className="text-xs text-slate-500 mb-6">Manage your account preferences and security.</p>

                    <AnimatePresence mode='wait'>
                        {message.text && (
                            <motion.div 
                                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                className={`mb-6 p-3 rounded-lg text-xs flex items-center gap-2 ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}
                            >
                                {message.type === 'success' ? <Icons.Check /> : <Icons.Alert />}
                                {message.text}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {activeTab === 'general' && (
                        <form onSubmit={handleUpdateProfile} className="space-y-5">
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Operative Name</label>
                                <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Neural Link (Email)</label>
                                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all" />
                            </div>
                            <button type="submit" disabled={loading} className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-cyan-900/20 disabled:opacity-50">
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </form>
                    )}

                    {activeTab === 'security' && (
                        <form onSubmit={handleChangePassword} className="space-y-5">
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Current Passkey</label>
                                <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-all" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">New Passkey</label>
                                    <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-all" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Confirm</label>
                                    <input type="password" value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-all" />
                                </div>
                            </div>
                            <button type="submit" disabled={loading} className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-cyan-900/20 disabled:opacity-50">
                                {loading ? 'Updating...' : 'Update Passkey'}
                            </button>
                        </form>
                    )}

                    {activeTab === 'danger' && (
                        <div className="space-y-6">
                            <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20">
                                <h3 className="text-red-400 font-bold text-sm mb-1">Terminate Neural Link</h3>
                                <p className="text-slate-400 text-xs leading-relaxed">
                                    Permanently delete your account and all mission data. This action cannot be undone.
                                </p>
                            </div>
                            <form onSubmit={handleDeleteAccount} className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase font-bold text-red-400/70 tracking-wider">Confirm with Passkey</label>
                                    <input type="password" value={deletePassword} onChange={e => setDeletePassword(e.target.value)} className="w-full bg-black/30 border border-red-900/30 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-red-500/50 transition-all" placeholder="Enter password to confirm" />
                                </div>
                                <button type="submit" disabled={loading || !deletePassword} className="w-full px-5 py-3 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-600/50 rounded-lg text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                                    {loading ? 'Terminating...' : 'Delete Account'}
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default SettingsModal;