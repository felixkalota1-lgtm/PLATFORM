import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  User,
  Auth,
} from "firebase/auth";
import {
  saveEmailAccount,
  getEmailAccounts,
  updateEmailAccountToken,
  deleteEmailAccount,
  saveEmailHistory,
  getEmailHistory,
  updateInboxMetadata,
  getInboxMetadata,
} from "../utils/tursoConfig";

// Type alias for compatibility
type Unsubscribe = () => void;

// Gmail OAuth configuration
const GMAIL_OAUTH_CLIENT_ID =
  "328826778668-ul170l644lqpf8l3qbq3h2171ba4dbm.apps.googleusercontent.com";
const GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.modify",
];

// Email account types
export interface EmailAccount {
  id: string;
  email: string;
  provider: "gmail" | "outlook" | "custom-smtp";
  accessToken: string;
  refreshToken?: string;
  connectedAt: number;
  isDefault: boolean;
  lastSyncedAt?: number;
}

export interface EmailHistory {
  id: string;
  documentId: string;
  documentType: "quotation" | "invoice" | "order";
  recipientEmail: string;
  senderEmail: string;
  subject: string;
  timestamp: number;
  status: "sent" | "pending" | "failed" | "bounced";
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
  private currentUser: User | null = null;

  constructor(auth: Auth) {
    this.auth = auth;
    this.currentUser = auth.currentUser;

    // Listen for auth state changes
    auth.onAuthStateChanged((user) => {
      this.currentUser = user;
    });
  }

