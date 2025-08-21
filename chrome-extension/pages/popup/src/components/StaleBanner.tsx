import { useState, useEffect } from 'react';

interface SyncStatus {
  lastSyncedAt: string | null;
  isStale: boolean;
  hoursAgo: number | null;
}

interface StaleBannerProps {
  isLight: boolean;
}

export function StaleBanner({ isLight }: StaleBannerProps) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSyncStatus();
  }, []);

  const fetchSyncStatus = async () => {
    try {
      const response = await fetch('http://localhost:8787/api/chatbot/sync-status');
      if (response.ok) {
        const data = await response.json();
        setSyncStatus(data);
      }
    } catch (error) {
      console.error('Failed to fetch sync status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !syncStatus) {
    return null;
  }

  if (!syncStatus.isStale) {
    return null;
  }

  const formatLastSync = () => {
    if (!syncStatus.lastSyncedAt) {
      return 'Never synced';
    }
    
    const date = new Date(syncStatus.lastSyncedAt);
    const hoursAgo = syncStatus.hoursAgo;
    
    if (hoursAgo === null) return 'Never synced';
    if (hoursAgo < 1) return 'Less than 1 hour ago';
    if (hoursAgo < 24) return `${Math.round(hoursAgo)} hours ago`;
    
    const daysAgo = Math.round(hoursAgo / 24);
    return `${daysAgo} day${daysAgo > 1 ? 's' : ''} ago`;
  };

  return (
    <div className={`px-3 py-2 text-xs border-b-2 ${isLight 
      ? 'bg-yellow-100 text-yellow-800 border-yellow-300' 
      : 'bg-yellow-900 text-yellow-200 border-yellow-700'
    }`}>
      <div className="flex items-center gap-2">
        <span className="font-medium">⚠️ Stale Data</span>
        <span>Last updated: {formatLastSync()}</span>
      </div>
    </div>
  );
}