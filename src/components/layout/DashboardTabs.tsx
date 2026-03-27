import { Tabs, TabList, TabPanels, Tab, TabPanel } from "@chakra-ui/react";
import { UserRole } from "@/types/auth";
import { BalanceDashboard } from "@/components/balances/BalanceDashboard";
import { LeaveApplicationForm } from "@/components/leaves/LeaveApplicationForm";
import { MyLeaveApplications } from "@/components/leaves/MyLeaveApplications";
import { ApprovalQueue } from "@/components/leaves/ApprovalQueue";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";
import { DepartmentManagement } from "@/components/admin/DepartmentManagement";
import { UserManagement } from "@/components/admin/UserManagement";
import { ProfilePage } from "../profile/ProfilePage";
import { DesignationManagement } from "../admin/DesignationManagement";
import { DesiredMonthsAdminView } from "../desiredMonths/DesiredMonthsAdminView";
import { ReportsPage } from "@/components/reports/ReportsPage";
import { LeaveAllocationManagement } from "@/components/admin/LeaveAllocationManagement";

interface DashboardTabsProps {
  role: UserRole;
}

export const DashboardTabs = ({ role }: DashboardTabsProps) => {
  const isAdmin = role === "admin";
  const isHR = role === "hr";
  const isDirector = role === "director";

  // Group permissions: Admin OR HR can access system settings
  const canManageSystem = isAdmin || isHR;

  return (
    <Tabs colorScheme="blue" variant="enclosed" isLazy>
      <TabList>
        {!canManageSystem && <Tab>📊 My Balances</Tab>}
        {!canManageSystem && <Tab>✍️ Apply</Tab>}
        {!canManageSystem && <Tab>📋 My Applications</Tab>}
        {isDirector && <Tab>✅ Director Approvals</Tab>}
        {isHR && <Tab>✅ HR Approvals</Tab>}
        {canManageSystem && <Tab>👥 Users</Tab>}
        {canManageSystem && <Tab>🏢 Departments</Tab>}
        {canManageSystem && <Tab>👔 Designations</Tab>}
        {canManageSystem && <Tab>📅 Desired Months</Tab>}
        {canManageSystem && <Tab>🗓️ Leave Allocations</Tab>}
        {canManageSystem && <Tab>� Reports</Tab>}

        <Tab>⚙️ Profile</Tab>
      </TabList>

      <TabPanels>
        {!canManageSystem && (
          <TabPanel>
            <BalanceDashboard />
          </TabPanel>
        )}
        {!canManageSystem && (
          <TabPanel>
            <LeaveApplicationForm />
          </TabPanel>
        )}
        {!canManageSystem && (
          <TabPanel>
            <MyLeaveApplications />
          </TabPanel>
        )}
        {isDirector && (
          <TabPanel>
            <ApprovalQueue role="director" />
          </TabPanel>
        )}
        {isHR && (
          <TabPanel>
            <ApprovalQueue role="hr" />
          </TabPanel>
        )}
        {canManageSystem && (
          <TabPanel>
            <UserManagement />
          </TabPanel>
        )}
        {canManageSystem && (
          <TabPanel>
            <DepartmentManagement />
          </TabPanel>
        )}
        {canManageSystem && (
          <TabPanel>
            <DesignationManagement />
          </TabPanel>
        )}
        {canManageSystem && (
          <TabPanel>
            <DesiredMonthsAdminView />
          </TabPanel>
        )}
        {canManageSystem && (
          <TabPanel>
            <LeaveAllocationManagement />
          </TabPanel>
        )}
        {canManageSystem && (
          <TabPanel>
            <ReportsPage />
          </TabPanel>
        )}
        <TabPanel>
          <ProfilePage />
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
};
