# Reading Mermaid Graphs

This guide explains how to read Mermaid diagrams without mixing up flows, calls, and dependencies.

The key rule: an arrow is read from source to target.

## Basic Rule

In a `flowchart`, read an arrow as a sentence:

- `A --> B` means `A` goes to `B`.
- In an calls diagram: `A` calls `B`.
- In a dependency diagram: `A` depends on `B`.
- In a flow diagram: something starts at `A` and arrives at `B`.

Outgoing arrows show what a node uses, calls, or feeds. Incoming arrows show who uses that node or sends something to it.

## Simple Relation

```mermaid
flowchart LR
  UI[UI] --> Service[Service]
```

Read this as `UI` uses or calls `Service`. `Service` does not depend on `UI` in this diagram.

## Chain

```mermaid
flowchart LR
  Component[Component] --> Facade[Facade] --> Orchestrator[Orchestrator] --> Store[Store]
```

Read this as:

- `Component` uses `Facade`.
- `Facade` uses `Orchestrator`.
- `Orchestrator` uses `Store`.

To find what `Facade` depends on, inspect outgoing arrows. To find who depends on `Facade`, inspect incoming arrows.

## Multiple Outgoing Dependencies

```mermaid
flowchart LR
  Facade[ConnectionFacade] --> Nip07[NIP-07 Method]
  Facade --> Nip46[NIP-46 Method]
  Facade --> Store[Session Store]
```

Outgoing arrows from `Facade` show the things `Facade` may use.

## Multiple Inputs

```mermaid
flowchart LR
  Nip07[NIP-07 Method] --> Session[ConnectionSession]
  Nip46[NIP-46 Method] --> Session
  Bunker[Bunker Method] --> Session
```

Multiple sources point to `ConnectionSession`, so multiple paths can produce or feed the same thing.

## Loops

```mermaid
flowchart LR
  Orch[Orchestrator] -->|set current| Store[Session Store]
  Store -->|read current| Orch
```

Read each arrow separately. Opposite arrows do not automatically mean a circular dependency; they can describe two different actions.

## Orientation

- `LR` means left to right.
- `TD` means top down.

The visual direction changes, but the rule does not: the arrow tail is the source and the arrow head is the target.

## Subgraphs

`subgraph` groups nodes visually. It does not create or reverse dependencies.
