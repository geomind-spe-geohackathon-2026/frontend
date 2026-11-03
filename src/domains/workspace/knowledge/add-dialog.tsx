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
import type { KnowledgeCreate } from "@/shared/api/pending";
import { useAddKnowledge } from "./api";

type FieldSpec = { name: string; label: string; type?: string; required?: boolean };

const fields: FieldSpec[] = [
  { name: "item", label: "Item", required: true },
  { name: "id", label: "Id (letters, digits, dashes)" },
  { name: "value", label: "Value", required: true },
  { name: "unit", label: "Unit" },
  { name: "title", label: "Source title", required: true },
  { name: "publisher", label: "Publisher", required: true },
  { name: "year", label: "Year", type: "number", required: true },
  { name: "page", label: "Page" },
  { name: "link", label: "Link", type: "url" },
  { name: "price_year", label: "Price year", type: "number" },
  { name: "currency", label: "Currency" },
  { name: "note", label: "Note" },
];

function text(form: FormData, name: string): string | null {
  const value = form.get(name);
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

function toNumberOr(value: string | null): number | string | null {
  if (value === null) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : value;
}

function toSlug(words: string): string {
  return words
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function toEntry(form: FormData): KnowledgeCreate {
  const year = Number(text(form, "year"));
  const priceYear = text(form, "price_year");
  const item = text(form, "item") ?? "";
  return {
    id: text(form, "id") ?? toSlug(item),
    item,
    value: toNumberOr(text(form, "value")) ?? "",
    unit: text(form, "unit"),
    title: text(form, "title") ?? "",
    publisher: text(form, "publisher") ?? "",
    year,
    page: text(form, "page"),
    link: text(form, "link"),
    price_year: priceYear === null ? null : Number(priceYear),
    currency: text(form, "currency"),
    status: text(form, "status") === "secondary" ? "secondary" : "verified",
    note: text(form, "note"),
  };
}

function EntryFields() {
  return (
    <>
      {fields.map((field) => (
        <Field key={field.name} className="gap-1.5">
          <FieldLabel htmlFor={`knowledge-${field.name}`}>{field.label}</FieldLabel>
          <Input
            id={`knowledge-${field.name}`}
            name={field.name}
            type={field.type ?? "text"}
            required={field.required === true}
          />
        </Field>
      ))}
      <Field className="gap-1.5">
        <FieldLabel htmlFor="knowledge-status">Status</FieldLabel>
        <NativeSelect id="knowledge-status" name="status" defaultValue="verified">
          <NativeSelectOption value="verified">Verified</NativeSelectOption>
          <NativeSelectOption value="secondary">Secondary</NativeSelectOption>
        </NativeSelect>
      </Field>
    </>
  );
}

/** The Add value button: a window with the cited value and its source; a page or a link is required. */
export function AddKnowledgeButton() {
  const [open, setOpen] = useState(false);
  const add = useAddKnowledge();
  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    add.mutate(toEntry(new FormData(event.currentTarget)), {
      onSuccess: () => {
        toast("Value added to the knowledge");
        setOpen(false);
      },
    });
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default">
          <Plus aria-hidden="true" />
          Add value
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[calc(100svh-4rem)] flex-col sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Add value</DialogTitle>
          <DialogDescription>
            A cited value the agents may use. Give its source with a page or a link; money also
            needs its price year and currency. The id comes from the item when left empty.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={handleSubmit}
          className="-mx-6 flex min-h-0 flex-col gap-3 overflow-y-auto px-6"
        >
          <EntryFields />
          {add.error === null ? null : (
            <p role="alert" className="text-bad">
              {toFieldMessage(add.error)}
            </p>
          )}
          <div className="flex justify-end gap-2 pb-1">
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
