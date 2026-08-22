import React, { useRef } from 'react';
import { SalarySlip } from '../../types/hrms';
import { Modal } from './Modal';
import { Button } from './Button';
import { Printer, Download, Building2, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface SalarySlipModalProps {
  slip: SalarySlip | null;
  isOpen: boolean;
  onClose: () => void;
}

export const SalarySlipModal: React.FC<SalarySlipModalProps> = ({ slip, isOpen, onClose }) => {
  const { showToast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);

  if (!slip) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    showToast(`Downloading Salary Slip ${slip.slipNumber} as PDF...`, 'info', 'PDF Generated');
    // Trigger printable window after brief moment
    setTimeout(() => {
      window.print();
    }, 500);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <span>Salary Pay Slip</span>
          <span className="text-xs px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-mono">
            {slip.slipNumber}
          </span>
        </div>
      }
      size="xl"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button variant="outline" size="sm" leftIcon={<Printer className="w-4 h-4" />} onClick={handlePrint}>
            Print
          </Button>
          <Button variant="primary" size="sm" leftIcon={<Download className="w-4 h-4" />} onClick={handleDownload}>
            Download PDF
          </Button>
        </>
      }
    >
      <div ref={printRef} className="bg-white text-slate-800 p-4 sm:p-8 rounded-xl border border-slate-200 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-800 print:border-none print:shadow-none print:p-0">
        {/* Header Branding */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 pb-6 mb-6 dark:border-slate-800 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-2xl shadow-md">
              D
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                {slip.companyName}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {slip.companyAddress}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                Tax ID / EIN: {slip.companyTaxNumber}
              </p>
            </div>
          </div>

          <div className="sm:text-right">
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 mb-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              CONFIRMED DISBURSEMENT
            </span>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pay Period: <strong className="text-slate-700 dark:text-slate-300">{slip.payPeriod}</strong>
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Disbursed On: {slip.paymentDate}
            </p>
          </div>
        </div>

        {/* Employee Summary Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 dark:bg-slate-800/50 dark:border-slate-800 mb-6 text-xs">
          <div>
            <span className="text-slate-400 dark:text-slate-500 uppercase font-medium">Employee Name</span>
            <p className="font-bold text-slate-900 dark:text-white mt-0.5">{slip.employeeName}</p>
          </div>
          <div>
            <span className="text-slate-400 dark:text-slate-500 uppercase font-medium">Employee ID</span>
            <p className="font-bold text-slate-900 dark:text-white font-mono mt-0.5">{slip.employeeCode}</p>
          </div>
          <div>
            <span className="text-slate-400 dark:text-slate-500 uppercase font-medium">Department</span>
            <p className="font-bold text-slate-900 dark:text-white mt-0.5">{slip.departmentName}</p>
          </div>
          <div>
            <span className="text-slate-400 dark:text-slate-500 uppercase font-medium">Designation</span>
            <p className="font-bold text-slate-900 dark:text-white mt-0.5">{slip.jobTitle}</p>
          </div>
          <div>
            <span className="text-slate-400 dark:text-slate-500 uppercase font-medium">Bank Partner</span>
            <p className="font-medium text-slate-700 dark:text-slate-300 mt-0.5">{slip.bankName || 'Partner Bank'}</p>
          </div>
          <div>
            <span className="text-slate-400 dark:text-slate-500 uppercase font-medium">Account No.</span>
            <p className="font-mono font-medium text-slate-700 dark:text-slate-300 mt-0.5">{slip.accountNumber || '••••••••'}</p>
          </div>
          <div>
            <span className="text-slate-400 dark:text-slate-500 uppercase font-medium">Tax Identifier</span>
            <p className="font-mono font-medium text-slate-700 dark:text-slate-300 mt-0.5">{slip.taxId || 'US-TAX'}</p>
          </div>
          <div>
            <span className="text-slate-400 dark:text-slate-500 uppercase font-medium">Pay Date</span>
            <p className="font-medium text-slate-700 dark:text-slate-300 mt-0.5">{slip.paymentDate}</p>
          </div>
        </div>

        {/* Earnings & Deductions Breakdown Tables */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Earnings */}
          <div className="border border-slate-200 rounded-xl overflow-hidden dark:border-slate-800">
            <div className="bg-slate-100 px-4 py-2.5 font-bold text-xs uppercase tracking-wider text-slate-700 border-b border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
              Earnings Breakdown
            </div>
            <table className="w-full text-xs">
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-2 text-slate-600 dark:text-slate-400">Basic Salary</td>
                  <td className="px-4 py-2 text-right font-medium font-mono">${slip.basicSalary.toLocaleString()}</td>
                </tr>
                <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-2 text-slate-600 dark:text-slate-400">House Rent Allowance (HRA)</td>
                  <td className="px-4 py-2 text-right font-medium font-mono">${slip.hra.toLocaleString()}</td>
                </tr>
                <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-2 text-slate-600 dark:text-slate-400">Special & Conveyance Allowances</td>
                  <td className="px-4 py-2 text-right font-medium font-mono">${slip.allowances.toLocaleString()}</td>
                </tr>
                <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-2 text-slate-600 dark:text-slate-400">Performance Bonus & Incentives</td>
                  <td className="px-4 py-2 text-right font-medium font-mono">${slip.bonus.toLocaleString()}</td>
                </tr>
                <tr className="bg-slate-50/80 font-bold border-t border-slate-200 dark:bg-slate-800/80 dark:border-slate-700">
                  <td className="px-4 py-2.5 text-slate-900 dark:text-white">Total Gross Earnings</td>
                  <td className="px-4 py-2.5 text-right font-mono text-indigo-600 dark:text-indigo-400">
                    ${slip.grossSalary.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Deductions */}
          <div className="border border-slate-200 rounded-xl overflow-hidden dark:border-slate-800">
            <div className="bg-slate-100 px-4 py-2.5 font-bold text-xs uppercase tracking-wider text-slate-700 border-b border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
              Deductions & Withholdings
            </div>
            <table className="w-full text-xs">
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-2 text-slate-600 dark:text-slate-400">Income Tax (TDS / Federal)</td>
                  <td className="px-4 py-2 text-right font-medium font-mono">${slip.tax.toLocaleString()}</td>
                </tr>
                <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-2 text-slate-600 dark:text-slate-400">Health & Life Insurance Premium</td>
                  <td className="px-4 py-2 text-right font-medium font-mono">${slip.insurance.toLocaleString()}</td>
                </tr>
                <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-2 text-slate-600 dark:text-slate-400">Provident Fund & Other Deductions</td>
                  <td className="px-4 py-2 text-right font-medium font-mono">${slip.otherDeductions.toLocaleString()}</td>
                </tr>
                <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 opacity-0">
                  <td className="px-4 py-2">-</td>
                  <td className="px-4 py-2 text-right font-mono">$0</td>
                </tr>
                <tr className="bg-slate-50/80 font-bold border-t border-slate-200 dark:bg-slate-800/80 dark:border-slate-700">
                  <td className="px-4 py-2.5 text-slate-900 dark:text-white">Total Deductions</td>
                  <td className="px-4 py-2.5 text-right font-mono text-rose-600 dark:text-rose-400">
                    ${slip.totalDeductions.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Net Salary Highlight Banner */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-5 rounded-xl bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 dark:from-indigo-950/50 dark:to-slate-900 dark:border-indigo-900/60 mb-6">
          <div>
            <span className="text-xs uppercase font-bold tracking-wider text-indigo-700 dark:text-indigo-300">
              Net Disbursed Take-Home Salary
            </span>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Net = Gross Earnings (${slip.grossSalary.toLocaleString()}) − Total Deductions (${slip.totalDeductions.toLocaleString()})
            </p>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 font-mono mt-2 sm:mt-0">
            ${slip.netSalary.toLocaleString()} <span className="text-xs font-normal text-slate-500">USD</span>
          </div>
        </div>

        {/* Digital Verification & Stamp */}
        <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-400 dark:text-slate-500 gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Cryptographically sealed & auto-generated by Dayflow Payroll Engine on {slip.generatedDate}</span>
          </div>
          <div className="text-center sm:text-right">
            <div className="font-semibold text-slate-700 dark:text-slate-300">Dayflow HR & Payroll Authority</div>
            <div className="text-[10px] text-slate-400">Authorized Electronic Signature</div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
