# Human Flow OS Foundation v1

Production Supabase project: `sunlovesflow-core` (`qydbtholbwbuwiswmqsr`)

## Applied in production

- `20260828031510_add_human_flow_os_foundation_v1`
- `20260828031729_add_human_flow_snapshot_and_line_optimizer_v1`

## What is now available

### Stable person identity
- `person_serials`
- automatic serial assignment for every new `contacts` row
- existing contacts backfilled
- example format: `SLF-000001`

### Learning State
- `learning_states`
- per person × curriculum node
- states: `unseen / touched / understanding / practicing / embodied / reproducible / teachable`
- evidence count, blocker, practice/review timestamps, source type

### Capability Graph
- `capabilities`
- `person_capabilities`
- `capability_evidence`
- categories: knowledge / skill / experience / resource / trait / role_potential
- states: has / wants_to_grow / can_help / can_teach / can_build
- fact / self-report / AI hypothesis / system inference / human review / third-party evidence remain distinct

### Encounter Engine storage
- `encounter_recommendations`
- `encounter_feedback`
- match types: mentor / peer / collaborator / student / connector / unexpected
- recommendations are explainable and intended to remain human-approved before actual introductions

### Education Exchange Graph
- `education_exchange_edges`
- learned_from / taught / coached_by / inspired_by / introduced_by / collaborated_with / supported_by / created_with

### LINE Cost Optimizer foundation
Existing `line_message_log` now has:
- `delivery_mode`
- `message_object_count`
- `billing_units`
- `request_group_id`
- `delivery_reason`
- `cost_policy_decision`
- `cost_metadata`

Also added:
- `line_cost_settings`
- `line_monthly_usage` view
- `recommend_line_delivery(...)` server-only RPC

Decision examples:
- user initiated → Reply, 0 billing units, pack up to 5 message objects
- proactive + >5 objects + Web/LIFF available → one Push CTA, move depth to Web/LIFF
- no proactive need → no billable Push

### My Map / Steward View aggregate
Server-only RPC:
- `get_human_flow_snapshot(person_id)`

Returns one aggregate containing:
- serial
- lifecycle stage
- progress
- curriculum state
- education input/output profile
- learning states
- capabilities
- next experiences
- encounter recommendations

RPC is restricted to `service_role`; it is not exposed to anon/authenticated clients.

## Important safety boundary

This foundation does **not** change live LINE outbound behavior.

No production Edge Function was modified in these migrations. The existing webhook/dispatcher continues to behave as before.

Do not turn on budget hard-stops until the current LINE plan and included message quota have been explicitly configured in `line_cost_settings`.

## Next implementation step

1. Wire `recommend_line_delivery(...)` into the outbound LINE dispatcher before each proactive send.
2. Log actual delivery mode, object count, billing units and policy decision into `line_message_log`.
3. Populate `learning_states` from Quest/education completion evidence.
4. Populate capability evidence from explicit user input and verified action evidence.
5. Add human-reviewed Encounter candidate generation after at least two real people have usable capability/learning profiles.
6. Render `get_human_flow_snapshot(...)` into My Map and Steward View UI.

Do not fabricate capabilities or encounter matches just to populate the UI.
