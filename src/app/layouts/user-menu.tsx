import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { meQuery, signOut } from "@/shared/api/me";
import { toInitials } from "@/lib/initials";
import { useTheme, type Theme } from "@/shared/layout/theme";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const themes: { value: Theme; label: string }[] = [
  { value: "system", label: "Theme: system" },
  { value: "light", label: "Theme: light" },
  { value: "dark", label: "Theme: dark" },
];

function isTheme(value: string): value is Theme {
  return themes.some((theme) => theme.value === value);
}

/** The avatar menu: account, users (admins only), theme and sign out. */
export function UserMenu() {
  const me = useQuery(meQuery());
  const queryClient = useQueryClient();
  const [theme, setTheme] = useTheme();
  const user = me.data;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="User menu"
        className="grid size-7 place-items-center rounded-full bg-accent text-[11px] font-semibold text-on-accent"
      >
        {user === undefined ? "?" : toInitials(user.name)}
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {user === undefined ? null : (
          <>
            <DropdownMenuLabel>
              <span className="block font-medium text-text">{user.name}</span>
              <span className="block">
                {user.role} · {user.email}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem asChild>
          <Link to="/account">Account and password</Link>
        </DropdownMenuItem>
        {user?.role === "admin" ? (
          <DropdownMenuItem asChild>
            <Link to="/users">Users</Link>
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={theme}
          onValueChange={(value) => {
            if (isTheme(value)) setTheme(value);
          }}
        >
          {themes.map((item) => (
            <DropdownMenuRadioItem key={item.value} value={item.value}>
              {item.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => {
            void signOut(queryClient);
          }}
        >
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
