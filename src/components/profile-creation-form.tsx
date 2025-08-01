"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useProfileRegistry } from '@/hooks/use-profile-registry';
import { ProfileFormData, ProfileLink, ProfileTheme, SocialLinks } from '@/types/profile';
import { Plus, X, Check, AlertCircle, User, Link as LinkIcon, Palette, Share2 } from 'lucide-react';
import { useAccount } from 'wagmi';

const defaultTheme: ProfileTheme = {
  backgroundColor: '#ffffff',
  textColor: '#000000',
  accentColor: '#3b82f6',
  buttonStyle: 'rounded',
  backgroundType: 'solid',
};

const defaultSocialLinks: SocialLinks = {};

interface ProfileCreationFormProps {
  existingUsername?: string;
  isEditing?: boolean;
}

export function ProfileCreationForm({ existingUsername, isEditing = false }: ProfileCreationFormProps) {
  const router = useRouter();
  const { address } = useAccount();
  const { createProfile, updateProfile, isPending, isSuccess, useIsUsernameAvailable } = useProfileRegistry();

  const [formData, setFormData] = useState<ProfileFormData>({
    username: existingUsername || '',
    name: existingUsername || '',
    bio: '',
    links: [],
    theme: defaultTheme,
    socialLinks: defaultSocialLinks,
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [usernameCheck, setUsernameCheck] = useState<string>('');

  // Check username availability (only if not editing existing profile)
  const { data: isAvailable, isLoading: isCheckingUsername } = useIsUsernameAvailable(
    !isEditing ? usernameCheck : ''
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.username.length >= 3) {
        setUsernameCheck(formData.username);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [formData.username]);

  useEffect(() => {
    if (isSuccess) {
      router.push(`/${formData.username}`);
    }
  }, [isSuccess, formData.username, router]);

  const handleInputChange = (field: keyof ProfileFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addLink = () => {
    const newLink: Omit<ProfileLink, 'id'> = {
      title: '',
      url: '',
      description: '',
      icon: '',
      isActive: true,
      order: formData.links.length,
      type: 'link',
    };
    handleInputChange('links', [...formData.links, newLink]);
  };

  const updateLink = (index: number, field: keyof Omit<ProfileLink, 'id'>, value: any) => {
    const updatedLinks = [...formData.links];
    updatedLinks[index] = { ...updatedLinks[index], [field]: value };
    handleInputChange('links', updatedLinks);
  };

  const removeLink = (index: number) => {
    const updatedLinks = formData.links.filter((_, i) => i !== index);
    handleInputChange('links', updatedLinks);
  };

  const handleSubmit = async () => {
    if (!address) return;

    try {
      const profileData = {
        name: formData.name,
        bio: formData.bio,
        links: formData.links.map((link, index) => ({
          ...link,
          id: `link-${index}`,
        })),
        theme: formData.theme,
        socialLinks: formData.socialLinks,
      };

      if (isEditing) {
        await updateProfile(profileData);
      } else {
        await createProfile(formData.username, profileData);
      }
    } catch (error) {
      console.error('Failed to save profile:', error);
    }
  };

  const isUsernameValid = isEditing || (formData.username.length >= 3 && isAvailable);
  const canProceedStep1 = isUsernameValid && formData.name.trim().length > 0;
  const canSubmit = canProceedStep1;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-center space-x-4 mb-8">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep >= step ? 'bg-main text-main-foreground' : 'bg-secondary text-secondary-foreground'
            }`}>
              {currentStep > step ? <Check className="w-4 h-4" /> : step}
            </div>
            {step < 3 && <div className={`w-12 h-0.5 ${currentStep > step ? 'bg-main' : 'bg-secondary'}`} />}
          </div>
        ))}
      </div>

      {/* Step 1: Basic Info */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              {isEditing ? 'Profile Information' : 'Basic Information'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Show username field only if not editing */}
            {!isEditing && (
              <div>
                <label className="block text-sm font-medium mb-2">Username *</label>
                <div className="relative">
                  <Input
                    placeholder="your-username"
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    className="pr-10"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {isCheckingUsername ? (
                      <div className="w-4 h-4 border-2 border-main border-t-transparent rounded-full animate-spin" />
                    ) : formData.username.length >= 3 ? (
                      isAvailable ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <X className="w-4 h-4 text-red-500" />
                      )
                    ) : null}
                  </div>
                </div>
                {formData.username.length >= 3 && !isCheckingUsername && (
                  <p className={`text-sm mt-1 ${isAvailable ? 'text-green-600' : 'text-red-600'}`}>
                    {isAvailable ? '✓ Username is available' : '✗ Username is taken'}
                  </p>
                )}
              </div>
            )}

            {/* Show username as read-only if editing */}
            {isEditing && (
              <div>
                <label className="block text-sm font-medium mb-2">Username</label>
                <div className="p-3 bg-secondary-background border border-border rounded-base text-foreground/60">
                  @{formData.username}
                </div>
                <p className="text-xs text-foreground/50 mt-1">
                  Username cannot be changed after creation
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">Display Name *</label>
              <Input
                placeholder="Your Name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Bio</label>
              <textarea
                className="w-full p-3 border border-border rounded-base bg-background text-foreground resize-none"
                rows={3}
                placeholder="Tell people about yourself..."
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
              />
            </div>

            <Button
              onClick={() => setCurrentStep(2)}
              disabled={!canProceedStep1}
              className="w-full"
            >
              Continue to Links
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Links */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="w-5 h-5" />
              Your Links
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.links.map((link, index) => (
              <div key={index} className="border border-border rounded-base p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Link {index + 1}</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeLink(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    placeholder="Link Title"
                    value={link.title}
                    onChange={(e) => updateLink(index, 'title', e.target.value)}
                  />
                  <select
                    className="p-2 border border-border rounded-base bg-background"
                    value={link.type}
                    onChange={(e) => updateLink(index, 'type', e.target.value)}
                  >
                    <option value="link">Link</option>
                    <option value="payment">Payment</option>
                    <option value="donation">Donation</option>
                    <option value="product">Product</option>
                    <option value="content">Content</option>
                  </select>
                </div>
                
                <Input
                  placeholder="https://..."
                  value={link.url}
                  onChange={(e) => updateLink(index, 'url', e.target.value)}
                />
                
                <Input
                  placeholder="Description (optional)"
                  value={link.description}
                  onChange={(e) => updateLink(index, 'description', e.target.value)}
                />
              </div>
            ))}

            <Button onClick={addLink} variant="outline" className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add Link
            </Button>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setCurrentStep(1)} className="flex-1">
                Back
              </Button>
              <Button onClick={() => setCurrentStep(3)} className="flex-1">
                Continue to Theme
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Theme & Submit */}
      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Customize Theme
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Background Color</label>
                <input
                  type="color"
                  value={formData.theme.backgroundColor}
                  onChange={(e) => handleInputChange('theme', { ...formData.theme, backgroundColor: e.target.value })}
                  className="w-full h-10 rounded-base border border-border"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Accent Color</label>
                <input
                  type="color"
                  value={formData.theme.accentColor}
                  onChange={(e) => handleInputChange('theme', { ...formData.theme, accentColor: e.target.value })}
                  className="w-full h-10 rounded-base border border-border"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Button Style</label>
              <div className="flex gap-2">
                {(['rounded', 'square', 'pill'] as const).map((style) => (
                  <Button
                    key={style}
                    variant={formData.theme.buttonStyle === style ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleInputChange('theme', { ...formData.theme, buttonStyle: style })}
                  >
                    {style}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setCurrentStep(2)} className="flex-1">
                Back
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={!canSubmit || isPending}
                className="flex-1"
              >
                {isPending ? 'Creating Profile...' : 'Create Profile'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
