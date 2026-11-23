export { isDemoBackend, markDemoBackend } from "./backendMode";
export {
  type Branch,
  type ChangeKind,
  type Commit,
  type CommitDetail,
  commands,
  type DiffHunk,
  type DiffLine,
  type DiffTarget,
  events,
  type FileDelta,
  type FileDiff,
  type GitError,
  type GitVersion,
  type Head,
  type LineKind,
  type LogPage,
  type MockCommandHandlers,
  mockCommands,
  type RecentRepo,
  type RepoChange,
  type RepoSummary,
  type WorkingTree,
} from "./bindings";
export { errorMessage } from "./errorMessage";
export { CommandError, unwrap } from "./unwrap";
