"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useProfileRegistry } from '@/hooks/use-profile-registry';
import { useAccount } from 'wagmi';
import { Check, X, Sparkles, User, ArrowRight, Loader2, SkipForward } from 'lucide-react';

interface UsernameSetupProps {
  onSkip?: () => void;
  onComplete?: () => void;
  showSkipButton?: boolean;
  isModal?: boolean;
}

export function UsernameSetup({ onSkip, onComplete, showSkipButton = false, isModal = false }: UsernameSetupProps) {
  const router = useRouter();
  const { address } = useAccount();
  const { createProfile, isPending, isSuccess, useIsUsernameAvailable } = useProfileRegistry();
  
  const [username, setUsername] = useState('');
  const [usernameCheck, setUsernameCheck] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  
  // Check username availability with debounce
  const { data: isAvailable, isLoading: isCheckingUsername } = useIsUsernameAvailable(usernameCheck);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (username.length >= 3) {
        setUsernameCheck(username);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [username]);

  useEffect(() => {
    if (isSuccess) {
      if (onComplete) {
        onComplete();
      } else {
        router.push(`/${username}`);
      }
    }
  }, [isSuccess, username, router, onComplete]);

  const handleUsernameChange = (value: string) => {
    // Only allow lowercase letters, numbers, and hyphens
    const cleanValue = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setUsername(cleanValue);
  };

  const handleCreateProfile = async () => {
    if (!address || !isUsernameValid) return;
    
    setIsCreating(true);
    try {
      // Create a basic profile with just the username
      const basicProfileData = {
        name: username,
        bio: '',
        links: [],
        theme: {
          backgroundColor: '#ffffff',
          textColor: '#000000',
          accentColor: '#ec4899',
          buttonStyle: 'rounded' as const,
          backgroundType: 'solid' as const,
        },
        socialLinks: {},
      };

      await createProfile(username, basicProfileData);
    } catch (error) {
      console.error('Failed to create profile:', error);
      setIsCreating(false);
    }
  };

  const isUsernameValid = username.length >= 3 && isAvailable;
  const showValidation = username.length >= 3;

  return (
    <div className={isModal ? "" : "flex items-center justify-center p-4"}>
      <Card className={`w-full max-w-lg mx-auto ${isModal ? 'glow-soft shimmer border-2 border-main/20 bg-gradient-to-br from-main/5 to-main/10' : 'border border-border bg-main/5'}`}>
        <CardContent className="p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${isModal ? 'bg-gradient-to-br from-main/20 to-main/10' : 'bg-main/20'}`}>
              <Sparkles className="w-8 h-8 text-main" />
            </div>
            <h1 className="text-2xl font-heading text-foreground">
              💖 Welcome to Paylynk!
            </h1>
            <p className="text-foreground/60 leading-relaxed">
              To get started, you'll need to set up your username.
              <br />
              This will help others find and pay you easily~ ✨
            </p>
          </div>

          {/* Username Input Section */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">
                Choose your username
              </label>
              
              {/* URL Preview */}
              <div className="flex items-center bg-secondary-background border border-border rounded-base p-3">
                <span className="text-main font-medium bg-main/10 px-2 py-1 rounded text-sm">
                  paylynk.app/
                </span>
                <Input
                  placeholder="your-username"
                  value={username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  className="border-0 bg-transparent focus:ring-0 focus:outline-none shadow-none pl-1"
                  maxLength={20}
                />
                
                {/* Validation Icon */}
                <div className="ml-2 flex-shrink-0">
                  {isCheckingUsername ? (
                    <Loader2 className="w-4 h-4 animate-spin text-foreground/40" />
                  ) : showValidation ? (
                    isAvailable ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <X className="w-4 h-4 text-red-500" />
                    )
                  ) : null}
                </div>
              </div>
              
              {/* Validation Message */}
              {showValidation && !isCheckingUsername && (
                <p className={`text-sm ${isAvailable ? 'text-green-600' : 'text-red-600'}`}>
                  {isAvailable ? '✓ Username is available' : '✗ Username is already taken'}
                </p>
              )}
              
              {/* Username Rules */}
              <p className="text-xs text-foreground/50">
                3-20 characters, lowercase letters, numbers, and hyphens only
              </p>
            </div>

            {/* Username Suggestions */}
            <div className="space-y-2">
              <p className="text-sm text-foreground/60">💡 Need inspiration?</p>
              <div className="flex flex-wrap gap-2">
                {['creator-hub', 'my-links', 'pay-me', 'link-tree'].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => handleUsernameChange(suggestion)}
                    className="px-3 py-1 text-xs bg-main/10 text-main rounded-full hover:bg-main/20 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleCreateProfile}
              disabled={!isUsernameValid || isPending || isCreating}
              className={`w-full text-main-foreground h-12 ${isModal ? 'bg-gradient-to-r from-main to-main/80 hover:from-main/90 hover:to-main/70 shadow-shadow glow-hover hover:scale-105 transition-all duration-300' : 'bg-main hover:bg-main/90'}`}
            >
              {isPending || isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating your profile...
                </>
              ) : (
                <>
                  <User className="w-4 h-4 mr-2" />
                  Set Up Your Username
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>

            {/* Skip Button */}
            {showSkipButton && onSkip && (
              <Button
                onClick={onSkip}
                variant="outline"
                className={`w-full border-border hover:bg-secondary-background ${isModal ? 'transition-all duration-300' : ''}`}
                disabled={isPending || isCreating}
              >
                <SkipForward className="w-4 h-4 mr-2" />
                Skip for now
              </Button>
            )}
          </div>

          {/* Footer */}
          <div className="text-center pt-4">
            <p className="text-xs text-foreground/40">
              {showSkipButton
                ? "You can always set up your username later from the dashboard! 🎨"
                : "You can customize your profile with bio, links, and themes later! 🎨"
              }
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
