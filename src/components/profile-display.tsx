"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ProfileData, ProfileLink } from '@/types/profile';
import { 
  ExternalLink, 
  Share2, 
  Copy, 
  Twitter, 
  Instagram, 
  Linkedin, 
  Github,
  MessageCircle,
  Send,
  Youtube,
  Music
} from 'lucide-react';

interface ProfileDisplayProps {
  username: string;
  profileData: ProfileData;
  isOwner?: boolean;
}

const socialIcons = {
  twitter: Twitter,
  instagram: Instagram,
  linkedin: Linkedin,
  github: Github,
  discord: MessageCircle,
  telegram: Send,
  youtube: Youtube,
  tiktok: Music,
};

const linkTypeColors = {
  link: 'bg-blue-500',
  payment: 'bg-green-500',
  donation: 'bg-yellow-500',
  product: 'bg-purple-500',
  content: 'bg-pink-500',
};

const linkTypeEmojis = {
  link: '🔗',
  payment: '💳',
  donation: '💝',
  product: '🛍️',
  content: '📄',
};

export function ProfileDisplay({ username, profileData, isOwner = false }: ProfileDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [clickedLinks, setClickedLinks] = useState<Set<string>>(new Set());

  const profileUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/${username}`;

  const copyProfileUrl = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  };

  const handleLinkClick = (link: ProfileLink) => {
    setClickedLinks(prev => new Set([...prev, link.id]));
    
    // Track click analytics here if needed
    console.log('Link clicked:', link);
    
    // Open link
    if (link.type === 'link') {
      window.open(link.url, '_blank', 'noopener,noreferrer');
    } else {
      // For payment/donation/product links, handle differently
      // This would integrate with your payment system
      window.open(link.url, '_blank', 'noopener,noreferrer');
    }
  };

  const getButtonStyle = () => {
    const { buttonStyle, accentColor } = profileData.theme;
    const baseClasses = 'w-full p-4 text-left transition-all duration-200 hover:scale-105 hover:shadow-lg';
    
    switch (buttonStyle) {
      case 'square':
        return `${baseClasses} rounded-none`;
      case 'pill':
        return `${baseClasses} rounded-full`;
      default:
        return `${baseClasses} rounded-lg`;
    }
  };

  const activeLinks = profileData.links
    .filter(link => link.isActive)
    .sort((a, b) => a.order - b.order);

  const activeSocialLinks = Object.entries(profileData.socialLinks || {})
    .filter(([_, url]) => url && url.trim() !== '');

  return (
    <div 
      className="min-h-screen p-4"
      style={{ 
        backgroundColor: profileData.theme.backgroundColor,
        color: profileData.theme.textColor 
      }}
    >
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          {/* Avatar */}
          <div className="flex justify-center">
            <Avatar className="w-24 h-24">
              {profileData.avatar ? (
                <img src={profileData.avatar} alt={profileData.name} className="w-full h-full object-cover" />
              ) : (
                <div 
                  className="w-full h-full flex items-center justify-center text-2xl font-bold"
                  style={{ backgroundColor: profileData.theme.accentColor, color: '#fff' }}
                >
                  {profileData.name.charAt(0).toUpperCase()}
                </div>
              )}
            </Avatar>
          </div>

          {/* Name and Bio */}
          <div>
            <h1 className="text-2xl font-bold mb-2">{profileData.name}</h1>
            <p className="text-sm opacity-80">@{username}</p>
            {profileData.bio && (
              <p className="mt-3 text-sm leading-relaxed opacity-90">{profileData.bio}</p>
            )}
          </div>

          {/* Social Links */}
          {activeSocialLinks.length > 0 && (
            <div className="flex justify-center gap-3">
              {activeSocialLinks.map(([platform, url]) => {
                const IconComponent = socialIcons[platform as keyof typeof socialIcons];
                if (!IconComponent) return null;
                
                return (
                  <Button
                    key={platform}
                    variant="outline"
                    size="sm"
                    className="p-2"
                    onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
                  >
                    <IconComponent className="w-4 h-4" />
                  </Button>
                );
              })}
            </div>
          )}

          {/* Share Button */}
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={copyProfileUrl}
              className="flex items-center gap-2"
            >
              {copied ? (
                <>
                  <Copy className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  Share Profile
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Links */}
        <div className="space-y-3">
          {activeLinks.map((link) => (
            <Card
              key={link.id}
              className={`${getButtonStyle()} cursor-pointer border-2 hover:border-opacity-50`}
              style={{ 
                borderColor: profileData.theme.accentColor,
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              }}
              onClick={() => handleLinkClick(link)}
            >
              <CardContent className="p-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    {/* Link Type Badge */}
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {linkTypeEmojis[link.type]}
                      </span>
                      <Badge 
                        variant="secondary" 
                        className={`${linkTypeColors[link.type]} text-white text-xs`}
                      >
                        {link.type}
                      </Badge>
                    </div>
                    
                    {/* Link Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{link.title}</h3>
                      {link.description && (
                        <p className="text-sm opacity-75 truncate">{link.description}</p>
                      )}
                    </div>
                  </div>
                  
                  <ExternalLink className="w-4 h-4 opacity-60" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {activeLinks.length === 0 && (
          <div className="text-center py-12 opacity-60">
            <p>No links added yet</p>
            {isOwner && (
              <p className="text-sm mt-2">Add some links to get started!</p>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="text-center pt-8 pb-4">
          <p className="text-xs opacity-50">
            Powered by Relynk ⚡
          </p>
        </div>
      </div>
    </div>
  );
}
