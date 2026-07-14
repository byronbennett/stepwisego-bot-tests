# AI provider setup

The AI tests make a handful of small model calls per run (text prompts,
structured extraction, and small image/audio generations) — expect pennies
of usage, not dollars.

Both variables hold a small JSON payload as text.

## OpenAI — `sgtAiOpenAi`

1. Create an API key at platform.openai.com.
2. Set `sgtAiOpenAi` to:

   ```json
   {"provider":"openai","apiKey":"sk-...","defaultModel":"gpt-4o-mini"}
   ```

   Any current small model works as `defaultModel`.
3. Run `tier1-features/ai/text-prompt-mechanics` to prove the wiring.

## Ollama (optional, local models) — `sgtAiOllama`

Only needed for the local-model legs. With Ollama running locally and a
model pulled:

```json
{"provider":"ollama","apiKey":"ollama","baseUrl":"http://localhost:11434/v1","defaultModel":"llama3.2"}
```

Leave `sgtAiOllama` empty to skip those legs.
