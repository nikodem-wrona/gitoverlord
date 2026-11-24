import type { ReactNode } from "react";

import { EmptyState, Panel } from "@/hud";
import { errorMessage } from "@/ipc";

/** The part of a query result that the views read. */
export interface QueryState<Data> {
  data: Data | undefined;
  error: Error | null;
}

interface QueryViewProps<Data> {
  query: QueryState<Data>;
  children(data: Data): ReactNode;
}

/** Shows the data of a query. Before the data arrives, it shows the state of the query. */
export function QueryView<Data>({ query, children }: QueryViewProps<Data>) {
  if (query.data !== undefined) return <>{children(query.data)}</>;
  if (query.error) {
    return (
      <EmptyState title="Signal lost" message={errorMessage(query.error)} />
    );
  }
  return <EmptyState title="Scanning" message="Reading the repository." />;
}

interface QueryPanelProps<Data> extends QueryViewProps<Data> {
  title: string;
  /** Makes the status text of the title bar from the data. */
  meta(data: Data): ReactNode;
  delay?: number;
  flush?: boolean;
}

/** A panel that shows the data of one query. */
export function QueryPanel<Data>(props: QueryPanelProps<Data>) {
  const { query, meta, children, ...panel } = props;
  const status = query.error ? "No signal" : "Scanning";

  return (
    <Panel
      {...panel}
      meta={query.data === undefined ? status : meta(query.data)}
    >
      <QueryView query={query}>{children}</QueryView>
    </Panel>
  );
}
