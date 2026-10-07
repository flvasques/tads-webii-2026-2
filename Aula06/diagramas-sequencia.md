# Aula 06 — Diagramas de Sequência dos Casos de Uso

Diagramas de sequência (Mermaid) dos casos de uso do projeto [`project-management`](./project-management/), seguindo as camadas da arquitetura hexagonal:

| Camada | Peças |
|---|---|
| **Adaptador primário** (driving) | `currentUser`, `requireModuleAccess`, rotas e Controllers HTTP, `errorHandler` |
| **Aplicação** (casos de uso) | `CreateProject`, `ListProjects`, `GetProject`, `AdvanceProjectStage`, `GetProjectsSummary`, `GrantModuleAccess`, `RevokeModuleAccess`, `ListUserGrants`, `CheckModuleAccess` |
| **Domínio** | `Project`, `User`, `AccessGrant`, `Permission`, `knownModules` |
| **Porta de saída** → **adaptador secundário** | `ProjectRepository`, `UserRepository`, `AccessRepository` → `InMemory*Repository` |

> Nos diagramas, os repositórios aparecem como a **porta** (interface). Em tempo de execução quem responde é o adaptador `InMemory*Repository` injetado pela composition root (`server.ts`) — o caso de uso não sabe disso.

---

## 1. Pipeline comum: identificação + autorização por módulo

Toda requisição passa primeiro pelo middleware `currentUser`. As rotas de `projects` e `reports` passam também por `requireModuleAccess`, que delega ao caso de uso **CheckModuleAccess**. As rotas de `access` **não** passam por `requireModuleAccess` (a regra ali é o papel `ADMIN`, checado dentro do caso de uso).

```mermaid
sequenceDiagram
    autonumber
    actor C as Cliente
    participant CU as currentUser<br/>(middleware)
    participant UR as UserRepository<br/>(porta)
    participant RMA as requireModuleAccess<br/>(middleware)
    participant CMA as CheckModuleAccess<br/>(caso de uso)
    participant AR as AccessRepository<br/>(porta)
    participant P as Permission<br/>(shared kernel)
    participant R as Rota / Controller
    participant EH as errorHandler

    C->>CU: requisição HTTP + header x-user-id
    CU->>UR: findById(userId)
    UR-->>CU: User | undefined
    alt usuário não encontrado / header inválido
        CU--)EH: throw UnauthenticatedError
        EH-->>C: 401 { error }
    else usuário identificado
        CU->>CU: req.currentUser = user
        CU->>RMA: next()
        RMA->>CMA: execute(userId, moduleName, required)
        CMA->>AR: findGrant(userId, moduleName)
        AR-->>CMA: AccessGrant | undefined
        alt sem grant
            CMA-->>RMA: false
        else com grant
            CMA->>P: satisfies(grant.permission, required)
            P-->>CMA: boolean (WRITE inclui READ)
            CMA-->>RMA: boolean
        end
        alt não autorizado
            RMA--)EH: throw ForbiddenError
            EH-->>C: 403 { error }
        else autorizado
            RMA->>R: next()
            R-->>C: resposta do caso de uso
        end
    end
```

> Como `CheckModuleAccess` relê o `AccessRepository` em **toda** requisição (sem cache), um grant concedido pelo admin vale já na próxima chamada do usuário.

---

## 2. Módulo `projects`

### 2.1 Criar projeto — `POST /projects` (exige `projects:WRITE`)

```mermaid
sequenceDiagram
    autonumber
    actor C as Cliente
    participant MW as currentUser +<br/>requireModuleAccess
    participant PC as ProjectController
    participant UC as CreateProject<br/>(caso de uso)
    participant PR as ProjectRepository<br/>(porta)
    participant PJ as Project<br/>(entidade)
    participant EH as errorHandler

    C->>MW: POST /projects { name, stages }
    Note over MW: ver diagrama 1<br/>(projects, WRITE)
    MW->>PC: create(req, res)
    alt name não é string / stages vazio ou inválido
        PC--)EH: throw ValidationError
        EH-->>C: 400 { error }
    else corpo válido
        PC->>UC: execute(name, stages)
        UC->>PR: nextId()
        PR-->>UC: id
        UC->>PJ: Project.create(id, name, stageNames)
        alt nome em branco
            PJ--)EH: throw InvalidProjectNameError
            EH-->>C: 400 { error }
        else lista de etapas vazia
            PJ--)EH: throw EmptyStageListError
            EH-->>C: 400 { error }
        else etapa repetida
            PJ--)EH: throw DuplicateStageNameError
            EH-->>C: 400 { error }
        else regras OK
            PJ-->>UC: project (currentStageIndex = 0)
            UC->>PR: save(project)
            UC-->>PC: project
            PC->>PC: toJSON(project)
            PC-->>C: 201 { id, name, stages, currentStage, ... }
        end
    end
```

### 2.2 Listar projetos — `GET /projects` (exige `projects:READ`)

