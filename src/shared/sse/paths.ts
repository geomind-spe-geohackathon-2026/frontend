import type {
  Answer,
  Chat,
  ChatState,
  Message,
  Run,
  RunLog,
  SentMessage,
  UsageTotals,
} from "./contract";

type Json<T> = { content: { "application/json": T } };
type Items<T> = Json<{ items: T[]; next: string | null }>;
type Id = { path: { id: string } };

declare module "@/shared/api/schema" {
  interface paths {
    "/assistant/chat": {
      get: {
        parameters: { query: { project: string; cursor?: string; limit?: number } };
        responses: { 200: Items<Chat> };
      };
      post: {
        requestBody: Json<{ project: string; title?: string }>;
        responses: { 201: Json<Chat> };
      };
    };
    "/assistant/chat/{id}": {
      patch: {
        parameters: Id;
        requestBody: Json<{ title: string }>;
        responses: { 200: Json<Chat> };
      };
      delete: { parameters: Id; responses: { 204: { content?: never } } };
    };
    "/assistant/chat/{id}/messages": {
      get: {
        parameters: { path: { id: string }; query?: { cursor?: string; limit?: number } };
        responses: { 200: Items<Message> };
      };
      post: {
        parameters: Id;
        requestBody: Json<{ content: string }>;
        responses: { 201: Json<SentMessage> };
      };
    };
    "/assistant/chat/{id}/state": {
      get: { parameters: Id; responses: { 200: Json<ChatState> } };
    };
    "/assistant/runs/{id}": {
      get: { parameters: Id; responses: { 200: Json<Run> } };
    };
    "/assistant/runs/{id}/log": {
      get: { parameters: Id; responses: { 200: Json<RunLog> } };
    };
    "/assistant/runs/{id}/log/export": {
      get: {
        parameters: { path: { id: string }; query: { format: "json" | "md" } };
        responses: { 200: Json<unknown> };
      };
    };
    "/assistant/runs/{id}/answer": {
      post: {
        parameters: Id;
        requestBody: Json<{ request: string; answer: Answer }>;
        responses: { 200: Json<Run> };
      };
    };
    "/assistant/runs/{id}/cancel": {
      post: { parameters: Id; responses: { 200: Json<Run> } };
    };
    "/assistant/usage": {
      get: {
        parameters: { query: { project: string } };
        responses: { 200: Json<UsageTotals> };
      };
    };
  }
}
