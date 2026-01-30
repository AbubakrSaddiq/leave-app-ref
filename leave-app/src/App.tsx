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
      // email: "test3@company.com",
      // password: "Test123!",

      email: "staff.rld@company.com",
      password: "Test123!",

      // email: "test.research.lab@company.com",
      // password: "Test123!",

      // email: "Director.rld@company.com",
      // password: "Director123!",

      // email: "hr@company.com",
      // password: "Hr123!",

      // email: "hr1@company.com",
      // password: "hr123!",

      // email: "admin@company.com",
      // password: "Admin123!",

      // email: "sharon.may@company.com",
      // password: "Test123!",

      //   email: "director.budget@company.com",
      // password: "Director123!",

      // email: "testfinance@company.com",
      // password: "Test123!",
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
          <Badge colorScheme="purple">{profile?.role}</Badge>
          <Button size="sm" onClick={handleLogout} variant="outline">
            Logout
          </Button>
        </VStack>
      ) : (
        <VStack align="flex-start" spacing={2}>
          <Text>🔒 Not logged in</Text>

          <Button size="sm" onClick={handleLogin} colorScheme="blue">
            Quick Login
          </Button>
        </VStack>
      )}
    </Box>
  );
}

function DashboardTabs({ role }: { role: string }) {
  const isDirector = role === "director";
  const isHR = role === "hr";
  const isStaff = role === "staff";
  const isAdmin = role === "admin";
  const canViewAnalytics = isDirector || isHR || isAdmin;
  const canManageSystem = isAdmin;

  return (
    <Tabs colorScheme="blue" variant="enclosed">
      <TabList>
        <Tab>📊 My Balances</Tab>
        <Tab>✍️ Apply for Leave</Tab>
        <Tab>📋 My Applications</Tab>
        {isDirector && <Tab>✅ Director Approvals</Tab>}
        {isHR && <Tab>✅ HR Approvals</Tab>}
        {/* {canViewAnalytics && <Tab>📈 Analytics</Tab>} */}
        {canManageSystem && <Tab>👥 Users</Tab>}
        {canManageSystem && <Tab>🏢 Departments</Tab>}
      </TabList>

      <TabPanels>
        <TabPanel>
          <BalanceDashboard />
        </TabPanel>

        <TabPanel>
          <LeaveApplicationForm />
        </TabPanel>

        <TabPanel>
          <MyLeaveApplications />
        </TabPanel>

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

        {/* {canViewAnalytics && (
          <TabPanel>
            <AnalyticsDashboard />
          </TabPanel>
        )} */}

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
          {/* <Image
            src="/src/assets/logo/naseni_logo_3.png" // Replace with your actual path in the public folder
            fallbackSrc="https://via.placeholder.com/40" // Shows while loading
            boxSize="40px"
            objectFit="contain"
            alt="Company Logo"
          /> */}
          <Heading mb={2}>Leave Management System</Heading>
          {/* <Text mb={6} color="gray.600">
            Complete Admin Dashboard with User Management ✨
          </Text> */}

          <LoginButton />
          {profile && <DashboardTabs role={profile.role} />}
        </Container>
      </QueryClientProvider>
    </ChakraProvider>
  );
}

export default App;
