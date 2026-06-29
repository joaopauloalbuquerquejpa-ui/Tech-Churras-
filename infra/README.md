# Infraestrutura Tech Churras — Serviços Externos

Serviços self-hosted deployados no Railway. Cada um é um serviço separado
dentro do mesmo projeto Railway.

## Serviços

| Serviço | Porta | Função |
|---|---|---|
| Evolution API | 8080 | WhatsApp (substitui Z-API) |
| Chatwoot | 3000 | Atendimento omnichannel |
| Listmonk | 9000 | Email marketing |
| Postiz | 4000 | Agendamento de redes sociais |

## Como fazer deploy no Railway

1. Acesse railway.app → projeto Tech Churras
2. New Service → Deploy from Docker Image
3. Use a imagem do serviço desejado
4. Configure as env vars da pasta de cada serviço
5. Clique Deploy

---

> ⚠️ **Evolution API**: só migrar do Z-API APÓS o lançamento (06/07).
> O WhatsApp está funcionando em produção — não troque antes.
