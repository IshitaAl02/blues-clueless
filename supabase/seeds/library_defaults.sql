-- Seed shared library defaults (visible in the "Shared" tab to all signed-in users).
-- Run AFTER 20260511_library.sql. Idempotent: clears existing shared seed by section name first.
-- Data mirrors ishita-dev-library.html.

begin;

-- Wipe any prior shared sections with these names so re-running is safe.
delete from public.library_sections
  where owner_id is null
    and name in ('Endpoints','Form Keys','Reports','Other Sites','Guides');

with
sec_endpoints as (
  insert into public.library_sections (owner_id, name, position)
  values (null, 'Endpoints', 0) returning id
),
sec_formkeys as (
  insert into public.library_sections (owner_id, name, position)
  values (null, 'Form Keys', 1) returning id
),
sec_reports as (
  insert into public.library_sections (owner_id, name, position)
  values (null, 'Reports', 2) returning id
),
sec_sites as (
  insert into public.library_sections (owner_id, name, position)
  values (null, 'Other Sites', 3) returning id
),
sec_guides as (
  insert into public.library_sections (owner_id, name, position)
  values (null, 'Guides', 4) returning id
)
insert into public.library_cards
  (section_id, owner_id, kind, data, bg_color, text_color, position)
select id, null, kind, data, bg_color, text_color, position from (
  -- ENDPOINTS
  select (select id from sec_endpoints) as id, 'endpoint'::text as kind,
    jsonb_build_object('name','Offboarding Service','key','offboardingServiceUrl','url','https://nkkmf9pybk.ap-south-1.awsapprunner.com','swagger_url','https://nkkmf9pybk.ap-south-1.awsapprunner.com/docs') as data,
    '#c47a3e' as bg_color, '#ffffff' as text_color, 0 as position
  union all select (select id from sec_endpoints), 'endpoint',
    jsonb_build_object('name','Employee Assessment','key','employeeAssessmentUrl','url','https://gpyx78qfvz.ap-south-1.awsapprunner.com','swagger_url','https://gpyx78qfvz.ap-south-1.awsapprunner.com/docs'),
    '#5a8a73','#ffffff', 1
  union all select (select id from sec_endpoints), 'endpoint',
    jsonb_build_object('name','Benefits & Compensation','key','benefitsAndCompensationUrl','url','https://phs6nmpi2h.ap-south-1.awsapprunner.com','swagger_url','https://phs6nmpi2h.ap-south-1.awsapprunner.com/docs'),
    '#d4a574','#093c5d', 2
  union all select (select id from sec_endpoints), 'endpoint',
    jsonb_build_object('name','Employee Master','key','employee_master','url','https://ugcngqhnjx.ap-south-1.awsapprunner.com','swagger_url','https://ugcngqhnjx.ap-south-1.awsapprunner.com/docs'),
    '#2f5238','#ffffff', 3
  union all select (select id from sec_endpoints), 'endpoint',
    jsonb_build_object('name','DQS','key','dqsBaseUrl','url','http://dqs-staging.alucor.ai','swagger_url','http://dqs-staging.alucor.ai/docs'),
    '#4a6a8a','#ffffff', 4
  union all select (select id from sec_endpoints), 'endpoint',
    jsonb_build_object('name','EIDOS API','key','eidosApiBaseUrl','url','https://u9xbitpecd.ap-south-1.awsapprunner.com','swagger_url','https://u9xbitpecd.ap-south-1.awsapprunner.com/docs'),
    '#8a6342','#ffffff', 5
  union all select (select id from sec_endpoints), 'endpoint',
    jsonb_build_object('name','Core Entities','key','coreEntitiesUrl','url','https://gdmbdfydcp.ap-south-1.awsapprunner.com','swagger_url','https://gdmbdfydcp.ap-south-1.awsapprunner.com/docs'),
    '#6d8a5f','#ffffff', 6
  union all select (select id from sec_endpoints), 'endpoint',
    jsonb_build_object('name','Person Identifier','key','person_identifier','url','https://bx6ptccijv.ap-south-1.awsapprunner.com','swagger_url','https://bx6ptccijv.ap-south-1.awsapprunner.com/docs'),
    '#a87543','#ffffff', 7
  union all select (select id from sec_endpoints), 'endpoint',
    jsonb_build_object('name','Reporting Service','key','reportingServiceUrl','url','https://dqs-staging.alucor.ai:8000','swagger_url','https://dqs-staging.alucor.ai:8000/docs'),
    '#3d5a45','#ffffff', 8

  -- FORM KEYS
  union all select (select id from sec_formkeys), 'form_key',
    jsonb_build_object('service','Benefits & Comp','form','Create Benefit Type','urn','urn:form:default:1771749432:5wyac5un','key','CREATE_BENEFIT_TYPE'),
    '#ede5d6','#1a3320', 0
  union all select (select id from sec_formkeys), 'form_key',
    jsonb_build_object('service','Benefits & Comp','form','Edit Benefit Type','urn','urn:form:default:1774949158:trpis2vw','key','EDIT_BENEFIT_TYPE'),
    '#ede5d6','#1a3320', 1
  union all select (select id from sec_formkeys), 'form_key',
    jsonb_build_object('service','Benefits & Comp','form','Create Benefit Enrollment','urn','urn:form:default:1773392338:k411qo26','key','CREATE_BENEFIT_ENROLLMENT'),
    '#ede5d6','#1a3320', 2
  union all select (select id from sec_formkeys), 'form_key',
    jsonb_build_object('service','Benefits & Comp','form','Edit Benefit Enrollment','urn','urn:form:default:1775050829:bs5bi5sk','key','EDIT_BENEFIT_ENROLLMENT'),
    '#ede5d6','#1a3320', 3
  union all select (select id from sec_formkeys), 'form_key',
    jsonb_build_object('service','Benefits & Comp','form','Create Compensation Component','urn','urn:form:default:1773573789:7x01d3j0','key','CREATE_COMPENSATION_COMPONENT'),
    '#ede5d6','#1a3320', 4
  union all select (select id from sec_formkeys), 'form_key',
    jsonb_build_object('service','Benefits & Comp','form','Edit Compensation Component','urn','urn:form:default:1774928931:4rwk2gky','key','EDIT_COMPENSATION_COMPONENT'),
    '#ede5d6','#1a3320', 5
  union all select (select id from sec_formkeys), 'form_key',
    jsonb_build_object('service','Benefits & Comp','form','Assign Employee Compensation','urn','urn:form:default:1773578117:6dy9kvv2','key','ASSIGN_EMPLOYEE_COMPENSATION'),
    '#ede5d6','#1a3320', 6
  union all select (select id from sec_formkeys), 'form_key',
    jsonb_build_object('service','Benefits & Comp','form','Edit Employee Compensation','urn','urn:form:default:1774945207:a84mssnh','key','EDIT_EMPLOYEE_COMPENSATION'),
    '#ede5d6','#1a3320', 7
  union all select (select id from sec_formkeys), 'form_key',
    jsonb_build_object('service','Offboarding','form','Request Offboarding','urn','urn:form:default:1776925494:1jhjs1n1','key','REQUEST_OFFBOARDING'),
    '#ede5d6','#1a3320', 8

  -- REPORTS
  union all select (select id from sec_reports), 'report',
    jsonb_build_object('service','Benefits & Comp','module','benefits-comp','report_id','all-benefit-types-v1','db_views', jsonb_build_array('benefit_type_complete')),
    '#ede5d6','#1a3320', 0
  union all select (select id from sec_reports), 'report',
    jsonb_build_object('service','Benefits & Comp','module','benefits-comp','report_id','all-enrollments-v1','db_views', jsonb_build_array('benefit_enrollment_complete')),
    '#ede5d6','#1a3320', 1
  union all select (select id from sec_reports), 'report',
    jsonb_build_object('service','Offboarding','module','offboarding','report_id','all-offboarding-v1','db_views', jsonb_build_array('offboarding_request_complete')),
    '#ede5d6','#1a3320', 2

  -- OTHER SITES
  union all select (select id from sec_sites), 'link',
    jsonb_build_object('title','Jira','description','Project Board','url','https://alucor.atlassian.net/jira/core/projects/CAPELLA/board','tags', jsonb_build_array('jira','board')),
    '#dbeafe','#093c5d', 0
  union all select (select id from sec_sites), 'link',
    jsonb_build_object('title','AWS Console','description','Cloud · 517134635345','url','https://517134635345.signin.aws.amazon.com/console','tags', jsonb_build_array('aws','cloud')),
    '#fef3c7','#1a3320', 1
  union all select (select id from sec_sites), 'link',
    jsonb_build_object('title','Confluence','description','Wiki','url','https://alucor.atlassian.net/wiki/home','tags', jsonb_build_array('docs','wiki')),
    '#dbeafe','#093c5d', 2

  -- GUIDES
  union all select (select id from sec_guides), 'guide',
    jsonb_build_object('title','CRUD Events — DW Sync Guide','body_md',
'# CRUD Event & DW Sync

Every time your service **creates, updates, or deletes** a DB record, a copy is sent to the Data Warehouse (DQS) via the `@publish_crud_event` decorator.

## How it works
Your DB is a whiteboard. Every change → snapshot sent to Kafka → DW consumes and updates.

## Event types
- **CREATE** — full record after creation
- **UPDATE** — full record after change
- **DELETE** — record before deletion

**Golden rule:** CREATE once, UPDATE for everything else.

```python
from app.core.crud_event_decorator import publish_crud_event

@publish_crud_event(
    service_name="leave-management",
    entity_name="leave_request",
    event_type="CREATE",
)
async def create_leave_request(self, data: dict):
    ...
```

## Common mistakes
- Don''t use CREATE on update methods
- Set correct `entity_name` — becomes the DQS topic key
- Event failures only log — your method still runs'),
    '#ede5d6','#1a3320', 0
  union all select (select id from sec_guides), 'guide',
    jsonb_build_object('title','RBAC & ABAC — Permissions Guide','body_md',
'# Capella RBAC & ABAC

Keycloak for auth, custom RBAC/ABAC for authorization. Permissions from JWT tokens.

## Permission format
```
{action}:{resource}
create:visa-application
list:visa-applications   // plural = collections
```

## Action types
- **Singular:** create, view, update, delete, approve, reject
- **Plural/Bulk:** list, export, manage

## Report permissions (3-tier)
```
{action}:{module}:{report-id}
view:visa-application:comprehensive-all-applications
access:visa-application:reports
```

## Registry location
`src/app/@core/constants/permissions.ts`

## Guards & directives
- **Route guards** — protect entire routes
- **Template directives** — show/hide UI elements
- **Service-level checks** — programmatic in code'),
    '#ede5d6','#1a3320', 1
  union all select (select id from sec_guides), 'guide',
    jsonb_build_object('title','Eidos Forms — Capella Integration','body_md',
'# Eidos on Capella

Config-driven form system. Forms defined in JSON configs in EIDOS backend, rendered via the `eidos-library` npm package.

## Architecture
```
Form Service (backend) ──HTTP──► Capella App
                                       │
                         EidosFormWrapperComponent
                        /                         \
             EidosFormService           EidosFormHandlerRegistry
```

## Adding a new form
1. Add form URN constant
2. Create form handler (implements `IEidosFormHandler`)
3. Register in registry
4. Set up navigation
5. Test with actual URN

## Form URN format
```
urn:form:default:{form-id}:{hash}
urn:form:default:1774557517:vyu4uyw5
```

## GitLab repo
`https://gitlab.alucor.ai/capella_frontend/eidos`'),
    '#ede5d6','#1a3320', 2
  union all select (select id from sec_guides), 'guide',
    jsonb_build_object('title','Pulsar ADK — AI Microservice Gen','body_md',
'# Pulsar ADK

Takes a markdown plan → generates a complete FastAPI microservice. You provide the plan + run one command.

## Prerequisites
- Python 3.11+, Docker running
- `.md` plan file from manager
- OpenRouter API key

## Phase 1 — MCP Docs Server (once per machine)
```
git clone -b staging https://gitlab.alucor.ai/alialwahayb/grounded-docs-mcp.git
cd grounded-docs-mcp
# Windows: run.bat  |  Linux/Mac: ./run.sh
# Verify: open http://localhost:6280
```

## Phase 2 — Install Pulsar
```
pip install git+https://...   # get URL from manager
pulsar --version
```

## Phase 3 — Set API key
```
export OPENROUTER_API_KEY=your_key_here
```

## Phase 4 — Generate
```
pulsar generate --plan your_plan.md
```

## Troubleshooting
- **"pulsar not found"** → check PATH / venv
- **"Invalid API key"** → re-check env var
- **MCP not running** → start `run.bat` / `./run.sh`
- **Docker not running** → start Docker Desktop'),
    '#ede5d6','#1a3320', 3
  union all select (select id from sec_guides), 'guide',
    jsonb_build_object('title','Report Config — DQS Guide v2.5','body_md',
'# Report Config Guide v2.5

How to create working report configs for DQS + AG Grid frontend.

## What''s new in v2.5
- **filter_group** — recursive AND/OR filter tree in POST body
- **defaultFilterGroup** — auto-applied when no `filter_group` in request
- **or_filters** — flat AG-Grid groups ORed together

## Required fields
- `report_id`, `name`, `description`
- `data_query_view` — the DB view name
- `color`

## Filter chain order
```
1. defaultFilterModel (from config)
2. filterModel        (from request)
3. or_filters         (from request)
4. filter_group       (from request) ← last
```

## Default sort
```json
"defaultSortModel": [
  { "colId": "status",    "sort": "asc"  },
  { "colId": "createdAt", "sort": "desc" }
]
```

## Rules
- Phone: extract `dialing_code` + `phone_number` separately
- Doc URLs: `temp_storage_url` for `document_data`
- Always check the DQS response first — solves most errors'),
    '#ede5d6','#1a3320', 4
) as rows;

commit;
