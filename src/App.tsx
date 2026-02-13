import { ChakraProvider, Container, Flex, Heading } from "@chakra-ui/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/context/AuthContext";
import { useAuth } from "@/hooks/useAuth"; 
import { UserNav } from "@/components/auth/UserNav";
import { DashboardTabs } from "@/components/layout/DashboardTabs";
import { DesiredMonthsChecker } from "@/components/desiredMonths/DesiredMonthsChecker";

const queryClient = new QueryClient();

const MainContent = () => {
  const { profile } = useAuth();
  
  return (
    <>
      <Container maxW="container.xl" py={8}>
        <Heading mb={6}>Leave Management System</Heading>
        <UserNav />
        {profile && <DashboardTabs role={profile.role} />}
      </Container>
      
    
    </>
  );
};

function App() {
  return (
    <ChakraProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <MainContent />
        </AuthProvider>
      </QueryClientProvider>
    </ChakraProvider>
  );
}

export default App;