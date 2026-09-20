import { TargetInput, InvestigationResult, BenchmarkItem, CopilotResponse } from '../types/intelligence';

const API_BASE = '/api/v1';

export const apiService = {
  async fetchBenchmarks(): Promise<BenchmarkItem[]> {
    const res = await fetch(`${API_BASE}/investigate/benchmarks`);
    if (!res.ok) throw new Error('Failed to fetch benchmarks');
    return res.json();
  },

  async runInvestigation(input: TargetInput): Promise<InvestigationResult> {
    const formData = new FormData();
    if (input.photo) {
      formData.append('photo', input.photo);
    }
    if (input.name) formData.append('name', input.name);
    if (input.seed_handle) formData.append('seed_handle', input.seed_handle);
    if (input.email) formData.append('email', input.email);
    if (input.affiliation) formData.append('affiliation', input.affiliation);
    if (input.location) formData.append('location', input.location);
    if (input.image_url) formData.append('image_url', input.image_url);
    if (input.linkedin_url) formData.append('linkedin_url', input.linkedin_url);
    if (input.benchmark_id) formData.append('benchmark_id', input.benchmark_id);
    formData.append('consent_confirmed', String(input.consent_confirmed ?? true));

    const res = await fetch(`${API_BASE}/investigate/run`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Investigation failed' }));
      throw new Error(err.detail || 'Investigation failed');
    }
    return res.json();
  },

  async fetchSystemStatus(): Promise<Record<string, any>> {
    const res = await fetch(`${API_BASE}/system/status`);
    if (!res.ok) throw new Error('Failed to fetch system status');
    return res.json();
  },

  async queryCopilot(investigationId: string, query: string): Promise<CopilotResponse> {
    const res = await fetch(`${API_BASE}/copilot/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ investigation_id: investigationId, query }),
    });
    if (!res.ok) throw new Error('Copilot query failed');
    return res.json();
  },
};
