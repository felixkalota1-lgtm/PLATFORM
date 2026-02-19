import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { gmail_v1, google } from "googleapis";

// Initialize Firebase Admin SDK
admin.initializeApp();

// OAuth2 client configuration
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URL,
);

// Gmail API client type
let gmailService: gmail_v1.Gmail;

/**
 * Initialize Gmail service with user's access token
 */
function initializeGmailService(accessToken: string) {
  oauth2Client.setCredentials({ access_token: accessToken });
  gmailService = google.gmail({ version: "v1", auth: oauth2Client });
}

/**
 * Cloud Function: Send email via Gmail API
 * Callable function that securely sends emails on behalf of the user
 */
export const sendEmailViaGmail = functions.https.onCall(
  async (data, context) => {
    // Verify user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated to send emails",
      );
    }

    const userId = context.auth.uid;
    const { emailAccountId, toEmail, subject, htmlBody, attachmentData } = data;

    try {
      // 1. Retrieve email account data from Realtime Database
      const db = admin.database();
      const accountSnapshot = await db
        .ref(`users/${userId}/emailAccounts/${emailAccountId}`)
        .once("value");

      if (!accountSnapshot.exists()) {
        throw new functions.https.HttpsError(
          "not-found",
          "Email account not found",
        );
      }

      const account = accountSnapshot.val();
      const accessToken = account.accessToken;

      // 2. Initialize Gmail service with user's token
      initializeGmailService(accessToken);

      // 3. Build email message
      const message = buildEmailMessage(
        account.email,
        toEmail,
        subject,
        htmlBody,
        attachmentData,
      );

      // 4. Send email via Gmail API
      const sentEmail = await gmailService.users.messages.send({
        userId: "me",
        requestBody: {
          raw: message,
        },
      });

      console.log(`✅ Email sent successfully: ${sentEmail.data.id}`);

      // 5. Log to Firestore for history tracking
      await admin
        .firestore()
        .collection("emailHistory")
        .doc(userId)
        .collection("sent")
        .add({
          documentId: data.documentId || "unknown",
          documentType: data.documentType || "document",
          recipientEmail: toEmail,
          senderEmail: account.email,
          subject,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          status: "sent",
          messageId: sentEmail.data.id,
          emailAccountId,
        });

      return {
        success: true,
        messageId: sentEmail.data.id,
        threadId: sentEmail.data.threadId,
      };
    } catch (error: any) {
      console.error("❌ Error sending email:", error);

      // Log failed attempt
      await admin
        .firestore()
        .collection("emailHistory")
        .doc(userId)
        .collection("sent")
        .add({
          documentId: data.documentId || "unknown",
          documentType: data.documentType || "document",
          recipientEmail: toEmail,
          senderEmail: "unknown",
          subject,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          status: "failed",
          errorMessage: error.message,
          emailAccountId,
        });

      throw new functions.https.HttpsError(
        "internal",
        `Failed to send email: ${error.message}`,
      );
    }
  },
);

/**
 * Cloud Function: Fetch inbox emails from Gmail
 * Polls Gmail API for new emails from connected accounts
 */
export const fetchInboxEmails = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated",
      );
    }

    const userId = context.auth.uid;
    const { emailAccountId, maxResults = 10 } = data;

    try {
      // 1. Get email account with token
      const db = admin.database();
      const accountSnapshot = await db
        .ref(`users/${userId}/emailAccounts/${emailAccountId}`)
        .once("value");

      if (!accountSnapshot.exists()) {
        throw new functions.https.HttpsError(
          "not-found",
          "Email account not found",
        );
      }

      const account = accountSnapshot.val();
      initializeGmailService(account.accessToken);

      // 2. Fetch emails from Gmail API
      const messagesResult = await gmailService.users.messages.list({
        userId: "me",
        maxResults,
        q: "is:unread from:*@*", // Get unread emails
      });

      const messages = messagesResult.data.messages || [];
      const emailDetails: any[] = [];

      // 3. Get full details for each message
      for (const msg of messages) {
        if (msg.id) {
          const fullMessage = await gmailService.users.messages.get({
            userId: "me",
            id: msg.id,
            format: "full",
          });

          const headers = fullMessage.data.payload?.headers || [];
          const from = headers.find((h) => h.name === "From")?.value || "";
          const emailSubject =
            headers.find((h) => h.name === "Subject")?.value || "";
          const date = headers.find((h) => h.name === "Date")?.value || "";

          const body = extractEmailBody(fullMessage.data.payload);

          emailDetails.push({
            id: msg.id,
            messageId: msg.id,
            from,
            subject: emailSubject,
            body,
            date: new Date(date).getTime(),
            isRead: !fullMessage.data.labelIds?.includes("UNREAD"),
          });
        }
      }

      // 4. Update last sync time in Realtime DB
      await db.ref(`users/${userId}/inboxMetadata`).update({
        lastFetch: admin.database.ServerValue.TIMESTAMP,
        unreadCount: messages.length,
      });

      return {
        success: true,
        emails: emailDetails,
        count: emailDetails.length,
      };
    } catch (error: any) {
      console.error("❌ Error fetching inbox:", error);
      throw new functions.https.HttpsError(
        "internal",
        `Failed to fetch inbox: ${error.message}`,
      );
    }
  },
);