  /**
   * Initialize Gmail OAuth provider
   */
  private initializeGoogleProvider(): GoogleAuthProvider {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "consent" });

    // Add Gmail scopes
    GMAIL_SCOPES.forEach((scope) => {
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
        throw new Error("User must be authenticated to connect Gmail account");
      }

      const provider = this.initializeGoogleProvider();
      const result = await signInWithPopup(this.auth, provider);

      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (!credential?.accessToken) {
        throw new Error("Failed to obtain access token");
      }

      const user = result.user;
      const email = user.email || "";

      // Get refresh token from credential
      const refreshToken = credential.idToken || undefined;

      const emailAccount: EmailAccount = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        email,
        provider: "gmail",
        accessToken: credential.accessToken,
        refreshToken,
        connectedAt: Date.now(),
        isDefault: true, // First account is default
        lastSyncedAt: Date.now(),
      };

      // Save to Turso
      await saveEmailAccount({
        accountId: emailAccount.id,
        uid: this.currentUser.uid,
        email: emailAccount.email,
        provider: emailAccount.provider,
        accessToken: emailAccount.accessToken,
        refreshToken: emailAccount.refreshToken,
        isDefault: emailAccount.isDefault,
        connectedAt: new Date(emailAccount.connectedAt).toISOString(),
      });

      return emailAccount;
    } catch (error) {
      console.error("Error connecting Gmail account:", error);
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

      const accounts = await getEmailAccounts(this.currentUser.uid);

      // Convert Turso format to EmailAccount format
      return accounts.map((acc: any) => ({
        id: acc.accountId,
        email: acc.email,
        provider: acc.provider,
        accessToken: acc.accessToken,
        refreshToken: acc.refreshToken,
        connectedAt: new Date(acc.connectedAt).getTime(),
        isDefault: acc.isDefault,
        lastSyncedAt: acc.lastSyncedAt
          ? new Date(acc.lastSyncedAt).getTime()
          : undefined,
      }));
    } catch (error) {
      console.error("Error fetching email accounts:", error);
      return [];
    }
  }

  /**
   * Disconnect email account
   */
  async disconnectEmailAccount(accountId: string): Promise<void> {
    try {
      if (!this.currentUser) {
        throw new Error("User must be authenticated");
      }

      await deleteEmailAccount(accountId);
    } catch (error) {
      console.error("Error disconnecting email account:", error);
      throw error;
    }
  }

  /**
   * Set default email account
   */
  async setDefaultEmailAccount(accountId: string): Promise<void> {
    try {
      if (!this.currentUser) {
        throw new Error("User must be authenticated");
      }

      const accounts = await getEmailAccounts(this.currentUser.uid);

      if (!accounts || accounts.length === 0) {
        throw new Error("No email accounts found");
      }

      // Update all accounts to set isDefault
      for (const account of accounts) {
        await updateEmailAccountToken(
          account.accountId,
          account.accessToken,
          account.refreshToken,
          account.accountId === accountId,
        );
      }
    } catch (error) {
      console.error("Error setting default email account:", error);
      throw error;
    }
  }

  /**
   * Log email sending action to history
   */
  async logEmailHistory(
    history: Omit<EmailHistory, "id">,
  ): Promise<EmailHistory> {
    try {
      if (!this.currentUser) {
        throw new Error("User must be authenticated");
      }

      const emailHistoryId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const emailHistory: EmailHistory = {
        id: emailHistoryId,
        ...history,
      };

      await saveEmailHistory({
        emailId: emailHistoryId,
        uid: this.currentUser.uid,
        fromEmail: emailHistory.senderEmail,
        toEmail: emailHistory.recipientEmail,
        subject: emailHistory.subject,
        body: "", // Not stored but available in history
        timestamp: new Date(emailHistory.timestamp).toISOString(),
        status: emailHistory.status,
      });

      return emailHistory;
    } catch (error) {
      console.error("Error logging email history:", error);
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

      const history = await getEmailHistory(this.currentUser.uid, limit);

      if (!history || history.length === 0) {
        return [];
      }

      // Convert Turso format to EmailHistory format
      return history.map((h: any) => ({
        id: h.emailId,
        documentId: h.attachmentUrl || "", // Use as fallback document ID
        documentType: "quotation" as const,
        recipientEmail: h.toEmail,
        senderEmail: h.fromEmail,
        subject: h.subject,
        timestamp: new Date(h.timestamp).getTime(),
        status: h.status,
        errorMessage: h.errorMessage,
        attachmentUrl: h.attachmentUrl,
      }));
    } catch (error) {
      console.error("Error fetching email history:", error);
      return [];
    }
  }

  /**
   * Update email history status (e.g., mark as sent/failed)
   */
  async updateEmailHistoryStatus(
    emailHistoryId: string,
    status: EmailHistory["status"],
    errorMessage?: string,
  ): Promise<void> {
    try {
      if (!this.currentUser) {
        throw new Error("User must be authenticated");
      }

      // Note: Turso doesn't have direct update for individual history records
      // This would require additional schema planning
      console.warn(
        "updateEmailHistoryStatus: Not directly supported with Turso - consider using triggers or batch updates",
      );
    } catch (error) {
      console.error("Error updating email history status:", error);
      throw error;
    }
  }

  /**
   * Get inbox metadata (unread count, last sync)
   */
  async getInboxMetadata(): Promise<{
    unreadCount: number;
    lastFetch: number;
  }> {
    try {
      if (!this.currentUser) {
        return { unreadCount: 0, lastFetch: 0 };
      }

      const metadata = await getInboxMetadata(this.currentUser.uid);

      if (!metadata) {
        return { unreadCount: 0, lastFetch: 0 };
      }

      return {
        unreadCount: metadata.unreadCount || 0,
        lastFetch: metadata.lastFetch
          ? new Date(metadata.lastFetch).getTime()
          : 0,
      };
    } catch (error) {
      console.error("Error fetching inbox metadata:", error);
      return { unreadCount: 0, lastFetch: 0 };
    }
  }

  /**
   * Update inbox metadata
   */
  async updateInboxMetadata(
    unreadCount: number,
    lastFetch: number,
  ): Promise<void> {
    try {
      if (!this.currentUser) {
        throw new Error("User must be authenticated");
      }

      const { updateInboxMetadata: updateMetadata } =
        await import("../utils/tursoConfig");
      await updateMetadata(this.currentUser.uid, {
        unreadCount,
        lastFetch: new Date(lastFetch).toISOString(),
      });
    } catch (error) {
      console.error("Error updating inbox metadata:", error);
      throw error;
    }
  }

  /**
   * Subscribe to email accounts changes (polling-based with Turso)
   */
  private subscribeToEmailAccounts(uid: string): void {
    // With Turso, we use polling instead of real-time subscriptions
    const pollInterval = setInterval(async () => {
      try {
        const accounts = await getEmailAccounts(uid);
        // Dispatch custom event when email accounts change
        window.dispatchEvent(
          new CustomEvent("emailAccountsChanged", { detail: accounts }),
        );
      } catch (error) {
        console.error("Error polling email accounts:", error);
      }
    }, 30000); // Poll every 30 seconds

    // Store interval ID for cleanup
    (this as any).emailAccountsPollInterval = pollInterval;
  }

  /**
   * Unsubscribe from email accounts
   */
  private unsubscribeFromEmailAccounts(): void {
    if ((this as any).emailAccountsPollInterval) {
      clearInterval((this as any).emailAccountsPollInterval);
      (this as any).emailAccountsPollInterval = null;
    }
  }

  /**
   * Subscribe to inbox metadata changes (polling-based with Turso)
   */
  subscribeToInboxMetadata(
    uid: string,
    callback: (metadata: any) => void,
  ): Unsubscribe {
    const pollInterval = setInterval(async () => {
      try {
        const metadata = await getInboxMetadata(uid);
        if (metadata) {
          callback(metadata);
        } else {
          callback({ unreadCount: 0, lastFetch: new Date().toISOString() });
        }
      } catch (error) {
        console.error("Error polling inbox metadata:", error);
      }
    }, 30000); // Poll every 30 seconds

    // Return unsubscribe function
    return () => clearInterval(pollInterval);
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.unsubscribeFromEmailAccounts();
  }
}

export default GmailOAuthService;
