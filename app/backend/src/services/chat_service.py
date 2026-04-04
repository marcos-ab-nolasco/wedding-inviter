import json
import logging

import openai
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from src.core.config import get_settings
from src.schemas.guest import ChatMessage, ChatResponse, GuestRead

logger = logging.getLogger(__name__)

_SYSTEM_PROMPT = """\
Você é um redator especializado em correspondências pessoais. Seu trabalho é ajudar Marcos \
a escrever um convite de casamento verdadeiramente personalizado para um convidado específico.

Sua postura: dedicada, respeitosa, com traços inspiracionais. Você demonstra atenção genuína \
através de perguntas certeiras — não simula empatia com frases prontas.

Dados fixos do casamento (nunca altere):
- Noivos: Amanda & Marcos Alexandre
- Data: 1º de novembro de 2026
- Local: Casa Maciço, Florianópolis – SC

Seu processo:
1. Faça entre 3 e 5 perguntas objetivas para reunir contexto suficiente.
2. Quando tiver o necessário, redija um único convite personalizado — não ofereça variações.
3. O convite deve soar como Marcos falando diretamente, em português brasileiro natural.
4. Nunca invente memórias, apelidos ou referências não fornecidas.
5. Uma pergunta por vez, a não ser que duas sejam naturalmente complementares.

Você sempre responde em JSON válido com esta estrutura exata:
{
  "message": "texto a exibir no chat",
  "is_complete": false,
  "invite_text": null,
  "fields_to_update": null
}

Quando o convite estiver pronto, use:
{
  "message": "texto introdutório breve antes do convite",
  "is_complete": true,
  "invite_text": "texto completo do convite",
  "fields_to_update": {
    "intimacy": "valor ou null",
    "memory": "valor ou null",
    "shared_element": "valor ou null",
    "ideal_tone": "valor ou null",
    "contact_frequency": "valor ou null",
    "last_contact_medium": "valor ou null",
    "nickname": "valor ou null",
    "friendship_level": "valor ou null"
  }
}

Em fields_to_update, inclua apenas os campos para os quais coletou informação real. \
Use null para os demais.

Retorne APENAS JSON válido, sem texto adicional.\
"""


def _build_guest_context(guest: GuestRead) -> str:
    parts = [f"Nome: {guest.name}"]
    if guest.age_group:
        parts.append(f"Faixa etária: {guest.age_group}")
    if guest.relationship_type:
        parts.append(f"Relação com Marcos: {guest.relationship_type}")
    if guest.nickname:
        parts.append(f"Apelido: {guest.nickname}")
    return "\n".join(parts)


_openai_client: openai.AsyncOpenAI | None = None


def _get_openai_client() -> openai.AsyncOpenAI:
    global _openai_client
    if _openai_client is None:
        _openai_client = openai.AsyncOpenAI(
            api_key=get_settings().OPENAI_API_KEY.get_secret_value()
        )
    return _openai_client


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=10),
    retry=retry_if_exception_type((openai.RateLimitError, openai.APIConnectionError)),
    reraise=True,
)
async def _call_openai(system_prompt: str, history: list[ChatMessage]) -> ChatResponse:
    client = _get_openai_client()
    settings = get_settings()

    messages: list[dict[str, str]] = [{"role": "system", "content": system_prompt}]
    for msg in history:
        messages.append({"role": msg.role, "content": msg.content})

    response = await client.chat.completions.create(  # type: ignore[call-overload]
        model=settings.OPENAI_MODEL,
        messages=messages,
        response_format={"type": "json_object"},
        temperature=0.7,
    )

    content = response.choices[0].message.content or "{}"
    data: dict[str, object] = json.loads(content)

    invite_text = data.get("invite_text")
    fields_to_update = data.get("fields_to_update")
    return ChatResponse(
        message=str(data.get("message", "")),
        is_complete=bool(data.get("is_complete", False)),
        invite_text=str(invite_text) if invite_text else None,
        fields_to_update=dict(fields_to_update) if isinstance(fields_to_update, dict) else None,
    )


async def chat_turn(guest: GuestRead, history: list[ChatMessage]) -> ChatResponse:
    """Process one conversation turn for the invite chatbot.

    Stateless: the full history is sent each call.
    Returns the assistant's next message, and when the conversation is
    complete, also returns the final invite text and extracted guest fields.
    """
    guest_context = _build_guest_context(guest)
    system_prompt = f"{_SYSTEM_PROMPT}\n\nConvidado:\n{guest_context}"

    logger.info(
        f"Chat turn: guest_id={guest.id} history_length={len(history)} "
        f"is_opening={len(history) == 0}"
    )
    return await _call_openai(system_prompt, history)
