/// ============================================================
/// Supabase Realtime subscriptions for live dashboard
/// Task 3.11
/// ============================================================

import {
  createClient,
  type SupabaseClient,
  type RealtimeChannel,
  type RealtimePostgresInsertPayload,
} from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';

type PageViewRow = Database['public']['Tables']['page_views']['Row'];
type WhatsAppClickRow = Database['public']['Tables']['whatsapp_clicks']['Row'];
type ConversionRow = Database['public']['Tables']['conversions']['Row'];

// Event types for realtime
export interface RealtimePageViewEvent {
  type: 'INSERT';
  table: 'page_views';
  record: PageViewRow;
  old_record: PageViewRow | null;
}

export interface RealtimeWhatsAppClickEvent {
  type: 'INSERT';
  table: 'whatsapp_clicks';
  record: WhatsAppClickRow;
  old_record: WhatsAppClickRow | null;
}

export interface RealtimeConversionEvent {
  type: 'INSERT';
  table: 'conversions';
  record: ConversionRow;
  old_record: ConversionRow | null;
}

export type RealtimeAnalyticsEvent =
  RealtimePageViewEvent | RealtimeWhatsAppClickEvent | RealtimeConversionEvent;

// Callback types
export type PageViewCallback = (event: RealtimePageViewEvent) => void;
export type WhatsAppClickCallback = (event: RealtimeWhatsAppClickEvent) => void;
export type ConversionCallback = (event: RealtimeConversionEvent) => void;

// Subscription manager class
export class AnalyticsRealtimeSubscriptions {
  private supabase: SupabaseClient<Database>;
  private channels: Map<string, RealtimeChannel> = new Map();
  private isConnected = false;

  constructor() {
    this.supabase = createClient<Database>(
      import.meta.env.PUBLIC_SUPABASE_URL,
      import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
      {
        realtime: {
          params: {
            eventsPerSecond: 10,
          },
        },
      }
    );
  }

  /**
   * Subscribe to page_views inserts
   */
  subscribeToPageViews(callback: PageViewCallback): () => void {
    const channelName = 'page_views_inserts';

    const channel = this.supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'page_views',
        },
        (payload: RealtimePostgresInsertPayload<PageViewRow>) => {
          const event: RealtimePageViewEvent = {
            type: 'INSERT',
            table: 'page_views',
            record: payload.new,
            old_record: payload.old as PageViewRow | null,
          };
          callback(event);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          this.isConnected = true;
          console.log('[Realtime] Subscribed to page_views');
        } else if (status === 'CLOSED') {
          this.isConnected = false;
          console.log('[Realtime] Unsubscribed from page_views');
        }
      });

    this.channels.set(channelName, channel);

    return () => {
      this.unsubscribe(channelName);
    };
  }

  /**
   * Subscribe to whatsapp_clicks inserts
   */
  subscribeToWhatsAppClicks(callback: WhatsAppClickCallback): () => void {
    const channelName = 'whatsapp_clicks_inserts';

    const channel = this.supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'whatsapp_clicks',
        },
        (payload: RealtimePostgresInsertPayload<WhatsAppClickRow>) => {
          const event: RealtimeWhatsAppClickEvent = {
            type: 'INSERT',
            table: 'whatsapp_clicks',
            record: payload.new,
            old_record: payload.old as WhatsAppClickRow | null,
          };
          callback(event);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[Realtime] Subscribed to whatsapp_clicks');
        }
      });

    this.channels.set(channelName, channel);

    return () => {
      this.unsubscribe(channelName);
    };
  }

  /**
   * Subscribe to conversions inserts
   */
  subscribeToConversions(callback: ConversionCallback): () => void {
    const channelName = 'conversions_inserts';

    const channel = this.supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversions',
        },
        (payload: RealtimePostgresInsertPayload<ConversionRow>) => {
          const event: RealtimeConversionEvent = {
            type: 'INSERT',
            table: 'conversions',
            record: payload.new,
            old_record: payload.old as ConversionRow | null,
          };
          callback(event);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[Realtime] Subscribed to conversions');
        }
      });

    this.channels.set(channelName, channel);

    return () => {
      this.unsubscribe(channelName);
    };
  }

  /**
   * Subscribe to all analytics tables
   */
  subscribeToAll(callbacks: {
    onPageView?: PageViewCallback;
    onWhatsAppClick?: WhatsAppClickCallback;
    onConversion?: ConversionCallback;
  }): () => void {
    const unsubscribers: (() => void)[] = [];

    if (callbacks.onPageView) {
      unsubscribers.push(this.subscribeToPageViews(callbacks.onPageView));
    }
    if (callbacks.onWhatsAppClick) {
      unsubscribers.push(this.subscribeToWhatsAppClicks(callbacks.onWhatsAppClick));
    }
    if (callbacks.onConversion) {
      unsubscribers.push(this.subscribeToConversions(callbacks.onConversion));
    }

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }

  /**
   * Unsubscribe from a specific channel
   */
  unsubscribe(channelName: string): void {
    const channel = this.channels.get(channelName);
    if (channel) {
      this.supabase.removeChannel(channel);
      this.channels.delete(channelName);
    }
  }

  /**
   * Unsubscribe from all channels
   */
  unsubscribeAll(): void {
    for (const [, channel] of this.channels) {
      this.supabase.removeChannel(channel);
    }
    this.channels.clear();
    this.isConnected = false;
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): boolean {
    return this.isConnected;
  }
}

// Singleton instance for the browser
let _instance: AnalyticsRealtimeSubscriptions | null = null;

export function getAnalyticsRealtime(): AnalyticsRealtimeSubscriptions {
  if (!_instance) {
    _instance = new AnalyticsRealtimeSubscriptions();
  }
  return _instance;
}

// Helper to enable realtime on tables (run once during setup)
export async function enableRealtimeOnAnalyticsTables(): Promise<void> {
  // This requires admin privileges and is typically done via SQL migration:
  // ALTER PUBLICATION supabase_realtime ADD TABLE page_views;
  // ALTER PUBLICATION supabase_realtime ADD TABLE whatsapp_clicks;
  // ALTER PUBLICATION supabase_realtime ADD TABLE conversions;
  console.log(
    '[Realtime] Tables should be added to supabase_realtime publication via SQL migration'
  );
}

// React/Vue/Svelte hook helper (for framework integration)
export function createRealtimeHook() {
  const realtime = getAnalyticsRealtime();

  return {
    subscribe: realtime.subscribeToAll.bind(realtime),
    unsubscribeAll: realtime.unsubscribeAll.bind(realtime),
    getStatus: realtime.getConnectionStatus.bind(realtime),
  };
}
