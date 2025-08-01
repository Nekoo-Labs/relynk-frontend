"use client";

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UsernameSetup } from '@/components/username-setup';
import { Sparkles, SkipForward } from 'lucide-react';

interface DashboardWelcomeCardProps {
  hasProfile: boolean;
  username?: string;
  onSkip?: () => void;
}

export function DashboardWelcomeCard({ hasProfile, username, onSkip }: DashboardWelcomeCardProps) {
  const [showUsernameSetup, setShowUsernameSetup] = useState(false);

  // Don't show anything if user already has a profile
  if (hasProfile) {
    return null;
  }

  const handleSkipSetup = () => {
    setShowUsernameSetup(false);
    if (onSkip) {
      onSkip();
    }
  };

  const handleCompleteSetup = () => {
    setShowUsernameSetup(false);
    // The page will refresh/update automatically when profile is created
  };

  // Show username setup card directly on the dashboard
  if (showUsernameSetup) {
    return (
      <div className="space-y-6">
        <UsernameSetup
          onSkip={handleSkipSetup}
          onComplete={handleCompleteSetup}
          showSkipButton={true}
          isModal={false}
        />
      </div>
    );
  }

  // Show the welcome card on dashboard
  return (
    <Card className="border border-border bg-main/5">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-main/20 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-main" />
            </div>
            <div>
              <h3 className="font-heading text-lg text-foreground">
                💖 Welcome to Paylynk!
              </h3>
              <p className="text-foreground/60 text-sm mt-1">
                Set up your username to create your personalized profile~ ✨
              </p>
              <p className="text-main text-xs mt-2 font-medium">
                paylynk.app/your-username
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Button
              onClick={() => setShowUsernameSetup(true)}
              className="bg-main hover:bg-main/90 text-main-foreground flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Set Up Username
            </Button>
            {onSkip && (
              <Button
                onClick={handleSkipSetup}
                variant="outline"
                size="sm"
                className="w-full text-xs border-border text-foreground/60 hover:bg-secondary-background"
              >
                <SkipForward className="w-3 h-3 mr-1" />
                Skip for now
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
