import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from "@/components/ui/item";
import type { Connector } from "@/shared/api/pending";
import { PageHeader } from "@/shared/layout/page-header";
import { Notice } from "@/shared/ui/notice";
import { PendingNotice } from "@/shared/ui/pending-notice";
import { AddConnectorButton } from "./add-dialog";
import { connectorsQuery } from "@/shared/api/connectors";
import { useCheckConnector, useDeleteConnector, useUpdateConnector } from "./api";
import { CheckResult } from "./check-result";

const statusDot: Record<Connector["status"], string> = {
  ok: "bg-ok",
  error: "bg-bad",
  unchecked: "bg-border",
};

const statusWord: Record<Connector["status"], string> = {
  ok: "connected",
  error: "cannot connect",
  unchecked: "not checked yet",
};

function ToolsButton({ connector }: { connector: Connector }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button aria-label={`Tools of ${connector.name}`}>
          {connector.tools.length} {connector.tools.length === 1 ? "tool" : "tools"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100svh-4rem)] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Tools of {connector.name}</DialogTitle>
          <DialogDescription>
            A tool that changes something asks for your approval in the chat.
          </DialogDescription>
        </DialogHeader>
        <ul className="flex flex-col gap-2">
          {connector.tools.map((tool) => (
            <li key={tool.name} className="flex flex-col gap-0.5">
              <span className="flex items-center gap-2 font-mono text-[13px]">
                {tool.name}
                <Badge variant={tool.read_only ? "off" : "info"}>
                  {tool.read_only ? "read only" : "asks approval"}
                </Badge>
              </span>
              <span className="text-[12.5px] text-muted-foreground">{tool.description}</span>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}

type Check = ReturnType<typeof useCheckConnector>;

function ConnectorActions({ connector, check }: { connector: Connector; check: Check }) {
  const update = useUpdateConnector(connector.id);
  const remove = useDeleteConnector(connector.id);
  return (
    <ItemActions className="flex-wrap">
      <ToolsButton connector={connector} />
      <Button
        disabled={check.isPending}
        onClick={() => {
          check.mutate(undefined, { onSuccess: () => toast(`${connector.name} checked`) });
        }}
      >
        Check
      </Button>
      <label
        htmlFor={`connector-on-${connector.id}`}
        className="inline-flex items-center gap-1.5 text-sm"
      >
        <Checkbox
          id={`connector-on-${connector.id}`}
          checked={connector.enabled}
          disabled={update.isPending}
          onCheckedChange={(checked) => {
            update.mutate({ enabled: checked === true });
          }}
        />
        On
      </label>
      <Button
        variant="ghost"
        aria-label={`Remove ${connector.name}`}
        disabled={remove.isPending}
        onClick={() => {
          remove.mutate(undefined, { onSuccess: () => toast(`${connector.name} removed`) });
        }}
      >
        Remove
      </Button>
    </ItemActions>
  );
}

function ConnectorItem({ connector }: { connector: Connector }) {
  const check = useCheckConnector(connector.id);
  return (
    <Item variant="outline">
      <ItemContent>
        <ItemTitle>
          <span
            aria-hidden="true"
            className={`size-2 rounded-full ${statusDot[connector.status]}`}
          />
          {connector.name}
          <span className="sr-only">{statusWord[connector.status]}</span>
        </ItemTitle>
        <ItemDescription>
          {connector.url}
          {connector.error === null ? "" : ` · ${connector.error}`}
        </ItemDescription>
        {check.data === undefined ? null : <CheckResult result={check.data} />}
      </ItemContent>
      <ConnectorActions connector={connector} check={check} />
    </Item>
  );
}

/** Connectors: the MCP servers whose tools the agents may use; add, check, turn on or off, remove. */
export function ConnectorsPage() {
  const connectors = useQuery(connectorsQuery());
  return (
    <div className="mx-auto flex w-[min(1040px,100%)] flex-col gap-3">
      <PageHeader
        title="Connectors"
        description="MCP servers that give the agents more tools; each project picks its own."
        actions={<AddConnectorButton />}
      />
      {connectors.isPending ? <Notice status="loading" what="the connectors" /> : null}
      {connectors.isError ? <PendingNotice error={connectors.error} what="connectors" /> : null}
      {connectors.data?.length === 0 ? (
        <p className="text-muted-foreground">No connectors yet.</p>
      ) : null}
      <ItemGroup className="gap-2">
        {connectors.data?.map((connector) => (
          <ConnectorItem key={connector.id} connector={connector} />
        ))}
      </ItemGroup>
    </div>
  );
}
