import {describe,it,expect,vi} from 'vitest';
import {render,screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {ActivityLogTable} from './ActivityLogTable';
const setActor=vi.hoisted(()=>vi.fn());
vi.mock('@/store/authStore',()=>({useAuthStore:()=>({id:'1',name:'Signed-in administrator',role:'super_admin'})}));
vi.mock('../hooks/useStaff',()=>({
 useStaff:()=>({query:{data:{items:[{id:'500',name:'Recently added staff',role:'customer_support'}]}}}),
 useActivityLog:()=>({query:{data:{items:[{id:'log1',actor_admin_id:'1',actor_customer_id:null,action:'staff.updated',resource_type:'admin_user',resource_id:'500',meta:{},ip_address:null,created_at:'2026-11-26T00:00:00Z'}]},isLoading:false},filters:{actor_admin_id:'',resource_type:'',action:'',page:1,pageSize:50},setPage:vi.fn(),setActorAdminId:setActor,setResourceType:vi.fn(),setAction:vi.fn()})
}));
describe('Activity Log administrator outside the loaded staff page',()=>{
 it('names their activity and allows filtering by the signed-in administrator',async()=>{
  render(<ActivityLogTable/>);
  expect(screen.getByText('Signed-in administrator')).toBeInTheDocument();
  const user=userEvent.setup();await user.click(screen.getAllByRole('combobox')[0]);
  await user.click(await screen.findByRole('option',{name:'Signed-in administrator'}));
  expect(setActor).toHaveBeenCalledWith('1');
 });
});
