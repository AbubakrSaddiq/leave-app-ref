// ============================================
// Analytics Dashboard Component
// ============================================

import React, { useState } from "react";
import {
  Box,
  Grid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Select,
  Button,
  VStack,
  HStack,
  Text,
  useToast,
  Spinner,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Progress,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import {
  getDashboardAnalytics,
  getLeaveUtilization,
  exportAnalyticsToCSV,
  type DashboardAnalytics,
  type LeaveUtilization,
} from "@/api/analytics.api";
import { formatDate } from "@/utils/date.utils";

// ============================================
// SUMMARY STATS COMPONENT
// ============================================

interface SummaryStatsProps {
  data: DashboardAnalytics["summary"];
}

function SummaryStats({ data }: SummaryStatsProps) {
  return (
    <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4} mb={6}>
      <Card>
        <CardBody>
          <Stat>
            <StatLabel>Total Applications</StatLabel>
            <StatNumber>{data.total_applications}</StatNumber>
            <StatHelpText>All time</StatHelpText>
          </Stat>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <Stat>
            <StatLabel>Pending</StatLabel>
            <StatNumber color="orange.500">
              {data.pending_applications}
            </StatNumber>
            <StatHelpText>Awaiting approval</StatHelpText>
          </Stat>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <Stat>
            <StatLabel>Approved</StatLabel>
            <StatNumber color="green.500">
              {data.approved_applications}
            </StatNumber>
            <StatHelpText>
              {data.total_applications > 0
                ? Math.round(
                    (data.approved_applications / data.total_applications) * 100
                  )
                : 0}
              % approval rate
            </StatHelpText>
          </Stat>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <Stat>
            <StatLabel>Avg Approval Time</StatLabel>
            <StatNumber>{data.average_approval_time_hours}h</StatNumber>
            <StatHelpText>Average hours</StatHelpText>
          </Stat>
        </CardBody>
      </Card>
    </Grid>
  );
}

// ============================================
// LEAVE TYPE BREAKDOWN
// ============================================

interface LeaveTypeBreakdownProps {
  data: DashboardAnalytics["by_leave_type"];
}

