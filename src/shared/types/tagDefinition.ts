export interface TagDefinition {
  name: string;
  color: string;
  enabled: boolean;
  description: string;
}

export interface TagGroup {
  id: string;
  name: string;
  sortOrder: number;
}

export interface TagGroupLink {
  tagName: string;
  groupId: string;
}
