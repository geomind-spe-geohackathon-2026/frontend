import type { PasswordChange } from "./me/types";
import type { NewUser, UserChanges, UserList } from "./users/types";
import type { User } from "@/shared/api/types";

declare module "@/shared/api/schema" {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface paths {
    "/identity/me/password": {
      post: {
        requestBody: { content: { "application/json": PasswordChange } };
        responses: { 204: { content?: never } };
      };
    };
    "/identity/users": {
      get: {
        parameters: { query?: { cursor?: string; limit?: number } };
        responses: { 200: { content: { "application/json": UserList } } };
      };
      post: {
        requestBody: { content: { "application/json": NewUser } };
        responses: { 201: { content: { "application/json": User } } };
      };
    };
    "/identity/users/{id}": {
      patch: {
        parameters: { path: { id: string } };
        requestBody: { content: { "application/json": UserChanges } };
        responses: { 200: { content: { "application/json": User } } };
      };
    };
  }
}
