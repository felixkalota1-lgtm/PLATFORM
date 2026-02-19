import * as functions from "firebase-functions";
/**
 * Cloud Function: Send email via Gmail API
 * Callable function that securely sends emails on behalf of the user
 */
export declare const sendEmailViaGmail: functions.HttpsFunction & functions.Runnable<any>;
/**
 * Cloud Function: Fetch inbox emails from Gmail
 * Polls Gmail API for new emails from connected accounts
 */
export declare const fetchInboxEmails: functions.HttpsFunction & functions.Runnable<any>;
/**
 * Cloud Function: Mark email as read
 */
export declare const markEmailAsRead: functions.HttpsFunction & functions.Runnable<any>;
/**
 * Scheduled Cloud Function: Sync inbox for all active users
 * Runs every 5 minutes to fetch new emails
 */
export declare const syncAllInboxes: functions.CloudFunction<unknown>;
