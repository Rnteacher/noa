select p.email, pr.role
from profiles p
left join profile_roles pr on pr.profile_id = p.id
order by p.created_at desc;