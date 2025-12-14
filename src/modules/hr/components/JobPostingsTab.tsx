import React, { useState, useMemo } from 'react';
import {
  Briefcase,
  MapPin,
  DollarSign,
  Calendar,
  Eye,
  Users,
  FileText,
} from 'lucide-react';
import { JobPosting } from '../../../services/hrService';
import '../HRModule.css';

interface JobPostingsTabProps {
  jobs: JobPosting[];
  onRefresh?: () => void;
}

const JobPostingsTab: React.FC<JobPostingsTabProps> = ({ jobs, onRefresh: _onRefresh }) => {
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');

  const departments = Array.from(new Set(jobs.map((j) => j.department)));

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchesStatus = filterStatus === 'all' || job.status === filterStatus;
      const matchesDept = filterDepartment === 'all' || job.department === filterDepartment;
      return matchesStatus && matchesDept;
    });
  }, [jobs, filterStatus, filterDepartment]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-green-500/20 text-green-300 border border-green-500/30';
      case 'closed':
        return 'bg-red-500/20 text-red-300 border border-red-500/30';
      case 'on-hold':
        return 'bg-amber-500/20 text-amber-300 border border-amber-500/30';
      default:
        return 'bg-slate-500/20 text-slate-300';
    }
  };

  const stats = [
    {
      label: 'Open Positions',
      value: jobs.filter((j) => j.status === 'open').length,
      color: 'from-green-600 to-green-400',
      icon: '📂',
    },
    {
      label: 'Total Applicants',
      value: jobs.reduce((sum, j) => sum + j.applicants, 0),
      color: 'from-blue-600 to-blue-400',
      icon: '👥',
    },
    {
      label: 'On Hold',
      value: jobs.filter((j) => j.status === 'on-hold').length,
      color: 'from-amber-600 to-amber-400',
      icon: '⏸',
    },
    {
      label: 'Closed',
      value: jobs.filter((j) => j.status === 'closed').length,
      color: 'from-slate-600 to-slate-400',
      icon: '✓',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`rounded-xl bg-gradient-to-br ${stat.color} p-6 text-white shadow-lg hover:shadow-xl transition-shadow`}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium opacity-90">{stat.label}</p>
                <p className="text-3xl font-bold mt-2">{stat.value}</p>
              </div>
              <div className="text-2xl opacity-50">{stat.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <select
          value={filterDepartment}
          onChange={(e) => setFilterDepartment(e.target.value)}
          className="px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Departments</option>
          {departments.map((dept) => (
            <option key={dept} value={dept}>
              {dept}
            </option>
          ))}
        </select>

        <div className="flex gap-2">
          {['all', 'open', 'on-hold', 'closed'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filterStatus === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Job Postings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredJobs.map((job) => (
          <div
            key={job.id}
            className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600 hover:border-blue-500 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/20"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/0 to-purple-600/0 group-hover:from-blue-600/10 group-hover:to-purple-600/10 transition-all duration-300" />

            <div className="relative p-6 space-y-4">
              {/* Header */}
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-white">{job.title}</h3>
                  <p className="text-sm text-slate-400 mt-1">{job.department}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(job.status)}`}>
                  {job.status === 'open' ? '●' : job.status === 'on-hold' ? '⊖' : '✓'}{' '}
                  {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                </span>
              </div>

              {/* Job Details */}
              <div className="space-y-2 border-t border-slate-600 pt-4">
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <MapPin size={16} className="text-blue-400 flex-shrink-0" />
                  <span>{job.location}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <DollarSign size={16} className="text-green-400 flex-shrink-0" />
                  <span>
                    ${(job.salary.min / 1000).toFixed(0)}K - ${(job.salary.max / 1000).toFixed(0)}K
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <Users size={16} className="text-purple-400 flex-shrink-0" />
                  <span>{job.applicants} applicants</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <Calendar size={16} className="text-amber-400 flex-shrink-0" />
                  <span>Closes: {job.closingDate.toLocaleDateString()}</span>
                </div>
              </div>

              {/* Description */}
              <div className="border-t border-slate-600 pt-4">
                <p className="text-sm text-slate-300 line-clamp-2">{job.description}</p>
              </div>

              {/* Requirements Count */}
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <FileText size={14} />
                <span>{job.requirements.length} requirements</span>
              </div>

              {/* Action Button */}
              <button
                onClick={() => {
                  setSelectedJob(job);
                  setShowDetailModal(true);
                }}
                className="w-full px-4 py-2 mt-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Eye size={16} />
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredJobs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12">
          <Briefcase className="w-12 h-12 text-slate-500 mb-4" />
          <p className="text-slate-400 text-lg font-medium">No job postings found</p>
        </div>
      )}

      {/* Job Detail Modal */}
      {showDetailModal && selectedJob && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl max-w-2xl w-full max-h-96 overflow-y-auto border border-slate-700 shadow-2xl">
            <div className="sticky top-0 flex justify-between items-center p-6 border-b border-slate-700 bg-slate-800">
              <h2 className="text-2xl font-bold text-white">{selectedJob.title}</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-slate-400 hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-400 text-sm">Department</p>
                  <p className="text-white font-medium">{selectedJob.department}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Location</p>
                  <p className="text-white font-medium">{selectedJob.location}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Salary Range</p>
                  <p className="text-white font-medium">
                    ${(selectedJob.salary.min / 1000).toFixed(0)}K - ${(selectedJob.salary.max / 1000).toFixed(0)}K
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Applicants</p>
                  <p className="text-white font-medium">{selectedJob.applicants}</p>
                </div>
              </div>

              <div className="border-t border-slate-700 pt-4">
                <h3 className="text-white font-bold mb-2">Description</h3>
                <p className="text-slate-300">{selectedJob.description}</p>
              </div>

              <div className="border-t border-slate-700 pt-4">
                <h3 className="text-white font-bold mb-3">Requirements</h3>
                <ul className="space-y-2">
                  {selectedJob.requirements.map((req, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-slate-300">
                      <span className="text-blue-400 flex-shrink-0">✓</span>
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-t border-slate-700 pt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-400 text-sm">Posted</p>
                  <p className="text-white font-medium">{selectedJob.postedDate.toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Closing</p>
                  <p className="text-white font-medium">{selectedJob.closingDate.toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobPostingsTab;
