export interface OptionItem {
  label: string;
}

export interface QuestionItem {
  id: string;
  header: string;
  short: string;
  type: "single" | "multi" | "text";
  section: string;
  required: boolean;
  scored: boolean;
  sensitive: boolean;
  note?: string;
  options?: OptionItem[];
}

export interface QuestionnaireResponse {
  version: string;
  sections: string[];
  questions: QuestionItem[];
}

export interface QuotientInfo {
  score: number;
  z: number;
  level: "H" | "Avg" | "L";
  norm_mean: number;
  norm_sd: number;
  items_used: number;
}

export interface ProfileProb {
  id: number;
  name: string;
  p: number;
}

export interface RunnerUp {
  id: number;
  name: string;
  p: number;
}

export interface PredictionInfo {
  profile_id: number;
  name: string;
  subtitle: string;
  probability: number;
  probabilities: ProfileProb[];
  borderline: boolean;
  runner_up: RunnerUp;
}

export interface TopItem {
  question_id: string;
  short: string;
  quotient: string;
  component: string;
  answer: string;
  item_score: number;
  importance: number;
}

export interface ActionItem {
  id: string;
  title: string;
  detail: string;
}

export interface FocusBlock {
  quotient: string;
  level: string;
  gap: number;
  actions: ActionItem[];
}

export interface RecommendationsInfo {
  target_profile: { id: number; name: string } | null;
  focus: FocusBlock[];
  maintain: ActionItem[] | null;
  support_note: string | null;
  disclaimer: string;
}

export interface PredictResponse {
  submission_id: string;
  model_version: string;
  quotients: Record<string, QuotientInfo>;
  rule_profile: {
    id: number;
    name: string;
    borderline: boolean;
  };
  prediction: PredictionInfo;
  explanation: {
    top_items: TopItem[];
    quotient_importance: Record<string, number>;
  };
  recommendations: RecommendationsInfo;
  disclaimer: string;
}

export interface HealthResponse {
  status: string;
  model_loaded: boolean;
  model_version: string | null;
}

export interface ProfileDef {
  id: number;
  name: string;
  subtitle: string;
  levels: Record<string, string>;
  prototype: Record<string, number>;
  description: string;
  strengths: string;
  watch_outs: string;
  next_target: number | null;
  color: string;
}

export interface QuestionMappingRow {
  id: string;
  header: string;
  short: string;
  type: string;
  section: string;
  scored: boolean;
  quotient: string | null;
  component: string | null;
  direction: string | null;
  score_min: number | null;
  score_max: number | null;
  scoring_rule: string;
  is_reversed: boolean;
  note: string;
}

export interface WorkedExampleItem {
  question_id: string;
  short: string;
  quotient: string;
  component: string;
  answer: string;
  raw_value: number;
  score_min: number;
  score_max: number;
  normalised_value: number;
}

export interface WorkedExample {
  items: WorkedExampleItem[];
  quotients: Record<string, QuotientInfo>;
  prototypes: Array<{
    profile_id: number;
    name: string;
    prototype: Record<string, number>;
    distance: number;
    is_assigned: boolean;
  }>;
  assigned_profile: {
    id: number;
    name: string;
    distance: number;
    distance_gap: number;
    borderline: boolean;
  };
}

export interface ScoringResponse {
  overview_steps: Array<{ step: number; title: string; description: string }>;
  items_per_quotient: Array<{
    quotient: string;
    count: number;
    items: string[];
    description: string;
  }>;
  question_mapping: QuestionMappingRow[];
  formulas: Record<string, any>;
  norms: Record<string, { mean: number; sd: number }>;
  prototypes: ProfileDef[];
  worked_example: WorkedExample;
  limitations: string[];
}

export interface ModelInfoResponse {
  meta: Record<string, any>;
  data_report: Record<string, any>;
  distributions: {
    profiles: Array<{
      profile_id: number;
      name: string;
      color: string;
      count: number;
      percentage: number;
    }>;
    quotient_levels: Array<{
      quotient: string;
      H: number;
      Avg: number;
      L: number;
    }>;
    histograms: Record<string, { bins: string[]; counts: number[] }>;
    demographics: Record<string, Array<{ label: string; count: number }>>;
    split: {
      train_size: number;
      val_size: number;
      test_size: number;
      stratified: boolean;
      classes_present: number[];
      classes_missing: number[];
    };
  };
  metrics: {
    accuracy: number;
    macro_precision: number;
    weighted_precision: number;
    macro_recall: number;
    weighted_recall: number;
    macro_f1: number;
    weighted_f1: number;
    balanced_accuracy: number;
    cohen_kappa: number;
    mcc: number;
    roc_auc_macro_ovr: number | null;
    train_accuracy: number;
    val_accuracy: number;
    per_class: Array<{
      profile_id: number;
      name: string;
      precision: number;
      recall: number;
      f1: number;
      support: number;
    }>;
    confusion_matrix: {
      labels: string[];
      profile_ids: number[];
      matrix: number[][];
    };
    history: {
      loss: number[];
      val_accuracy: number[];
    };
    cross_validation: {
      performed: boolean;
      k_folds?: number;
      mean_accuracy?: number;
      sd_accuracy?: number;
      mean_macro_f1?: number;
      sd_macro_f1?: number;
      reason?: string;
    };
  };
  feature_importance: Array<{
    question_id: string;
    short: string;
    quotient: string;
    component: string;
    importance: number;
  }>;
  hyperparameters: Record<string, any>;
  warnings: string[];
}

