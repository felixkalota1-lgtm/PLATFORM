import React, { useState, useEffect } from "react";
import { Plus, Trash2, Check, Loader, Mail, LogOut } from "lucide-react";
import GmailOAuthService, { EmailAccount } from "../services/GmailOAuthService";

export interface EmailAccountsSettingsProps {
  gmailService: GmailOAuthService;
}

const EmailAccountsSettings: React.FC<EmailAccountsSettingsProps> = ({
  gmailService,
}) => {
  const [emailAccounts, setEmailAccounts] = useState<EmailAccount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [accountToDelete, setAccountToDelete] = useState<string | null>(null);

  // Load email accounts on mount
  useEffect(() => {
    loadEmailAccounts();

    // Listen for email accounts changes
    const unsubscribe = window.addEventListener("emailAccountsChanged", () => {
      loadEmailAccounts();
    });

    return () => {
      window.removeEventListener(
        "emailAccountsChanged",
        loadEmailAccounts as EventListener,
      );
    };
  }, []);

  const loadEmailAccounts = async () => {
    try {
      setIsLoading(true);
      const accounts = await gmailService.getEmailAccounts();
      setEmailAccounts(accounts);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load email accounts";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectGmail = async () => {
    try {
      setError(null);
      setIsConnecting(true);

      const newAccount = await gmailService.connectGmailAccount();
      if (newAccount) {
        setSuccess(`Gmail account ${newAccount.email} connected successfully!`);
        await loadEmailAccounts();

        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to connect Gmail account";
      setError(errorMessage);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSetDefault = async (accountId: string) => {
    try {
      setError(null);
      await gmailService.setDefaultEmailAccount(accountId);
      setSuccess("Default email account updated!");
      await loadEmailAccounts();

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to set default account";
      setError(errorMessage);
    }
  };

  const handleDisconnect = async (accountId: string) => {
    try {
      setError(null);
      await gmailService.disconnectEmailAccount(accountId);
      setSuccess("Email account disconnected successfully!");
      setAccountToDelete(null);
      await loadEmailAccounts();

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to disconnect account";
      setError(errorMessage);
    }
  };

  const formatConnectDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatLastSync = (timestamp?: number) => {
    if (!timestamp) return "Never";
    const now = Date.now();
    const diff = now - timestamp;

    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Email Accounts
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Connect and manage email accounts for sending documents
          </p>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm flex justify-between items-center">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-600"
          >
            ×
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700 text-sm flex items-center gap-2">
          <Check size={18} />
          {success}
        </div>
      )}

      {/* Connect Button */}
      <button
        onClick={handleConnectGmail}
        disabled={isConnecting || isLoading}
        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isConnecting ? (
          <>
            <Loader size={18} className="animate-spin" />
            Connecting...
          </>
        ) : (
          <>
            <Plus size={18} />
            Connect Gmail Account
          </>
        )}
      </button>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader size={24} className="animate-spin text-blue-600" />
        </div>
      )}

      {/* Email Accounts List */}
      {!isLoading && emailAccounts.length > 0 && (
        <div className="space-y-3">
          {emailAccounts.map((account) => (
            <div
              key={account.id}
              className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between hover:shadow-md transition"
            >
              <div className="flex items-start gap-4 flex-1">
                <div className="bg-blue-100 rounded-full p-3 mt-1">
                  <Mail size={20} className="text-blue-600" />
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900">{account.email}</p>
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                      {account.provider.toUpperCase()}
                    </span>
                    {account.isDefault && (
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded flex items-center gap-1">
                        <Check size={12} />
                        Default
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 mt-2 text-sm text-gray-600">
                    <p>Connected: {formatConnectDate(account.connectedAt)}</p>
                    <p>Last synced: {formatLastSync(account.lastSyncedAt)}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!account.isDefault && (
                  <button
                    onClick={() => handleSetDefault(account.id)}
                    className="px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition"
                  >
                    Set as Default
                  </button>
                )}

                <button
                  onClick={() => setAccountToDelete(account.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                  title="Disconnect account"
                >
                  <LogOut size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && emailAccounts.length === 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
          <Mail size={48} className="mx-auto text-gray-400 mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">
            No Email Accounts Connected
          </h4>
          <p className="text-gray-600 mb-6">
            Connect a Gmail account to send documents via email from the app.
          </p>
          <button
            onClick={handleConnectGmail}
            disabled={isConnecting}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {isConnecting ? (
              <>
                <Loader size={18} className="animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Plus size={18} />
                Connect Gmail Account
              </>
            )}
          </button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {accountToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Disconnect Email Account?
            </h3>
            <p className="text-gray-600 text-sm mb-6">
              Are you sure you want to disconnect this email account? You won't
              be able to send documents from this account anymore.
            </p>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setAccountToDelete(null)}
                className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDisconnect(accountToDelete)}
                className="px-4 py-2 bg-red-600 text-white font-medium hover:bg-red-700 rounded-lg transition"
              >
                Disconnect
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
        <p>
          <strong>Privacy:</strong> Your email credentials are securely stored
          and encrypted in Firebase. We only use them to send documents on your
          behalf.
        </p>
      </div>
    </div>
  );
};

export default EmailAccountsSettings;
