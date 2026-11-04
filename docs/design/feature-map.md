# GEMINI: domain / feature / use-case map

Regroups every legacy feature by what the user is trying to achieve, not by legacy page or route.

- **Frontend IDs** (`F-<page>-<n>`, 260 features) come from `frontend-features.md`.
- **Backend IDs** (`AUTH-01`, `PLT-03`, ..., 98 features) come from `backend-features.md`.
- **(broken)** marks a legacy feature that does not work today. **(backend only)** marks a use-case with no frontend screen yet.

Every one of the 260 frontend and 98 backend IDs appears in this map. The new backend and frontend repos can share these names, so a use-case means the same thing in an endpoint, a screen and a test.

## 0. Naming rules

Every name below was chosen against these rules. A name that breaks one is a bug in this map.

1. **Domain = an area of responsibility.** A noun for the subject a user role looks after (for example, "Well Integrity" is what an integrity engineer owns). One sidebar group per domain.
2. **Feature = an activity, not a thing.** Named after what the user does there ("Nodal Analysis"), never after the equipment ("Production Well") or the legacy page title.
3. **Use-case = verb + object, at the level of a user goal.** Something a user would say they came to do. UI mechanics (zoom, switch tab, see a toast) and backend mechanics (load the plant, poll a task) are not use-cases; they are details of one.
4. **Industry term first.** Where geothermal or oil and gas engineering already has a standard name for the activity, use it, so engineers recognise it at once. The reason is given in the "Why" line.
5. **No vague words.** Avoid "Data", "Settings", "Overview", "Manager", "Monitoring" on their own: they say where something is, not what it does.
6. **No overlaps.** Two names must never fit the same use-case.
7. **Use-case verbs come from one fixed list**, so the same action always has the same word:
   - Managing things: Create, Open, Close, Save, Delete, Import, Export, Upload, Add, Edit, Remove, Discard, Keep (versions), Fill.
   - Describing the plant or well: Draw, Define, Link, Connect, Record, Assign.
   - Looking: Review, Read, Browse, Plot, Monitor, Compare.
   - Computing: Compute, Estimate, Analyse, Detect, Assess, Calibrate, Predict, Forecast, Generate.
   - Other: Sign in, Sign out, Change, Ask, Continue, Make, Plan, Acknowledge, Start, Index.

## Summary

8 user domains with 30 features and 76 use-cases, plus 1 technical domain (Platform) with 6 features and 6 use-cases.

| Domain | Folder | Features (folder) |
|---|---|---|
| Workspace | `workspace` | Projects (`projects`), Documents (`documents`), Documentation (`guide`) |
| Identity | `identity` | Authentication (`authn`), Profile (`me`), Users (`users`) |
| Assistant | `assistant` | Chat (`chat`), Runs (`runs`, backend only) |
| Plant Model | `plant` | Flowsheet (`flowsheet`), Equipment Parameters (`parameters`), Tag Mapping (`bindings`), Equipment Catalogue (`catalogue`) |
| Time Series | `timeseries` | Dashboard (`dashboard`), Trends (`trends`), Data Sources (`sources`), Data Availability (`availability`), Soft Sensors (`softsensors`) |
| Well Performance | `performance` | Nodal Analysis (`nodal`), Injectivity Analysis (`injectivity`), Pump Performance (`pump`) |
| Well Integrity | `integrity` | Integrity Status (`status`), Well Schematic (`schematic`), Well Barriers (`barriers`), Annulus Pressure (`annulus`), Maintenance Plan (`maintenance`), Well History (`history`), Casing Inspection (`inspection`), Corrosion Forecast (`corrosion`), Erosion Assessment (`erosion`) |
| Reporting | `reporting` | Operations Report (`operations`), Regulatory Report (`regulatory`) |
| Platform (technical) | `core`, `system` | Plant Loading, Background Jobs, Time-Series Storage, Startup, Error Handling and Logging, Page Serving |

**Folder names:** one word, lower case, no underscores, the same in the backend (`src/api/v1/<domain>/<feature>/`) and the frontend (`src/domains/<domain>/<feature>/`). The UI shows the full name; the folder keeps the word that carries the meaning:
- `plant`: the domain is the plant model; "model" alone would clash with database models.
- `timeseries`: one token, as in pandas and InfluxDB.
- `bindings`: the Python package already calls tag links `Bindings`.
- `nodal`, `pump`: inside `performance`, the domain already says "analysis" and "performance".
- `guide`: avoids `docs`, which every repo uses for its own developer docs.
- `softsensors`: no single word is clear enough; `sensors` alone would mean real sensors.

