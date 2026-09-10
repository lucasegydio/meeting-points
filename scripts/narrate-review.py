"""Generate the explicitly synthetic narration test from the separate adapted script."""
import asyncio
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[2] / '.motion-analysis' / 'voice-deps'))
import edge_tts

root = Path(__file__).resolve().parents[1]
async def main():
    text = (root / 'dist/audio/hopecore-narration.txt').read_text(encoding='utf-8')
    voice = edge_tts.Communicate(text, 'pt-BR-AntonioNeural', rate='-2%')
    await voice.save(str(root / 'dist/audio/hopecore-review.mp3'))
    print('Narration generated: pt-BR-AntonioNeural, explicitly synthetic.')
asyncio.run(main())
