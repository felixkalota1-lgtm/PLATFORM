import { 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult,
  GoogleAuthProvider,
  User,
  Auth
} from 'firebase/auth';
import { 
  getDatabase, 
  ref, 
  set, 
  get, 
  update,
  remove,
  onValue,
  Unsubscribe
} from 'firebase/database';

// Gmail OAuth configuration
const GMAIL_OAUTH_CLIENT_ID = '328826778668-ul170l644lqpf8l3qbq3h2171ba4dbm.apps.googleusercontent.com';
const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify'
];

// Email account types
export interface EmailAccount {
  id: string;
  email: string;
  provider: 'gmail' | 'outlook' | 'custom-smtp';
  accessToken: string;
  refreshToken?: string;
  connectedAt: number;
  isDefault: boolean;
  lastSyncedAt?: number;
}

export interface EmailHistory {
  id: string;
  documentId: string;
  documentType: 'quotation' | 'invoice' | 'order';
  recipientEmail: string;
  senderEmail: string;
  subject: string;
  timestamp: number;
  status: 'sent' | 'pending' | 'failed' | 'bounced';
  errorMessage?: string;
  attachmentUrl?: string;
}

export interface InboxEmail {
  id: string;
  messageId: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  timestamp: number;
  isRead: boolean;
  hasAttachments: boolean;
  attachmentCount: number;
}

class GmailOAuthService {
  private auth: Auth;
  private database: any;
  private currentUser: User | null = null;
  private emailAccountsUnsubscribe: Unsubscribe | null = null;
  private inboxMetadataUnsubscribe: Unsubscribe | null = null;

  constructor(auth: Auth) {
    this.auth = auth;
    this.database = getDatabase();
    this.currentUser = auth.currentUser;
    
    // Listen for auth state changes
    auth.onAuthStateChanged((user) => {
      this.currentUser = user;
      if (user) {
        this.subscribeToEmailAccounts(user.uid);
      } else {
        this.unsubscribeFromEmailAccounts();
      }
    });
  }

