import { useQuery } from "@tanstack/react-query";
import { toFieldMessage } from "@/shared/api/errors";
import type { FormEvent } from "react";
import { meQuery } from "@/shared/api/me";
import type { User } from "@/shared/api/types";
import { PageHeader } from "@/shared/layout/page-header";
import { Button } from "@/shared/ui/button";
import { Card, CardBody, CardHeader } from "@/shared/ui/card";
import { Field } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { useChangePassword } from "./api";

function Profile({ user }: { user: User }) {
  return (
    <Card>
      <CardHeader>
        <h2>Profile</h2>
      </CardHeader>
      <CardBody>
        <dl className="grid grid-cols-[100px_1fr] gap-y-1.5">
          <dt className="text-muted">Name</dt>
          <dd>{user.name}</dd>
          <dt className="text-muted">Email</dt>
          <dd>{user.email}</dd>
          <dt className="text-muted">Role</dt>
          <dd>{user.role}</dd>
        </dl>
      </CardBody>
    </Card>
  );
}

function PasswordForm() {
  const change = useChangePassword();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const oldPassword = form.get("old_password");
    const newPassword = form.get("new_password");
    if (typeof oldPassword !== "string" || typeof newPassword !== "string") return;
    change.mutate({ old_password: oldPassword, new_password: newPassword });
  }

  return (
    <Card>
      <CardHeader>
        <h2>Change password</h2>
      </CardHeader>
      <CardBody>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Field label="Current password" htmlFor="old_password">
            <Input
              id="old_password"
              name="old_password"
              type="password"
              autoComplete="current-password"
              required
            />
          </Field>
          <Field label="New password" htmlFor="new_password">
            <Input
              id="new_password"
              name="new_password"
              type="password"
              autoComplete="new-password"
              required
            />
          </Field>
          {change.error === null ? null : (
            <p role="alert" className="text-bad">
              {toFieldMessage(change.error)}
            </p>
          )}
          <p className="text-muted">You will be signed out everywhere.</p>
          <Button
            type="submit"
            variant="primary"
            disabled={change.isPending}
            className="self-start"
          >
            Change password
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}

/** The account page: the signed-in profile and the change password form. */
export function AccountPage() {
  const me = useQuery(meQuery());

  return (
    <div className="mx-auto flex w-[min(600px,100%)] flex-col gap-3.5">
      <PageHeader title="Account" />
      {me.isPending ? <p role="status">Loading your profile</p> : null}
      {me.isError ? <p role="alert">{me.error.message}</p> : null}
      {me.data === undefined ? null : <Profile user={me.data} />}
      <PasswordForm />
    </div>
  );
}