/**
 * Cloud Function: Mark email as read
 */
export const markEmailAsRead = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User must be authenticated",
    );
  }

  const userId = context.auth.uid;
  const { emailAccountId, messageId } = data;

  try {
    const db = admin.database();
    const accountSnapshot = await db
      .ref(`users/${userId}/emailAccounts/${emailAccountId}`)
      .once("value");

    if (!accountSnapshot.exists()) {
      throw new functions.https.HttpsError(
        "not-found",
        "Email account not found",
      );
    }

    const account = accountSnapshot.val();
    initializeGmailService(account.accessToken);

    await gmailService.users.messages.modify({
      userId: "me",
      id: messageId,
      requestBody: {
        removeLabelIds: ["UNREAD"],
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error("❌ Error marking email as read:", error);
    throw new functions.https.HttpsError(
      "internal",
      `Failed to mark email as read: ${error.message}`,
    );
  }
});

/**
 * Helper: Build MIME email message
 */
function buildEmailMessage(
  from: string,
  to: string,
  subject: string,
  htmlBody: string,
  attachmentData?: { filename: string; mimeType: string; data: string },
): string {
  const boundary = `boundary${Date.now()}`;
  const utf8Subject = `=?UTF-8?B?${Buffer.from(subject).toString("base64")}?=`;

  let message = `From: ${from}\r\nTo: ${to}\r\nSubject: ${utf8Subject}\r\n`;

  if (attachmentData) {
    message += `MIME-Version: 1.0\r\nContent-Type: multipart/mixed; boundary="${boundary}"\r\n\r\n`;
    message += `--${boundary}\r\nContent-Type: text/html; charset="UTF-8"\r\nContent-Transfer-Encoding: quoted-printable\r\n\r\n`;
    message += htmlBody;
    message += `\r\n--${boundary}\r\nContent-Type: ${attachmentData.mimeType}\r\nContent-Disposition: attachment; filename="${attachmentData.filename}"\r\nContent-Transfer-Encoding: base64\r\n\r\n`;
    message += attachmentData.data;
    message += `\r\n--${boundary}--`;
  } else {
    message += `MIME-Version: 1.0\r\nContent-Type: text/html; charset="UTF-8"\r\nContent-Transfer-Encoding: quoted-printable\r\n\r\n`;
    message += htmlBody;
  }

  return Buffer.from(message)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

/**
 * Helper: Extract email body from Gmail message payload
 */
function extractEmailBody(payload: any): string {
  if (!payload) return "";

  if (payload.parts) {
    // Multipart message - find HTML or plain text
    for (const part of payload.parts) {
      if (part.mimeType === "text/html" && part.body?.data) {
        return Buffer.from(part.body.data, "base64").toString("utf-8");
      }
      if (part.mimeType === "text/plain" && part.body?.data) {
        return Buffer.from(part.body.data, "base64").toString("utf-8");
      }
    }
  }

  if (payload.body?.data) {
    return Buffer.from(payload.body.data, "base64").toString("utf-8");
  }

  return "";
}

/**
 * Scheduled Cloud Function: Sync inbox for all active users
 * Runs every 5 minutes to fetch new emails
 */
export const syncAllInboxes = functions.pubsub
  .schedule("every 5 minutes")
  .onRun(async (context) => {
    try {
      const db = admin.database();
      const usersSnapshot = await db.ref("users").once("value");
      const users = usersSnapshot.val() || {};

      let synced = 0;
      let failed = 0;

      for (const [userId, userData] of Object.entries(users)) {
        const userDataObj = userData as any;
        const emailAccounts = userDataObj.emailAccounts || {};

        for (const [accountId, account] of Object.entries(emailAccounts)) {
          try {
            const accountObj = account as any;
            initializeGmailService(accountObj.accessToken);

            const messagesResult = await gmailService.users.messages.list({
              userId: "me",
              maxResults: 5,
              q: "is:unread",
            });

            const unreadCount = messagesResult.data.resultSizeEstimate || 0;

            await db.ref(`users/${userId}/inboxMetadata`).update({
              unreadCount,
              lastFetch: admin.database.ServerValue.TIMESTAMP,
            });

            synced++;
          } catch (error) {
            console.error(
              `Failed to sync inbox for user ${userId} account ${accountId}:`,
              error,
            );
            failed++;
          }
        }
      }

      console.log(`✅ Inbox sync complete: ${synced} synced, ${failed} failed`);
      return null;
    } catch (error) {
      console.error("❌ Error in syncAllInboxes:", error);
      return null;
    }
  });