A new domain for the heating and cooling design work of the hackathon (Challenge 2) is not in this map, because it has no legacy features.

### Names changed after reading the backend

| Before | After | Reason |
|---|---|---|
| Measurements (domain) | Time Series | The backend stores three kinds of tags: measured, filtered and calculated. "Measurements" would be wrong for the last two. |
| (none) | Soft Sensors | The backend batch run computes calculated tags (ESP head and power, bottomhole pressure, injectivity index) from measurements. "Soft sensor" is the standard name for a value computed from a model instead of measured. |
| (none) | Platform (domain) | 17 backend features have no user goal (loading the plant, Celery jobs, connectors, logging). They need a home so they are not lost, but they are not a sidebar group. |
| Pump Performance | kept, plus "Predict pump failure" | The backend has a failure prediction, broken today because its model file is missing. |
| Access | kept, plus "Sign out" and "Review my profile" | Both exist only in the backend. |

## 1. Workspace

**Why:** the frame around all work: which project is open and the files that belong to it. Common name in tools such as Slack and Notion.

### 1.1 Projects

**Why:** a project is the unit the legacy app opens, imports and exports. In the backend each project is a folder with its own Git history.

| Use-case | Frontend | Backend |
|---|---|---|
| Create a project | F-G-04 | PRJ-02 |
| Open a project | F-G-01, F-G-02, F-G-03, F-G-05 | PRJ-01, PRJ-03 |
| Close a project | F-G-07 | PRJ-03 |
| Import a project from a zip file | F-G-06 | PRJ-06 |
| Export a project to a zip file | F-G-08 | PRJ-05 |
| Delete a project | F-G-09 | PRJ-04 |

### 1.2 Documents

**Why:** project files such as reports, permits and drawings. They feed the assistant, but they are owned by the project, so they live here.

| Use-case | Frontend | Backend |
|---|---|---|
| Upload a document | F-P16-03 | RPT-06 |
| Read a document | F-P16-01, F-P16-02 | RPT-06 |
| Make a document searchable by the assistant | F-P16-04 | RPT-06, CHT-02 |
| Delete a document | F-P16-05 | RPT-06 |

### 1.3 Documentation

**Why:** help on how to use the tool. Kept apart from Documents, which are the user's own files.

| Use-case | Frontend | Backend |
|---|---|---|
| Read the user guide | F-P17-01, F-P02-02 | NAV-02 |

## 2. Identity

**Why:** who the user is and what they may do. The standard term for this area (identity and access management), and already the name of the domain in the backend code.

### 2.1 Authentication

**Why:** proving who you are. Short form `authn` is the usual folder name, and the backend already uses it.

| Use-case | Frontend | Backend |
|---|---|---|
| Sign in | F-P01-01, F-P01-02, F-G-10 | AUTH-01, AUTH-06 |
| Sign out | F-G-10 | AUTH-02 |

### 2.2 Profile

**Why:** the signed-in user's own account. The backend folder is `me`, the usual name for "the current user" in REST APIs.

| Use-case | Frontend | Backend |
|---|---|---|
| Change my password | F-P02-01, F-P02-03 | AUTH-03 |
| Review my profile (broken, backend only) | | AUTH-08 |

### 2.3 Users

**Why:** managing other people's accounts, which only an admin may do.

| Use-case | Frontend | Backend |
|---|---|---|
| Create a user (admin) | F-P03-01, F-P03-02 | AUTH-04 |
| Assign projects and roles to users (admin) | F-P18-01, F-P18-02 | ADM-01, AUTH-07 |

## 3. Assistant

**Why:** its own domain, not a corner widget. Challenge 1 makes the AI agent the centre of the product, and it will grow beyond chat (design runs, agent log, token usage).

### 3.1 Chat

**Why:** the legacy assistant only answers questions from project documents (RAG). "Chat" says exactly that, and leaves "Agent" free for the new design agent.

| Use-case | Frontend | Backend |
|---|---|---|
| Ask a question about the project | F-G-11, F-G-12, F-G-15 | CHT-01, CHT-03 |
| Read an answer with its sources | F-G-13 | CHT-03 |
| Continue a conversation later | F-G-14 | |

## 4. Plant Model

**Why:** what the user describes here is the model of the plant (the digital twin), not the plant itself. Matches the `plant` module of the Python package.

### 4.1 Flowsheet

**Why:** the standard name in process simulators (Aspen, TESPy) for a diagram of equipment joined by streams. "Builder" names the tool, not the result.

