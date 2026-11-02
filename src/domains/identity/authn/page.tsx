import type { FormEvent } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { toFieldMessage } from "@/shared/api/errors";
import { useSession } from "@/shared/api/session";
import { Button } from "@/shared/ui/button";
import { Field } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { useLogin } from "./api";

const homePath = "/projects";

function toTarget(next: string | null): string {
  if (next === null || !next.startsWith("/") || next.startsWith("//")) return homePath;
  return next;
}

function SignInForm({ target }: { target: string }) {
  const navigate = useNavigate();
  const login = useLogin();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = form.get("email");
    const password = form.get("password");
    if (typeof email !== "string" || typeof password !== "string") return;
    login.mutate(
      { email, password },
      {
        onSuccess: () => {
          void navigate(target, { replace: true });
        },
      },
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-[min(380px,100%)] flex-col gap-3.5">
      <Field label="Email" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="username" required />
      </Field>
      <Field label="Password" htmlFor="password">
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </Field>
      {login.error === null ? null : (
        <p role="alert" className="text-bad">
          {toFieldMessage(login.error)}
        </p>
      )}
      <Button type="submit" variant="primary" disabled={login.isPending} className="justify-center">
        Sign in
      </Button>
    </form>
  );
}

/** The sign in page: email and password, an error message on failure, then back to where the user was going. */
export function SignInPage() {
  const tokens = useSession();
  const [params] = useSearchParams();
  const target = toTarget(params.get("next"));

  if (tokens !== null) return <Navigate to={target} replace />;

  return (
    <main className="grid flex-1 place-items-center bg-gradient-to-b from-sunken to-surface p-6">
      <div className="flex w-[min(380px,100%)] flex-col gap-3.5">
        <div className="flex items-center gap-2 text-xl font-semibold">
          <span aria-hidden="true" className="size-[18px] rounded-full bg-hot" />
          Geomind
        </div>
        <h1 className="sr-only">Sign in</h1>
        <p className="text-muted">
          Design geothermal heating and cooling plants with an assistant.
        </p>
        <SignInForm target={target} />
        <p className="text-muted">
          No public sign up. Forgot your password? Ask an admin to reset it.
        </p>
      </div>
    </main>
  );
}
