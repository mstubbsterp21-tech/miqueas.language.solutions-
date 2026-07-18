alter table public.portal_layout_preferences
  add column if not exists widget_order text[] not null default '{}',
  add column if not exists enabled_widgets text[] not null default '{}',
  add column if not exists tab_card_preferences jsonb not null default '{}'::jsonb;

comment on column public.portal_layout_preferences.widget_order is
  'Per-user order for optional dashboard widgets.';
comment on column public.portal_layout_preferences.enabled_widgets is
  'Optional dashboard widgets enabled by this user.';
comment on column public.portal_layout_preferences.tab_card_preferences is
  'Validated per-navigation-tab card density and shape preferences.';
