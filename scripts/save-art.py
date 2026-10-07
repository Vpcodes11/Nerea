from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
source = Path(r'C:/Users/Trade/.codex/generated_images/01a114d0-63ef-7851-913c-22179a9dcf24')
files = {
    'night': 'exec-46860467-0332-4ee9-95f9-2d0cf6a9364a.png',
    'pink': 'exec-48614db9-4953-4346-884c-c4f82bcecfda.png',
    'violet': 'exec-7f599786-f37f-4e3f-b6ed-a5ae1a61a61a.png',
    'pink-mobile': 'exec-2bb2425b-fb06-4335-99e3-d0200cd10378.png',
}
out = root / 'public' / 'scenery'
out.mkdir(exist_ok=True)
for name, file in files.items():
    img = Image.open(source / file).convert('RGB')
    img.save(out / f'{name}.webp', quality=88, method=6)