function LeaveTypeBreakdown({ data }: LeaveTypeBreakdownProps) {
  const leaveTypeColors: Record<string, string> = {
    annual: "blue",
    casual: "green",
    sick: "orange",
    maternity: "pink",
    paternity: "purple",
  };

  return (
    <Card>
      <CardHeader>
        <Heading size="md">Applications by Leave Type</Heading>
      </CardHeader>
      <CardBody>
        <Table variant="simple" size="sm">
          <Thead>
            <Tr>
              <Th>Leave Type</Th>
              <Th isNumeric>Applications</Th>
              <Th isNumeric>Total Days</Th>
            </Tr>
          </Thead>
          <Tbody>
            {data.map((item) => (
              <Tr key={item.leave_type}>
                <Td>
                  <Badge colorScheme={leaveTypeColors[item.leave_type]}>
                    {item.leave_type.toUpperCase()}
                  </Badge>
                </Td>
                <Td isNumeric>{item.count}</Td>
                <Td isNumeric>{item.total_days}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </CardBody>
    </Card>
  );
}

// ============================================
// DEPARTMENT BREAKDOWN
// ============================================

interface DepartmentBreakdownProps {
  data: DashboardAnalytics["by_department"];
}

function DepartmentBreakdown({ data }: DepartmentBreakdownProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <Heading size="md">By Department</Heading>
        </CardHeader>
        <CardBody>
          <Text color="gray.500">No department data available</Text>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <Heading size="md">Applications by Department</Heading>
      </CardHeader>
      <CardBody>
        <VStack spacing={4} align="stretch">
          {data.map((dept) => (
            <Box key={dept.department_id}>
              <HStack justify="space-between" mb={2}>
                <Text fontWeight="bold">{dept.department_name}</Text>
                <Badge>{dept.total_applications} applications</Badge>
              </HStack>
              <Progress
                value={
                  dept.total_applications > 0
                    ? (dept.total_applications /
                        Math.max(...data.map((d) => d.total_applications))) *
                      100
                    : 0
                }
                colorScheme="blue"
                size="sm"
              />
            </Box>
          ))}
        </VStack>
      </CardBody>
    </Card>
  );
}

// ============================================
// MONTHLY TREND CHART
// ============================================

interface MonthlyTrendProps {
  data: DashboardAnalytics["monthly_trend"];
}

function MonthlyTrend({ data }: MonthlyTrendProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <Heading size="md">Monthly Trend</Heading>
        </CardHeader>
        <CardBody>
          <Text color="gray.500">No trend data available</Text>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <Heading size="md">Monthly Trend</Heading>
      </CardHeader>
      <CardBody>
        <Table variant="simple" size="sm">
          <Thead>
            <Tr>
              <Th>Month</Th>
              <Th isNumeric>Applications</Th>
              <Th isNumeric>Days Taken</Th>
            </Tr>
          </Thead>
          <Tbody>
            {data.map((item) => (
              <Tr key={item.month}>
                <Td>
                  {new Date(item.month + "-01").toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </Td>
                <Td isNumeric>{item.applications}</Td>
                <Td isNumeric>{item.days_taken}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </CardBody>
    </Card>
  );
}

// ============================================
// UTILIZATION REPORT
// ============================================

interface UtilizationReportProps {
  data: LeaveUtilization;
}

function UtilizationReport({ data }: UtilizationReportProps) {
  return (
    <Card>
      <CardHeader>
        <Heading size="md">Leave Utilization Report - {data.year}</Heading>
      </CardHeader>
      <CardBody>
        <Table variant="simple" size="sm">
          <Thead>
            <Tr>
              <Th>Employee</Th>
              <Th>Department</Th>
              <Th isNumeric>Utilization</Th>
              <Th>Progress</Th>
            </Tr>
          </Thead>
          <Tbody>
            {data.by_user.map((user) => (
              <Tr key={user.user_id}>
                <Td>{user.user_name}</Td>
                <Td>{user.department}</Td>
                <Td isNumeric>{user.total_utilization_percentage}%</Td>
                <Td width="200px">
                  <Progress
                    value={user.total_utilization_percentage}
                    colorScheme={
                      user.total_utilization_percentage > 80
                        ? "green"
                        : user.total_utilization_percentage > 50
                        ? "yellow"
                        : "blue"
                    }
                    size="sm"
                  />
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </CardBody>
    </Card>
  );
}

// ============================================
// MAIN ANALYTICS DASHBOARD
// ============================================

export function AnalyticsDashboard() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [dateRange, setDateRange] = useState<"all" | "month" | "year">("year");
  const toast = useToast();

  // Fetch dashboard analytics
  const {
    data: analytics,
    isLoading: analyticsLoading,
    refetch: refetchAnalytics,
  } = useQuery({
    queryKey: ["analytics", dateRange],
    queryFn: () => {
      const today = new Date();
      let start_date: string | undefined;
      let end_date: string | undefined;

      if (dateRange === "month") {
        start_date = new Date(
          today.getFullYear(),
          today.getMonth(),
          1
        ).toISOString();
        end_date = new Date(
          today.getFullYear(),
          today.getMonth() + 1,
          0
        ).toISOString();
      } else if (dateRange === "year") {
        start_date = new Date(today.getFullYear(), 0, 1).toISOString();
        end_date = new Date(today.getFullYear(), 11, 31).toISOString();
      }

      return getDashboardAnalytics({ start_date, end_date });
    },
  });

  // Fetch utilization report
  const {
    data: utilization,
    isLoading: utilizationLoading,
    refetch: refetchUtilization,
  } = useQuery({
    queryKey: ["utilization", year],
    queryFn: () => getLeaveUtilization({ year }),
  });

  const handleExportAnalytics = () => {
    if (!analytics) return;

    const exportData = [
      ...analytics.by_leave_type.map((item) => ({
        Type: "Leave Type",
        Category: item.leave_type,
        Count: item.count,
        Total_Days: item.total_days,
      })),
      ...analytics.by_department.map((dept) => ({
        Type: "Department",
        Category: dept.department_name,
        Count: dept.total_applications,
        Total_Days: "-",
      })),
    ];

    exportAnalyticsToCSV(
      exportData,
      `analytics-${new Date().toISOString().split("T")[0]}.csv`
    );

    toast({
      title: "Exported successfully",
      description: "Analytics data has been exported to CSV",
      status: "success",
      duration: 3000,
    });
  };

  const handleExportUtilization = () => {
    if (!utilization) return;

    const exportData = utilization.by_user.flatMap((user) =>
      user.by_leave_type.map((leave) => ({
        Employee: user.user_name,
        Department: user.department,
        Leave_Type: leave.leave_type,
        Allocated: leave.allocated,
        Used: leave.used,
        Pending: leave.pending,
        Available: leave.available,
        Utilization: leave.utilization_percentage + "%",
      }))
    );

    exportAnalyticsToCSV(
      exportData,
      `utilization-${year}-${new Date().toISOString().split("T")[0]}.csv`
    );

    toast({
      title: "Exported successfully",
      description: "Utilization report has been exported to CSV",
      status: "success",
      duration: 3000,
    });
  };

  if (analyticsLoading || utilizationLoading) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" />
        <Text mt={4}>Loading analytics...</Text>
      </Box>
    );
  }

  return (
    <VStack spacing={6} align="stretch">
      {/* Filters */}
      <Card>
        <CardBody>
          <HStack spacing={4} wrap="wrap">
            <Box>
              <Text fontSize="sm" mb={1} fontWeight="medium">
                Date Range
              </Text>
              <Select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as any)}
                width="200px"
              >
                <option value="all">All Time</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </Select>
            </Box>

            <Box>
              <Text fontSize="sm" mb={1} fontWeight="medium">
                Utilization Year
              </Text>
              <Select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                width="150px"
              >
                <option value={new Date().getFullYear() - 1}>
                  {new Date().getFullYear() - 1}
                </option>
                <option value={new Date().getFullYear()}>
                  {new Date().getFullYear()}
                </option>
                <option value={new Date().getFullYear() + 1}>
                  {new Date().getFullYear() + 1}
                </option>
              </Select>
            </Box>

            <Box ml="auto">
              <Text fontSize="sm" mb={1} fontWeight="medium" opacity={0}>
                Actions
              </Text>
              <HStack>
                <Button
                  size="sm"
                  onClick={handleExportAnalytics}
                  colorScheme="blue"
                >
                  Export Analytics
                </Button>
                <Button
                  size="sm"
                  onClick={handleExportUtilization}
                  colorScheme="green"
                >
                  Export Utilization
                </Button>
              </HStack>
            </Box>
          </HStack>
        </CardBody>
      </Card>

      {/* Summary Stats */}
      {analytics && <SummaryStats data={analytics.summary} />}

      {/* Charts Grid */}
      <Grid templateColumns={{ base: "1fr", lg: "repeat(2, 1fr)" }} gap={6}>
        {analytics && <LeaveTypeBreakdown data={analytics.by_leave_type} />}
        {analytics && <DepartmentBreakdown data={analytics.by_department} />}
        {analytics && <MonthlyTrend data={analytics.monthly_trend} />}
      </Grid>

      {/* Utilization Report */}
      {utilization && <UtilizationReport data={utilization} />}
    </VStack>
  );
}
