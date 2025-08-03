"use client";

import { useParams } from 'next/navigation';
import { useAccount } from 'wagmi';
import { ProfileDisplay } from '@/components/profile-display';
import { useProfileByUsername } from '@/hooks/use-profile-data';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const { address } = useAccount();

  // Get profile data using React Query
  const { 
    profile, 
    profileData, 
    isLoading, 
    error 
  } = useProfileByUsername(username);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-main border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-foreground/60">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="text-center space-y-4 p-6">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
            <h1 className="text-xl font-bold">Error Loading Profile</h1>
            <p className="text-foreground/60">
              There was an error loading this profile. Please try again later.
            </p>
            <Link href="/">
              <Button className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Go Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Profile not found
  if (!profile && !profileData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="text-center space-y-4 p-6">
            <div className="text-6xl">🔍</div>
            <h1 className="text-xl font-bold">Profile Not Found</h1>
            <p className="text-foreground/60">
              The profile <strong>@{username}</strong> doesn&apos;t exist or hasn&apos;t been created yet.
            </p>
            <div className="space-y-2">
              <Link href="/dashboard/profile">
                <Button className="w-full">
                  Create Your Profile
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline" className="w-full flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Go Home
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if current user is the profile owner
  const isOwner = profile?.owner.toLowerCase() === address?.toLowerCase();

  return (
    <div>
      {profileData && (
        <ProfileDisplay
          username={username}
          profileData={profileData}
          isOwner={isOwner}
        />
      )}
    </div>
  );
}
