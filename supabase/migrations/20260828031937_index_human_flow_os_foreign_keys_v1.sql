create index if not exists learning_states_node_idx on public.learning_states(node_id);
create index if not exists capability_evidence_source_event_idx on public.capability_evidence(source_event_id) where source_event_id is not null;
create index if not exists encounter_feedback_person_idx on public.encounter_feedback(person_id, occurred_at desc);
create index if not exists education_exchange_source_event_idx on public.education_exchange_edges(source_event_id) where source_event_id is not null;