| Use-case | Frontend | Backend |
|---|---|---|
| Draw the plant from the equipment palette | F-P05-01, F-P05-02, F-P05-07 to F-P05-23 | PLT-04 |
| Start from an example plant | F-P05-05 | PLT-03 |
| Save the plant model with a change note | F-P05-03 | PLT-01 |
| Discard unsaved changes | F-P05-04 | PLT-02 |
| Review the change history of the plant model | F-P05-06 | PRJ-07 |

The legacy palette (ESP, injection pump, booster pump, production well, injection well, reservoir, filter, heat exchanger, degasser, gas boiler, electric boiler, heat pump, heat demand, CHP, mixing node) should be replaced by the module library of the Python package. The backend only implements 10 of these unit types (PLT-12).

### 4.2 Equipment Parameters

**Why:** the design and operating values of each piece of equipment, versioned by date.

| Use-case | Frontend | Backend |
|---|---|---|
| Edit the parameters of a piece of equipment | F-P05-24, F-P05-35 | PLT-01, PLT-09 (broken) |
| Keep dated versions of parameters | F-P05-25, F-P05-37 | PLT-01 |
| Fill pump parameters from the catalogue | F-P05-27, F-P05-28 | |
| Upload a well trajectory | F-P05-29, F-P05-30, F-P05-33 | PLT-05 |
| Upload a well tally | F-P05-31, F-P05-32, F-P05-34 | PLT-06, WIM-14 |
| Review parameters as they were on a date | F-P13-01, F-P13-02, F-P13-04, F-P13-05 | PLT-08 |

The legacy app has two tally uploads. Only PLT-06 is used by calculations; WIM-14 stores files nothing reads. The new app needs one.

### 4.3 Tag Mapping

**Why:** "tag" is the standard name for a sensor signal in historians (AVEVA PI, Grafana). The task is linking model variables to tags. In the legacy app it was hidden in a tab, but it is a separate job, often done by someone else.

| Use-case | Frontend | Backend |
|---|---|---|
| Link equipment measurements to sensor tags | F-P05-36 | PLT-01 |
| Keep dated versions of the links | F-P05-26 | PLT-01 |
| Review the links as they were on a date | F-P13-03, F-P13-06 | PLT-08 |

### 4.4 Equipment Catalogue

**Why:** today it only holds ESP pumps, but heat pumps, heat exchangers and chillers will need the same thing. "Pump Database" would have to be renamed later.

| Use-case | Frontend | Backend |
|---|---|---|
| Browse catalogue equipment | F-P14-15 | |
| Add, edit or remove a catalogue entry | F-P14-16, F-P14-17 | PLT-11 |

## 5. Time Series

**Why:** everything stored over time: measured tags, plus filtered and calculated tags derived from them. Every engineer knows the term, and it matches the store (InfluxDB).

### 5.1 Dashboard

**Why:** live key values of the plant at a glance. Used here in its usual sense, a set of live panels.

| Use-case | Frontend | Backend |
|---|---|---|
| Monitor the plant at a glance | F-P04-01, F-P04-02 | PLT-10, MON-05 |

### 5.2 Trends

**Why:** the standard name in SCADA and historian tools for plotting tags over time. Operators look for this word.

| Use-case | Frontend | Backend |
|---|---|---|
| Plot tags over a time range | F-P14-01 to F-P14-09, F-P06-01 | MON-01, MON-02, MON-05 |

### 5.3 Data Sources

**Why:** everything about where measurements come from: a connected historian, or uploaded files.

| Use-case | Frontend | Backend |
|---|---|---|
| Connect a historian (AVEVA) | F-P15-02, F-P15-04 | PLT-07 |
| Define data intervals and the start time | F-P15-01, F-P15-03 | PLT-07 |
| Import measurements from a CSV file | F-P14-10, F-P14-11, F-P14-12 | MON-03 |

The dashboard and schematic service URLs in F-P15-01 become deployment configuration of the infrastructure repo. They are not a user task.

### 5.4 Data Availability

**Why:** says exactly what is shown, from when to when each tag has data. "Data Quality" would promise checks that do not exist.

| Use-case | Frontend | Backend |
|---|---|---|
| Review which tags have data and for which period | F-P14-13, F-P14-14 | MON-04 |

### 5.5 Soft Sensors

**Why:** the standard name for values computed by a model from measurements, such as bottomhole pressure from wellhead pressure. In the Python package this is the twin's replay mode.

| Use-case | Frontend | Backend |
|---|---|---|
| Compute calculated tags from the latest measurements (backend only) | | MON-06, MON-07, MON-08 |

The legacy run is a manual command with no scheduler. Whether it becomes a button, a schedule or both is open.

## 6. Well Performance