```mermaid
sequenceDiagram
    autonumber
    actor C as Cliente
    participant MW as currentUser +<br/>requireModuleAccess
    participant PC as ProjectController
    participant UC as ListProjects<br/>(caso de uso)
    participant PR as ProjectRepository<br/>(porta)

    C->>MW: GET /projects
    Note over MW: ver diagrama 1<br/>(projects, READ)
    MW->>PC: list(req, res)
    PC->>UC: execute()
    UC->>PR: findAll()
    PR-->>UC: Project[]
    UC-->>PC: Project[]
    PC->>PC: map(toJSON)
    PC-->>C: 200 [ ... ]
```

### 2.3 Consultar projeto — `GET /projects/:id` (exige `projects:READ`)

```mermaid
sequenceDiagram
    autonumber
    actor C as Cliente
    participant MW as currentUser +<br/>requireModuleAccess
    participant PC as ProjectController
    participant UC as GetProject<br/>(caso de uso)
    participant PR as ProjectRepository<br/>(porta)
    participant EH as errorHandler

    C->>MW: GET /projects/:id
    Note over MW: ver diagrama 1<br/>(projects, READ)
    MW->>PC: get(req, res)
    PC->>UC: execute(Number(id))
    UC->>PR: findById(projectId)
    PR-->>UC: Project | undefined
    alt projeto não existe
        UC--)EH: throw ProjectNotFoundError
        EH-->>C: 404 { error }
    else encontrado
        UC-->>PC: project
        PC-->>C: 200 toJSON(project)
    end
```

### 2.4 Avançar etapa — `POST /projects/:id/advance` (exige `projects:WRITE`)

```mermaid
sequenceDiagram
    autonumber
    actor C as Cliente
    participant MW as currentUser +<br/>requireModuleAccess
    participant PC as ProjectController
    participant UC as AdvanceProjectStage<br/>(caso de uso)
    participant PR as ProjectRepository<br/>(porta)
    participant PJ as Project<br/>(entidade)
    participant EH as errorHandler

    C->>MW: POST /projects/:id/advance
    Note over MW: ver diagrama 1<br/>(projects, WRITE)
    MW->>PC: advance(req, res)
    PC->>UC: execute(Number(id))
    UC->>PR: findById(projectId)
    PR-->>UC: Project | undefined
    alt projeto não existe
        UC--)EH: throw ProjectNotFoundError
        EH-->>C: 404 { error }
    else encontrado
        UC->>PJ: advance()
        alt já está na última etapa
            PJ--)EH: throw ProjectAlreadyAtFinalStageError
            EH-->>C: 409 { error }
        else pode avançar
            PJ-->>UC: NOVA instância (currentStageIndex + 1)
            Note right of PJ: entidade imutável:<br/>não altera this
            UC->>PR: save(advanced)
            UC-->>PC: advanced
            PC-->>C: 200 toJSON(advanced)
        end
    end
```

---

## 3. Módulo `reports`

### 3.1 Resumo de projetos — `GET /reports/summary` (exige `reports:READ`)

O módulo `reports` reaproveita a **porta** `ProjectRepository` do módulo `projects` (e não o adaptador concreto). A permissão exigida é no módulo `reports`, independente de `projects`.

```mermaid
sequenceDiagram
    autonumber
    actor C as Cliente
    participant MW as currentUser +<br/>requireModuleAccess
    participant RC as ReportsController
    participant UC as GetProjectsSummary<br/>(caso de uso)
    participant PR as ProjectRepository<br/>(porta do módulo projects)
    participant PJ as Project<br/>(entidade)

    C->>MW: GET /reports/summary
    Note over MW: ver diagrama 1<br/>(reports, READ)
    MW->>RC: summary(req, res)
    RC->>UC: execute()
    UC->>PR: findAll()
    PR-->>UC: Project[]
    loop para cada projeto
        UC->>PJ: currentStage.name
        PJ-->>UC: nome da etapa
        UC->>UC: byStage[nome] += 1
    end
    UC-->>RC: { totalProjects, byStage }
    RC-->>C: 200 { totalProjects, byStage }
```

---

## 4. Módulo `access`

Estas rotas passam só pelo `currentUser` (não há `requireModuleAccess`). A regra "apenas `ADMIN`" mora no caso de uso.

### 4.1 Conceder acesso — `POST /access/grants`

