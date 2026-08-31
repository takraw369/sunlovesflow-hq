create or replace function public.get_human_flow_snapshot(p_person_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'person_id', c.id,
    'serial_code', ps.serial_code,
    'display_name', c.display_name,
    'lifecycle_stage', c.lifecycle_stage,
    'tags', c.tags,
    'progress', case when pp.contact_id is null then null else to_jsonb(pp) - 'contact_id' end,
    'curriculum', case when cs.person_id is null then null else to_jsonb(cs) - 'person_id' end,
    'education_input', case when eip.person_id is null then null else to_jsonb(eip) - 'person_id' end,
    'education_output', case when eop.person_id is null then null else to_jsonb(eop) - 'person_id' end,
    'learning_states', coalesce((
      select jsonb_agg(jsonb_build_object(
        'node_id', ls.node_id,
        'external_node_id', cn.external_node_id,
        'node_title', cn.node_title,
        'spine_stage', cn.spine_stage,
        'branch', cn.branch,
        'loop_step', cn.loop_step,
        'learning_status', ls.learning_status,
        'confidence', ls.confidence,
        'evidence_count', ls.evidence_count,
        'current_blocker', ls.current_blocker,
        'last_practiced_at', ls.last_practiced_at,
        'next_review_at', ls.next_review_at,
        'source_type', ls.source_type
      ) order by ls.updated_at desc)
      from public.learning_states ls
      join public.curriculum_nodes cn on cn.id = ls.node_id
      where ls.person_id = c.id
    ), '[]'::jsonb),
    'capabilities', coalesce((
      select jsonb_agg(jsonb_build_object(
        'capability_id', cap.id,
        'capability_key', cap.capability_key,
        'name', cap.name,
        'category', cap.category,
        'state', pc.capability_state,
        'evidence_level', pc.evidence_level,
        'confidence', pc.confidence,
        'source_type', pc.source_type,
        'verified_at', pc.verified_at
      ) order by cap.category, cap.name, pc.capability_state)
      from public.person_capabilities pc
      join public.capabilities cap on cap.id = pc.capability_id
      where pc.person_id = c.id
    ), '[]'::jsonb),
    'next_experiences', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', er.id,
        'type', er.recommendation_type,
        'ref', er.recommendation_ref,
        'destination', er.destination,
        'reason', er.reason,
        'confidence', er.confidence,
        'status', er.status,
        'generated_at', er.generated_at
      ) order by er.generated_at desc)
      from (
        select * from public.education_recommendations
        where person_id = c.id and status in ('proposed','shown','accepted')
        order by generated_at desc
        limit 5
      ) er
    ), '[]'::jsonb),
    'encounters', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', r.id,
        'candidate_person_id', r.candidate_person_id,
        'match_type', r.match_type,
        'reason', r.reason,
        'confidence', r.confidence,
        'status', r.status,
        'generated_at', r.generated_at
      ) order by r.generated_at desc)
      from (
        select * from public.encounter_recommendations
        where person_id = c.id and status in ('proposed','shown','accepted')
        order by generated_at desc
        limit 3
      ) r
    ), '[]'::jsonb)
  )
  from public.contacts c
  left join public.person_serials ps on ps.person_id = c.id
  left join public.person_progress pp on pp.contact_id = c.id
  left join public.curriculum_states cs on cs.person_id = c.id
  left join public.education_input_profiles eip on eip.person_id = c.id
  left join public.education_output_profiles eop on eop.person_id = c.id
  where c.id = p_person_id;
$$;

revoke all on function public.get_human_flow_snapshot(uuid) from public;
revoke all on function public.get_human_flow_snapshot(uuid) from anon;
revoke all on function public.get_human_flow_snapshot(uuid) from authenticated;
grant execute on function public.get_human_flow_snapshot(uuid) to service_role;

create or replace function public.recommend_line_delivery(
  p_user_initiated boolean,
  p_requires_proactive boolean,
  p_message_object_count integer,
  p_has_web_destination boolean default false
)
returns jsonb
language plpgsql
immutable
security invoker
set search_path = public, pg_temp
as $$
declare
  v_count integer := greatest(coalesce(p_message_object_count, 1), 1);
  v_pack integer := least(v_count, 5);
begin
  if p_user_initiated then
    return jsonb_build_object(
      'action', 'reply',
      'delivery_mode', 'reply',
      'billing_units_per_recipient', 0,
      'pack_message_objects', v_pack,
      'overflow_to_web', (v_count > 5 and p_has_web_destination),
      'reason', 'User initiated the interaction; prefer Reply and pack up to 5 message objects.'
    );
  end if;

  if not p_requires_proactive then
    return jsonb_build_object(
      'action', case when p_has_web_destination then 'wait_for_pull' else 'no_send' end,
      'delivery_mode', case when p_has_web_destination then 'web' else 'system' end,
      'billing_units_per_recipient', 0,
      'pack_message_objects', 0,
      'overflow_to_web', false,
      'reason', 'No proactive notification is required; avoid a billable LINE push.'
    );
  end if;

  if v_count > 5 and p_has_web_destination then
    return jsonb_build_object(
      'action', 'push_web_cta',
      'delivery_mode', 'push',
      'billing_units_per_recipient', 1,
      'pack_message_objects', 1,
      'overflow_to_web', true,
      'reason', 'Content exceeds one 5-object bundle; send one proactive CTA and move depth to Web/LIFF.'
    );
  end if;

  return jsonb_build_object(
    'action', 'push_packed',
    'delivery_mode', 'push',
    'billing_units_per_recipient', 1,
    'pack_message_objects', v_pack,
    'overflow_to_web', false,
    'reason', 'Proactive delivery is required; pack up to 5 message objects into one request.'
  );
end;
$$;

revoke all on function public.recommend_line_delivery(boolean, boolean, integer, boolean) from public;
revoke all on function public.recommend_line_delivery(boolean, boolean, integer, boolean) from anon;
revoke all on function public.recommend_line_delivery(boolean, boolean, integer, boolean) from authenticated;
grant execute on function public.recommend_line_delivery(boolean, boolean, integer, boolean) to service_role;

comment on function public.get_human_flow_snapshot(uuid) is 'Server-side My Map / Steward View aggregate for one canonical person.';
comment on function public.recommend_line_delivery(boolean, boolean, integer, boolean) is 'Pure LINE Cost Optimizer decision helper. It never sends a message.';
