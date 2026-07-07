select email, is_active
from staff_access_grants
order by created_at desc;

select action, entity_type, created_at
from audit_logs
where action like 'staff_access_grant.%'
order by created_at desc;