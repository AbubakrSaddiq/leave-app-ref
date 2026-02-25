import React, { useRef } from 'react';
import {
  Box, VStack, HStack, Heading, Text, Button, Card, CardBody,
  FormControl, FormLabel, Input, Select, Table, Thead, Tbody,
  Tr, Th, Td, Badge, Spinner, Center, Icon,
  Menu, MenuButton, MenuList, MenuItem, IconButton,
} from '@chakra-ui/react';
import { FiPrinter, FiDownload, FiFilter, FiX, FiFileText, FiMoreVertical, FiEye } from 'react-icons/fi';
import { LeaveType } from '@/types/models';
import { LeaveDetailModal } from './LeaveDetailModal';
import { useLeaveReports } from '@/hooks/useLeaveReports';
import { formatDate } from '@/utils/date.utils';

export function ReportsPage() {
  const {
    filters,
    departments,
    reports,
    isLoading,
    isGenerating,
    selectedLeave,
    isDetailModalOpen,
    hasActiveFilters,
    updateFilter,
    clearFilters,
    openDetailModal,
    closeDetailModal,
    handleExportPdf,
    handlePrint,
  } = useLeaveReports();

  const printRef = useRef<HTMLDivElement>(null);

  return (
    <Box className="no-print">
      <VStack align="stretch" spacing={6}>
        {/* Header */}
        <HStack justify="space-between" flexWrap="wrap" gap={4}>
          <Box>
            <Heading size="lg">Leave Reports</Heading>
            <Text color="gray.600" fontSize="sm" mt={1}>
              View and export approved leave applications
            </Text>
          </Box>

          <HStack spacing={3}>
            <Button
              leftIcon={<FiPrinter />}
              onClick={handlePrint}
              variant="outline"
              isDisabled={!reports || reports.length === 0}
            >
              Print
            </Button>
            <Button
              leftIcon={<FiDownload />}
              onClick={handleExportPdf}
              colorScheme="blue"
              isLoading={isGenerating}
              loadingText="Generating..."
              isDisabled={!reports || reports.length === 0}
            >
              Export PDF
            </Button>
          </HStack>
        </HStack>

        {/* Filters */}
        <Card>
          <CardBody>
            <HStack justify="space-between" mb={4}>
              <HStack spacing={2}>
                <Icon as={FiFilter} color="gray.500" />
                <Text fontWeight="bold" fontSize="sm">Filters</Text>
              </HStack>
              {hasActiveFilters && (
                <Button
                  leftIcon={<FiX />}
                  size="xs"
                  variant="ghost"
                  onClick={clearFilters}
                >
                  Clear All
                </Button>
              )}
            </HStack>

            <HStack spacing={4} flexWrap="wrap">
              <FormControl maxW="200px">
                <FormLabel fontSize="xs">Start Date</FormLabel>
                <Input
                  type="date"
                  size="sm"
                  value={filters.startDate}
                  onChange={(e) => updateFilter('startDate', e.target.value)}
                />
              </FormControl>

              <FormControl maxW="200px">
                <FormLabel fontSize="xs">End Date</FormLabel>
                <Input
                  type="date"
                  size="sm"
                  value={filters.endDate}
                  onChange={(e) => updateFilter('endDate', e.target.value)}
                />
              </FormControl>

              <FormControl maxW="200px">
                <FormLabel fontSize="xs">Department</FormLabel>
                <Select
                  size="sm"
                  value={filters.departmentId}
                  onChange={(e) => updateFilter('departmentId', e.target.value)}
                  placeholder="All Departments"
                >
                  {departments?.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.code} - {dept.name}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl maxW="200px">
                <FormLabel fontSize="xs">Leave Type</FormLabel>
                <Select
                  size="sm"
                  value={filters.leaveType}
                  onChange={(e) => updateFilter('leaveType', e.target.value)}
                  placeholder="All Types"
                >
                  <option value={LeaveType.ANNUAL}>Annual</option>
                  <option value={LeaveType.CASUAL}>Casual</option>
                  <option value={LeaveType.SICK}>Sick</option>
                  <option value={LeaveType.MATERNITY}>Maternity</option>
                  <option value={LeaveType.PATERNITY}>Paternity</option>
                  <option value={LeaveType.STUDY}>Study</option>
                </Select>
              </FormControl>
            </HStack>
          </CardBody>
        </Card>

        {/* Results */}
        <Card>
          <CardBody>
            {isLoading ? (
              <Center py={20}>
                <VStack spacing={4}>
                  <Spinner size="xl" color="blue.500" />
                  <Text>Loading reports...</Text>
                </VStack>
              </Center>
            ) : !reports || reports.length === 0 ? (
              <Center py={20}>
                <VStack spacing={2}>
                  <Icon as={FiFileText} boxSize={12} color="gray.300" />
                  <Text color="gray.500" fontWeight="medium">
                    No approved leave applications found
                  </Text>
                  <Text color="gray.400" fontSize="sm">
                    {hasActiveFilters
                      ? 'Try adjusting your filters'
                      : 'Select filters to generate a report'}
                  </Text>
                </VStack>
              </Center>
            ) : (
              <>
                <Text fontSize="sm" color="gray.600" mb={4}>
                  Showing {reports.length} approved application{reports.length !== 1 ? 's' : ''}
                </Text>

                <Box ref={printRef} className="print-content">
                  <Table variant="simple" size="sm">
                    <Thead bg="gray.50">
                      <Tr>
                        <Th>Application #</Th>
                        <Th>Employee</Th>
                        <Th>Department</Th>
                        <Th>Type</Th>
                        <Th>Period</Th>
                        <Th>Days</Th>
                        <Th>Approvals</Th>
                        <Th className="no-print">Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {reports.map((report) => (
                        <Tr key={report.id} _hover={{ bg: 'gray.25' }}>
                          <Td fontFamily="mono" fontSize="xs">
                            {report.application_number}
                          </Td>
                          <Td>
                            <VStack align="start" spacing={0}>
                              <Text fontWeight="bold" fontSize="xs">
                                {report.user.full_name}
                              </Text>
                              {report.user.designation && (
                                <Text fontSize="10px" color="gray.500">
                                  {report.user.designation.name}
                                </Text>
                              )}
                            </VStack>
                          </Td>
                          <Td fontSize="xs">
                            {report.user.department?.code || '—'}
                          </Td>
                          <Td>
                            <Badge
                              colorScheme={
                                report.leave_type === 'annual' ? 'blue' :
                                report.leave_type === 'sick' ? 'red' :
                                report.leave_type === 'casual' ? 'green' : 'purple'
                              }
                              fontSize="10px"
                            >
                              {report.leave_type}
                            </Badge>
                          </Td>
                          <Td fontSize="xs">
                            {formatDate(report.start_date, 'MMM d')} -{' '}
                            {formatDate(report.end_date, 'MMM d, yyyy')}
                          </Td>
                          <Td fontSize="xs" fontWeight="bold">
                            {report.working_days}
                          </Td>
                          <Td fontSize="xs">
                            <VStack align="start" spacing={1}>
                              {report.director_approved_at && (
                                <Text fontSize="10px" color="gray.600">
                                  ✓ Director: {formatDate(report.director_approved_at, 'MMM d')}
                                </Text>
                              )}
                              {report.hr_approved_at && (
                                <Text fontSize="10px" color="gray.600">
                                  ✓ HR: {formatDate(report.hr_approved_at, 'MMM d')}
                                </Text>
                              )}
                            </VStack>
                          </Td>
                          <Td className="no-print">
                            <Menu>
                              <MenuButton
                                as={IconButton}
                                icon={<FiMoreVertical />}
                                size="xs"
                                variant="ghost"
                              />
                              <MenuList fontSize="sm">
                                <MenuItem
                                  icon={<FiEye />}
                                  onClick={() => openDetailModal(report)}
                                >
                                  View Details
                                </MenuItem>
                              </MenuList>
                            </Menu>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              </>
            )}
          </CardBody>
        </Card>
      </VStack>

      {/* Detail Modal */}
      {selectedLeave && (
        <LeaveDetailModal
          isOpen={isDetailModalOpen}
          onClose={closeDetailModal}
          leave={selectedLeave}
        />
      )}

      {/* Print Styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-content { width: 100%; font-size: 11pt; }
          .print-content table { border-collapse: collapse; width: 100%; }
          .print-content th, .print-content td { border: 1px solid #ddd; padding: 8px; }
          .print-content th { background-color: #f5f5f5; font-weight: bold; }
        }
      `}</style>
    </Box>
  );
}