export type DashboardSidebarStatus = {
  message: string;
  stats: string[];
};

export function createDashboardSidebarStatus(message: string, stats: string[] = []): DashboardSidebarStatus {
  return { message, stats };
}
