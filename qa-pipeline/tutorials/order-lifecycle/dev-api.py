"""Isolated actual API, plus a loopback bridge for FakeStorage presigned PUTs."""
import runpy
from pathlib import Path
from fastapi import Request, HTTPException
from fastapi.responses import Response
namespace = runpy.run_path(str(Path(__file__).resolve().parents[1] / 'catalog-production/dev-api.py'))
app = namespace['app']
from app.providers.storage.factory import get_storage_provider
from app.providers.storage.fake import FakeStorageProvider
class LocalTutorialStorage(FakeStorageProvider):
    async def presign_upload(self, key: str, content_type: str, expires_in: int = 900) -> str:
        return f'http://localhost:8020/__tutorial/storage/{key}'
local_storage = LocalTutorialStorage()
app.dependency_overrides[get_storage_provider] = lambda: local_storage

@app.api_route('/__tutorial/storage/{key:path}', methods=['PUT', 'OPTIONS'])
async def storage_bridge(key: str, request: Request):
    target = (Path('/tmp/fake_uploads') / key).resolve()
    if not target.is_relative_to('/tmp/fake_uploads') or not key.startswith(('artwork/', 'artworks/', 'proofs/')):
        raise HTTPException(400, 'Invalid tutorial storage key')
    headers = {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'PUT, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type'}
    if request.method == 'OPTIONS':
        return Response(status_code=204, headers=headers)
    body = await request.body()
    content_type = request.headers.get('content-type', 'application/octet-stream')
    if content_type == 'image/png' and not body.startswith(b'\x89PNG\r\n\x1a\n'):
        raise HTTPException(400, 'Invalid PNG upload bytes')
    await local_storage.upload_file(key, body, content_type)
    return Response(status_code=200, headers=headers)

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='127.0.0.1', port=8020, log_level='warning')
