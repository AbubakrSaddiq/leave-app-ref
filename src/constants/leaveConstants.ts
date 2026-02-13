import { LeaveType } from "@/types/models";

export const LEAVE_TYPE_OPTIONS = [
  {
    value: LeaveType.ANNUAL,
    label: "Annual Leave",
    description: "30 days/year - 14 days notice",
  },
  {
    value: LeaveType.CASUAL,
    label: "Casual Leave",
    description: "7 days/year - 14 days notice",
  },
  {
    value: LeaveType.SICK,
    label: "Sick Leave",
    description: "10 days/year (reapplicable) - No notice",
  },
  {
    value: LeaveType.MATERNITY,
    label: "Maternity Leave",
    description: "16 weeks - 4 weeks notice",
  },
  {
    value: LeaveType.PATERNITY,
    label: "Paternity Leave",
    description: "14 days - 14 days notice",
  },
  {
    value: LeaveType.STUDY,
    label: "Study Leave",
    description: "BSc (4 years), MSc (2 years), PhD (4 years) ",
  },
];

export const STUDY_PROGRAMS = [
  {
    value: 'bsc',
    label: 'Bachelor of Science (BSc)',
    duration: '4 years',
    durationYears: 4,
  },
  {
    value: 'msc',
    label: 'Master of Science (MSc)',
    duration: '2 years',
    durationYears: 2,
  },
  {
    value: 'phd',
    label: 'Doctor of Philosophy (PhD)',
    duration: '4 years',
    durationYears: 4,
  },
];