**Why:** the standard production engineering term for how much a well delivers or takes, including the pump in it (artificial lift). It pairs with Well Integrity: performance asks "how much?", integrity asks "is it safe?".

### 6.1 Nodal Analysis

**Why:** the standard name for intersecting the reservoir inflow curve (IPR) with the well outflow curve (VLP) to find the operating point. That is exactly this feature.

| Use-case | Frontend | Backend |
|---|---|---|
| Estimate the operating flow and pressure of a production well | F-P08-01 to F-P08-10 | PWL-01, PWL-02 |
| Compare what-if conditions, such as pump frequency | F-P08-02 to F-P08-05 | PWL-02 |

### 6.2 Injectivity Analysis

**Why:** the standard name for judging how easily a well takes water. The Hall plot and skin lines are its usual tools.

| Use-case | Frontend | Backend |
|---|---|---|
| Analyse the injectivity trend of an injection well | F-P09-01 to F-P09-11 | INJ-01, INJ-02 |
| Compare measured flow and pressure with skin lines | F-P09-12, F-P09-13 | INJ-03 |

### 6.3 Pump Performance

**Why:** compares the real pump with its manufacturer curve, tunes the model and predicts failure. "ESP Monitoring" would hide the calibration and the prediction.

| Use-case | Frontend | Backend |
|---|---|---|
| Compare pump operation with the manufacturer curve | F-P10-01 to F-P10-08, F-P10-13 | ESP-01, ESP-02 |
| Calibrate the pump model on measured data | F-P10-09, F-P10-10, F-P10-11, F-P10-12 | ESP-03, ESP-04 |
| Predict pump failure (broken, backend only) | | ESP-05 |

## 7. Well Integrity

**Why:** the standard term (ISO 16530) for keeping a well safe over its whole life.

### 7.1 Integrity Status

**Why:** the one place that answers "is this well safe right now?".

| Use-case | Frontend | Backend |
|---|---|---|
| Review the integrity status of a well | F-P12-01 to F-P12-04, F-P12-08, F-P12-41, F-P12-63 | WIM-01, WIM-02, WIM-03, WIM-05 |
| Save the integrity record of a well | F-P12-55, F-P12-56, F-P12-57 | WIM-26, WIM-27 |

### 7.2 Well Schematic

**Why:** the name every well engineer uses for the drawing of casings, cement and completion. "Well Construction" would be more abstract.

| Use-case | Frontend | Backend |
|---|---|---|
| Create a schematic from a template | F-P11-06, F-P11-11, F-P11-12 | |
| Open, save or delete a schematic | F-P11-01 to F-P11-05, F-P11-07, F-P11-08, F-P11-09, F-P11-13 | SCH-01, SCH-02 |
| Define casings and tubing | F-P11-15 to F-P11-23 | |
| Define fluids, cements, packers, plugs and screens | F-P11-24 to F-P11-28 | |
| Define the wellhead and Christmas tree | F-P11-29, F-P11-30 | |
| Generate the schematic drawing | F-P11-10, F-P11-14, F-P11-31, F-P11-32 | SCH-03 |

Schematic editing happens in the browser; the backend only stores the JSON and forwards it to the external drawing service.

### 7.3 Well Barriers

**Why:** "well barrier element" is the term of NORSOK D-010 and ISO 16530 that the legacy tables already use (WBE).

| Use-case | Frontend | Backend |
|---|---|---|
| Record primary and secondary barrier elements | F-P12-10, F-P12-52, F-P12-53 | WIM-26 |
| Assess the risk of a barrier element | F-P12-11, F-P12-51 | WIM-26 |
| Review barrier status on the schematic | F-P12-54 | WIM-04 |

### 7.4 Annulus Pressure

**Why:** annulus pressure management (API RP 90) is the actual job. The legacy "operational limits" are mostly the allowed annulus pressures.

| Use-case | Frontend | Backend |
|---|---|---|
| Define the allowed pressure limits | F-P12-05, F-P12-58 | WIM-27 |
| Monitor annulus pressures against their limits | F-P12-09, F-P12-45, F-P12-46, F-P12-47, F-P12-49, F-P12-50 | WIM-23, WIM-24, WIM-25 |
| Acknowledge a limit alarm | F-P12-48 | |

### 7.5 Maintenance Plan

**Why:** about the future: what must be done and when.

| Use-case | Frontend | Backend |
|---|---|---|
| Plan recurring maintenance | F-P12-07, F-P12-60 | WIM-27 |
| Review maintenance that is due or overdue | F-P12-61 | |

### 7.6 Well History

**Why:** about the past: what happened to the well, with its documents. Split from the maintenance plan because looking forward and looking back are different tasks.

