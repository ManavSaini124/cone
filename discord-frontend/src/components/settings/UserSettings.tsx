import React, { useState } from 'react';
import { Camera, Upload, X, User, Settings, Palette, Shield, LogOut } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Switch } from '../ui/switch';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

import { useRouter } from 'next/navigation';


interface UserSettingsProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const UserSettings: React.FC<UserSettingsProps> = ({ isOpen = true, onClose }) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    name: 'John Doe',
    email: 'john.doe@example.com',
    showReadReceipts: true,
    showTypingStatus: true,
    allowForwarding: true,
    muteGroupMessages: false,
    theme: 'dark',
    font: 'default',
    showOnlineStatus: true,
    hideFromStrangers: false,
    disableForwarding: false,
  });

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      router.back();
    }
  };

  const handleLogout = () => {
    console.log('Logging out...');
    // Add logout logic here
  };

  const handleDeleteAccount = () => {
    console.log('Delete account requested...');
    // Add delete account logic here
  };

  const handleAvatarUpload = () => {
    console.log('Avatar upload requested...');
    // Add avatar upload logic here
  };
 
 const tabs = [
    { id: 'general', label: 'General', icon: User },
    { id: 'preferences', label: 'Preferences', icon: Settings },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'account', label: 'Account', icon: LogOut },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-[#1b1b1b] rounded-xl shadow-2xl overflow-hidden transition-all duration-300 animate-scale-in max-h-[90vh] flex">
        {/* Sidebar Navigation */}
        <div className="w-64 bg-[#161616] border-r border-white/10 p-6">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-xl font-semibold text-white">Settings</h1>
            <button
              onClick={handleClose}
              className="p-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              <X size={20} className="text-white/60" />
            </button>
          </div>
          
          <nav className="space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-[#2c2c2c] text-[#9cbc9c] font-semibold'
                      : 'text-white/70 hover:text-[#9cbc9c] hover:bg-white/5'
                  }`}
                >
                  <Icon size={18} />
                  <span className="text-sm">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right Panel Content */}
        <div className="flex-1 p-8 overflow-y-auto">
          {/* General Tab */}
          {activeTab === 'general' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-semibold text-white mb-2">My Profile</h2>
                <p className="text-sm text-white/60 mb-6">Manage your profile information</p>
                
                {/* Avatar Upload */}
                <div className="flex items-center gap-4 mb-8">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
                      <Camera size={28} className="text-white/40" />
                    </div>
                    <button
                      onClick={handleAvatarUpload}
                      className="absolute -bottom-1 -right-1 w-8 h-8 bg-[#9cbc9c] rounded-full flex items-center justify-center hover:scale-105 transition-transform"
                    >
                      <Upload size={14} className="text-black" />
                    </button>
                  </div>
                  <button
                    onClick={handleAvatarUpload}
                    className="text-sm text-[#9cbc9c] underline hover:text-[#9cbc9c]/80 transition-colors"
                  >
                    Upload new photo
                  </button>
                </div>

                {/* Name Field */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-white/80 mb-2">Name</label>
                  <Input
                    value={settings.name}
                    onChange={(e) => handleSettingChange('name', e.target.value)}
                    className="bg-white/5 border-white/10 text-white focus:border-[#9cbc9c] focus:ring-[#9cbc9c]/20"
                  />
                </div>

                {/* Email Field */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Email</label>
                  <Input
                    value={settings.email}
                    readOnly
                    className="bg-white/5 border-white/10 text-white/70 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-semibold text-white mb-2">Preferences</h2>
                <p className="text-sm text-white/60 mb-6">Customize your chat experience</p>
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium text-white">Show read receipts</p>
                      <p className="text-xs text-white/60">Let others know when you've read their messages</p>
                    </div>
                    <Switch
                      checked={settings.showReadReceipts}
                      onCheckedChange={(checked) => handleSettingChange('showReadReceipts', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium text-white">Show typing status</p>
                      <p className="text-xs text-white/60">Display when you're typing to others</p>
                    </div>
                    <Switch
                      checked={settings.showTypingStatus}
                      onCheckedChange={(checked) => handleSettingChange('showTypingStatus', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium text-white">Allow forwarding</p>
                      <p className="text-xs text-white/60">Let others forward your messages</p>
                    </div>
                    <Switch
                      checked={settings.allowForwarding}
                      onCheckedChange={(checked) => handleSettingChange('allowForwarding', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium text-white">Mute group messages</p>
                      <p className="text-xs text-white/60">Turn off notifications for group chats</p>
                    </div>
                    <Switch
                      checked={settings.muteGroupMessages}
                      onCheckedChange={(checked) => handleSettingChange('muteGroupMessages', checked)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-semibold text-white mb-2">Appearance</h2>
                <p className="text-sm text-white/60 mb-6">Customize how Cone looks and feels</p>
                
                {/* Theme Switcher */}
                <div className="mb-8">
                  <p className="text-sm font-medium text-white mb-4">Theme</p>
                  <RadioGroup
                    value={settings.theme}
                    onValueChange={(value) => handleSettingChange('theme', value)}
                    className="flex gap-6"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="dark" id="dark" />
                      <label htmlFor="dark" className="text-sm text-white cursor-pointer">Dark</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="light" id="light" />
                      <label htmlFor="light" className="text-sm text-white cursor-pointer">Light</label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Font Selection */}
                <div>
                  <p className="text-sm font-medium text-white mb-4">Font</p>
                  <Select value={settings.font} onValueChange={(value) => handleSettingChange('font', value)}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white focus:border-[#9cbc9c] max-w-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-white/10">
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="sf-pro">SF Pro</SelectItem>
                      <SelectItem value="satoshi">Satoshi</SelectItem>
                      <SelectItem value="inter">Inter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Privacy Tab */}
          {activeTab === 'privacy' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-semibold text-white mb-2">Privacy</h2>
                <p className="text-sm text-white/60 mb-6">Control your privacy and visibility</p>
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium text-white">Show online status</p>
                      <p className="text-xs text-white/60">Let others see when you're online</p>
                    </div>
                    <Switch
                      checked={settings.showOnlineStatus}
                      onCheckedChange={(checked) => handleSettingChange('showOnlineStatus', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium text-white">Hide profile from strangers</p>
                      <p className="text-xs text-white/60">Only show your profile to contacts</p>
                    </div>
                    <Switch
                      checked={settings.hideFromStrangers}
                      onCheckedChange={(checked) => handleSettingChange('hideFromStrangers', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium text-white">Disable forwarding</p>
                      <p className="text-xs text-white/60">Prevent others from forwarding your messages</p>
                    </div>
                    <Switch
                      checked={settings.disableForwarding}
                      onCheckedChange={(checked) => handleSettingChange('disableForwarding', checked)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Account Tab */}
          {activeTab === 'account' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-semibold text-white mb-2">Account</h2>
                <p className="text-sm text-white/60 mb-6">Manage your account settings</p>
                
                {/* Account Action Buttons */}
                <div className="space-y-4 max-w-xs">
                  <Button
                    onClick={handleLogout}
                    className="w-full bg-[#9cbc9c] text-black hover:bg-[#9cbc9c]/90 font-medium"
                  >
                    Logout
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={handleDeleteAccount}
                    className="w-full border-red-400 text-red-400 hover:bg-red-400/10 hover:border-red-400 hover:text-red-400"
                  >
                    Delete Account
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserSettings;