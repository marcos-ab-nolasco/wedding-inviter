import json
import logging
from uuid import UUID

import openai
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from src.core.cache.decorator import redis_cache_decorator
from src.core.config import get_settings
from src.schemas.guest import GuestRead, InviteMessageVariation

logger = logging.getLogger(__name__)

_SYSTEM_PROMPT = """\
Você é um assistente especializado em comunicação pessoal, encarregado de ajudar Marcos a \
redigir convites de casamento individualizados via WhatsApp. Cada mensagem deve soar como uma \
conversa real — não como um comunicado genérico.

Dados fixos do casamento (nunca altere):
- Noivos: Amanda & Marcos Alexandre
- Data: 1º de novembro de 2026
- Local: Casa Maciço, Florianópolis – SC
- Canal: WhatsApp

Diretrizes de estilo:
- Escreva sempre em português brasileiro informal-natural
- Nunca use linguagem corporativa ou de convite formal impresso
- Cada mensagem deve soar como Marcos falando, não como uma IA redigindo
- Nunca invente memórias, apelidos ou referências não fornecidas
- Piadas internas e referências específicas têm peso maior que modelos genéricos

Estrutura obrigatória de cada mensagem (4 blocos em sequência):
1. Saudação pessoal — abra com naturalidade, use nome ou apelido conforme o tom
2. O convite — inclua sempre: data (1º de novembro de 2026), local (Casa Maciço) e \
cidade (Florianópolis – SC)
3. Toque pessoal — use a memória ou elemento compartilhado fornecido; se o convidado for \
distante (is_distant=true), mencione os ~7 meses de antecedência e ofereça ajuda com \
logística, sem pressão
4. Encerramento — com calma, sem pressão, deixando espaço explícito para o convidado responder

Retorne APENAS JSON válido, sem texto adicional.\
"""


def _choose_tones(ideal_tone: str | None) -> list[str]:
    defaults = ["Descontraído", "Carinhoso", "Brincalhão"]
    if not ideal_tone:
        return defaults
    normalized = ideal_tone.strip().capitalize()
    tones = [normalized]
    for t in defaults:
        if len(tones) == 3:
            break
        if t.lower() != normalized.lower():
            tones.append(t)
    return tones


def _build_user_prompt(guest: GuestRead) -> str:
    def val(v: str | None) -> str:
        return v if v else "não informado"

    parts: list[str] = []
    if guest.city and guest.state:
        parts.append(f"{guest.city}/{guest.state}")
    elif guest.city:
        parts.append(guest.city)
    elif guest.state:
        parts.append(guest.state)
    location = parts[0] if parts else "não informada"
    distant = "Sim" if guest.is_distant else "Não"
    tones = _choose_tones(guest.ideal_tone)
    tones_str = ", ".join(tones)

    return f"""\
Ficha do convidado:
- Nome: {guest.name}
- Apelido: {val(guest.nickname)}
- Tipo de relacionamento: {val(guest.relationship_type)}
- Nível de amizade: {val(guest.friendship_level)}
- Intimidade: {val(guest.intimacy)}
- Frequência de contato: {val(guest.contact_frequency)}
- Último meio de contato: {val(guest.last_contact_medium)}
- Cidade/Estado: {location}
- Convidado distante: {distant}
- Memória marcante: {val(guest.memory)}
- Elemento compartilhado: {val(guest.shared_element)}
- Tom ideal: {val(guest.ideal_tone)}
- Observações: {val(guest.notes)}

Gere 3 variações de mensagem de convite para WhatsApp com os tons: {tones_str}.
Retorne JSON com esta estrutura exata:
{{"variations": [{{"tone": "NomeDoTom", "message": "texto completo da mensagem"}}, ...]}}\
"""


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
async def _call_openai(prompt: str) -> list[InviteMessageVariation]:
    client = _get_openai_client()
    settings = get_settings()

    response = await client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        messages=[
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
        response_format={"type": "json_object"},
        temperature=0.8,
    )

    content = response.choices[0].message.content or "{}"
    data: dict[str, list[dict[str, str]]] = json.loads(content)
    return [
        InviteMessageVariation(tone=v["tone"], message=v["message"])
        for v in data.get("variations", [])
    ]


@redis_cache_decorator(ttl=3600, namespace="invites.generate")
async def generate_invite_messages(
    guest_id: UUID, guest: GuestRead
) -> list[InviteMessageVariation]:
    """Generate 3 personalized WhatsApp invite message variations for a guest.

    Results are cached for 1 hour keyed by guest_id + guest data, so any edit
    to the guest automatically produces a fresh generation on next call.
    """
    logger.info(f"Generating invite via OpenAI: guest_id={guest_id}")
    prompt = _build_user_prompt(guest)
    return await _call_openai(prompt)
