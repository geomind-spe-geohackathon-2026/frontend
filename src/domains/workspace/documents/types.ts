export type Document = {
  id: string;
  project: string;
  name: string;
  size: number;
  searchable: "pending" | "ready" | "failed";
  created: string;
};

export type DocumentList = { items: Document[]; next: string | null };
