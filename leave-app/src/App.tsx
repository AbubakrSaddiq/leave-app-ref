import {
  ChakraProvider,
  Container,
  Heading,
  Text,
  Box,
  Button,
  VStack,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Badge,
} from "@chakra-ui/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { BalanceDashboard } from "@/components/balances/BalanceDashboard";
import { LeaveApplicationForm } from "@/components/leaves/LeaveApplicationForm";
import { MyLeaveApplications } from "@/components/leaves/MyLeaveApplications";
import { ApprovalQueue } from "@/components/leaves/ApprovalQueue";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";
import { DepartmentManagement } from "@/components/admin/DepartmentManagement";
import { UserManagement } from "@/components/admin/UserManagement";

const queryClient = new QueryClient();

function LoginButton() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUser(user);

        const { data: profileData } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .single();

        setProfile(profileData);
      }
    };

    fetchUser();
  }, []);

  const handleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: "admin@company.com",
      password: "Admin123!",
    });

    if (error) {
      alert("❌ " + error.message);
    } else {
      window.location.reload();
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  return (
    <Box mb={6} p={4} bg="white" borderRadius="lg" boxShadow="sm">
      {user ? (
        <VStack align="flex-start" spacing={2}>
          <Text fontWeight="bold">👤 {profile?.full_name || user.email}</Text>
          <Badge colorScheme="purple">{profile?.role || "User"}</Badge>
          <Button size="sm" onClick={handleLogout} variant="outline">
            Logout
          </Button>
        </VStack>
      ) : (
        <VStack align="flex-start" spacing={2}>
          <Text>🔒 Not logged in</Text>
          <Button size="sm" onClick={handleLogin} colorScheme="blue">
            Quick Login (Admin)
          </Button>
        </VStack>
      )}
    </Box>
  );
}

function DashboardTabs({ role }: { role: string }) {
  const isDirector = role === "director";
  const isHR = role === "hr";
  const isAdmin = role === "admin";
  const canViewAnalytics = isDirector || isHR || isAdmin;
  const canManageSystem = isAdmin;

  return (
    <Tabs colorScheme="blue" variant="enclosed">
      <TabList>
        <Tab>📊 My Balances</Tab>
        <Tab>✍️ Apply for Leave</Tab>
        <Tab>📋 My Applications</Tab>
        {(isDirector || isAdmin) && <Tab>✅ Director Approvals</Tab>}
        {(isHR || isAdmin) && <Tab>✅ HR Approvals</Tab>}
        {canViewAnalytics && <Tab>📈 Analytics</Tab>}
        {canManageSystem && <Tab>👥 Users</Tab>}
        {canManageSystem && <Tab>🏢 Departments</Tab>}
      </TabList>

      <TabPanels>
        <TabPanel>
          <BalanceDashboard />
        </TabPanel>

        <TabPanel>
          <LeaveApplicationForm
            onSuccess={() => {
              alert("✅ Leave application submitted successfully!");
            }}
          />
        </TabPanel>

        <TabPanel>
          <MyLeaveApplications />
        </TabPanel>

        {(isDirector || isAdmin) && (
          <TabPanel>
            <ApprovalQueue role="director" />
          </TabPanel>
        )}

        {(isHR || isAdmin) && (
          <TabPanel>
            <ApprovalQueue role="hr" />
          </TabPanel>
        )}

        {canViewAnalytics && (
          <TabPanel>
            <AnalyticsDashboard />
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
      </TabPanels>
    </Tabs>
  );
}

function App() {
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .single();
        setProfile(data);
      }
    };

    fetchProfile();
  }, []);

  return (
    <ChakraProvider>
      <QueryClientProvider client={queryClient}>
        <Container maxW="container.xl" py={8}>
          <Heading mb={2}>🏢 Leave Management System</Heading>
          <Text mb={6} color="gray.600">
            Complete Admin Dashboard with User Management ✨
          </Text>

          <LoginButton />
          {profile && <DashboardTabs role={profile.role} />}
        </Container>
      </QueryClientProvider>
    </ChakraProvider>
  );
}

export default App;
