"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAccount } from 'wagmi';
import { ProfileDisplay } from '@/components/profile-display';
import { useProfileRegistry } from '@/hooks/use-profile-registry';
import { ProfileData } from '@/types/profile';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

// Mock function to fetch profile data from IPFS
const fetchProfileData = async (ipfsHash: string, username: string): Promise<ProfileData> => {
  // In a real implementation, you would fetch from IPFS
  // For now, return mock data based on username
  const mockProfiles: Record<string, ProfileData> = {
    'xfajarr': {
      name: 'xfajarr | CEO Femboy Famz',
      bio: 'Creating beautiful digital products & templates ✨ Supporting my journey through crypto payments 🌸',
      avatar: '',
      links: [
        {
          id: '1',
          title: '🎨 Premium Design Pack 2024',
          url: '/pay/design-pack-2024',
          description: 'Complete UI/UX design system with 50+ components',
          icon: '🎨',
          isActive: true,
          order: 0,
          type: 'product',
        },
        {
          id: '2',
          title: '📝 Notion Template Bundle',
          url: '/pay/notion-templates',
          description: 'Productivity templates for creators and entrepreneurs',
          icon: '📝',
          isActive: true,
          order: 1,
          type: 'product',
        },
        {
          id: '3',
          title: '☕ Buy me a coffee',
          url: '/pay/coffee-tip',
          description: 'Support my work with a small donation',
          icon: '☕',
          isActive: true,
          order: 2,
          type: 'donation',
        },
        {
          id: '4',
          title: '🎓 Course Presale Access',
          url: '/pay/course-presale',
          description: 'Early access to my upcoming Web3 design course',
          icon: '🎓',
          isActive: false,
          order: 3,
          type: 'product',
        },
        {
          id: '5',
          title: '🎵 Music Pack Vol. 1',
          url: '/pay/music-pack-1',
          description: 'Royalty-free background music for content creators',
          icon: '🎵',
          isActive: true,
          order: 4,
          type: 'product',
        },
        {
          id: '6',
          title: '💎 VIP Community Access',
          url: '/pay/vip-community',
          description: 'Join my exclusive Discord community for creators',
          icon: '💎',
          isActive: true,
          order: 5,
          type: 'content',
        },
      ],
      theme: {
        backgroundColor: '#fdf2f8',
        textColor: '#831843',
        accentColor: '#ec4899',
        buttonStyle: 'rounded',
        backgroundType: 'solid',
      },
      socialLinks: {
        twitter: 'https://twitter.com/xfajarr',
        instagram: 'https://instagram.com/xfajarr',
      },
    },
    'johndoe': {
      name: 'John Doe',
      bio: 'Web3 developer and crypto enthusiast. Building the future of decentralized applications.',
      avatar: '',
      links: [
        {
          id: '1',
          title: 'My Portfolio Website',
          url: 'https://johndoe.com',
          description: 'Check out my latest projects and work',
          icon: '🌐',
          isActive: true,
          order: 0,
          type: 'link',
        },
        {
          id: '2',
          title: 'Buy Me Coffee ☕',
          url: '/pay/coffee-donation',
          description: 'Support my open source work',
          icon: '☕',
          isActive: true,
          order: 1,
          type: 'donation',
        },
        {
          id: '3',
          title: 'Premium Web3 Course',
          url: '/pay/web3-course',
          description: 'Learn Web3 development from scratch',
          icon: '📚',
          isActive: true,
          order: 2,
          type: 'product',
        },
        {
          id: '4',
          title: 'Consultation Call',
          url: '/pay/consultation',
          description: '1-hour Web3 consultation session',
          icon: '💬',
          isActive: true,
          order: 3,
          type: 'payment',
        },
      ],
      theme: {
        backgroundColor: '#0f172a',
        textColor: '#f8fafc',
        accentColor: '#3b82f6',
        buttonStyle: 'rounded',
        backgroundType: 'solid',
      },
      socialLinks: {
        twitter: 'https://twitter.com/johndoe',
        github: 'https://github.com/johndoe',
        linkedin: 'https://linkedin.com/in/johndoe',
      },
    },
  };

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  return mockProfiles[username] || {
    name: username,
    bio: 'Welcome to my profile!',
    links: [],
    theme: {
      backgroundColor: '#ffffff',
      textColor: '#000000',
      accentColor: '#3b82f6',
      buttonStyle: 'rounded',
      backgroundType: 'solid',
    },
    socialLinks: {},
  };
};

export default function ProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const { address } = useAccount();
  const { useGetProfile } = useProfileRegistry();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Get profile data from contract
  const { data: profile, isLoading: isLoadingProfile, error } = useGetProfile(username);

  useEffect(() => {
    const loadProfileData = async () => {
      setIsLoading(true);
      try {
        if (profile?.ipfsHash) {
          const data = await fetchProfileData(profile.ipfsHash, username);
          setProfileData(data);
        } else if (!isLoadingProfile && !profile) {
          // Profile doesn't exist, show mock data for demo
          const data = await fetchProfileData('', username);
          setProfileData(data);
        }
      } catch (error) {
        console.error('Failed to load profile data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfileData();
  }, [profile, isLoadingProfile, username]);

  // Loading state
  if (isLoading || isLoadingProfile) {
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
