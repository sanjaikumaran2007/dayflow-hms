import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './src/db/index.ts';
import * as schema from './src/db/schema.ts';
import { eq, desc, and, sql } from 'drizzle-orm';
import { optionalAuth, requireAuth, AuthRequest } from './src/middleware/auth.ts';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health Check
  app.get('/api/health', async (req, res) => {
    try {
      const result = await db.select({ count: sql<number>`count(*)` }).from(schema.users);
      res.json({ status: 'ok', database: 'connected', userCount: result[0]?.count ?? 0 });
    } catch (err: any) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  });

  // ----------------------------------------------------
  // AUTH & USERS
  // ----------------------------------------------------
  app.post('/api/auth/sync-user', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const { email, fullName, profileImage, role } = req.body;
      const uid = req.user?.uid;

      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      // Check if user exists
      const existing = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);

      let user;
      if (existing.length > 0) {
        // Update user
        const updated = await db
          .update(schema.users)
          .set({
            uid: uid || existing[0].uid,
            fullName: fullName || existing[0].fullName,
            profileImage: profileImage || existing[0].profileImage,
            lastLogin: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(schema.users.id, existing[0].id))
          .returning();
        user = updated[0];
      } else {
        // Create user
        const inserted = await db
          .insert(schema.users)
          .values({
            uid,
            email,
            fullName: fullName || email.split('@')[0],
            profileImage,
            role: role || 'EMPLOYEE',
            lastLogin: new Date(),
          })
          .returning();
        user = inserted[0];
      }

      res.json(user);
    } catch (error: any) {
      console.error('Error syncing user:', error);
      res.status(500).json({ error: error.message || 'Failed to sync user' });
    }
  });

  app.get('/api/users', async (req, res) => {
    try {
      const users = await db.select().from(schema.users);
      res.json(users);
    } catch (error: any) {
      console.error('Failed to get users:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // ----------------------------------------------------
  // EMPLOYEES
  // ----------------------------------------------------
  app.get('/api/employees', async (req, res) => {
    try {
      const emps = await db.select().from(schema.employees).where(sql`deleted_at IS NULL`).orderBy(desc(schema.employees.id));
      const jobs = await db.select().from(schema.employeeJobDetails);
      const depts = await db.select().from(schema.departments);
      const docs = await db.select().from(schema.employeeDocuments);

      const mapped = emps.map((emp) => {
        const job = jobs.find((j) => j.employeeId === emp.id);
        const dept = depts.find((d) => d.id === job?.departmentId);
        const empDocs = docs.filter((d) => d.employeeId === emp.id);

        return {
          id: String(emp.id),
          userId: emp.userId ? String(emp.userId) : undefined,
          employeeCode: emp.employeeCode,
          firstName: emp.firstName,
          lastName: emp.lastName,
          email: emp.email,
          phone: emp.phone || '',
          departmentId: job ? `dept-${job.departmentId}` : 'dept-eng',
          departmentName: dept?.name || 'Engineering',
          jobTitle: job?.jobTitle || 'Team Member',
          employmentType: job?.employmentType || 'FULL_TIME',
          joiningDate: emp.createdAt ? new Date(emp.createdAt).toISOString().split('T')[0] : '2025-01-01',
          status: emp.status,
          gender: emp.gender || 'OTHER',
          dateOfBirth: emp.dateOfBirth ? String(emp.dateOfBirth) : undefined,
          address: emp.address || undefined,
          city: emp.city || undefined,
          avatarUrl: emp.profileImage || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
          documents: empDocs.map((d) => ({
            id: String(d.id),
            name: d.documentName,
            type: d.documentType,
            uploadDate: d.createdAt ? new Date(d.createdAt).toISOString().split('T')[0] : '',
            fileUrl: d.filePath,
            size: d.fileSize ? `${Math.round(d.fileSize / 1024)} KB` : '120 KB',
          })),
          createdAt: emp.createdAt ? new Date(emp.createdAt).toISOString().split('T')[0] : '',
          updatedAt: emp.updatedAt ? new Date(emp.updatedAt).toISOString().split('T')[0] : '',
        };
      });

      res.json(mapped);
    } catch (error: any) {
      console.error('Failed to get employees:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/employees', async (req, res) => {
    try {
      const data = req.body;
      const code = data.employeeCode || `DF-EMP-${Math.floor(1000 + Math.random() * 9000)}`;

      const newEmp = await db
        .insert(schema.employees)
        .values({
          employeeCode: code,
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || '',
          phone: data.phone || '',
          status: data.status || 'ACTIVE',
          gender: data.gender || 'OTHER',
          address: data.address || null,
          city: data.city || null,
          profileImage: data.avatarUrl || null,
        })
        .returning();

      const emp = newEmp[0];

      // Insert job detail
      let deptId = 1;
      if (data.departmentId && typeof data.departmentId === 'string' && data.departmentId.startsWith('dept-')) {
        const parsed = parseInt(data.departmentId.replace('dept-', ''), 10);
        if (!isNaN(parsed)) deptId = parsed;
      }

      await db.insert(schema.employeeJobDetails).values({
        employeeId: emp.id,
        departmentId: deptId,
        jobTitle: data.jobTitle || 'Associate',
        employmentType: data.employmentType || 'FULL_TIME',
        joiningDate: data.joiningDate ? new Date(data.joiningDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      });

      // Default leave balances
      const currentYear = new Date().getFullYear();
      await db.insert(schema.leaveBalances).values([
        { employeeId: emp.id, leaveTypeId: 1, year: currentYear, allocatedDays: 20, remainingDays: 20 },
        { employeeId: emp.id, leaveTypeId: 2, year: currentYear, allocatedDays: 10, remainingDays: 10 },
      ]);

      res.json({
        id: String(emp.id),
        employeeCode: emp.employeeCode,
        firstName: emp.firstName,
        lastName: emp.lastName,
        email: emp.email,
        phone: emp.phone,
        departmentId: `dept-${deptId}`,
        departmentName: data.departmentName || 'Engineering',
        jobTitle: data.jobTitle || 'Associate',
        employmentType: data.employmentType || 'FULL_TIME',
        joiningDate: data.joiningDate || new Date().toISOString().split('T')[0],
        status: emp.status,
        avatarUrl: emp.profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        documents: [],
      });
    } catch (error: any) {
      console.error('Failed to create employee:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.put('/api/employees/:id', async (req, res) => {
    try {
      const empId = parseInt(req.params.id, 10);
      const data = req.body;

      if (!isNaN(empId)) {
        await db
          .update(schema.employees)
          .set({
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phone: data.phone,
            status: data.status,
            gender: data.gender,
            address: data.address,
            city: data.city,
            profileImage: data.avatarUrl,
            updatedAt: new Date(),
          })
          .where(eq(schema.employees.id, empId));

        if (data.jobTitle) {
          await db
            .update(schema.employeeJobDetails)
            .set({
              jobTitle: data.jobTitle,
              employmentType: data.employmentType || 'FULL_TIME',
              updatedAt: new Date(),
            })
            .where(eq(schema.employeeJobDetails.employeeId, empId));
        }
      }
      res.json({ success: true, ...data });
    } catch (error: any) {
      console.error('Failed to update employee:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // ----------------------------------------------------
  // DEPARTMENTS
  // ----------------------------------------------------
  app.get('/api/departments', async (req, res) => {
    try {
      const depts = await db.select().from(schema.departments);
      const jobs = await db.select().from(schema.employeeJobDetails);

      const mapped = depts.map((d) => {
        const count = jobs.filter((j) => j.departmentId === d.id).length;
        return {
          id: `dept-${d.id}`,
          name: d.name,
          description: d.description || '',
          headCount: count,
          managerId: d.managerId ? String(d.managerId) : undefined,
          budget: '$250,000',
          color: 'indigo',
        };
      });

      res.json(mapped);
    } catch (error: any) {
      console.error('Failed to get departments:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // ----------------------------------------------------
  // ATTENDANCE
  // ----------------------------------------------------
  app.get('/api/attendance', async (req, res) => {
    try {
      const records = await db.select().from(schema.attendance).orderBy(desc(schema.attendance.attendanceDate));
      const emps = await db.select().from(schema.employees);

      const mapped = records.map((r) => {
        const emp = emps.find((e) => e.id === r.employeeId);
        return {
          id: String(r.id),
          employeeId: String(r.employeeId),
          employeeName: emp ? `${emp.firstName} ${emp.lastName}` : 'Unknown Employee',
          employeeCode: emp?.employeeCode || 'EMP',
          date: String(r.attendanceDate),
          checkIn: r.checkIn ? new Date(r.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
          checkOut: r.checkOut ? new Date(r.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
          workingHours: r.workingHours ? Number(r.workingHours) : 0,
          status: r.status,
          remarks: r.remarks || undefined,
        };
      });

      res.json(mapped);
    } catch (error: any) {
      console.error('Failed to get attendance:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/attendance/check-in', async (req, res) => {
    try {
      const { employeeId, employeeName } = req.body;
      const empIdNum = parseInt(String(employeeId).replace('emp-', ''), 10) || 3;
      const today = new Date().toISOString().split('T')[0];

      // Check if already checked in today
      const existing = await db
        .select()
        .from(schema.attendance)
        .where(and(eq(schema.attendance.employeeId, empIdNum), eq(schema.attendance.attendanceDate, today as any)))
        .limit(1);

      if (existing.length > 0) {
        return res.json({
          id: String(existing[0].id),
          employeeId: String(empIdNum),
          employeeName: employeeName || 'Employee',
          date: today,
          checkIn: existing[0].checkIn ? new Date(existing[0].checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '09:00 AM',
          status: existing[0].status,
        });
      }

      const inserted = await db
        .insert(schema.attendance)
        .values({
          employeeId: empIdNum,
          attendanceDate: today as any,
          checkIn: new Date(),
          status: 'PRESENT',
        })
        .returning();

      const record = inserted[0];
      await db.insert(schema.attendanceLogs).values({
        employeeId: empIdNum,
        attendanceId: record.id,
        eventType: 'CHECK_IN',
      });

      res.json({
        id: String(record.id),
        employeeId: String(empIdNum),
        employeeName: employeeName || 'Employee',
        date: today,
        checkIn: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'PRESENT',
      });
    } catch (error: any) {
      console.error('Failed check in:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/attendance/check-out', async (req, res) => {
    try {
      const { employeeId } = req.body;
      const empIdNum = parseInt(String(employeeId).replace('emp-', ''), 10) || 3;
      const today = new Date().toISOString().split('T')[0];

      const existing = await db
        .select()
        .from(schema.attendance)
        .where(and(eq(schema.attendance.employeeId, empIdNum), eq(schema.attendance.attendanceDate, today as any)))
        .limit(1);

      if (existing.length === 0) {
        return res.status(404).json({ error: 'No check-in record found for today' });
      }

      const checkInTime = existing[0].checkIn ? new Date(existing[0].checkIn) : new Date(Date.now() - 8 * 3600000);
      const checkOutTime = new Date();
      const diffHrs = Math.max(1, (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60));

      const updated = await db
        .update(schema.attendance)
        .set({
          checkOut: checkOutTime,
          workingHours: String(diffHrs.toFixed(2)) as any,
          updatedAt: new Date(),
        })
        .where(eq(schema.attendance.id, existing[0].id))
        .returning();

      const record = updated[0];
      await db.insert(schema.attendanceLogs).values({
        employeeId: empIdNum,
        attendanceId: record.id,
        eventType: 'CHECK_OUT',
      });

      res.json({
        id: String(record.id),
        employeeId: String(empIdNum),
        date: today,
        checkIn: checkInTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        checkOut: checkOutTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        workingHours: Number(diffHrs.toFixed(2)),
        status: record.status,
      });
    } catch (error: any) {
      console.error('Failed check out:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // ----------------------------------------------------
  // LEAVES
  // ----------------------------------------------------
  app.get('/api/leaves/requests', async (req, res) => {
    try {
      const requests = await db.select().from(schema.leaveRequests).orderBy(desc(schema.leaveRequests.id));
      const emps = await db.select().from(schema.employees);
      const types = await db.select().from(schema.leaveTypes);

      const mapped = requests.map((r) => {
        const emp = emps.find((e) => e.id === r.employeeId);
        const lType = types.find((t) => t.id === r.leaveTypeId);
        return {
          id: String(r.id),
          employeeId: String(r.employeeId),
          employeeName: emp ? `${emp.firstName} ${emp.lastName}` : 'Employee',
          employeeCode: emp?.employeeCode || 'EMP',
          leaveType: lType?.name || 'Paid Leave',
          startDate: String(r.startDate),
          endDate: String(r.endDate),
          days: r.numberOfDays,
          reason: r.remarks || '',
          status: r.status,
          appliedDate: r.createdAt ? new Date(r.createdAt).toISOString().split('T')[0] : '',
          approvedBy: r.approvedBy ? String(r.approvedBy) : undefined,
          comments: r.adminComment || undefined,
        };
      });

      res.json(mapped);
    } catch (error: any) {
      console.error('Failed to get leave requests:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/leaves/requests', async (req, res) => {
    try {
      const data = req.body;
      const empIdNum = parseInt(String(data.employeeId).replace('emp-', ''), 10) || 3;
      const leaveTypeId = 1; // Default Paid Leave

      const inserted = await db
        .insert(schema.leaveRequests)
        .values({
          employeeId: empIdNum,
          leaveTypeId,
          startDate: data.startDate,
          endDate: data.endDate,
          numberOfDays: data.days || 1,
          remarks: data.reason || '',
          status: 'PENDING',
        })
        .returning();

      const r = inserted[0];
      await db.insert(schema.leaveApprovalHistory).values({
        leaveRequestId: r.id,
        action: 'SUBMITTED',
        actionBy: empIdNum,
        comment: 'User submission',
      });

      res.json({
        id: String(r.id),
        employeeId: String(empIdNum),
        employeeName: data.employeeName || 'Employee',
        leaveType: data.leaveType || 'Paid Leave',
        startDate: String(r.startDate),
        endDate: String(r.endDate),
        days: r.numberOfDays,
        reason: r.remarks || '',
        status: r.status,
        appliedDate: new Date().toISOString().split('T')[0],
      });
    } catch (error: any) {
      console.error('Failed to create leave request:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.put('/api/leaves/requests/:id', async (req, res) => {
    try {
      const reqId = parseInt(req.params.id, 10);
      const { status, comments, actionBy } = req.body;

      if (!isNaN(reqId)) {
        await db
          .update(schema.leaveRequests)
          .set({
            status: status || 'APPROVED',
            adminComment: comments || null,
            approvedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(schema.leaveRequests.id, reqId));

        await db.insert(schema.leaveApprovalHistory).values({
          leaveRequestId: reqId,
          action: status === 'APPROVED' ? 'APPROVED' : 'REJECTED',
          actionBy: actionBy ? parseInt(String(actionBy), 10) || 1 : 1,
          comment: comments || '',
        });
      }

      res.json({ success: true, id: reqId, status });
    } catch (error: any) {
      console.error('Failed to update leave request:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // ----------------------------------------------------
  // PAYROLL & SALARY
  // ----------------------------------------------------
  app.get('/api/payroll', async (req, res) => {
    try {
      const records = await db.select().from(schema.payroll).orderBy(desc(schema.payroll.id));
      const emps = await db.select().from(schema.employees);

      const mapped = records.map((p) => {
        const emp = emps.find((e) => e.id === p.employeeId);
        return {
          id: String(p.id),
          employeeId: String(p.employeeId),
          employeeName: emp ? `${emp.firstName} ${emp.lastName}` : 'Employee',
          employeeCode: emp?.employeeCode || 'EMP',
          department: 'Engineering',
          month: String(p.payPeriodStart).slice(0, 7),
          basicSalary: Number(p.basicSalary),
          allowances: Number(p.allowances),
          deductions: Number(p.totalDeductions),
          netSalary: Number(p.netSalary),
          status: p.status,
          paymentDate: p.processedAt ? new Date(p.processedAt).toISOString().split('T')[0] : '',
        };
      });

      res.json(mapped);
    } catch (error: any) {
      console.error('Failed to get payroll:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/payroll/salary-structures', async (req, res) => {
    try {
      const structs = await db.select().from(schema.salaryStructures);
      const emps = await db.select().from(schema.employees);

      const mapped = structs.map((s) => {
        const emp = emps.find((e) => e.id === s.employeeId);
        return {
          id: String(s.id),
          employeeId: String(s.employeeId),
          employeeName: emp ? `${emp.firstName} ${emp.lastName}` : 'Employee',
          basicSalary: Number(s.basicSalary),
          hra: Number(s.hra),
          allowances: Number(s.allowances),
          bonus: Number(s.bonus),
          tax: Number(s.tax),
          insurance: Number(s.insurance),
          otherDeductions: Number(s.otherDeductions),
          effectiveFrom: String(s.effectiveFrom),
        };
      });

      res.json(mapped);
    } catch (error: any) {
      console.error('Failed to get salary structures:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // ----------------------------------------------------
  // ANNOUNCEMENTS & AUDIT LOGS
  // ----------------------------------------------------
  app.get('/api/announcements', async (req, res) => {
    try {
      const items = await db.select().from(schema.announcements).where(eq(schema.announcements.isActive, true)).orderBy(desc(schema.announcements.id));
      const mapped = items.map((a) => ({
        id: String(a.id),
        title: a.title,
        content: a.content,
        author: a.authorName || 'HR Team',
        date: a.createdAt ? new Date(a.createdAt).toISOString().split('T')[0] : '',
        priority: 'MEDIUM',
        targetRole: a.targetRole,
        isPinned: false,
      }));
      res.json(mapped);
    } catch (error: any) {
      console.error('Failed to get announcements:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/announcements', async (req, res) => {
    try {
      const data = req.body;
      const inserted = await db
        .insert(schema.announcements)
        .values({
          title: data.title,
          content: data.content,
          authorName: data.author || 'Super Admin',
          targetRole: data.targetRole || 'ALL',
        })
        .returning();
      const a = inserted[0];
      res.json({
        id: String(a.id),
        title: a.title,
        content: a.content,
        author: a.authorName,
        date: new Date().toISOString().split('T')[0],
        targetRole: a.targetRole,
      });
    } catch (error: any) {
      console.error('Failed to create announcement:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/audit-logs', async (req, res) => {
    try {
      const logs = await db.select().from(schema.auditLogs).orderBy(desc(schema.auditLogs.id)).limit(100);
      const mapped = logs.map((l) => ({
        id: String(l.id),
        userId: l.userId ? String(l.userId) : 'user-admin',
        userName: l.userName || 'Super Admin',
        action: l.action,
        tableName: l.tableName,
        recordId: l.recordId || '',
        timestamp: l.createdAt ? new Date(l.createdAt).toISOString() : new Date().toISOString(),
        details: l.details || `Performed ${l.action} on ${l.tableName}`,
      }));
      res.json(mapped);
    } catch (error: any) {
      console.error('Failed to get audit logs:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Dayflow HRMS Server connected with Cloud SQL running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
