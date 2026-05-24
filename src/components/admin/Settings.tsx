import React, { useState, useEffect } from 'react';
import { settingsService } from '../../services/settings';
import type { UpdateSettingsData } from '../../services/settings';
import type { Setting } from '../../types';
import Button from '../common/Button';
import Input from '../common/Input';
import Loader from '../common/Loader';
import { Layout } from '../layout';

interface SettingsBySection {
  [section: string]: Setting[];
}

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<UpdateSettingsData>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await settingsService.getAllSettings();
      setSettings(response.data);
      
      // Initialize form data with current values
      const initialData: UpdateSettingsData = {};
      response.data.forEach((setting) => {
        initialData[setting.key] = parseSettingValue(setting);
      });
      setFormData(initialData);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const parseSettingValue = (setting: Setting): string | number | boolean => {
    switch (setting.type) {
      case 'boolean':
        return setting.value === 'true' || setting.value === '1';
      case 'integer':
        return parseInt(setting.value, 10);
      default:
        return setting.value;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSaving(true);
    setSuccessMessage('');

    try {
      await settingsService.updateSettings(formData);
      setSuccessMessage('Settings saved successfully!');
      fetchSettings();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        alert('Failed to save settings');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (key: string, value: string | number | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const groupSettingsBySection = (): SettingsBySection => {
    const sections: SettingsBySection = {
      'Clinic Information': [],
      'Booking Rules': [],
      'Slot Configuration': [],
      'Features': [],
      'Other': [],
    };

    settings.forEach((setting) => {
      if (setting.key.startsWith('clinic_')) {
        sections['Clinic Information'].push(setting);
      } else if (
        setting.key.includes('booking') ||
        setting.key.includes('cancellation') ||
        setting.key.includes('deadline')
      ) {
        sections['Booking Rules'].push(setting);
      } else if (setting.key.includes('slot') || setting.key.includes('capacity')) {
        sections['Slot Configuration'].push(setting);
      } else if (setting.key.startsWith('enable_')) {
        sections['Features'].push(setting);
      } else {
        sections['Other'].push(setting);
      }
    });

    // Remove empty sections
    Object.keys(sections).forEach((key) => {
      if (sections[key].length === 0) {
        delete sections[key];
      }
    });

    return sections;
  };

  const renderSettingInput = (setting: Setting) => {
    const key = setting.key;
    const value = formData[key];
    const label = key
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    switch (setting.type) {
      case 'boolean':
        return (
          <div key={key} className="flex items-center justify-between py-3 border-b border-gray-200">
            <label className="text-sm font-medium text-gray-700">{label}</label>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={value as boolean}
                onChange={(e) => handleInputChange(key, e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        );

      case 'integer':
        return (
          <div key={key} className="py-3 border-b border-gray-200">
            <Input
              label={label}
              type="number"
              value={value as number}
              onChange={(e) => handleInputChange(key, Number(e.target.value))}
              error={errors[key]?.[0]}
              fullWidth
            />
          </div>
        );

      default:
        return (
          <div key={key} className="py-3 border-b border-gray-200">
            <Input
              label={label}
              type="text"
              value={value as string}
              onChange={(e) => handleInputChange(key, e.target.value)}
              error={errors[key]?.[0]}
              fullWidth
            />
          </div>
        );
    }
  };

  if (loading) {
    return (
      <Layout showSidebar={true}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader size="lg" />
        </div>
      </Layout>
    );
  }

  const settingsBySection = groupSettingsBySection();

  return (
    <Layout showSidebar={true}>
      <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
      </div>

      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800">{successMessage}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {Object.entries(settingsBySection).map(([section, sectionSettings]) => (
          <div key={section} className="bg-white rounded-lg shadow mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">{section}</h2>
            </div>
            <div className="px-6 py-2">
              {sectionSettings.map((setting) => renderSettingInput(setting))}
            </div>
          </div>
        ))}

        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={fetchSettings}
            disabled={saving}
          >
            Reset
          </Button>
          <Button type="submit" isLoading={saving}>
            Save Settings
          </Button>
        </div>
      </form>
    </div>
    </Layout>
  );
};

export default Settings;
