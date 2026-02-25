/**
 * Maps leave types to Chakra UI color schemes
 */
export  const getLeaveTypeColor = (type: string): string => {
  const mapping: Record<string, string> = {
    annual: "blue",
    sick: "red",
    casual: "green",
    maternity: "purple",
    paternity: "cyan",
    study: "orange",
  };
  return mapping[type.toLowerCase()] || "gray";
};