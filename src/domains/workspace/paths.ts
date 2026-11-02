import type { Project } from "@/shared/api/types";
import type { Document, DocumentList } from "./documents/types";
import type { Overview, MessageReply, NewChat, NewMessage, Chat } from "./overview/types";
import type { ProjectRename } from "./settings/types";

declare module "@/shared/api/schema" {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface paths {
    "/workspace/projects/import": {
      post: {
        requestBody: { content: { "multipart/form-data": FormData } };
        responses: { 201: { content: { "application/json": Project } } };
      };
    };
    "/workspace/projects/{id}": {
      patch: {
        parameters: { path: { id: string } };
        requestBody: { content: { "application/json": ProjectRename } };
        responses: { 200: { content: { "application/json": Project } } };
      };
      delete: {
        parameters: { path: { id: string } };
        responses: { 204: { content?: never } };
      };
    };
    "/workspace/projects/{id}/export": {
      get: {
        parameters: { path: { id: string } };
        responses: { 200: { content: { "application/zip": Blob } } };
      };
    };
    "/workspace/overview": {
      get: {
        parameters: { query: { project: string } };
        responses: { 200: { content: { "application/json": Overview } } };
      };
    };
    "/workspace/documents": {
      get: {
        parameters: { query: { project: string; cursor?: string; limit?: number } };
        responses: { 200: { content: { "application/json": DocumentList } } };
      };
      post: {
        requestBody: { content: { "multipart/form-data": FormData } };
        responses: { 201: { content: { "application/json": Document } } };
      };
    };
    "/workspace/documents/{id}": {
      delete: {
        parameters: { path: { id: string } };
        responses: { 204: { content?: never } };
      };
    };
    "/assistant/chat": {
      post: {
        requestBody: { content: { "application/json": NewChat } };
        responses: { 201: { content: { "application/json": Chat } } };
      };
    };
    "/assistant/chat/{id}/messages": {
      post: {
        parameters: { path: { id: string } };
        requestBody: { content: { "application/json": NewMessage } };
        responses: { 201: { content: { "application/json": MessageReply } } };
      };
    };
  }
}
