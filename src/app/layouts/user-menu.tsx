import { ChevronsUpDown, LogOut, SunMoon, UserRound, Users } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { meQuery, signOut } from "@/shared/api/me";
import type { User } from "@/shared/api/types";
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
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";

const themes: { value: Theme; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

function isTheme(value: string): value is Theme {
  return themes.some((theme) => theme.value === value);
}

function ThemeMenu({ theme, onTheme }: { theme: Theme; onTheme: (theme: Theme) => void }) {
  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <SunMoon aria-hidden="true" />
        Theme
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        <DropdownMenuRadioGroup
          value={theme}
          onValueChange={(value) => {
            if (isTheme(value)) onTheme(value);
          }}
        >
          {themes.map((item) => (
            <DropdownMenuRadioItem key={item.value} value={item.value}>
              {item.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}

function UserButton({ user, ...props }: { user: User | undefined }) {
  return (
    <SidebarMenuButton
      {...props}
      size="lg"
      aria-label="User menu"
      tooltip={user?.name ?? "User menu"}
    >
      <span className="grid size-8 flex-none place-items-center rounded-full bg-accent text-[11px] font-semibold text-on-accent">
        {user === undefined ? "?" : toInitials(user.name)}
      </span>
      <span className="flex min-w-0 flex-col leading-tight">
        <span className="truncate font-medium">{user?.name ?? ""}</span>
        <span className="truncate text-xs text-muted-foreground">{user?.role ?? ""}</span>
      </span>
      <ChevronsUpDown aria-hidden="true" className="ml-auto" />
    </SidebarMenuButton>
  );
}

/** The user menu at the bottom of the sidebar: account, users (admins only), theme and sign out. */
export function UserMenu() {
  const me = useQuery(meQuery());
  const queryClient = useQueryClient();
  const [theme, setTheme] = useTheme();
  const user = me.data;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <UserButton user={user} />
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="min-w-56">
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
              <Link to="/account">
                <UserRound aria-hidden="true" />
                Account and password
              </Link>
            </DropdownMenuItem>
            {user?.role === "admin" ? (
              <DropdownMenuItem asChild>
                <Link to="/users">
                  <Users aria-hidden="true" />
                  Users
                </Link>
              </DropdownMenuItem>
            ) : null}
            <ThemeMenu theme={theme} onTheme={setTheme} />
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => {
                void signOut(queryClient);
              }}
            >
              <LogOut aria-hidden="true" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
