import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/shared/ui/button";
import { Card, CardBody, CardHeader } from "@/shared/ui/card";
import { ApiError } from "@/shared/api/errors";
import { Field } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { Chip } from "@/shared/ui/chip";
import { caseSeriesQuery, useUploadCaseFile } from "./api";
import { SeriesChart } from "./series-chart";
import type { Case } from "./types";

type Props = { projectId: string; saved: Case; dirty: boolean };

function UploadForm({ projectId, saved, dirty }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const upload = useUploadCaseFile(projectId);
  const replaces = saved.files.some((existing) => existing.name === name);
  const canUpload = file !== null && name.trim() !== "" && !dirty && !upload.isPending;
  return (
    <form
      className="flex flex-wrap items-end gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (file === null) return;
        upload.mutate({ base: saved.version, name: name.trim(), file });
      }}
    >
      <Field label="Series file" htmlFor="case-file">
        <Input
          id="case-file"
          type="file"
          onChange={(event) => {
            const chosen = event.target.files?.[0] ?? null;
            setFile(chosen);
            setName(chosen?.name ?? "");
          }}
        />
      </Field>
      <Field label="Name in the problem" htmlFor="case-file-name">
        <Input
          id="case-file-name"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
          }}
        />
      </Field>
      <Button type="submit" variant="primary" disabled={!canUpload}>
        {replaces ? "Replace file" : "Upload file"}
      </Button>
      {dirty ? (
        <p className="w-full text-muted">Save or discard your changes before uploading.</p>
      ) : null}
      {upload.error instanceof ApiError ? (
        <p role="alert" className="w-full text-bad">
          {upload.error.code}: {upload.error.message}
        </p>
      ) : null}
    </form>
  );
}

/** The files the problem names, an upload or replace form, and a chart of every series read through gemini. */
export function FilesPanel(props: Props) {
  const { projectId, saved } = props;
  const series = useQuery(caseSeriesQuery(projectId, saved.version));
  return (
    <div className="flex flex-col gap-3.5">
      <Card>
        <CardHeader>
          <h2>Files</h2>
        </CardHeader>
        <CardBody className="flex flex-col gap-3">
          {saved.files.length === 0 ? (
            <p className="text-muted">No files in this problem.</p>
          ) : null}
          <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
            {saved.files.map((file) => (
              <li key={file.name}>
                <Chip tone="ok">{file.name} loaded</Chip>
              </li>
            ))}
          </ul>
          <UploadForm {...props} />
        </CardBody>
      </Card>
      <Card>
        <CardHeader>
          <h2>Series</h2>
        </CardHeader>
        <CardBody className="flex flex-col gap-3">
          {series.isPending ? <p className="text-muted">Reading the series…</p> : null}
          {series.isError ? (
            <p role="alert" className="text-bad">
              The series could not be read.
            </p>
          ) : null}
          {series.data?.series.length === 0 ? (
            <p className="text-muted">No series in this problem.</p>
          ) : null}
          {series.data?.series.map((item, index) => (
            <SeriesChart key={item.name} series={item} colorIndex={index} />
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
