"""Restore only tutorial-owned rows, reordered originals and singleton content.

Original site content remains outside repositories and video archives.
"""
import asyncio,json,runpy,sys
from datetime import datetime
from pathlib import Path
from sqlalchemy import select,update,delete
runpy.run_path(str(Path(__file__).resolve().parents[1]/'catalog-production/dev-api.py'))
from app.core.database import AsyncSessionFactory,engine
from app.models.content import Banner,Testimonial,Faq,Announcement,NavLink
from app.models.site_theme import SiteTheme
MODELS={'banners':Banner,'testimonials':Testimonial,'faqs':Faq,'announcements':Announcement,'navigation':NavLink,'theme':SiteTheme}
folder=Path.home()/'.config/urgentprinters-tutorials';folder.mkdir(parents=True,exist_ok=True)
backup=folder/'content-originals.json'
async def main():
    command=sys.argv[1]
    async with AsyncSessionFactory() as db:
        if command=='snapshot':
            if backup.exists() and not json.loads(backup.read_text()).get('restored',False):
                print('Existing unfinished snapshot retained.');return
            data={'restored':False,'tables':{}}
            for kind,model in MODELS.items():
                rows=(await db.execute(select(model).order_by(model.id))).scalars().all()
                data['tables'][kind]=[r.model_dump(mode='json') for r in rows]
            backup.write_text(json.dumps(data,indent=2)+'\n');backup.chmod(0o600);print('Original content backed up outside repositories.');return
        data=json.loads(backup.read_text());kind=sys.argv[2];model=MODELS[kind]
        state_path=folder/f'content-{kind}-session.json';state=json.loads(state_path.read_text()) if state_path.exists() else {}
        for row_id in state.get('created_ids',[]):
            assert row_id not in [r['id'] for r in data['tables'][kind]]
            await db.execute(delete(model).where(model.id==row_id))
        for original in data['tables'][kind]:
            current=await db.get(model,original['id']);assert current is not None,'Original record unexpectedly removed'
            values=model.model_validate(original).model_dump()
            if kind in ['announcements','theme']:
                expected=state.get('last_saved_updated_at')
                if expected and current.updated_at!=datetime.fromisoformat(expected.replace('Z','+00:00')):
                    raise RuntimeError('Singleton changed outside this recording; automatic restore stopped')
                await db.execute(update(model).where(model.id==original['id']).values(**values))
            elif 'sort_order' in values:
                await db.execute(update(model).where(model.id==original['id']).values(sort_order=values['sort_order'],updated_at=values['updated_at']))
        await db.commit()
        state['restored']=True;state_path.write_text(json.dumps(state,indent=2)+'\n');state_path.chmod(0o600)
        data['restored_kinds']=list(set(data.get('restored_kinds',[])+[kind]));data['restored']=set(data['restored_kinds'])==set(MODELS)
        backup.write_text(json.dumps(data,indent=2)+'\n')
        if kind=='theme' and data['tables'][kind]:
            from app.providers.frontend_revalidation.factory import get_frontend_revalidation_provider
            await get_frontend_revalidation_provider().revalidate_theme(data['tables'][kind][0]['preset_id'])
        print(f'{kind}: original content restored; owned tutorial rows removed.')
    await engine.dispose()
asyncio.run(main())
