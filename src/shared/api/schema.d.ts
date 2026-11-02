export interface paths {
    "/assistant/chat": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Chats */
        get: operations["list_chats_api_v1_assistant_chat_get"];
        put?: never;
        /** Create Chat */
        post: operations["create_chat_api_v1_assistant_chat_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/assistant/chat/{chat_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Delete Chat */
        delete: operations["delete_chat_api_v1_assistant_chat__chat_id__delete"];
        options?: never;
        head?: never;
        /** Rename Chat */
        patch: operations["rename_chat_api_v1_assistant_chat__chat_id__patch"];
        trace?: never;
    };
    "/assistant/chat/{chat_id}/messages": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Messages */
        get: operations["list_messages_api_v1_assistant_chat__chat_id__messages_get"];
        put?: never;
        /** Send Message */
        post: operations["send_message_api_v1_assistant_chat__chat_id__messages_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/assistant/chat/{chat_id}/state": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Read State */
        get: operations["read_state_api_v1_assistant_chat__chat_id__state_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/assistant/runs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Runs */
        get: operations["list_runs_api_v1_assistant_runs_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/assistant/runs/{run_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Run */
        get: operations["get_run_api_v1_assistant_runs__run_id__get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/assistant/runs/{run_id}/answer": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Answer Run */
        post: operations["answer_run_api_v1_assistant_runs__run_id__answer_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/assistant/runs/{run_id}/cancel": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Cancel Run */
        post: operations["cancel_run_api_v1_assistant_runs__run_id__cancel_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/assistant/runs/{run_id}/events": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Stream Events */
        get: operations["stream_events_api_v1_assistant_runs__run_id__events_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/assistant/runs/{run_id}/log": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Log */
        get: operations["get_log_api_v1_assistant_runs__run_id__log_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/assistant/runs/{run_id}/log/export": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Export Log */
        get: operations["export_log_api_v1_assistant_runs__run_id__log_export_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/assistant/usage": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Read Usage */
        get: operations["read_usage_api_v1_assistant_usage_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/design/case": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Case */
        get: operations["get_case_api_v1_design_case_get"];
        put?: never;
        /** Save Case */
        post: operations["save_case_api_v1_design_case_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/design/case/files": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Add File */
        post: operations["add_file_api_v1_design_case_files_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/design/case/files/{name}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get File */
        get: operations["get_file_api_v1_design_case_files__name__get"];
        put?: never;
        post?: never;
        /** Remove File */
        delete: operations["remove_file_api_v1_design_case_files__name__delete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/design/case/schema": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Schema */
        get: operations["get_schema_api_v1_design_case_schema_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/design/case/series": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Series */
        get: operations["get_series_api_v1_design_case_series_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/design/case/validate": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Validate Case */
        post: operations["validate_case_api_v1_design_case_validate_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/design/case/versions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Versions */
        get: operations["list_versions_api_v1_design_case_versions_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/design/results": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Results */
        get: operations["list_results_api_v1_design_results_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/design/results/compare": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Compare Results */
        get: operations["compare_results_api_v1_design_results_compare_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/design/results/{result_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Result */
        get: operations["get_result_api_v1_design_results__result_id__get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/design/results/{result_id}/adopt": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Adopt Design */
        post: operations["adopt_design_api_v1_design_results__result_id__adopt_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/design/study": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Studies */
        get: operations["list_studies_api_v1_design_study_get"];
        put?: never;
        /** Create Study */
        post: operations["create_study_api_v1_design_study_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/design/study/kinds": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Kinds */
        get: operations["list_kinds_api_v1_design_study_kinds_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/design/study/{study_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Study */
        get: operations["get_study_api_v1_design_study__study_id__get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/design/study/{study_id}/cancel": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Cancel Study */
        post: operations["cancel_study_api_v1_design_study__study_id__cancel_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/design/study/{study_id}/start": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Start Study */
        post: operations["start_study_api_v1_design_study__study_id__start_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/identity/authn/login": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Login */
        post: operations["login_api_v1_identity_authn_login_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/identity/authn/logout": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Logout */
        post: operations["logout_api_v1_identity_authn_logout_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/identity/authn/refresh": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Refresh */
        post: operations["refresh_api_v1_identity_authn_refresh_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/identity/me": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Me */
        get: operations["get_me_api_v1_identity_me_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/identity/me/password": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Change Password */
        post: operations["change_password_api_v1_identity_me_password_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/identity/users": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Users */
        get: operations["list_users_api_v1_identity_users_get"];
        put?: never;
        /** Create User */
        post: operations["create_user_api_v1_identity_users_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/identity/users/{user_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Update User */
        patch: operations["update_user_api_v1_identity_users__user_id__patch"];
        trace?: never;
    };
    "/plant/flowsheet": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Flowsheet */
        get: operations["get_flowsheet_api_v1_plant_flowsheet_get"];
        put?: never;
        /** Save Flowsheet */
        post: operations["save_flowsheet_api_v1_plant_flowsheet_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/plant/flowsheet/layout": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** Save Layout */
        put: operations["save_layout_api_v1_plant_flowsheet_layout_put"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/plant/flowsheet/palette": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Palette */
        get: operations["list_palette_api_v1_plant_flowsheet_palette_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/plant/flowsheet/ports": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Ports */
        get: operations["list_ports_api_v1_plant_flowsheet_ports_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/plant/flowsheet/templates": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Templates */
        get: operations["list_templates_api_v1_plant_flowsheet_templates_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/plant/flowsheet/validate": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Validate Spec */
        post: operations["validate_spec_api_v1_plant_flowsheet_validate_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/plant/flowsheet/versions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Versions */
        get: operations["list_versions_api_v1_plant_flowsheet_versions_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/plant/flowsheet/versions/{number}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Version */
        get: operations["get_version_api_v1_plant_flowsheet_versions__number__get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/plant/parameters": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Parameters */
        get: operations["get_parameters_api_v1_plant_parameters_get"];
        put?: never;
        /** Save Parameters */
        post: operations["save_parameters_api_v1_plant_parameters_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/plant/parameters/fill": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Fill Parameters */
        post: operations["fill_parameters_api_v1_plant_parameters_fill_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/reporting/design/export": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Export Report */
        post: operations["export_report_api_v1_reporting_design_export_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/reporting/design/parts": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Parts */
        get: operations["list_parts_api_v1_reporting_design_parts_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/reporting/design/preview": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Preview Report */
        post: operations["preview_report_api_v1_reporting_design_preview_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/system/health": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Health */
        get: operations["health_api_v1_system_health_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/workspace/documents": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Documents */
        get: operations["list_documents_api_v1_workspace_documents_get"];
        put?: never;
        /** Upload Document */
        post: operations["upload_document_api_v1_workspace_documents_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/workspace/documents/formats": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Formats */
        get: operations["list_formats_api_v1_workspace_documents_formats_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/workspace/documents/{document_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Delete Document */
        delete: operations["delete_document_api_v1_workspace_documents__document_id__delete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/workspace/overview": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Overview */
        get: operations["get_overview_api_v1_workspace_overview_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/workspace/projects": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Projects */
        get: operations["list_projects_api_v1_workspace_projects_get"];
        put?: never;
        /** Create Project */
        post: operations["create_project_api_v1_workspace_projects_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/workspace/projects/import": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Import Project */
        post: operations["import_project_api_v1_workspace_projects_import_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/workspace/projects/{project_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Project */
        get: operations["get_project_api_v1_workspace_projects__project_id__get"];
        put?: never;
        post?: never;
        /** Delete Project */
        delete: operations["delete_project_api_v1_workspace_projects__project_id__delete"];
        options?: never;
        head?: never;
        /** Update Project */
        patch: operations["update_project_api_v1_workspace_projects__project_id__patch"];
        trace?: never;
    };
    "/workspace/projects/{project_id}/case/copy": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Copy Case Into */
        post: operations["copy_case_into_api_v1_workspace_projects__project_id__case_copy_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/workspace/projects/{project_id}/export": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Export Project */
        get: operations["export_project_api_v1_workspace_projects__project_id__export_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        /** Activity */
        Activity: {
            actor: components["schemas"]["Actor"];
            /**
             * Id
             * Format: uuid
             */
            id: string;
            link: components["schemas"]["Link"] | null;
            /** Text */
            text: string;
            /**
             * Time
             * Format: date-time
             */
            time: string;
        };
        /** Actor */
        Actor: {
            /**
             * Kind
             * @enum {string}
             */
            kind: "user" | "agent";
            /** Name */
            name: string;
        };
        /** AdoptedDesign */
        AdoptedDesign: {
            /** Plant Version */
            plant_version: number;
        };
        /** Approval */
        Approval: {
            /** Approved */
            approved: boolean;
            /** Reason */
            reason?: string | null;
        };
        /** Author */
        Author: {
            /**
             * Id
             * Format: uuid
             */
            id: string;
            /** Name */
            name: string;
        };
        /** Body_add_file_api_v1_design_case_files_post */
        Body_add_file_api_v1_design_case_files_post: {
            /** Base */
            base?: number | null;
            /** File */
            file: Blob;
            /** Name */
            name: string;
            /**
             * Project
             * Format: uuid
             */
            project: string;
        };
        /** Body_import_project_api_v1_workspace_projects_import_post */
        Body_import_project_api_v1_workspace_projects_import_post: {
            /** File */
            file: Blob;
        };
        /** Body_upload_document_api_v1_workspace_documents_post */
        Body_upload_document_api_v1_workspace_documents_post: {
            /** File */
            file: Blob;
            /**
             * Project
             * Format: uuid
             */
            project: string;
        };
        /** Budget */
        Budget: {
            /** Max Cost */
            max_cost?: number | null;
            /** Max Tokens */
            max_tokens?: number | null;
        };
        /** Capacity */
        Capacity: {
            /** Kind */
            kind: string;
            /** Name */
            name: string;
            /** Peak */
            peak: number | null;
            /** Peak Unit */
            peak_unit: string;
            /** Reason */
            reason: string | null;
            /** Share */
            share: number | null;
            /** Title */
            title: string;
            /** Unit */
            unit: string;
            /** Value */
            value: number | null;
        };
        /** Case */
        Case: {
            /** Content */
            content: {
                [key: string]: unknown;
            };
            /** Files */
            files: components["schemas"]["CaseFile"][];
            /** Missing */
            missing: components["schemas"]["Missing"][];
            /** Problems */
            problems: components["schemas"]["Problem"][];
            /**
             * Project
             * Format: uuid
             */
            project: string;
            /** Version */
            version: number;
        };
        /** CaseCheck */
        CaseCheck: {
            /** Content */
            content: {
                [key: string]: unknown;
            };
            /** Project */
            project?: string | null;
        };
        /** CaseCopy */
        CaseCopy: {
            /**
             * Case From
             * Format: uuid
             */
            case_from: string;
        };
        /** CaseCreate */
        CaseCreate: {
            /** Base */
            base: number | null;
            /** Content */
            content: {
                [key: string]: unknown;
            };
            /** Note */
            note: string;
            /**
             * Project
             * Format: uuid
             */
            project: string;
        };
        /** CaseFile */
        CaseFile: {
            /** Name */
            name: string;
            /** Size */
            size: number;
        };
        /** CaseProblems */
        CaseProblems: {
            /**
             * Has Plant
             * @default false
             */
            has_plant: boolean;
            /** Missing */
            missing: components["schemas"]["Missing"][];
            /**
             * Plant Missing
             * @default []
             */
            plant_missing: components["schemas"]["Missing"][];
            /** Problems */
            problems: components["schemas"]["Problem"][];
        };
        /** ChangePassword */
        ChangePassword: {
            /** New Password */
            new_password: string;
            /** Old Password */
            old_password: string;
        };
        /** Chat */
        Chat: {
            /**
             * Created
             * Format: date-time
             */
            created: string;
            /**
             * Id
             * Format: uuid
             */
            id: string;
            last_run: components["schemas"]["LastRun"] | null;
            /**
             * Project
             * Format: uuid
             */
            project: string;
            /** Title */
            title: string;
        };
        /** ChatCreate */
        ChatCreate: {
            /**
             * Project
             * Format: uuid
             */
            project: string;
            /** Title */
            title?: string | null;
        };
        /** ChatState */
        ChatState: {
            /** State */
            state: {
                [key: string]: unknown;
            } | null;
            /** Version */
            version: number;
        };
        /** ChatUpdate */
        ChatUpdate: {
            /** Title */
            title: string;
        };
        /** Checks */
        Checks: {
            /** Failed */
            failed: number;
            /** Not Assessed */
            not_assessed: number;
            /** Passed */
            passed: number;
        };
        /** Constraint */
        Constraint: {
            /** Limit */
            limit: string;
            /** Margin */
            margin: number | null;
            /** Message */
            message: string;
            /** Module */
            module: string | null;
            /** Name */
            name: string;
            /** Near */
            near: boolean;
            /**
             * Status
             * @enum {string}
             */
            status: "pass" | "fail" | "not_assessed";
            /** Title */
            title: string;
            /** Unit */
            unit: string;
            /** Value */
            value: number | null;
            /** Worst */
            worst: string | null;
        };
        /** Coverage */
        Coverage: {
            /**
             * Cooling
             * @default []
             */
            cooling: components["schemas"]["CoverageDay"][];
            /**
             * Heating
             * @default []
             */
            heating: components["schemas"]["CoverageDay"][];
        };
        /** CoverageDay */
        CoverageDay: {
            backup: components["schemas"]["Figure"];
            /** Date */
            date: string;
            demand: components["schemas"]["Figure"];
            failed_steps: components["schemas"]["Figure"];
            geothermal: components["schemas"]["Figure"];
            short: components["schemas"]["Figure"];
            /**
             * Source
             * @enum {string}
             */
            source: "geothermal" | "backup" | "short";
        };
        /** Credentials */
        Credentials: {
            /** Email */
            email: string;
            /** Password */
            password: string;
        };
        /** Document */
        Document: {
            /**
             * Created
             * Format: date-time
             */
            created: string;
            /**
             * Id
             * Format: uuid
             */
            id: string;
            /** Name */
            name: string;
            /**
             * Project
             * Format: uuid
             */
            project: string;
            /**
             * Searchable
             * @enum {string}
             */
            searchable: "pending" | "ready" | "failed";
            /** Size */
            size: number;
        };
        /** Failure */
        Failure: {
            /** Code */
            code: string;
            /** Message */
            message: string;
        };
        /** Figure */
        Figure: {
            /** Unit */
            unit: string;
            /** Value */
            value: number;
        };
        /** Flowsheet */
        Flowsheet: {
            /** Connections */
            connections: components["schemas"]["FlowsheetConnection"][];
            /** Layout */
            layout: {
                [key: string]: unknown;
            };
            /** Modules */
            modules: components["schemas"]["FlowsheetModule"][];
            /**
             * Project
             * Format: uuid
             */
            project: string;
            /** Spec */
            spec: {
                [key: string]: unknown;
            };
            /** Structure */
            structure: {
                [key: string]: unknown;
            };
            /** Version */
            version: number;
        };
        /** FlowsheetConnection */
        FlowsheetConnection: {
            /** Kind */
            kind: string | null;
            /** Source */
            source: string;
            /** Stream */
            stream: string | null;
            /** Target */
            target: string;
        };
        /** FlowsheetCreate */
        FlowsheetCreate: {
            /** Base */
            base: number | null;
            /** Layout */
            layout?: {
                [key: string]: unknown;
            } | null;
            /** Note */
            note: string;
            /** Parameters */
            parameters?: {
                [key: string]: {
                    [key: string]: unknown;
                };
            } | null;
            /**
             * Project
             * Format: uuid
             */
            project: string;
            /** Spec */
            spec?: {
                [key: string]: unknown;
            } | null;
            /** Template */
            template?: string | null;
        };
        /** FlowsheetModule */
        FlowsheetModule: {
            /** Category */
            category: string;
            /** Id */
            id: string;
            /** Title */
            title: string;
            /** Type */
            type: string;
        };
        /** HTTPValidationError */
        HTTPValidationError: {
            /** Detail */
            detail?: components["schemas"]["ValidationError"][];
        };
        /** HealthStatus */
        HealthStatus: {
            /**
             * Assistant
             * @enum {string}
             */
            assistant: "model" | "scripted";
            /** Status */
            status: string;
        };
        /** Kpi */
        Kpi: {
            /** Name */
            name: string;
            /** Reason */
            reason: string | null;
            /** Title */
            title: string;
            /** Unit */
            unit: string;
            /** Value */
            value: number | null;
        };
        /** LastRun */
        LastRun: {
            /**
             * Id
             * Format: uuid
             */
            id: string;
            /**
             * Status
             * @enum {string}
             */
            status: "queued" | "running" | "waiting" | "done" | "failed" | "cancelled";
        };
        /** LayoutUpdate */
        LayoutUpdate: {
            /** Base */
            base: number | null;
            /** Layout */
            layout: {
                [key: string]: unknown;
            };
            /**
             * Project
             * Format: uuid
             */
            project: string;
        };
        /** Link */
        Link: {
            /** Id */
            id: string | null;
            /** Route */
            route: string;
        };
        /** Message */
        Message: {
            /**
             * Chat
             * Format: uuid
             */
            chat: string;
            /** Content */
            content: string;
            /**
             * Created
             * Format: date-time
             */
            created: string;
            /**
             * Id
             * Format: uuid
             */
            id: string;
            /**
             * Role
             * @enum {string}
             */
            role: "user" | "assistant";
            /** Run */
            run: string | null;
        };
        /** MessageCreate */
        MessageCreate: {
            /** Content */
            content: string;
        };
        /** MessageSent */
        MessageSent: {
            message: components["schemas"]["Message"];
            run: components["schemas"]["Run"];
        };
        /** Missing */
        Missing: {
            /** Message */
            message: string;
            /** Path */
            path: string;
        };
        /** ModulePorts */
        ModulePorts: {
            /** Inlets */
            inlets: components["schemas"]["PortKind"][];
            /** Outlets */
            outlets: components["schemas"]["PortKind"][];
            /** Type */
            type: string;
        };
        /** Overview */
        Overview: {
            /** Active Runs */
            active_runs: components["schemas"]["Run"][];
            /** Activity */
            activity: components["schemas"]["Activity"][];
            /** Chats */
            chats: components["schemas"]["Chat"][];
            progress: components["schemas"]["Progress"];
        };
        /** Owner */
        Owner: {
            /**
             * Id
             * Format: uuid
             */
            id: string;
            /** Name */
            name: string;
        };
        /** Page[Chat] */
        Page_Chat_: {
            /** Items */
            items: components["schemas"]["Chat"][];
            /** Next */
            next: string | null;
        };
        /** Page[Document] */
        Page_Document_: {
            /** Items */
            items: components["schemas"]["Document"][];
            /** Next */
            next: string | null;
        };
        /** Page[Message] */
        Page_Message_: {
            /** Items */
            items: components["schemas"]["Message"][];
            /** Next */
            next: string | null;
        };
        /** Page[Project] */
        Page_Project_: {
            /** Items */
            items: components["schemas"]["Project"][];
            /** Next */
            next: string | null;
        };
        /** Page[Result] */
        Page_Result_: {
            /** Items */
            items: components["schemas"]["Result"][];
            /** Next */
            next: string | null;
        };
        /** Page[Run] */
        Page_Run_: {
            /** Items */
            items: components["schemas"]["Run"][];
            /** Next */
            next: string | null;
        };
        /** Page[Study] */
        Page_Study_: {
            /** Items */
            items: components["schemas"]["Study"][];
            /** Next */
            next: string | null;
        };
        /** Page[UserResponse] */
        Page_UserResponse_: {
            /** Items */
            items: components["schemas"]["UserResponse"][];
            /** Next */
            next: string | null;
        };
        /** Page[Version] */
        Page_Version_: {
            /** Items */
            items: components["schemas"]["Version"][];
            /** Next */
            next: string | null;
        };
        /** Palette */
        Palette: {
            /** Category */
            category: string;
            /** Summary */
            summary: string;
            /** Title */
            title: string;
            /** Type */
            type: string;
        };
        /** ParameterHistory */
        ParameterHistory: {
            /** Params */
            params: {
                [key: string]: unknown;
            };
            /** Valid From */
            valid_from: string | null;
        };
        /** Parameters */
        Parameters: {
            /** History */
            history: components["schemas"]["ParameterHistory"][];
            /** Missing */
            missing: string[];
            /** Module */
            module: string;
            /** Schema */
            schema: {
                [key: string]: unknown;
            };
            /** Type */
            type: string;
            /** Values */
            values: {
                [key: string]: unknown;
            };
        };
        /** ParametersFill */
        ParametersFill: {
            /** Base */
            base: number | null;
            /** Entry */
            entry: string;
            /** Module */
            module: string;
            /** Note */
            note: string;
            /**
             * Project
             * Format: uuid
             */
            project: string;
            /** Valid From */
            valid_from?: string | null;
        };
        /** ParametersUpdate */
        ParametersUpdate: {
            /** Base */
            base: number | null;
            /** Module */
            module: string;
            /** Note */
            note: string;
            /** Params */
            params: {
                [key: string]: unknown;
            };
            /**
             * Project
             * Format: uuid
             */
            project: string;
            /** Valid From */
            valid_from?: string | null;
        };
        /** PortKind */
        PortKind: {
            /** Kind */
            kind: string | null;
            /** Port */
            port: string;
        };
        /** Problem */
        Problem: {
            /** Code */
            code: string;
            /** Message */
            message: string;
            /** Path */
            path: string;
        };
        /** Progress */
        Progress: {
            case: components["schemas"]["ProgressStep"];
            plant: components["schemas"]["ProgressStep"];
            report: components["schemas"]["ProgressStep"];
            results: components["schemas"]["ProgressStep"];
            study: components["schemas"]["ProgressStep"];
        };
        /** ProgressStep */
        ProgressStep: {
            /** Label */
            label: string;
            /**
             * State
             * @enum {string}
             */
            state: "empty" | "incomplete" | "ready" | "running" | "done";
        };
        /** Project */
        Project: {
            budget: components["schemas"]["Budget"];
            /** Case Version */
            case_version: number | null;
            /** Chats */
            chats: number;
            /**
             * Created
             * Format: date-time
             */
            created: string;
            /**
             * Id
             * Format: uuid
             */
            id: string;
            /** Name */
            name: string;
            owner: components["schemas"]["Owner"];
            /** Plant Version */
            plant_version: number | null;
            progress: components["schemas"]["Progress"];
            /** Runs */
            runs: number;
            /**
             * Updated
             * Format: date-time
             */
            updated: string;
        };
        /** ProjectCreate */
        ProjectCreate: {
            /** Case From */
            case_from?: string | null;
            /** Name */
            name: string;
        };
        /** ProjectUpdate */
        ProjectUpdate: {
            budget?: components["schemas"]["Budget"] | null;
            /** Name */
            name?: string | null;
        };
        /** RefreshRequest */
        RefreshRequest: {
            /** Refresh Token */
            refresh_token: string;
        };
        /** Reply */
        Reply: {
            /** Text */
            text: string;
        };
        /** Report */
        Report: {
            /** Sections */
            sections: components["schemas"]["ReportSection"][];
            /** Title */
            title: string;
        };
        /** ReportExport */
        ReportExport: {
            /**
             * Format
             * @enum {string}
             */
            format: "md" | "pdf";
            /** Include */
            include: ("summary" | "design" | "capacities" | "coverage" | "checks" | "costs" | "findings" | "agentlog" | "appendix")[];
            /**
             * Project
             * Format: uuid
             */
            project: string;
            /**
             * Result
             * Format: uuid
             */
            result: string;
            /** Run */
            run?: string | null;
        };
        /** ReportPart */
        ReportPart: {
            /**
             * Key
             * @enum {string}
             */
            key: "summary" | "design" | "capacities" | "coverage" | "checks" | "costs" | "findings" | "agentlog" | "appendix";
            /** Title */
            title: string;
        };
        /** ReportRequest */
        ReportRequest: {
            /** Include */
            include: ("summary" | "design" | "capacities" | "coverage" | "checks" | "costs" | "findings" | "agentlog" | "appendix")[];
            /**
             * Project
             * Format: uuid
             */
            project: string;
            /**
             * Result
             * Format: uuid
             */
            result: string;
            /** Run */
            run?: string | null;
        };
        /** ReportSection */
        ReportSection: {
            /**
             * Key
             * @enum {string}
             */
            key: "summary" | "design" | "capacities" | "coverage" | "checks" | "costs" | "findings" | "agentlog" | "appendix";
            /** Markdown */
            markdown: string;
            /** Title */
            title: string;
        };
        /** Result */
        Result: {
            /** Case Version */
            case_version: number | null;
            checks: components["schemas"]["Checks"];
            /**
             * Created
             * Format: date-time
             */
            created: string;
            /**
             * Id
             * Format: uuid
             */
            id: string;
            /** Kpis */
            kpis: components["schemas"]["Kpi"][];
            /** Name */
            name: string;
            /** Plant Version */
            plant_version: number | null;
            /** Study */
            study: string | null;
        };
        /** ResultComparison */
        ResultComparison: {
            /** Items */
            items: components["schemas"]["Result"][];
            /** Pareto */
            pareto: string[];
        };
        /** ResultDetail */
        ResultDetail: {
            /** Capacities */
            capacities: components["schemas"]["Capacity"][];
            /** Case Version */
            case_version: number | null;
            checks: components["schemas"]["Checks"];
            /** Constraints */
            constraints: components["schemas"]["Constraint"][];
            coverage: components["schemas"]["Coverage"] | null;
            /**
             * Created
             * Format: date-time
             */
            created: string;
            /**
             * Id
             * Format: uuid
             */
            id: string;
            /** Kpis */
            kpis: components["schemas"]["Kpi"][];
            /** Name */
            name: string;
            /** Plant Version */
            plant_version: number | null;
            /** Series */
            series: unknown[];
            /** Sizes */
            sizes: components["schemas"]["Capacity"][];
            /** Spread */
            spread: components["schemas"]["SpreadRow"][] | null;
            /** Study */
            study: string | null;
            /** Tornado */
            tornado: components["schemas"]["TornadoRow"][] | null;
        };
        /**
         * Run
         * @description A run of the assistant, as the runs page and the chat show it.
         */
        Run: {
            /**
             * Chat
             * Format: uuid
             */
            chat: string;
            /** Ended */
            ended: string | null;
            error: components["schemas"]["Failure"] | null;
            /**
             * Id
             * Format: uuid
             */
            id: string;
            /** Loop */
            loop: string | null;
            /**
             * Project
             * Format: uuid
             */
            project: string;
            /** Request */
            request: {
                [key: string]: unknown;
            } | null;
            /** Started */
            started: string | null;
            /**
             * Status
             * @enum {string}
             */
            status: "queued" | "running" | "waiting" | "done" | "failed" | "cancelled";
            usage: components["schemas"]["Tokens"];
        };
        /**
         * RunAnswer
         * @description The user's answer to the request a waiting run shows.
         */
        RunAnswer: {
            /** Answer */
            answer: components["schemas"]["Approval"] | components["schemas"]["Reply"];
            /** Request */
            request: string;
        };
        /** Series */
        Series: {
            /** Name */
            name: string;
            /** Points */
            points: [
                string,
                number
            ][];
            /** Unit */
            unit: string;
        };
        /** SeriesList */
        SeriesList: {
            /** Series */
            series: components["schemas"]["Series"][];
        };
        /** SpecCheck */
        SpecCheck: {
            /** Project */
            project?: string | null;
            /** Spec */
            spec: {
                [key: string]: unknown;
            };
        };
        /** SpecProblems */
        SpecProblems: {
            /** Problems */
            problems: components["schemas"]["Problem"][];
        };
        /** SpreadRow */
        SpreadRow: {
            /** Draws */
            draws: number;
            /** Mean */
            mean: number | null;
            /** Metric */
            metric: string;
            /** P5 */
            p5: number | null;
            /** P50 */
            p50: number | null;
            /** P95 */
            p95: number | null;
            /** Unit */
            unit: string;
        };
        /** StartedBy */
        StartedBy: {
            /**
             * Kind
             * @enum {string}
             */
            kind: "user" | "agent";
            /** Name */
            name: string;
            /** Run */
            run: string | null;
        };
        /** Study */
        Study: {
            /** Case Version */
            case_version: number | null;
            /**
             * Created
             * Format: date-time
             */
            created: string;
            /** Ended */
            ended: string | null;
            error: components["schemas"]["StudyError"] | null;
            /**
             * Id
             * Format: uuid
             */
            id: string;
            /** Kind */
            kind: string;
            /** Missing */
            missing: components["schemas"]["Missing"][];
            /** Name */
            name: string;
            /** Plant Version */
            plant_version: number | null;
            progress: components["schemas"]["StudyProgress"];
            /**
             * Project
             * Format: uuid
             */
            project: string;
            /** Result */
            result: string | null;
            /** Settings */
            settings: {
                [key: string]: unknown;
            };
            started_by: components["schemas"]["StartedBy"];
            /**
             * Status
             * @enum {string}
             */
            status: "queued" | "running" | "done" | "failed" | "cancelled" | "blocked";
        };
        /** StudyCreate */
        StudyCreate: {
            /** Kind */
            kind: string;
            /** Name */
            name: string;
            /**
             * Project
             * Format: uuid
             */
            project: string;
            /** Settings */
            settings: {
                [key: string]: unknown;
            };
        };
        /** StudyError */
        StudyError: {
            /** Code */
            code: string;
            /** Details */
            details: {
                [key: string]: unknown;
            };
            /** Message */
            message: string;
        };
        /** StudyKind */
        StudyKind: {
            /** Description */
            description: string;
            /** Kind */
            kind: string;
            /** Schema */
            schema: {
                [key: string]: unknown;
            };
            /** Title */
            title: string;
        };
        /** StudyProgress */
        StudyProgress: {
            /** Done */
            done: number;
            /** Total */
            total: number;
        };
        /** Template */
        Template: {
            /** Categories */
            categories: string[];
            /** Description */
            description: string;
            /** Modules */
            modules: number;
            /** Name */
            name: string;
            /** Purpose */
            purpose: string | null;
            /** Title */
            title: string;
        };
        /** TokenPairResponse */
        TokenPairResponse: {
            /** Access Token */
            access_token: string;
            /** Refresh Token */
            refresh_token: string;
        };
        /** TokenResponse */
        TokenResponse: {
            /** Access Token */
            access_token: string;
            /** Refresh Token */
            refresh_token: string;
            user: components["schemas"]["UserResponse"];
        };
        /** Tokens */
        Tokens: {
            /** Cost */
            cost: number;
            /** Input Tokens */
            input_tokens: number;
            /** Output Tokens */
            output_tokens: number;
        };
        /** TornadoRow */
        TornadoRow: {
            /** At High */
            at_high: number | null;
            /** At Low */
            at_low: number | null;
            /** Effect */
            effect: number | null;
            /** High */
            high: string;
            /** Low */
            low: string;
            /** Metric */
            metric: string;
            /** Parameter */
            parameter: string;
            /** Unit */
            unit: string;
        };
        /** Usage */
        Usage: {
            /** Cost */
            cost: number;
            /** Input Tokens */
            input_tokens: number;
            /** Output Tokens */
            output_tokens: number;
            /** Runs */
            runs: number;
        };
        /** UserCreate */
        UserCreate: {
            /**
             * Email
             * Format: email
             */
            email: string;
            /** Name */
            name: string;
            /** Password */
            password: string;
            /**
             * Role
             * @enum {string}
             */
            role: "admin" | "member";
        };
        /** UserResponse */
        UserResponse: {
            /** Active */
            active: boolean;
            /** Email */
            email: string;
            /**
             * Id
             * Format: uuid
             */
            id: string;
            /** Name */
            name: string;
            /**
             * Role
             * @enum {string}
             */
            role: "admin" | "member";
        };
        /** UserUpdate */
        UserUpdate: {
            /** Active */
            active?: boolean | null;
            /** Name */
            name?: string | null;
            /** Role */
            role?: ("admin" | "member") | null;
        };
        /** ValidationError */
        ValidationError: {
            /** Context */
            ctx?: Record<string, never>;
            /** Input */
            input?: unknown;
            /** Location */
            loc: (string | number)[];
            /** Message */
            msg: string;
            /** Error Type */
            type: string;
        };
        /** Version */
        Version: {
            author: components["schemas"]["Author"];
            /**
             * Created
             * Format: date-time
             */
            created: string;
            /** Note */
            note: string;
            /** Number */
            number: number;
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    list_chats_api_v1_assistant_chat_get: {
        parameters: {
            query: {
                project: string;
                cursor?: string | null;
                limit?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Page_Chat_"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    create_chat_api_v1_assistant_chat_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ChatCreate"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Chat"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    delete_chat_api_v1_assistant_chat__chat_id__delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                chat_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    rename_chat_api_v1_assistant_chat__chat_id__patch: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                chat_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ChatUpdate"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Chat"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_messages_api_v1_assistant_chat__chat_id__messages_get: {
        parameters: {
            query?: {
                cursor?: string | null;
                limit?: number;
            };
            header?: never;
            path: {
                chat_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Page_Message_"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    send_message_api_v1_assistant_chat__chat_id__messages_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                chat_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["MessageCreate"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MessageSent"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    read_state_api_v1_assistant_chat__chat_id__state_get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                chat_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ChatState"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_runs_api_v1_assistant_runs_get: {
        parameters: {
            query: {
                status?: "active" | null;
                project: string;
                cursor?: string | null;
                limit?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Page_Run_"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_run_api_v1_assistant_runs__run_id__get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                run_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Run"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    answer_run_api_v1_assistant_runs__run_id__answer_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                run_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RunAnswer"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Run"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    cancel_run_api_v1_assistant_runs__run_id__cancel_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                run_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Run"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    stream_events_api_v1_assistant_runs__run_id__events_get: {
        parameters: {
            query?: never;
            header?: {
                "last-event-id"?: string | null;
            };
            path: {
                run_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "text/event-stream": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_log_api_v1_assistant_runs__run_id__log_get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                run_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    export_log_api_v1_assistant_runs__run_id__log_export_get: {
        parameters: {
            query: {
                format: "json" | "md";
            };
            header?: never;
            path: {
                run_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                    "text/markdown": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    read_usage_api_v1_assistant_usage_get: {
        parameters: {
            query: {
                project: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Usage"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_case_api_v1_design_case_get: {
        parameters: {
            query: {
                project: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Case"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    save_case_api_v1_design_case_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CaseCreate"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Case"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    add_file_api_v1_design_case_files_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "multipart/form-data": components["schemas"]["Body_add_file_api_v1_design_case_files_post"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Case"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_file_api_v1_design_case_files__name__get: {
        parameters: {
            query: {
                version?: number | null;
                project: string;
            };
            header?: never;
            path: {
                name: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    remove_file_api_v1_design_case_files__name__delete: {
        parameters: {
            query: {
                base?: number | null;
                project: string;
            };
            header?: never;
            path: {
                name: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Case"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_schema_api_v1_design_case_schema_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        [key: string]: unknown;
                    };
                };
            };
        };
    };
    get_series_api_v1_design_case_series_get: {
        parameters: {
            query: {
                project: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SeriesList"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    validate_case_api_v1_design_case_validate_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CaseCheck"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CaseProblems"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_versions_api_v1_design_case_versions_get: {
        parameters: {
            query: {
                project: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Page_Version_"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_results_api_v1_design_results_get: {
        parameters: {
            query: {
                project: string;
                cursor?: string | null;
                limit?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Page_Result_"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    compare_results_api_v1_design_results_compare_get: {
        parameters: {
            query: {
                project: string;
                ids: string;
                x: string;
                y: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ResultComparison"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_result_api_v1_design_results__result_id__get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                result_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ResultDetail"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    adopt_design_api_v1_design_results__result_id__adopt_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                result_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AdoptedDesign"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_studies_api_v1_design_study_get: {
        parameters: {
            query: {
                project: string;
                cursor?: string | null;
                limit?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Page_Study_"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    create_study_api_v1_design_study_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["StudyCreate"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Study"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_kinds_api_v1_design_study_kinds_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StudyKind"][];
                };
            };
        };
    };
    get_study_api_v1_design_study__study_id__get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                study_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Study"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    cancel_study_api_v1_design_study__study_id__cancel_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                study_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Study"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    start_study_api_v1_design_study__study_id__start_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                study_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Study"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    login_api_v1_identity_authn_login_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["Credentials"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TokenResponse"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    logout_api_v1_identity_authn_logout_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    refresh_api_v1_identity_authn_refresh_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RefreshRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TokenPairResponse"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_me_api_v1_identity_me_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UserResponse"];
                };
            };
        };
    };
    change_password_api_v1_identity_me_password_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ChangePassword"];
            };
        };
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_users_api_v1_identity_users_get: {
        parameters: {
            query?: {
                cursor?: string | null;
                limit?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Page_UserResponse_"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    create_user_api_v1_identity_users_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UserCreate"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UserResponse"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    update_user_api_v1_identity_users__user_id__patch: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                user_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UserUpdate"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UserResponse"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_flowsheet_api_v1_plant_flowsheet_get: {
        parameters: {
            query: {
                project: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Flowsheet"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    save_flowsheet_api_v1_plant_flowsheet_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["FlowsheetCreate"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Flowsheet"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    save_layout_api_v1_plant_flowsheet_layout_put: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["LayoutUpdate"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Flowsheet"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_palette_api_v1_plant_flowsheet_palette_get: {
        parameters: {
            query?: {
                category?: string | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Palette"][];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_ports_api_v1_plant_flowsheet_ports_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ModulePorts"][];
                };
            };
        };
    };
    list_templates_api_v1_plant_flowsheet_templates_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Template"][];
                };
            };
        };
    };
    validate_spec_api_v1_plant_flowsheet_validate_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SpecCheck"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SpecProblems"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_versions_api_v1_plant_flowsheet_versions_get: {
        parameters: {
            query: {
                project: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Page_Version_"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_version_api_v1_plant_flowsheet_versions__number__get: {
        parameters: {
            query: {
                project: string;
            };
            header?: never;
            path: {
                number: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Flowsheet"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_parameters_api_v1_plant_parameters_get: {
        parameters: {
            query: {
                module: string;
                at?: string | null;
                project: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Parameters"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    save_parameters_api_v1_plant_parameters_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ParametersUpdate"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Version"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    fill_parameters_api_v1_plant_parameters_fill_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ParametersFill"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Version"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    export_report_api_v1_reporting_design_export_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ReportExport"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/pdf": unknown;
                    "text/markdown": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_parts_api_v1_reporting_design_parts_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ReportPart"][];
                };
            };
        };
    };
    preview_report_api_v1_reporting_design_preview_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ReportRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Report"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    health_api_v1_system_health_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HealthStatus"];
                };
            };
        };
    };
    list_documents_api_v1_workspace_documents_get: {
        parameters: {
            query: {
                project: string;
                cursor?: string | null;
                limit?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Page_Document_"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    upload_document_api_v1_workspace_documents_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "multipart/form-data": components["schemas"]["Body_upload_document_api_v1_workspace_documents_post"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Document"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_formats_api_v1_workspace_documents_formats_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": string[];
                };
            };
        };
    };
    delete_document_api_v1_workspace_documents__document_id__delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                document_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_overview_api_v1_workspace_overview_get: {
        parameters: {
            query: {
                project: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Overview"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_projects_api_v1_workspace_projects_get: {
        parameters: {
            query?: {
                search?: string | null;
                cursor?: string | null;
                limit?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Page_Project_"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    create_project_api_v1_workspace_projects_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ProjectCreate"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Project"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    import_project_api_v1_workspace_projects_import_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "multipart/form-data": components["schemas"]["Body_import_project_api_v1_workspace_projects_import_post"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Project"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_project_api_v1_workspace_projects__project_id__get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                project_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Project"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    delete_project_api_v1_workspace_projects__project_id__delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                project_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    update_project_api_v1_workspace_projects__project_id__patch: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                project_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ProjectUpdate"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Project"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    copy_case_into_api_v1_workspace_projects__project_id__case_copy_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                project_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CaseCopy"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Project"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    export_project_api_v1_workspace_projects__project_id__export_get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                project_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/zip": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
}
