import React, { useState, useMemo } from 'react';
import {
  Clock,
  Eye,
} from 'lucide-react';
import { AttendanceRecord, Employee } from '../../../services/hrService';
import '../HRModule.css';

interface AttendanceTabProps {
  attendance: AttendanceRecord[];
  employees?: Employee[];
  onRefresh?: () => void;
}

const AttendanceTab: React.FC<AttendanceTabProps> = ({ attendance, employees: _employees, onRefresh: _onRefresh }) => {
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');

  const employeeList = Array.from(new Set(attendance.map((a) => a.employeeName)));

  const filteredAttendance = useMemo(() => {
    return attendance.filter((a) => {
      const matchesStatus = filterStatus === 'all' || a.status === filterStatus;
      const matchesEmployee = selectedEmployee === 'all' || a.employeeName === selectedEmployee;
      return matchesStatus && matchesEmployee;
    });
  }, [attendance, filterStatus, selectedEmployee]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return { bg: 'bg-green-500/20', text: 'text-green-300', border: 'border-green-500/30', icon: '✓' };
      case 'absent':
        return { bg: 'bg-red-500/20', text: 'text-red-300', border: 'border-red-500/30', icon: '✕' };
      case 'late':
        return { bg: 'bg-amber-500/20', text: 'text-amber-300', border: 'border-amber-500/30', icon: '⏱' };
      case 'early-leave':
        return { bg: 'bg-blue-500/20', text: 'text-blue-300', border: 'border-blue-500/30', icon: '⚡' };
      default:
        return { bg: 'bg-slate-500/20', text: 'text-slate-300', border: 'border-slate-500/30', icon: '?' };
    }
  };

  // Attendance Stats
  const stats = [
    {
      label: 'Present Today',
      value: attendance.filter((a) => a.status === 'present').length,
      color: 'from-green-600 to-green-400',
      icon: '✓',
    },
    {
      label: 'Absent',
      value: attendance.filter((a) => a.status === 'absent').length,
      color: 'from-red-600 to-red-400',
      icon: '✕',
    },
    {
      label: 'Late Arrivals',
      value: attendance.filter((a) => a.status === 'late').length,
      color: 'from-amber-600 to-amber-400',
      icon: '⏱',
    },
    {
      label: 'Avg Hours',
      value: (attendance.reduce((sum, a) => sum + a.hours, 0) / Math.max(attendance.length, 1)).toFixed(1),
      color: 'from-blue-600 to-blue-400',
      icon: '⏳',
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
          value={selectedEmployee}
          onChange={(e) => setSelectedEmployee(e.target.value)}
          className="px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Employees</option>
          {employeeList.map((emp) => (
            <option key={emp} value={emp}>
              {emp}
            </option>
          ))}
        </select>

        <div className="flex gap-2 flex-wrap">
          {['all', 'present', 'absent', 'late', 'early-leave'].map((status) => (
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

      {/* Attendance Records Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-700">
        <table className="w-full text-sm">
          <thead className="bg-slate-700/50 border-b border-slate-700">
            <tr>
              <th className="px-6 py-4 text-left font-semibold text-slate-300">Employee</th>
              <th className="px-6 py-4 text-left font-semibold text-slate-300">Date</th>
              <th className="px-6 py-4 text-left font-semibold text-slate-300">Check In</th>
              <th className="px-6 py-4 text-left font-semibold text-slate-300">Check Out</th>
              <th className="px-6 py-4 text-center font-semibold text-slate-300">Hours</th>
              <th className="px-6 py-4 text-left font-semibold text-slate-300">Status</th>
              <th className="px-6 py-4 text-left font-semibold text-slate-300">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredAttendance.map((record) => {
              const colors = getStatusColor(record.status);
              return (
                <tr
                  key={record.id}
                  className="border-b border-slate-700 hover:bg-slate-700/50 transition-colors"
                >
                  <td className="px-6 py-4 text-white font-medium">{record.employeeName}</td>
                  <td className="px-6 py-4 text-slate-300">{record.date.toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-white font-medium">{record.checkIn}</td>
                  <td className="px-6 py-4 text-white font-medium">{record.checkOut || '-'}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-white font-semibold">{record.hours.toFixed(2)}h</span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${colors.bg} ${colors.text} border ${colors.border}`}
                    >
                      {colors.icon} {record.status.charAt(0).toUpperCase() + record.status.slice(1).replace('-', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => {
                        setSelectedRecord(record);
                        setShowDetailModal(true);
                      }}
                      className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
                    >
                      <Eye size={16} />
                      View
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filteredAttendance.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12">
          <Clock className="w-12 h-12 text-slate-500 mb-4" />
          <p className="text-slate-400 text-lg font-medium">No attendance records found</p>
        </div>
      )}

      {/* Attendance Detail Modal */}
      {showDetailModal && selectedRecord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl max-w-2xl w-full border border-slate-700 shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-slate-700">
              <h2 className="text-2xl font-bold text-white">Attendance Details</h2>
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
                  <p className="text-slate-400 text-sm">Employee</p>
                  <p className="text-white font-medium text-lg">{selectedRecord.employeeName}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Date</p>
                  <p className="text-white font-medium">{selectedRecord.date.toLocaleDateString()}</p>
                </div>
              </div>

              {/* Time Details */}
              <div className="border-t border-slate-700 pt-4">
                <h3 className="text-white font-bold mb-4">Time Details</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg">
                    <span className="text-slate-300">Check In</span>
                    <span className="text-white font-semibold">{selectedRecord.checkIn}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg">
                    <span className="text-slate-300">Check Out</span>
                    <span className="text-white font-semibold">{selectedRecord.checkOut || '-'}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-500/10 border-2 border-blue-500/30 rounded-lg">
                    <span className="text-white font-bold">Total Hours</span>
                    <span className="text-blue-300 font-bold text-lg">{selectedRecord.hours.toFixed(2)}h</span>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="border-t border-slate-700 pt-4">
                <p className="text-slate-400 text-sm">Status</p>
                <div className="mt-2">
                  <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold ${getStatusColor(selectedRecord.status).bg} ${getStatusColor(selectedRecord.status).text}`}>
                    {getStatusColor(selectedRecord.status).icon}
                    {selectedRecord.status.charAt(0).toUpperCase() + selectedRecord.status.slice(1).replace('-', ' ')}
                  </span>
                </div>
              </div>

              {selectedRecord.notes && (
                <div className="border-t border-slate-700 pt-4">
                  <p className="text-slate-400 text-sm">Notes</p>
                  <p className="text-slate-300 mt-2 p-3 bg-slate-700/50 rounded-lg">{selectedRecord.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceTab;
