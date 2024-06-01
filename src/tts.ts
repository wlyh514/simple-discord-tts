import { AudioResource, StreamType, createAudioResource } from '@discordjs/voice';
import { Readable } from 'node:stream';

export async function textToSpeech(text: string): Promise<AudioResource | null> {
  const resp = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'tts-1',
      input: text,
      voice: 'echo',
      response_format: 'opus',
      speed: 1,
    })
  });

  if (!resp.body) return null;

  return createAudioResource(
    Readable.from(resp.body, { objectMode: false }),
    { inputType: StreamType.Arbitrary }
  );
}