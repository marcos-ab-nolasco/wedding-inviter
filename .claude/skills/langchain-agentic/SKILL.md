---
name: langchain-agentic
description: LangChain patterns for RAG, agents, chains, and tools.
user-invocable: false
---

# LangChain Agentic Patterns

## RAG
- Chunk size: 500-1000 tokens, 10-20% overlap
- Similarity search with score threshold, MMR for diversity
- Store metadata (source, timestamps) for filtering/citation

## Chains
- LCEL for all new code, `.with_retry()` for failures, `.astream()` for real-time
```python
chain = (
    {"context": retriever, "question": RunnablePassthrough()}
    | prompt | llm | StrOutputParser()
)
```

## Agents & Tools
- LangGraph for stateful agents
- Tools: Pydantic input models, async for I/O, clear descriptions
```python
class SearchInput(BaseModel):
    query: str = Field(description="Search query")

@tool
async def search_docs(query: SearchInput) -> str:
    """Search documentation."""
    return format_results(await vector_store.asimilarity_search(query.query))
```

## Monitoring
- LangSmith tracing, track token usage, callbacks for metrics

## Testing
- FakeLLM for chains, mock retrievers for RAG, integration tests for flows
