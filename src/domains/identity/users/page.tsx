import { TableScroll } from "@/shared/ui/table-scroll";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { hasCode } from "@/shared/api/errors";
import { meQuery } from "@/shared/api/me";
import { toItems } from "@/shared/api/pagination";
import type { User } from "@/shared/api/types";
import { PageHeader } from "@/shared/layout/page-header";
import { Button } from "@/shared/ui/button";
import { Chip } from "@/shared/ui/chip";
import { showToast } from "@/shared/ui/toast";
import { AddUserDialog } from "./add-user-dialog";
import { useUpdateUser, usersQuery } from "./api";
import { RoleSelect } from "./role-select";

function UserRow({ user, isSelf }: { user: User; isSelf: boolean }) {
  const update = useUpdateUser();

  function handleChange(changes: { role: User["role"] } | { active: boolean }, text: string) {
    update.mutate(
      { id: user.id, changes },
      {
        onSuccess: () => {
          showToast(text);
        },
      },
    );
  }

  return (
    <tr className="border-t border-border">
      <td className="px-3 py-2">{user.name}</td>
      <td className="px-3 py-2">{user.email}</td>
      <td className="px-3 py-2">
        <RoleSelect
          label={`Role of ${user.name}`}
          value={user.role}
          disabled={isSelf || update.isPending}
          onChange={(role) => {
            handleChange({ role }, `${user.name} is now ${role}`);
          }}
        />
      </td>
      <td className="px-3 py-2">
        <Chip tone={user.active ? "ok" : "off"}>{user.active ? "active" : "inactive"}</Chip>
      </td>
      <td className="px-3 py-2 text-right">
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
      </td>
    </tr>
  );
}

function UsersTable({ users, selfId }: { users: User[]; selfId: string | undefined }) {
  return (
    <TableScroll label="Users" className="rounded-card border border-border bg-surface">
      <table className="w-full text-left">
        <caption className="sr-only">Users</caption>
        <thead className="text-muted">
          <tr>
            <th scope="col" className="px-3 py-2 font-medium">
              Name
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              Email
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              Role
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              Status
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              <span className="sr-only">Action</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <UserRow key={user.id} user={user} isSelf={user.id === selfId} />
          ))}
        </tbody>
      </table>
    </TableScroll>
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
      {users.isPending ? <p role="status">Loading users</p> : null}
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