| Use-case | Frontend | Backend |
|---|---|---|
| Record a well event with documents | F-P12-06, F-P12-59 | WIM-27, WIM-28 |

### 7.7 Casing Inspection

**Why:** the task is inspecting the casing. The multi-finger caliper log is only the tool used, so "Caliper Logs" named the tool instead of the task.

| Use-case | Frontend | Backend |
|---|---|---|
| Upload a caliper log | F-P12-16, F-P12-17, F-P12-25, F-P12-62 | WIM-06, WIM-07, WIM-08, SCH-04 (broken) |
| Detect and check casing joints | F-P12-18, F-P12-20 to F-P12-23, F-P12-64 | WIM-09, WIM-10 |
| Analyse wall loss per joint | F-P12-12 to F-P12-15, F-P12-19, F-P12-24, F-P12-42, F-P12-43, F-P12-44 | WIM-11, WIM-12, WIM-13 |

### 7.8 Corrosion Forecast

**Why:** the result the user wants is a date: when the wall becomes too thin.

| Use-case | Frontend | Backend |
|---|---|---|
| Calibrate a corrosion model on the inspection logs | F-P12-26 to F-P12-34 | WIM-15, WIM-16, WIM-17 |
| Forecast wall thickness and the years left | F-P12-35, F-P12-36, F-P12-37 | WIM-18, WIM-19, WIM-29 (stub) |

### 7.9 Erosion Assessment

**Why:** standard term for estimating wear from flow and particles (DNV RP O501, one of the models the backend offers).

| Use-case | Frontend | Backend |
|---|---|---|
| Estimate erosion of the pump and tubing | F-P12-38, F-P12-39, F-P12-40, F-P12-65 | WIM-21, WIM-22 |

## 8. Reporting

**Why:** documents produced for people outside the tool: management and the regulator.

### 8.1 Operations Report

**Why:** the periodic report on how the wells and pump ran.

| Use-case | Frontend | Backend |
|---|---|---|
| Generate an operations report for a period | F-P07-01 to F-P07-15 | RPT-01, RPT-02 |

### 8.2 Regulatory Report

**Why:** NLOG is one regulator (the Netherlands). The general name leaves room for other countries.

| Use-case | Frontend | Backend |
|---|---|---|
| Link report values to sensor tags | F-P07-19 to F-P07-27 | RPT-04 |
| Generate the regulatory report for a period | F-P07-16, F-P07-17, F-P07-18, F-P07-28, F-P07-29, F-P07-30 | RPT-03, RPT-05 |

## 9. Platform (technical)

**Why:** backend capabilities that every domain uses but no user asks for by name. Not a sidebar group. Its use-cases are written from the system's side.

### 9.1 Plant Loading

| Use-case | Backend |
|---|---|
| Load a project's plant model with its equipment and connections | PLT-12 |

The legacy app repeats this as a `load_plant` route on almost every page (CHT-01, ESP-01, PWL-01, INJ-01, SCH-01, WIM-01, RPT-01). Those IDs are mapped to their user use-cases above.

### 9.2 Background Jobs

| Use-case | Backend |
|---|---|
| Run a long calculation and report its progress | OPS-01, OPS-06, WIM-20 |

### 9.3 Time-Series Storage

| Use-case | Backend |
|---|---|
| Read and write tags in the internal store or an external historian | MON-09, OPS-07 |

### 9.4 Startup

| Use-case | Backend |
|---|---|
| Create the database tables and the first admin user | AUTH-05, OPS-02 |

### 9.5 Error Handling and Logging

| Use-case | Backend |
|---|---|
| Return clear errors and keep a log | OPS-03, OPS-04, OPS-05 |

### 9.6 Page Serving

| Use-case | Backend |
|---|---|
| Serve the application pages | NAV-01 |

Not needed in the new stack: the React frontend serves its own pages.

## 10. Changes from the legacy layout

| Legacy | New |
|---|---|
| Data Management (P14), 3 tabs | split into Trends, Data Sources and Equipment Catalogue |
| Parameters Overview (P13) | a use-case in Equipment Parameters and in Tag Mapping |
| Diagram Builder (P05) | Flowsheet, Equipment Parameters and Tag Mapping |
| Plant Configuration (P15) | Data Sources. The service URLs go to deployment configuration |
| Well Integrity Monitoring (P12), 65 features | 8 features under Well Integrity |
| Report Generator (P07) | Operations Report and Regulatory Report |
| Report (P16) | Documents under Workspace |
| Chat widget | its own Assistant domain |
| Batch calculation command | Soft Sensors under Time Series |
