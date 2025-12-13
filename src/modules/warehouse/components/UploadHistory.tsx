/**
 * Upload History Component
 * 
 * Displays history of warehouse uploads with details
 */

import { useState, useEffect } from 'react'
import { db } from '../../../services/firebase'
import { collection, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore'
import { Loader, CheckCircle2, AlertCircle, FileText } from 'lucide-react'

interface UploadRecord {
  id: string
  uploadedBy: string
  uploadedAt: Timestamp
  fileName: string
  totalProducts: number
  newProducts: number
  duplicates: number
  aiFeatures?: {
    imagesGenerated?: number
    duplicatesDetected?: number
    categorized?: number
  }
  status: 'completed' | 'partial_error' | 'failed'
}

interface UploadHistoryProps {
  tenantId: string
}

export default function UploadHistory({ tenantId }: UploadHistoryProps) {
  const [uploads, setUploads] = useState<UploadRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    const fetchUploadHistory = async () => {
      try {
        setLoading(true)
        const q = query(
          collection(db, 'upload_history'),
          where('tenantId', '==', tenantId),
          orderBy('uploadedAt', 'desc'),
          limit(20)
        )
        const snapshot = await getDocs(q)
        const records = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as UploadRecord[]
        setUploads(records)
      } catch (error) {
        console.error('Error fetching upload history:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUploadHistory()
  }, [tenantId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-6 h-6 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading upload history...</span>
      </div>
    )
  }

  if (uploads.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-12 text-center">
        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">No uploads yet</h3>
        <p className="text-gray-500">Start by uploading your first batch of products</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold">Upload History</h2>
        <p className="text-gray-600 text-sm mt-1">Recent uploads to warehouse inventory</p>
      </div>

      <div className="divide-y divide-gray-200">
        {uploads.map(upload => (
          <div key={upload.id} className="hover:bg-gray-50 transition-colors">
            <button
              onClick={() => setExpandedId(expandedId === upload.id ? null : upload.id)}
              className="w-full text-left p-6 flex items-center justify-between gap-4"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  {upload.status === 'completed' ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                  )}
                  <span className="font-semibold text-gray-900">{upload.fileName}</span>
                  <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                    upload.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {upload.status === 'completed' ? 'Success' : 'Partial Error'}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  {upload.uploadedAt instanceof Timestamp 
                    ? upload.uploadedAt.toDate().toLocaleString()
                    : new Date(upload.uploadedAt as any).toLocaleString()}
                </p>
              </div>
              <div className="text-right min-w-fit">
                <p className="font-bold text-lg text-gray-900">{upload.totalProducts}</p>
                <p className="text-xs text-gray-600">products uploaded</p>
              </div>
            </button>

            {/* Expanded Details */}
            {expandedId === upload.id && (
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-600 font-semibold uppercase mb-1">Total Products</p>
                  <p className="text-2xl font-bold text-gray-900">{upload.totalProducts}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-semibold uppercase mb-1">New Products</p>
                  <p className="text-2xl font-bold text-green-600">{upload.newProducts}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-semibold uppercase mb-1">Duplicates</p>
                  <p className="text-2xl font-bold text-amber-600">{upload.duplicates}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-semibold uppercase mb-1">Images Generated</p>
                  <p className="text-2xl font-bold text-blue-600">{upload.aiFeatures?.imagesGenerated || 0}</p>
                </div>
                {upload.aiFeatures && (
                  <>
                    <div className="col-span-2 md:col-span-1">
                      <p className="text-xs text-gray-600 font-semibold uppercase mb-1">Categorized</p>
                      <p className="text-2xl font-bold text-purple-600">{upload.aiFeatures.categorized || 0}</p>
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <p className="text-xs text-gray-600 font-semibold uppercase mb-1">Duplicates Detected</p>
                      <p className="text-2xl font-bold text-red-600">{upload.aiFeatures.duplicatesDetected || 0}</p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
