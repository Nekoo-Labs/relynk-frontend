"use client";

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProfileCreationForm } from '@/components/profile-creation-form';
import { UsernameSetup } from '@/components/username-setup';
import { useProfileRegistry } from '@/hooks/use-profile-registry';
import { ProfileData } from '@/types/profile';
import { User, ExternalLink, Edit, Plus, Eye } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const { address } = useAccount();
  const { useGetProfileByOwner } = useProfileRegistry();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);

  // Get user's profile
  const { data: profileResult, isLoading, error } = useGetProfileByOwner(address!);
  const [profile, username] = profileResult || [null, ''];

  // Mock function to fetch profile data from IPFS
  const fetchProfileData = async (ipfsHash: string): Promise<ProfileData> => {
    // In a real implementation, you would fetch from IPFS
    // For now, return mock data
    return {
      name: 'John Doe',
      bio: 'Web3 developer and crypto enthusiast',
      links: [
        {
          id: '1',
          title: 'My Website',
          url: 'https://johndoe.com',
          description: 'Check out my portfolio',
          icon: '',
          isActive: true,
          order: 0,
          type: 'link',
        },
        {
          id: '2',
          title: 'Buy Me Coffee',
          url: '/pay/coffee-donation',
          description: 'Support my work',
          icon: '',
          isActive: true,
          order: 1,
          type: 'donation',
        },
      ],
      theme: {
        backgroundColor: '#ffffff',
        textColor: '#000000',
        accentColor: '#3b82f6',
        buttonStyle: 'rounded',
        backgroundType: 'solid',
      },
      socialLinks: {
        twitter: 'https://twitter.com/johndoe',
        github: 'https://github.com/johndoe',
      },
    };
  };

  useEffect(() => {
    if (profile?.ipfsHash) {
      fetchProfileData(profile.ipfsHash).then(setProfileData);
    }
  }, [profile]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-main border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p>Loading profile...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Show username setup if no profile exists
  if (!profile) {
    return <UsernameSetup />;
  }

  // Show profile editing form if user wants to edit
  if (showCreateForm) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-heading text-foreground">
                ✨ Edit Profile
              </h1>
              <p className="text-foreground/60 mt-1">
                Update your profile information and links
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowCreateForm(false)}
            >
              Cancel
            </Button>
          </div>

          <ProfileCreationForm
            existingUsername={username}
            isEditing={true}
          />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading text-foreground">
              👤 Your Profile
            </h1>
            <p className="text-foreground/60 mt-1">
              Manage your profile and links
            </p>
          </div>
          <div className="flex gap-2">
            <Link href={`/${username}`} target="_blank">
              <Button variant="outline" className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                View Profile
              </Button>
            </Link>
            <Button 
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit Profile
            </Button>
          </div>
        </div>

        {/* Profile Overview */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Profile Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground/60">Username</label>
                <p className="font-medium">@{username}</p>
              </div>
              
              {profileData && (
                <>
                  <div>
                    <label className="text-sm font-medium text-foreground/60">Display Name</label>
                    <p className="font-medium">{profileData.name}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-foreground/60">Bio</label>
                    <p className="text-sm">{profileData.bio || 'No bio added'}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-foreground/60">Profile URL</label>
                    <div className="flex items-center gap-2">
                      <code className="text-sm bg-secondary px-2 py-1 rounded">
                        /{username}
                      </code>
                      <Link href={`/${username}`} target="_blank">
                        <Button variant="outline" size="sm">
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Profile Stats */}
          <Card>
            <CardHeader>
              <CardTitle>📊 Profile Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-secondary rounded-base">
                  <p className="text-2xl font-bold text-main">
                    {profileData?.links.filter(l => l.isActive).length || 0}
                  </p>
                  <p className="text-sm text-foreground/60">Active Links</p>
                </div>
                <div className="text-center p-3 bg-secondary rounded-base">
                  <p className="text-2xl font-bold text-main">0</p>
                  <p className="text-sm text-foreground/60">Total Clicks</p>
                </div>
              </div>
              
              <div className="text-center p-3 bg-secondary rounded-base">
                <p className="text-2xl font-bold text-main">
                  {profile ? new Date(Number(profile.createdAt) * 1000).toLocaleDateString() : 'N/A'}
                </p>
                <p className="text-sm text-foreground/60">Profile Created</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Links Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                🔗 Your Links
              </span>
              <Button 
                onClick={() => setShowCreateForm(true)}
                size="sm"
                variant="outline"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Link
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {profileData?.links && profileData.links.length > 0 ? (
              <div className="space-y-3">
                {profileData.links
                  .sort((a, b) => a.order - b.order)
                  .map((link) => (
                    <div
                      key={link.id}
                      className="flex items-center justify-between p-4 border border-border rounded-base bg-secondary-background"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant={link.isActive ? "default" : "secondary"}>
                          {link.type}
                        </Badge>
                        <div>
                          <h4 className="font-medium">{link.title}</h4>
                          <p className="text-sm text-foreground/60 truncate max-w-xs">
                            {link.url}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant={link.isActive ? "default" : "secondary"}>
                          {link.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <Button variant="outline" size="sm">
                          <Edit className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8 text-foreground/60">
                <p>No links added yet</p>
                <p className="text-sm mt-1">Add your first link to get started!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
