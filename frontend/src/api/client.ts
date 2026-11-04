import {
  HealthResponse,
  QuestionnaireResponse,
  PredictResponse,
  ScoringResponse,
  ModelInfoResponse,
  ProfileDef
} from './types';

const BASE_URL = '/api';

export async function fetchHealth(): Promise<HealthResponse> {
  const res = await fetch(`${BASE_URL}/health`);
  if (!res.ok) {
    throw new Error(`Health check failed with status: ${res.status}`);
  }
  return res.json();
}

export async function fetchQuestionnaire(): Promise<QuestionnaireResponse> {
  const res = await fetch(`${BASE_URL}/questionnaire`);
  if (!res.ok) {
    throw new Error(`Failed to load questionnaire: ${res.statusText}`);
  }
  return res.json();
}

export async function postPredict(consent: boolean, answers: Record<string, any>): Promise<PredictResponse> {
  const res = await fetch(`${BASE_URL}/predict`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ consent, answers })
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = errorData.detail || `Prediction error (${res.status})`;
    throw new Error(message);
  }
  return res.json();
}

export async function fetchScoring(): Promise<ScoringResponse> {
  const res = await fetch(`${BASE_URL}/scoring`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to load scoring specs (${res.status})`);
  }
  return res.json();
}

export async function fetchModelInfo(): Promise<ModelInfoResponse> {
  const res = await fetch(`${BASE_URL}/model-info`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to load model info (${res.status})`);
  }
  return res.json();
}

export async function fetchProfiles(): Promise<ProfileDef[]> {
  const res = await fetch(`${BASE_URL}/profiles`);
  if (!res.ok) {
    throw new Error(`Failed to load profiles: ${res.statusText}`);
  }
  return res.json();
}

