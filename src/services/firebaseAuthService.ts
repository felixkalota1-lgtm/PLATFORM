/**
 * Firebase Authentication Service with RBAC
 * Handles user authentication, role management, and Firebase integration
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  setPersistence,
  browserSessionPersistence,
  browserLocalPersistence,
  updateProfile,
  User as FirebaseUser,
  AuthError,
} from 'firebase/auth'
import {
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  Timestamp,
} from 'firebase/firestore'
import { auth, db } from './firebase'
import { auditLog as performAuditLog } from './auditLogger'

export interface AuthUser {
  uid: string
  email: string
  tenantId: string
  role: 'admin' | 'director' | 'manager' | 'vendor' | 'buyer' | 'accountant'
  displayName?: string
  companyName?: string
  avatar?: string
  lastLogin?: Date
  createdAt?: Date
}

export type UserRole = 'admin' | 'director' | 'manager' | 'vendor' | 'buyer' | 'accountant'

/**
 * Role permissions mapping
 */
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: ['*'], // All access
  director: ['*'], // All access
  manager: ['dashboard', 'inventory', 'orders', 'analytics'],
  vendor: ['marketplace', 'myListings', 'orders', 'profile'],
  buyer: ['marketplace', 'orders', 'profile'],
  accountant: ['accounting', 'analytics', 'reports'],
}

/**
 * Module access control by role
 */
export const MODULE_ACCESS: Record<UserRole, string[]> = {
  admin: [
    'dashboard',
    'warehouse',
    'inventory',
    'marketplace',
    'orders',
    'analytics',
    'accounting',
    'settings',
    'users',
    'audit',
    'b2b',
    'procurement',
    'sales',
    'hr',
    'fleet',
    'logistics',
    'communication',
  ],
  director: [
    'dashboard',
    'warehouse',
    'inventory',
    'marketplace',
    'orders',
    'analytics',
    'accounting',
    'settings',
    'b2b',
    'procurement',
    'sales',
    'fleet',
    'logistics',
    'communication',
  ],
  manager: ['dashboard', 'warehouse', 'inventory', 'orders', 'analytics', 'settings'],
  vendor: ['marketplace', 'myListings', 'orders', 'settings', 'profile'],
  buyer: ['marketplace', 'orders', 'settings', 'profile'],
  accountant: ['accounting', 'analytics', 'reports', 'settings'],
}

interface LoginResult {
  success: boolean
  user?: AuthUser
  error?: string
}

interface SignupResult {
  success: boolean
  user?: AuthUser
  error?: string
}

/**
 * Register a new user/company
 */
export const registerUser = async (
  email: string,
  password: string,
  companyName: string,
  displayName: string,
  rememberMe: boolean = false
): Promise<SignupResult> => {
  try {
    // Set persistence based on "remember me"
    await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence)

    // Create Firebase auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const firebaseUser = userCredential.user

    // Generate tenant ID from company name
    const tenantId = companyName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .substring(0, 30)

    // Create user profile in Firestore
    const userData: AuthUser = {
      uid: firebaseUser.uid,
      email: email,
      tenantId: tenantId,
      role: 'admin', // First user is admin
      displayName: displayName,
      companyName: companyName,
      createdAt: new Date(),
      lastLogin: new Date(),
    }

    // Update Firebase profile
    await updateProfile(firebaseUser, {
      displayName: displayName,
    })

    // Save to Firestore
    await setDoc(doc(db, 'users', firebaseUser.uid), userData)

    // Create company profile
    await setDoc(doc(db, 'companies', tenantId), {
      id: tenantId,
      name: companyName,
      adminId: firebaseUser.uid,
      createdAt: Timestamp.now(),
      email: email,
      status: 'active',
    })

    // Audit log
    await performAuditLog('LOGIN', firebaseUser.uid, tenantId, {
      email,
      companyName,
      role: 'admin',
    })

    // Save to localStorage
    localStorage.setItem('pspm_user', JSON.stringify(userData))
    localStorage.setItem('pspm_auth_token', firebaseUser.uid)

    return { success: true, user: userData }
  } catch (error: any) {
    const errorMsg = getAuthErrorMessage(error)
    await performAuditLog('ERROR', 'unknown', 'unknown', { email, error: errorMsg })
    return { success: false, error: errorMsg }
  }
}

/**
 * Login user with email and password
 */
export const loginUser = async (
  email: string,
  password: string,
  rememberMe: boolean = false
): Promise<LoginResult> => {
  try {
    // Set persistence
    await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence)

    // Sign in
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    const firebaseUser = userCredential.user

    // Get user data from Firestore
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))

    if (!userDoc.exists()) {
      throw new Error('User profile not found')
    }

    const userData = userDoc.data() as AuthUser

    // Update last login
    await updateDoc(doc(db, 'users', firebaseUser.uid), {
      lastLogin: Timestamp.now(),
    })

    // Audit log
    await performAuditLog('LOGIN', firebaseUser.uid, userData.tenantId, {
      email,
      role: userData.role,
      ip: 'browser',
    })

    // Save to localStorage
    localStorage.setItem('pspm_user', JSON.stringify(userData))
    localStorage.setItem('pspm_auth_token', firebaseUser.uid)
    localStorage.setItem('pspm_tenant', userData.tenantId)

    return { success: true, user: userData }
  } catch (error: any) {
    const errorMsg = getAuthErrorMessage(error)
    await performAuditLog('ERROR', 'unknown', 'unknown', { email, error: errorMsg })
    return { success: false, error: errorMsg }
  }
}

