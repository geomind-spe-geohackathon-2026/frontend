import { useState, type SubmitEvent } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { toFieldMessage } from "@/shared/api/errors";
import type { Connector, ConnectorCreate } from "@/shared/api/pending";
import { useAddConnector } from "./api";

function text(form: FormData, name: string): string {
  const value = form.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function toConnector(form: FormData): ConnectorCreate {
  const raw = text(form, "auth");
  const auth: Connector["auth"] = raw === "bearer" || raw === "header" ? raw : "none";
  const secret = text(form, "secret");
  const header = text(form, "header_name");
  return {
    name: text(form, "name"),
    url: text(form, "url"),
    transport: text(form, "transport") === "sse" ? "sse" : "http",
    auth,
    ...(auth === "header" && header !== "" ? { header_name: header } : {}),
    ...(auth !== "none" && secret !== "" ? { secret } : {}),
  };
}

function AuthFields({ auth }: { auth: string }) {
  if (auth === "none") return null;
  return (
    <>
      {auth === "header" ? (
        <Field className="gap-1.5">
          <FieldLabel htmlFor="connector-header">Header name</FieldLabel>
          <Input id="connector-header" name="header_name" required placeholder="X-API-Key" />
        </Field>
      ) : null}
      <Field className="gap-1.5">
        <FieldLabel htmlFor="connector-secret">{auth === "bearer" ? "Token" : "Key"}</FieldLabel>
        <Input id="connector-secret" name="secret" type="password" autoComplete="off" required />
      </Field>
    </>
  );
}

function ConnectorFields() {
  const [auth, setAuth] = useState("none");
  return (
    <>
      <Field className="gap-1.5">
        <FieldLabel htmlFor="connector-name">Name</FieldLabel>
        <Input id="connector-name" name="name" required />
      </Field>
      <Field className="gap-1.5">
        <FieldLabel htmlFor="connector-url">Server URL</FieldLabel>
        <Input id="connector-url" name="url" type="url" required placeholder="https://" />
      </Field>
      <Field className="gap-1.5">
        <FieldLabel htmlFor="connector-transport">Transport</FieldLabel>
        <NativeSelect id="connector-transport" name="transport" defaultValue="http">
          <NativeSelectOption value="http">Streamable HTTP</NativeSelectOption>
          <NativeSelectOption value="sse">SSE</NativeSelectOption>
        </NativeSelect>
      </Field>
      <Field className="gap-1.5">
        <FieldLabel htmlFor="connector-auth">Sign-in</FieldLabel>
        <NativeSelect
          id="connector-auth"
          name="auth"
          value={auth}
          onChange={(event) => {
            setAuth(event.target.value);
          }}
        >
          <NativeSelectOption value="none">None</NativeSelectOption>
          <NativeSelectOption value="bearer">Bearer token</NativeSelectOption>
          <NativeSelectOption value="header">Key in a header</NativeSelectOption>
        </NativeSelect>
      </Field>
      <AuthFields auth={auth} />
    </>
  );
}

/** The Add connector button: a window for an MCP server's address and sign-in; the server checks it once added. */
export function AddConnectorButton() {
  const [open, setOpen] = useState(false);
  const add = useAddConnector();
  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    add.mutate(toConnector(new FormData(event.currentTarget)), {
      onSuccess: (connector) => {
        toast(`${connector.name} added`);
        setOpen(false);
      },
    });
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default">
          <Plus aria-hidden="true" />
          Add connector
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add connector</DialogTitle>
          <DialogDescription>
            An MCP server whose tools the agents may use. The key is stored on the server and never
            shown again.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <ConnectorFields />
          {add.error === null ? null : (
            <p role="alert" className="text-bad">
              {toFieldMessage(add.error)}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <DialogClose asChild>
              <Button type="button">Cancel</Button>
            </DialogClose>
            <Button type="submit" variant="default" disabled={add.isPending}>
              Add
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
