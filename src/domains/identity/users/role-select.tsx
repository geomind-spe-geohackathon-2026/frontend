import type { User } from "@/shared/api/types";

type Role = User["role"];

type Props = {
  id?: string;
  value: Role;
  onChange: (role: Role) => void;
  label?: string;
  disabled?: boolean;
};

function isRole(value: string): value is Role {
  return value === "admin" || value === "member";
}

/** A select for the two roles, admin and member. */
export function RoleSelect({ id, value, onChange, label, disabled }: Props) {
  return (
    <select
      id={id}
      aria-label={label}
      value={value}
      disabled={disabled}
      onChange={(event) => {
        if (isRole(event.target.value)) onChange(event.target.value);
      }}
      className="rounded-control border border-border bg-surface px-2 py-[7px]"
    >
      <option value="member">member</option>
      <option value="admin">admin</option>
    </select>
  );
}
