import { useState, type FormEvent } from "react";
import type { User } from "@/shared/api/types";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTrigger } from "@/shared/ui/dialog";
import { Field } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { showToast } from "@/shared/ui/toast";
import { useCreateUser } from "./api";
import { RoleSelect } from "./role-select";

/** The Add user button and its dialog: name, email, first password and role. */
export function AddUserDialog() {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<User["role"]>("member");
  const create = useCreateUser();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = form.get("name");
    const email = form.get("email");
    const password = form.get("password");
    if (typeof name !== "string" || typeof email !== "string" || typeof password !== "string") {
      return;
    }
    create.mutate(
      { name, email, password, role },
      {
        onSuccess: () => {
          showToast("User created");
          setOpen(false);
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="primary">Add user</Button>
      </DialogTrigger>
      <DialogContent title="Add user">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Field label="Name" htmlFor="new-user-name">
            <Input id="new-user-name" name="name" required />
          </Field>
          <Field label="Email" htmlFor="new-user-email">
            <Input id="new-user-email" name="email" type="email" required />
          </Field>
          <Field label="First password" htmlFor="new-user-password">
            <Input
              id="new-user-password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
            />
          </Field>
          <Field label="Role" htmlFor="new-user-role">
            <RoleSelect id="new-user-role" value={role} onChange={setRole} />
          </Field>
          {create.error === null ? null : (
            <p role="alert" className="text-bad">
              {create.error.message}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <DialogClose asChild>
              <Button>Cancel</Button>
            </DialogClose>
            <Button type="submit" variant="primary" disabled={create.isPending}>
              Create
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