/**
 * Login with Google OAuth
 */
export const loginWithGoogle = async (rememberMe: boolean = false): Promise<LoginResult> => {
  try {
    await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence)

    const provider = new GoogleAuthProvider()
    const userCredential = await signInWithPopup(auth, provider)
    const firebaseUser = userCredential.user

    // Check if user exists in Firestore
    let userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))

    let userData: AuthUser

    if (!userDoc.exists()) {
      // First time Google login - create profile
      const defaultTenantId = firebaseUser.email?.split('@')[1] || 'default'
      userData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        tenantId: defaultTenantId,
        role: 'vendor', // Default role for OAuth users
        displayName: firebaseUser.displayName || 'User',
        avatar: firebaseUser.photoURL || undefined,
        createdAt: new Date(),
        lastLogin: new Date(),
      }

      await setDoc(doc(db, 'users', firebaseUser.uid), userData)
    } else {
      userData = userDoc.data() as AuthUser
      // Update last login
      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        lastLogin: Timestamp.now(),
      })
    }

    // Audit log
    await performAuditLog('LOGIN', firebaseUser.uid, userData.tenantId, {
      email: userData.email,
      role: userData.role,
    })

    // Save to localStorage
    localStorage.setItem('pspm_user', JSON.stringify(userData))
    localStorage.setItem('pspm_auth_token', firebaseUser.uid)
    localStorage.setItem('pspm_tenant', userData.tenantId)

    return { success: true, user: userData }
  } catch (error: any) {
    const errorMsg = getAuthErrorMessage(error)
    return { success: false, error: errorMsg }
  }
}

/**
 * Logout user
 */
export const logoutUser = async (): Promise<void> => {
  try {
    const user = auth.currentUser
    if (user) {
      const userDoc = await getDoc(doc(db, 'users', user.uid))
      const userData = userDoc.data() as AuthUser

      // Audit log
      await performAuditLog('LOGOUT', user.uid, userData.tenantId, {
        email: userData.email,
      })
    }

    await signOut(auth)

    // Clear localStorage
    localStorage.removeItem('pspm_user')
    localStorage.removeItem('pspm_auth_token')
    localStorage.removeItem('pspm_tenant')
  } catch (error) {
    console.error('Logout error:', error)
    // Still clear localStorage even if signOut fails
    localStorage.clear()
  }
}

/**
 * Check if user has permission for a resource
 */
export const hasPermission = (role: UserRole, resource: string): boolean => {
  const permissions = ROLE_PERMISSIONS[role]
  if (!permissions) return false
  if (permissions.includes('*')) return true
  return permissions.includes(resource)
}

/**
 * Check if user can access module
 */
export const canAccessModule = (role: UserRole, module: string): boolean => {
  const modules = MODULE_ACCESS[role]
  if (!modules) return false
  return modules.includes(module)
}

/**
 * Get all users in company/tenant
 */
export const getCompanyUsers = async (tenantId: string): Promise<AuthUser[]> => {
  try {
    const usersRef = collection(db, 'users')
    const q = query(usersRef, where('tenantId', '==', tenantId))
    const snapshot = await getDocs(q)

    return snapshot.docs.map((doc) => doc.data() as AuthUser)
  } catch (error) {
    console.error('Error fetching company users:', error)
    return []
  }
}

/**
 * Update user role (admin only)
 */
export const updateUserRole = async (
  userId: string,
  newRole: UserRole,
  adminId: string,
  tenantId: string
): Promise<boolean> => {
  try {
    await updateDoc(doc(db, 'users', userId), {
      role: newRole,
      updatedAt: Timestamp.now(),
    })

    // Audit log
    await performAuditLog('MANAGE_USER', adminId, tenantId, {
      targetUserId: userId,
      newRole: newRole,
    })

    return true
  } catch (error) {
    console.error('Error updating user role:', error)
    return false
  }
}

/**
 * Convert Firebase error to user-friendly message
 */
function getAuthErrorMessage(error: AuthError): string {
  const code = error.code

  switch (code) {
    case 'auth/invalid-email':
      return 'Invalid email address'
    case 'auth/user-disabled':
      return 'This user account has been disabled'
    case 'auth/user-not-found':
      return 'Email address not found'
    case 'auth/wrong-password':
      return 'Incorrect password'
    case 'auth/email-already-in-use':
      return 'Email already in use'
    case 'auth/weak-password':
      return 'Password should be at least 6 characters'
    case 'auth/operation-not-allowed':
      return 'Operation not allowed'
    case 'auth/account-exists-with-different-credential':
      return 'Account already exists with different sign-in credentials'
    default:
      return error.message || 'Authentication error occurred'
  }
}

export default {
  registerUser,
  loginUser,
  loginWithGoogle,
  logoutUser,
  hasPermission,
  canAccessModule,
  getCompanyUsers,
  updateUserRole,
}