  /**
   * Initialize Gmail OAuth provider
   */
  private initializeGoogleProvider(): GoogleAuthProvider {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'consent' });
    
    // Add Gmail scopes
    GMAIL_SCOPES.forEach(scope => {
      provider.addScope(scope);
    });
    
    return provider;
  }

  /**
   * Connect Gmail account via OAuth popup
   */
  async connectGmailAccount(): Promise<EmailAccount | null> {
    try {
      if (!this.currentUser) {
        throw new Error('User must be authenticated to connect Gmail account');
      }

      const provider = this.initializeGoogleProvider();
      const result = await signInWithPopup(this.auth, provider);
      
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (!credential?.accessToken) {
        throw new Error('Failed to obtain access token');
      }

      const user = result.user;
      const email = user.email || '';
      
      // Get refresh token from credential
      const refreshToken = credential.idToken || undefined;

      const emailAccount: EmailAccount = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        email,
        provider: 'gmail',
        accessToken: credential.accessToken,
        refreshToken,
        connectedAt: Date.now(),
        isDefault: true, // First account is default
        lastSyncedAt: Date.now()
      };

      // Save to Realtime Database
      const accountRef = ref(this.database, `users/${this.currentUser.uid}/emailAccounts/${emailAccount.id}`);
      await set(accountRef, {
        email: emailAccount.email,
        provider: emailAccount.provider,
        accessToken: emailAccount.accessToken,
        refreshToken: emailAccount.refreshToken,
        connectedAt: emailAccount.connectedAt,
        isDefault: emailAccount.isDefault,
        lastSyncedAt: emailAccount.lastSyncedAt
      });

      return emailAccount;
    } catch (error) {
      console.error('Error connecting Gmail account:', error);
      throw error;
    }
  }

  /**
   * Get all connected email accounts for current user
   */
  async getEmailAccounts(): Promise<EmailAccount[]> {
    try {
      if (!this.currentUser) {
        return [];
      }

      const accountsRef = ref(this.database, `users/${this.currentUser.uid}/emailAccounts`);
      const snapshot = await get(accountsRef);
      
      if (!snapshot.exists()) {
        return [];
      }

      const accounts: EmailAccount[] = [];
      const data = snapshot.val();
      
      for (const [id, accountData] of Object.entries(data)) {
        accounts.push({
          id,
          ...(accountData as Omit<EmailAccount, 'id'>)
        });
      }

      return accounts;
    } catch (error) {
      console.error('Error fetching email accounts:', error);
      return [];
    }
  }

  /**
   * Disconnect email account
   */
  async disconnectEmailAccount(accountId: string): Promise<void> {
    try {
      if (!this.currentUser) {
        throw new Error('User must be authenticated');
      }

      const accountRef = ref(
        this.database,
        `users/${this.currentUser.uid}/emailAccounts/${accountId}`
      );
      
      await remove(accountRef);
    } catch (error) {
      console.error('Error disconnecting email account:', error);
      throw error;
    }
  }

  /**
   * Set default email account
   */
  async setDefaultEmailAccount(accountId: string): Promise<void> {
    try {
      if (!this.currentUser) {
        throw new Error('User must be authenticated');
      }

      const accountsRef = ref(this.database, `users/${this.currentUser.uid}/emailAccounts`);
      const snapshot = await get(accountsRef);
      
      if (!snapshot.exists()) {
        throw new Error('No email accounts found');
      }

      const updates: Record<string, any> = {};
      const data = snapshot.val();

      for (const [id, accountData] of Object.entries(data)) {
        updates[`${id}/isDefault`] = id === accountId;
      }

      await update(accountsRef, updates);
    } catch (error) {
      console.error('Error setting default email account:', error);
      throw error;
    }
  }

  /**
   * Log email sending action to history
   */
  async logEmailHistory(history: Omit<EmailHistory, 'id'>): Promise<EmailHistory> {
    try {
      if (!this.currentUser) {
        throw new Error('User must be authenticated');
      }

      const emailHistoryId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const emailHistory: EmailHistory = {
        id: emailHistoryId,
        ...history
      };

      const historyRef = ref(
        this.database,
        `users/${this.currentUser.uid}/emailHistory/${emailHistoryId}`
      );
      
      await set(historyRef, {
        documentId: emailHistory.documentId,
        documentType: emailHistory.documentType,
        recipientEmail: emailHistory.recipientEmail,
        senderEmail: emailHistory.senderEmail,
        subject: emailHistory.subject,
        timestamp: emailHistory.timestamp,
        status: emailHistory.status,
        errorMessage: emailHistory.errorMessage,
        attachmentUrl: emailHistory.attachmentUrl
      });

      return emailHistory;
    } catch (error) {
      console.error('Error logging email history:', error);
      throw error;
    }
  }

  /**
   * Get email sending history
   */
  async getEmailHistory(limit: number = 50): Promise<EmailHistory[]> {
    try {
      if (!this.currentUser) {
        return [];
      }

      const historyRef = ref(this.database, `users/${this.currentUser.uid}/emailHistory`);
      const snapshot = await get(historyRef);
      
      if (!snapshot.exists()) {
        return [];
      }

      const history: EmailHistory[] = [];
      const data = snapshot.val();
      
      for (const [id, emailData] of Object.entries(data)) {
        history.push({
          id,
          ...(emailData as Omit<EmailHistory, 'id'>)
        });
      }

      // Sort by timestamp descending and limit
      return history.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
    } catch (error) {
      console.error('Error fetching email history:', error);
      return [];
    }
  }

  /**
   * Update email history status (e.g., mark as sent/failed)
   */
  async updateEmailHistoryStatus(
    emailHistoryId: string,
    status: EmailHistory['status'],
    errorMessage?: string
  ): Promise<void> {
    try {
      if (!this.currentUser) {
        throw new Error('User must be authenticated');
      }

      const historyRef = ref(
        this.database,
        `users/${this.currentUser.uid}/emailHistory/${emailHistoryId}`
      );

      const updates: Record<string, any> = { status };
      if (errorMessage) {
        updates.errorMessage = errorMessage;
      }

      await update(historyRef, updates);
    } catch (error) {
      console.error('Error updating email history status:', error);
      throw error;
    }
  }

  /**
   * Get inbox metadata (unread count, last sync)
   */
  async getInboxMetadata(): Promise<{ unreadCount: number; lastFetch: number }> {
    try {
      if (!this.currentUser) {
        return { unreadCount: 0, lastFetch: 0 };
      }

      const metadataRef = ref(this.database, `users/${this.currentUser.uid}/inboxMetadata`);
      const snapshot = await get(metadataRef);
      
      if (!snapshot.exists()) {
        return { unreadCount: 0, lastFetch: 0 };
      }

      return snapshot.val();
    } catch (error) {
      console.error('Error fetching inbox metadata:', error);
      return { unreadCount: 0, lastFetch: 0 };
    }
  }

  /**
   * Update inbox metadata
   */
  async updateInboxMetadata(unreadCount: number, lastFetch: number): Promise<void> {
    try {
      if (!this.currentUser) {
        throw new Error('User must be authenticated');
      }

      const metadataRef = ref(this.database, `users/${this.currentUser.uid}/inboxMetadata`);
      await set(metadataRef, {
        unreadCount,
        lastFetch
      });
    } catch (error) {
      console.error('Error updating inbox metadata:', error);
      throw error;
    }
  }

  /**
   * Subscribe to email accounts changes
   */
  private subscribeToEmailAccounts(uid: string): void {
    const accountsRef = ref(this.database, `users/${uid}/emailAccounts`);
    
    this.emailAccountsUnsubscribe = onValue(accountsRef, (snapshot) => {
      if (snapshot.exists()) {
        const accounts = snapshot.val();
        // Dispatch custom event when email accounts change
        window.dispatchEvent(new CustomEvent('emailAccountsChanged', { detail: accounts }));
      }
    });
  }

  /**
   * Unsubscribe from email accounts
   */
  private unsubscribeFromEmailAccounts(): void {
    if (this.emailAccountsUnsubscribe) {
      this.emailAccountsUnsubscribe();
      this.emailAccountsUnsubscribe = null;
    }
  }

  /**
   * Subscribe to inbox metadata changes
   */
  subscribeToInboxMetadata(uid: string, callback: (metadata: any) => void): Unsubscribe {
    const metadataRef = ref(this.database, `users/${uid}/inboxMetadata`);
    
    return onValue(metadataRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.val());
      } else {
        callback({ unreadCount: 0, lastFetch: 0 });
      }
    });
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.unsubscribeFromEmailAccounts();
    if (this.inboxMetadataUnsubscribe) {
      this.inboxMetadataUnsubscribe();
    }
  }
}

export default GmailOAuthService;
