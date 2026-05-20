// Main component
export { MirrorEditor } from './MirrorEditor';

// Sub-components (for use in Phase 5 reteach editor composition)
export { SuggestionToolbar } from './SuggestionToolbar';
export { ImagePicker } from './ImagePicker';

// TipTap extensions (re-exported so the reteach editor can reuse them)
export { InsertionMark } from './extensions/InsertionMark';
export { DeletionMark } from './extensions/DeletionMark';
export { ImageSuggestionNode } from './extensions/ImageSuggestionNode';

// Hooks (for custom editor compositions)
export { useSuggestions } from './hooks/useSuggestions';
export { useApplyDiff } from './hooks/useApplyDiff';

// Types
export type {
  AssessmentDiff,
  DiffInsertion,
  DiffDeletion,
  DiffImageSuggestion,
  ImageCandidate,
  SuggestionRecord,
  SuggestionType,
  SuggestionStatus,
} from './types';