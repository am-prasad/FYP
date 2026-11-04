import React, { useState, useEffect } from 'react';
import { fetchScoring } from '../api/client';
import { ScoringResponse, QuestionMappingRow } from '../api/types';
import { BarChart } from '../components/charts/BarChart';

export const ScoringPage: React.FC = () => {
  const [data, setData] = useState<ScoringResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [quotientFilter, setQuotientFilter] = useState('ALL');

  useEffect(() => {
    loadScoring();
  }, []);

  const loadScoring = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchScoring();
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load scoring specifications.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent" />
        <p className="mt-3 text-sm text-slate-500">Loading scoring and mapping rules...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-red-50 border border-red-200 text-red-800 p-6 rounded-xl text-center space-y-3">
          <h3 className="text-base font-bold">Failed to Load Scoring Rules</h3>
          <p className="text-sm">{error}</p>
          <button
            onClick={loadScoring}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Filter questions
  const filteredQuestions = data.question_mapping.filter((q) => {
    const matchesSearch =
      q.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.header.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.short.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (q.component && q.component.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (quotientFilter === 'ALL') return true;
    if (quotientFilter === 'NOT_SCORED') return !q.scored;
    return q.quotient === quotientFilter;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-12">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Scoring Methodology & Question Mapping
        </h2>
        <p className="text-sm text-slate-600 mt-2 max-w-3xl leading-relaxed">
          Full mathematical specification of the transformation from raw questionnaire survey responses to normalised items, four standard quotient dimensions, prototype-based rule labels, and TabNet deep neural predictions.
        </p>
      </div>

      {/* 1. Overview Flow */}
      <section className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
          1. Step-by-Step Scoring Flow
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.overview_steps.map((st) => (
            <div key={st.step} className="p-4 rounded-lg bg-slate-50 border border-slate-200/80">
              <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold inline-flex items-center justify-center mb-2">
                {st.step}
              </span>
              <h4 className="text-sm font-bold text-slate-900 mb-1">{st.title}</h4>
              <p className="text-xs text-slate-600 leading-relaxed">{st.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 2. Items per Quotient */}
      <section className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
          2. Items per Quotient Distribution
        </h3>
        <p className="text-xs text-slate-600">
          Quotient scores use the <strong>arithmetic mean</strong> of normalised item scores, keeping quotients directly comparable despite different item counts across dimensions.
        </p>
        <div className="max-w-lg">
          <BarChart
            data={data.items_per_quotient.map((iq) => ({
              label: `${iq.quotient} (${iq.count} items)`,
              value: iq.count,
              color: '#4f46e5'
            }))}
            orientation="vertical"
            max={10}
            valueFormatter={(v) => `${v}`}
          />
        </div>
      </section>

      {/* 3. Question-by-Question Mapping Table */}
      <section className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">3. Complete Question-by-Question Mapping</h3>
            <p className="text-xs text-slate-500">
              Displaying {filteredQuestions.length} of {data.question_mapping.length} survey questions.
            </p>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search questions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-xs p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 w-full sm:w-48"
            />
            <select
              value={quotientFilter}
              onChange={(e) => setQuotientFilter(e.target.value)}
              aria-label="Filter questions by quotient"
              className="text-xs p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="ALL">All Quotients</option>
              <option value="IQ">IQ Items (6)</option>
              <option value="EQ">EQ Items (5)</option>
              <option value="SQ">SQ Items (9)</option>
              <option value="AQ">AQ Items (4)</option>
              <option value="NOT_SCORED">Not Scored</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <th className="p-2.5">Q#</th>
                <th className="p-2.5">Question Header</th>
                <th className="p-2.5">Type</th>
                <th className="p-2.5">Scored?</th>
                <th className="p-2.5">Quotient</th>
                <th className="p-2.5">Component</th>
                <th className="p-2.5">Direction</th>
                <th className="p-2.5">Scoring Formula / Rule</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredQuestions.map((q) => (
                <tr key={q.id} className="hover:bg-slate-50/70">
                  <td className="p-2.5 font-mono font-bold text-slate-900">{q.id}</td>
                  <td className="p-2.5 max-w-xs font-medium text-slate-800">
                    <div>{q.header}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{q.section}</div>
                  </td>
                  <td className="p-2.5 uppercase font-mono text-[10px] text-slate-500">{q.type}</td>
                  <td className="p-2.5">
                    {q.scored ? (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                        Yes
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium text-[10px]">
                        No
                      </span>
                    )}
                  </td>
                  <td className="p-2.5 font-bold text-indigo-700">{q.quotient || '-'}</td>
                  <td className="p-2.5 text-slate-600">{q.component || '-'}</td>
                  <td className="p-2.5">
                    {q.is_reversed ? (
                      <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold text-[10px]">
                        Reversed
                      </span>
                    ) : (
                      <span className="text-slate-500">{q.direction || '-'}</span>
                    )}
                  </td>
                  <td className="p-2.5 text-slate-700 max-w-sm">
                    {q.scoring_rule}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. Formulas */}
      <section className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
          4. Mathematical Formulas & Cutoff Parameters
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
            <h4 className="text-sm font-bold text-slate-900">Item Normalisation</h4>
            <code className="block p-2 bg-white rounded border border-slate-200 font-mono text-xs text-indigo-700">
              {data.formulas.item_normalization.formula}
            </code>
            <p className="text-xs text-slate-600">Range: {data.formulas.item_normalization.range}</p>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
            <h4 className="text-sm font-bold text-slate-900">Quotient Score (0 to 100)</h4>
            <code className="block p-2 bg-white rounded border border-slate-200 font-mono text-xs text-indigo-700">
              {data.formulas.quotient_score.formula}
            </code>
            <p className="text-xs text-slate-600">{data.formulas.quotient_score.note}</p>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
            <h4 className="text-sm font-bold text-slate-900">Standardized z-score</h4>
            <code className="block p-2 bg-white rounded border border-slate-200 font-mono text-xs text-indigo-700">
              {data.formulas.z_score.formula}
            </code>
            <p className="text-xs text-slate-600">{data.formulas.z_score.note}</p>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
            <h4 className="text-sm font-bold text-slate-900">Level Classification Thresholds</h4>
            <div className="text-xs space-y-1 text-slate-700">
              {Object.entries(data.formulas.level_classification.thresholds).map(([lvl, condition]: any) => (
                <div key={lvl} className="flex justify-between border-b border-slate-200/50 py-0.5">
                  <span className="font-semibold">{lvl}:</span>
                  <code className="font-mono text-indigo-700">{condition}</code>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5 mt-4">
          <h4 className="text-sm font-bold text-slate-900">Nearest Prototype Distance & Borderline Rule</h4>
          <code className="block p-2 bg-white rounded border border-slate-200 font-mono text-xs text-indigo-700">
            {data.formulas.prototype_matching.formula}
          </code>
          <p className="text-xs text-slate-600">
            Clip: {data.formulas.prototype_matching.clip} | Tie-breaking: {data.formulas.prototype_matching.tie_breaking} | {data.formulas.prototype_matching.borderline_rule}
          </p>
        </div>
      </section>

      {/* 5. Norms */}
      <section className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
          5. Reference Population Norms
        </h3>
        <p className="text-xs text-slate-600">
          The mean and population standard deviation (ddof=0) frozen from the trained reference sample. All student tiers and z-scores are <strong>relative to this sample</strong>.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs border border-slate-200">
            <thead>
              <tr className="bg-slate-100 text-slate-800">
                <th className="p-2 border border-slate-200">Quotient</th>
                <th className="p-2 border border-slate-200">Reference Mean</th>
                <th className="p-2 border border-slate-200">Population SD (ddof=0)</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(data.norms).map(([qKey, stat]) => (
                <tr key={qKey}>
                  <td className="p-2 border border-slate-200 font-bold">{qKey}</td>
                  <td className="p-2 border border-slate-200 font-mono">{stat.mean}</td>
                  <td className="p-2 border border-slate-200 font-mono">{stat.sd}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 6. Profile Prototypes */}
      <section className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
          6. Profile Prototype Vectors
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs border border-slate-200">
            <thead>
              <tr className="bg-slate-100 text-slate-800">
                <th className="p-2 border border-slate-200">ID</th>
                <th className="p-2 border border-slate-200">Profile Name</th>
                <th className="p-2 border border-slate-200">Subtitle</th>
                <th className="p-2 border border-slate-200">IQ Proto</th>
                <th className="p-2 border border-slate-200">EQ Proto</th>
                <th className="p-2 border border-slate-200">SQ Proto</th>
                <th className="p-2 border border-slate-200">AQ Proto</th>
              </tr>
            </thead>
            <tbody>
              {data.prototypes.map((p) => (
                <tr key={p.id}>
                  <td className="p-2 border border-slate-200 font-bold">{p.id}</td>
                  <td className="p-2 border border-slate-200 font-semibold text-slate-900">{p.name}</td>
                  <td className="p-2 border border-slate-200 text-slate-600">{p.subtitle}</td>
                  <td className="p-2 border border-slate-200 font-mono">{p.prototype.IQ}</td>
                  <td className="p-2 border border-slate-200 font-mono">{p.prototype.EQ}</td>
                  <td className="p-2 border border-slate-200 font-mono">{p.prototype.SQ}</td>
                  <td className="p-2 border border-slate-200 font-mono">{p.prototype.AQ}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 7. Worked Example */}
      <section className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm space-y-6">
        <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
          7. Worked Example Walkthrough
        </h3>
        <p className="text-xs text-slate-600">
          Step-by-step computation generated by executing the production scoring engine on a fixed benchmark response set.
        </p>

        {/* Quotients outcome */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(['IQ', 'EQ', 'SQ', 'AQ'] as const).map((q) => {
            const qStat = data.worked_example.quotients[q];
            return (
              <div key={q} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                <span className="font-bold text-slate-700">{q} Quotient</span>
                <div className="font-mono text-base font-bold text-indigo-700 mt-1">
                  {qStat.score}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  z = {qStat.z} (Tier: {qStat.level})
                </div>
              </div>
            );
          })}
        </div>

        {/* Prototype Distances & Final Label */}
        <div className="p-4 rounded-lg bg-indigo-50/50 border border-indigo-100 space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-bold text-indigo-950">Assigned Rule Profile</h4>
            <span className="px-2.5 py-1 rounded bg-indigo-600 text-white font-bold text-xs">
              Profile {data.worked_example.assigned_profile.id}: {data.worked_example.assigned_profile.name}
            </span>
          </div>
          <div className="text-xs text-indigo-900 flex gap-4">
            <span>Nearest Distance: {data.worked_example.assigned_profile.distance}</span>
            <span>Distance Gap: {data.worked_example.assigned_profile.distance_gap}</span>
            <span>Borderline: {data.worked_example.assigned_profile.borderline ? 'Yes' : 'No'}</span>
          </div>

          <div className="overflow-x-auto mt-2">
            <table className="w-full text-left text-xs border border-indigo-200 bg-white">
              <thead>
                <tr className="bg-indigo-100/50 text-indigo-950">
                  <th className="p-1.5 border border-indigo-200">Profile</th>
                  <th className="p-1.5 border border-indigo-200">Prototype Vector (IQ, EQ, SQ, AQ)</th>
                  <th className="p-1.5 border border-indigo-200">Euclidean Distance</th>
                  <th className="p-1.5 border border-indigo-200">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.worked_example.prototypes.map((pt) => (
                  <tr key={pt.profile_id} className={pt.is_assigned ? 'bg-indigo-50 font-bold' : ''}>
                    <td className="p-1.5 border border-indigo-200">{pt.profile_id}. {pt.name}</td>
                    <td className="p-1.5 border border-indigo-200 font-mono">
                      ({pt.prototype.IQ}, {pt.prototype.EQ}, {pt.prototype.SQ}, {pt.prototype.AQ})
                    </td>
                    <td className="p-1.5 border border-indigo-200 font-mono">{pt.distance}</td>
                    <td className="p-1.5 border border-indigo-200">
                      {pt.is_assigned ? <span className="text-emerald-700">Nearest (Assigned)</span> : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 8. Limitations */}
      <section className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
          8. Methodological Limitations
        </h3>
        <ul className="list-disc list-inside space-y-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
          {data.limitations.map((lim, idx) => (
            <li key={idx}>{lim}</li>
          ))}
        </ul>
      </section>
    </div>
  );
};

