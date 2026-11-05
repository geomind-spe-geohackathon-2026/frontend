import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { hasCode } from "@/shared/api/errors";
import { meQuery } from "@/shared/api/me";
import { toItems } from "@/shared/api/pagination";
import type { User } from "@/shared/api/types";
import { PageHeader } from "@/shared/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { AddUserDialog } from "./add-user-dialog";
import { useUpdateUser, usersQuery } from "./api";
import { RoleSelect } from "./role-select";
import {
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from "@/components/ui/table";
import { Notice } from "@/shared/ui/notice";
import { DataCell, DataTableFrame, dataTableClass } from "@/shared/ui/data-table";

function UserRow({ user, isSelf }: { user: User; isSelf: boolean }) {
  const update = useUpdateUser();

  function handleChange(changes: { role: User["role"] } | { active: boolean }, text: string) {
    update.mutate(
      { id: user.id, changes },
      {
        onSuccess: () => {
          toast(text);
        },
      },
    );
  }

  return (
    <TableRow className="border-t border-border">
      <DataCell className="px-3">{user.name}</DataCell>
      <DataCell className="px-3">{user.email}</DataCell>
      <TableCell className="px-3 py-2">
        <RoleSelect
          label={`Role of ${user.name}`}
          value={user.role}
          disabled={isSelf || update.isPending}
          onChange={(role) => {
            handleChange({ role }, `${user.name} is now ${role}`);
          }}
        />
      </TableCell>
      <TableCell className="px-3 py-2">
        <Badge variant={user.active ? "ok" : "off"}>{user.active ? "active" : "inactive"}</Badge>
      </TableCell>
      <TableCell className="px-3 py-2 text-right">
        {isSelf ? null : (
          <Button
            disabled={update.isPending}
            onClick={() => {
              handleChange(
                { active: !user.active },
                user.active ? `${user.name} deactivated` : `${user.name} activated`,
              );
            }}
          >
            {user.active ? "Deactivate" : "Activate"}
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}

function UsersTable({ users, selfId }: { users: User[]; selfId: string | undefined }) {
  return (
    <DataTableFrame className="max-h-[70vh]">
        <TableCaption className="sr-only">Users</TableCaption>
        <TableHeader className={`${dataTableClass.header} text-muted`}>
          <TableRow>
            <TableHead scope="col" className="px-3 py-2 font-medium">
              Name
            </TableHead>
            <TableHead scope="col" className="px-3 py-2 font-medium">
              Email
            </TableHead>
            <TableHead scope="col" className="px-3 py-2 font-medium">
              Role
            </TableHead>
            <TableHead scope="col" className="px-3 py-2 font-medium">
              Status
            </TableHead>
            <TableHead scope="col" className="px-3 py-2 font-medium">
              <span className="sr-only">Action</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <UserRow key={user.id} user={user} isSelf={user.id === selfId} />
          ))}
        </TableBody>
      </DataTableFrame>
  );
}

/** The admin users page: list, add, change role, deactivate and activate. */
export function UsersPage() {
  const users = useInfiniteQuery(usersQuery());
  const me = useQuery(meQuery());
  const items = toItems(users.data?.pages);

  return (
    <div className="mx-auto flex w-[min(900px,100%)] flex-col">
      <PageHeader title="Users" actions={<AddUserDialog />} />
      {users.isPending ? <Notice status="loading" what="users" /> : null}
      {users.isError ? (
        <p role="alert">
          {hasCode(users.error, "forbidden")
            ? "Only admins can manage users."
            : users.error.message}
        </p>
      ) : null}
      {users.isSuccess && items.length === 0 ? <p>No users yet. Add the first one.</p> : null}
      {items.length === 0 ? null : <UsersTable users={items} selfId={me.data?.id} />}
      {users.hasNextPage ? (
        <Button
          className="mt-3 self-start"
          disabled={users.isFetchingNextPage}
          onClick={() => void users.fetchNextPage()}
        >
          Load more
        </Button>
      ) : null}
    </div>
  );
}
