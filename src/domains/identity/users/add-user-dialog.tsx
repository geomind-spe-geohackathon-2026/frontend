import { useState, type SubmitEvent } from "react";
import { toFieldMessage } from "@/shared/api/errors";
import type { User } from "@/shared/api/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field } from "@/shared/ui/field";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useCreateUser } from "./api";
import { RoleSelect } from "./role-select";

function AddUserForm({ onCreated }: { onCreated: () => void }) {
  const [role, setRole] = useState<User["role"]>("member");
  const create = useCreateUser();

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
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
          toast("User created");
          onCreated();
        },
      },
    );
  }

  return (
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
          {toFieldMessage(create.error)}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <DialogClose asChild>
          <Button>Cancel</Button>
        </DialogClose>
        <Button type="submit" variant="default" disabled={create.isPending}>
          Create
        </Button>
      </div>
    </form>
  );
}

/** The Add user button and its dialog: name, email, first password and role. */
export function AddUserDialog() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default">Add user</Button>
      </DialogTrigger>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Add user</DialogTitle>
        </DialogHeader>
        <AddUserForm
          onCreated={() => {
            setOpen(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
