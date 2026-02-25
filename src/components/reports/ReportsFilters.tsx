import { Card, CardBody, HStack, FormControl, FormLabel, Input, Select, Button, Icon, Text } from "@chakra-ui/react";
import { FiFilter, FiX } from "react-icons/fi";
import { LeaveType } from "@/types/models";
import { useQuery } from "@tanstack/react-query";
import { getDepartments } from "@/api/departments.api";
import { LeaveReportFilters } from "@/api/reports.api";

interface ReportFiltersProps {
  filters: LeaveReportFilters;
  onChange: (filters: LeaveReportFilters) => void;
  onClear: () => void;
  hasActiveFilters: boolean;
}

export const ReportFilters = ({ filters, onChange, onClear, hasActiveFilters }: ReportFiltersProps) => {
  const { data: departments } = useQuery({ queryKey: ["departments"], queryFn: getDepartments });

  const updateFilter = (key: keyof LeaveReportFilters, value: string) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <Card variant="outline">
      <CardBody>
        <HStack justify="space-between" mb={4}>
          <HStack spacing={2}><Icon as={FiFilter} /><Text fontWeight="bold" fontSize="sm">Filters</Text></HStack>
          {hasActiveFilters && <Button size="xs" variant="ghost" leftIcon={<FiX />} onClick={onClear}>Clear All</Button>}
        </HStack>
        <HStack spacing={4} flexWrap="wrap">
          <FilterInput label="Start Date" type="date" value={filters.startDate} onChange={(v) => updateFilter("startDate", v)} />
          <FilterInput label="End Date" type="date" value={filters.endDate} onChange={(v) => updateFilter("endDate", v)} />
          <FormControl maxW="200px">
            <FormLabel fontSize="xs">Department</FormLabel>
            <Select size="sm" value={filters.departmentId} onChange={(e) => updateFilter("departmentId", e.target.value)} placeholder="All Departments">
              {departments?.map(dept => <option key={dept.id} value={dept.id}>{dept.code} - {dept.name}</option>)}
            </Select>
          </FormControl>
          <FormControl maxW="200px">
            <FormLabel fontSize="xs">Leave Type</FormLabel>
            <Select size="sm" value={filters.leaveType} onChange={(e) => updateFilter("leaveType", e.target.value)} placeholder="All Types">
              {Object.values(LeaveType).map(type => <option key={type} value={type}>{type}</option>)}
            </Select>
          </FormControl>
        </HStack>
      </CardBody>
    </Card>
  );
};

const FilterInput = ({ label, type, value, onChange }: any) => (
  <FormControl maxW="200px">
    <FormLabel fontSize="xs">{label}</FormLabel>
    <Input type={type} size="sm" value={value} onChange={(e) => onChange(e.target.value)} />
  </FormControl>
);