```mermaid
sequenceDiagram
    autonumber
    actor A as Admin
    participant CU as currentUser
    participant AC as AccessController
    participant UC as GrantModuleAccess<br/>(caso de uso)
    participant KM as knownModules<br/>(domínio)
    participant UR as UserRepository<br/>(porta)
    participant AR as AccessRepository<br/>(porta)
    participant EH as errorHandler

    A->>CU: POST /access/grants { targetUserId, moduleName, permission }
    Note over CU: ver diagrama 1<br/>(somente identificação)
    CU->>AC: grant(req, res)
    AC->>AC: parseGrantBody(body)
    alt corpo inválido
        AC--)EH: throw ValidationError
        EH-->>A: 400 { error }
    else corpo válido
        AC->>UC: execute(currentUser, targetUserId, moduleName, permission)
        alt actingUser.role != ADMIN
            UC--)EH: throw ForbiddenError
            EH-->>A: 403 { error }
        else é ADMIN
            UC->>KM: isKnownModule(moduleName)
            KM-->>UC: boolean
            alt módulo desconhecido
                UC--)EH: throw UnknownModuleError
                EH-->>A: 400 { error }
            else módulo existe
                UC->>UR: findById(targetUserId)
                UR-->>UC: User | undefined
                alt usuário alvo não existe
                    UC--)EH: throw UserNotFoundError
                    EH-->>A: 404 { error }
                else usuário existe
                    UC->>AR: save({ userId, moduleName, permission, grantedAt })
                    UC-->>AC: void
                    AC-->>A: 201 { targetUserId, moduleName, permission }
                end
            end
        end
    end
```

### 4.2 Revogar acesso — `DELETE /access/grants`

Revogar um módulo desconhecido não é erro (é um no-op), por isso não há checagem de `knownModules`.

```mermaid
sequenceDiagram
    autonumber
    actor A as Admin
    participant CU as currentUser
    participant AC as AccessController
    participant UC as RevokeModuleAccess<br/>(caso de uso)
    participant UR as UserRepository<br/>(porta)
    participant AR as AccessRepository<br/>(porta)
    participant EH as errorHandler

    A->>CU: DELETE /access/grants { targetUserId, moduleName }
    Note over CU: ver diagrama 1<br/>(somente identificação)
    CU->>AC: revoke(req, res)
    AC->>AC: parseRevokeBody(body)
    alt corpo inválido
        AC--)EH: throw ValidationError
        EH-->>A: 400 { error }
    else corpo válido
        AC->>UC: execute(currentUser, targetUserId, moduleName)
        alt actingUser.role != ADMIN
            UC--)EH: throw ForbiddenError
            EH-->>A: 403 { error }
        else é ADMIN
            UC->>UR: findById(targetUserId)
            UR-->>UC: User | undefined
            alt usuário alvo não existe
                UC--)EH: throw UserNotFoundError
                EH-->>A: 404 { error }
            else usuário existe
                UC->>AR: revoke(targetUserId, moduleName)
                UC-->>AC: void
                AC-->>A: 204 No Content
            end
        end
    end
```

### 4.3 Listar concessões de um usuário — `GET /access/grants/:userId`

```mermaid
sequenceDiagram
    autonumber
    actor A as Admin
    participant CU as currentUser
    participant AC as AccessController
    participant UC as ListUserGrants<br/>(caso de uso)
    participant UR as UserRepository<br/>(porta)
    participant AR as AccessRepository<br/>(porta)
    participant EH as errorHandler

    A->>CU: GET /access/grants/:userId
    Note over CU: ver diagrama 1<br/>(somente identificação)
    CU->>AC: listGrantsOf(req, res)
    AC->>UC: execute(currentUser, Number(userId))
    alt actingUser.role != ADMIN
        UC--)EH: throw ForbiddenError
        EH-->>A: 403 { error }
    else é ADMIN
        UC->>UR: findById(targetUserId)
        UR-->>UC: User | undefined
        alt usuário alvo não existe
            UC--)EH: throw UserNotFoundError
            EH-->>A: 404 { error }
        else usuário existe
            UC->>AR: listByUser(targetUserId)
            AR-->>UC: AccessGrant[]
            UC-->>AC: AccessGrant[]
            AC-->>A: 200 [ ... ]
        end
    end
```

---

## 5. Cenário integrado: concessão vale na próxima requisição

Mostra a interação entre `GrantModuleAccess` e `CheckModuleAccess` — o ponto central da aula (autorização lida do repositório a cada requisição, sem cache em sessão/token).

```mermaid
sequenceDiagram
    autonumber
    actor M as Membro (id 2)
    actor A as Admin (id 1)
    participant API as API (Express)
    participant CMA as CheckModuleAccess
    participant GMA as GrantModuleAccess
    participant AR as AccessRepository

    M->>API: GET /projects (x-user-id: 2)
    API->>CMA: execute(2, projects, READ)
    CMA->>AR: findGrant(2, projects)
    AR-->>CMA: undefined
    CMA-->>API: false
    API-->>M: 403 Forbidden

    A->>API: POST /access/grants { targetUserId: 2, moduleName: projects, permission: READ }
    API->>GMA: execute(admin, 2, projects, READ)
    GMA->>AR: save(grant)
    API-->>A: 201 Created

    M->>API: GET /projects (x-user-id: 2)
    API->>CMA: execute(2, projects, READ)
    CMA->>AR: findGrant(2, projects)
    AR-->>CMA: AccessGrant (READ)
    CMA-->>API: true
    API-->>M: 200 [ ... ]
    Note over M,AR: sem logout/login e sem invalidar cache
```
