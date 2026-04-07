export type WorkspaceFieldType = "string" | "number" | "multi_select";
export type WorkspaceFieldSource = "builtin" | "tag_group" | "custom";

export interface WorkspaceFieldDefinition {
  id: string;
  label: string;
  source: WorkspaceFieldSource;
  type: WorkspaceFieldType;
  options: string[];
  rawOptions?: string[];
  visible: boolean;
  width: number;
  editable: boolean;
}
