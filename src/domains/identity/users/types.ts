import type { User } from "@/shared/api/types";

export type UserList = { items: User[]; next: string | null };
export type NewUser = { email: string; name: string; password: string; role: User["role"] };
export type UserChanges = { role?: User["role"]; name?: string; active?: boolean };
