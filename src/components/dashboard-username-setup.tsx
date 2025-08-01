"use client";

import { DashboardLayout } from '@/components/dashboard-layout';
import { UsernameSetup } from '@/components/username-setup';
import { useRouter } from 'next/navigation';

export function DashboardUsernameSetup() {
  const router = useRouter();

  const handleSkipSetup = () => {
    // Navigate to regular dashboard
    router.push('/dashboard?skipSetup=true');
  };

  const handleCompleteSetup = () => {
    // The page will refresh/update automatically when profile is created
    // and user will be redirected to their profile page
  };

  // Show the username setup form directly
  return (
    <DashboardLayout>
      <div className="min-h-[60vh] flex items-center justify-center">
        <UsernameSetup
          onSkip={handleSkipSetup}
          onComplete={handleCompleteSetup}
          showSkipButton={true}
          isModal={false}
        />
      </div>
    </DashboardLayout>
  );
}
