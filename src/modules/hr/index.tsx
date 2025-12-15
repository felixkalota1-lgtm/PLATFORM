import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  Users,
  FileText,
  DollarSign,
  Clock,
  Briefcase,
  Building2,
} from 'lucide-react';
import hrService, { Employee, Contract, PayrollRecord, AttendanceRecord, JobPosting, Department } from '../../services/hrService';
import EmployeesTab from './components/EmployeesTab';
import ContractsTab from './components/ContractsTab';
import PayrollTab from './components/PayrollTab';
import AttendanceTab from './components/AttendanceTab';
import JobPostingsTab from './components/JobPostingsTab';
import DepartmentsTab from './components/DepartmentsTab';
import WorkAnalytics from '../../pages/WorkAnalytics';
import './HRModule.css';

const HRModule: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [payroll, setPayroll] = useState<PayrollRecord[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getActiveTab = () => {
    const path = location.pathname.split('/').pop();
    return path || 'employees';
  };

  useEffect(() => {
    loadHRData();
  }, []);

  const loadHRData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [empData, contData, payData, attData, jobData, deptData] = await Promise.all([
        hrService.getEmployees(),
        hrService.getContracts(),
        hrService.getPayrollRecords(),
        hrService.getAttendanceRecords(),
        hrService.getJobPostings(),
        hrService.getDepartments(),
      ]);

      setEmployees(empData);
      setContracts(contData);
      setPayroll(payData);
      setAttendance(attData);
      setJobs(jobData);
      setDepartments(deptData);
    } catch (err) {
      console.error('Error loading HR data:', err);
      setError('Failed to load HR data');
    } finally {
      setLoading(false);
    }
  };

  const activeTab = getActiveTab();

  const tabConfig = [
    { id: 'employees', label: 'Employees', icon: <Users size={20} />, count: employees.length },
    { id: 'contracts', label: 'Contracts', icon: <FileText size={20} />, count: contracts.length },
    { id: 'payroll', label: 'Payroll', icon: <DollarSign size={20} />, count: payroll.length },
    { id: 'attendance', label: 'Attendance', icon: <Clock size={20} />, count: attendance.length },
    { id: 'jobs', label: 'Job Postings', icon: <Briefcase size={20} />, count: jobs.filter((j) => j.status === 'open').length },
    { id: 'departments', label: 'Departments', icon: <Building2 size={20} />, count: departments.length },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-gradient-to-r from-slate-800 to-slate-700 border-b border-slate-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 rounded-lg bg-blue-500/20">
                  <Users className="w-8 h-8 text-blue-400" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                    Human Resources
                  </h1>
                  <p className="text-slate-400 text-sm mt-1">Employee Management & Payroll System</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-900 bg-opacity-50 border-t border-slate-700 overflow-x-auto sticky">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex gap-2">
              {tabConfig.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => navigate(`/hr/${tab.id}`)}
                  className={`px-4 py-4 font-semibold rounded-t-lg transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-400 bg-slate-800'
                      : 'border-transparent text-slate-400 hover:text-slate-300'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                  {tab.count > 0 && (
                    <span className="ml-1 text-xs px-2 py-1 rounded-full bg-slate-700">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
            <div className="text-red-400 flex-shrink-0 mt-0.5">⚠️</div>
            <div>
              <p className="text-red-200 font-medium">{error}</p>
              <button
                onClick={loadHRData}
                className="text-red-300 text-sm mt-2 hover:text-red-200 underline"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {loading && employees.length === 0 && (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              <p className="mt-4 text-slate-400">Loading HR data...</p>
            </div>
          </div>
        )}

        <Routes>
          <Route path="/" element={<Navigate to="/hr/employees" replace />} />
          <Route path="/employees" element={<EmployeesTab employees={employees} onRefresh={loadHRData} />} />
          <Route path="/contracts" element={<ContractsTab contracts={contracts} employees={employees} onRefresh={loadHRData} />} />
          <Route path="/payroll" element={<PayrollTab payroll={payroll} employees={employees} onRefresh={loadHRData} />} />
          <Route path="/attendance" element={<AttendanceTab attendance={attendance} employees={employees} onRefresh={loadHRData} />} />
          <Route path="/jobs" element={<JobPostingsTab jobs={jobs} onRefresh={loadHRData} />} />
          <Route path="/departments" element={<DepartmentsTab departments={departments} employees={employees} onRefresh={loadHRData} />} />
        </Routes>
      </div>
    </div>
  );
};

export default HRModule;
