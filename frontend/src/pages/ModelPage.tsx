import React, { useState, useEffect } from 'react';
import { fetchModelInfo } from '../api/client';
import { ModelInfoResponse } from '../api/types';
import { BarChart } from '../components/charts/BarChart';
import { GroupedBarChart } from '../components/charts/GroupedBarChart';
import { Histogram } from '../components/charts/Histogram';
import { LineChart } from '../components/charts/LineChart';
import { Heatmap } from '../components/charts/Heatmap';

export const ModelPage: React.FC = () => {
  const [data, setData] = useState<ModelInfoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadModelInfo();
  }, []);

  const loadModelInfo = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchModelInfo();
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load model diagnostics.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent" />
        <p className="mt-3 text-sm text-slate-500">Loading model performance metrics and distributions...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-red-50 border border-red-200 text-red-800 p-6 rounded-xl text-center space-y-3">
          <h3 className="text-base font-bold">Failed to Load Model Info</h3>
          <p className="text-sm">{error}</p>
          <button
            onClick={loadModelInfo}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { meta, data_report, distributions, metrics, feature_importance, hyperparameters, warnings } = data;
  const isDemo = meta.is_demo || data_report.is_demo;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">
      {/* Page Title */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Model Diagnostics & Data Distribution
        </h2>
        <p className="text-sm text-slate-600 mt-2 max-w-3xl leading-relaxed">
          Detailed transparency report covering dataset distribution, TabNet neural architecture, held-out test evaluation metrics, confusion matrix, feature importance rankings, and training curves.
        </p>
      </div>

      {/* 1. Banners & Warnings */}
      <div className="space-y-3">
        {isDemo && (
          <div className="p-4 rounded-xl bg-amber-500/10 border-2 border-amber-500 text-amber-950 flex items-start gap-3">
            <span className="font-bold text-lg">⚠️</span>
            <div>
              <h4 className="text-sm font-bold">Demo Data Notice</h4>
              <p className="text-xs sm:text-sm mt-0.5">
                This model was trained on synthetic demo data, not real responses. Results and metrics reflect demo benchmark distributions.
              </p>
            </div>
          </div>
        )}

        {warnings && warnings.length > 0 && (
          <div className="p-4 rounded-xl bg-slate-100 border border-slate-300 text-slate-800 space-y-1.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Important Methodological Disclosures
            </h4>
            <ul className="list-disc list-inside space-y-1 text-xs text-slate-600">
              {warnings.map((w, idx) => (
                <li key={idx}>{w}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* 2. Summary Cards */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Rows Read</span>
          <div className="text-xl font-black text-slate-900 mt-1">{data_report.rows_read}</div>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Rows Used</span>
          <div className="text-xl font-black text-emerald-700 mt-1">{data_report.rows_used}</div>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Rows Dropped</span>
          <div className="text-xl font-black text-slate-700 mt-1">{data_report.rows_dropped}</div>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Features</span>
          <div className="text-xl font-black text-indigo-700 mt-1">24</div>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Classes Present</span>
          <div className="text-xl font-black text-slate-900 mt-1">
            {distributions.split.classes_present.length} of 7
          </div>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Model Version</span>
          <div className="text-xs font-mono font-bold text-slate-700 mt-1 truncate" title={meta.model_version}>
            {meta.model_version}
          </div>
        </div>
      </section>

      {/* 3. Data Distribution */}
      <section className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm space-y-8">
        <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
          3. Reference Sample Distributions
        </h3>

        {/* Profile Distribution */}
        <div>
          <h4 className="text-sm font-semibold text-slate-800 mb-2">Profile Frequency & Percentage</h4>
          <BarChart
            data={distributions.profiles.map((p) => ({
              label: p.name,
              value: p.count,
              note: `${p.percentage}%`,
              color: p.color
            }))}
            orientation="horizontal"
            valueFormatter={(v) => `${v} students`}
          />
        </div>

        {/* Level Distribution per Quotient */}
        <div className="pt-6 border-t border-slate-100">
          <h4 className="text-sm font-semibold text-slate-800 mb-2">
            Tier Distribution per Quotient (High / Average / Low)
          </h4>
          <GroupedBarChart
            groups={distributions.quotient_levels.map((ql) => ({
              groupLabel: `${ql.quotient} Quotient`,
              values: {
                High: ql.H,
                Average: ql.Avg,
                Low: ql.L
              }
            }))}
            series={[
              { name: 'High', color: '#10b981' },
              { name: 'Average', color: '#64748b' },
              { name: 'Low', color: '#f59e0b' }
            ]}
          />
        </div>

        {/* Quotient Histograms */}
        <div className="pt-6 border-t border-slate-100 space-y-4">
          <h4 className="text-sm font-semibold text-slate-800">Quotient Score Histograms (10 Bins, 0-100)</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(['IQ', 'EQ', 'SQ', 'AQ'] as const).map((qKey) => {
              const hData = distributions.histograms[qKey];
              return (
                <div key={qKey} className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                  <Histogram
                    title={`${qKey} Score Distribution`}
                    bins={hData.bins}
                    counts={hData.counts}
                    color="#4f46e5"
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Demographics & Split sizes */}
        <div className="pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <h5 className="text-xs font-bold uppercase text-slate-700 mb-3">Age Groups</h5>
            <BarChart
              data={distributions.demographics.age_group.map((d: any) => ({
                label: d.label,
                value: d.count,
                color: '#6366f1'
              }))}
              orientation="horizontal"
            />
          </div>
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <h5 className="text-xs font-bold uppercase text-slate-700 mb-3">Gender</h5>
            <BarChart
              data={distributions.demographics.gender.map((d: any) => ({
                label: d.label,
                value: d.count,
                color: '#06b6d4'
              }))}
              orientation="horizontal"
            />
          </div>
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <h5 className="text-xs font-bold uppercase text-slate-700 mb-3">Grade Levels</h5>
            <BarChart
              data={distributions.demographics.grade.map((d: any) => ({
                label: d.label,
                value: d.count,
                color: '#8b5cf6'
              }))}
              orientation="horizontal"
            />
          </div>
        </div>

        {/* Split Info */}
        <div className="pt-4 border-t border-slate-100 text-xs text-slate-600 flex flex-wrap gap-6">
          <span><strong>Train Size:</strong> {distributions.split.train_size} (70%)</span>
          <span><strong>Validation Size:</strong> {distributions.split.val_size} (15%)</span>
          <span><strong>Test Size:</strong> {distributions.split.test_size} (15%)</span>
          <span>
            <strong>Stratified:</strong>{' '}
            {distributions.split.stratified ? (
              <span className="text-emerald-700 font-semibold">Yes</span>
            ) : (
              <span className="text-amber-700 font-semibold">No (unstratified fallback)</span>
            )}
          </span>
        </div>
      </section>

      {/* 4. TabNet Architecture & Hyperparameters */}
      <section className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
          4. TabNet Deep Learning Architecture
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          TabNet is an attention-based deep learning architecture designed for tabular learning. It uses sequential multi-step attention (Sparsemax) to select relevant features at each decision step, combining deep representation learning with built-in interpretability masks.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-slate-200">
            <thead>
              <tr className="bg-slate-100 text-slate-800">
                <th className="p-2 border border-slate-200">Hyperparameter</th>
                <th className="p-2 border border-slate-200">Configured Value</th>
                <th className="p-2 border border-slate-200">Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-2 border border-slate-200 font-mono">n_d / n_a</td>
                <td className="p-2 border border-slate-200 font-bold">16 / 16</td>
                <td className="p-2 border border-slate-200">Width of decision prediction and attention masking layers</td>
              </tr>
              <tr>
                <td className="p-2 border border-slate-200 font-mono">n_steps</td>
                <td className="p-2 border border-slate-200 font-bold">3</td>
                <td className="p-2 border border-slate-200">Number of sequential decision steps</td>
              </tr>
              <tr>
                <td className="p-2 border border-slate-200 font-mono">gamma</td>
                <td className="p-2 border border-slate-200 font-bold">1.3</td>
                <td className="p-2 border border-slate-200">Feature reuse penalty scaling factor across steps</td>
              </tr>
              <tr>
                <td className="p-2 border border-slate-200 font-mono">lambda_sparse</td>
                <td className="p-2 border border-slate-200 font-bold">1e-3</td>
                <td className="p-2 border border-slate-200">Sparsity regularization loss coefficient</td>
              </tr>
              <tr>
                <td className="p-2 border border-slate-200 font-mono">mask_type</td>
                <td className="p-2 border border-slate-200 font-bold">sparsemax</td>
                <td className="p-2 border border-slate-200">Euclidean projection for sparse probability attention vectors</td>
              </tr>
              <tr>
                <td className="p-2 border border-slate-200 font-mono">learning_rate</td>
                <td className="p-2 border border-slate-200 font-bold">0.02</td>
                <td className="p-2 border border-slate-200">Adam optimizer base learning rate with StepLR(step=50, gamma=0.9)</td>
              </tr>
              <tr>
                <td className="p-2 border border-slate-200 font-mono">batch_size</td>
                <td className="p-2 border border-slate-200 font-bold">{hyperparameters.batch_size || 32}</td>
                <td className="p-2 border border-slate-200">Virtual batch size: {hyperparameters.virtual_batch_size || 16}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 5. Metrics Cards */}
      <section className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
          5. Test Set Performance Metrics
        </h3>
        <p className="text-xs text-slate-500">
          Evaluated on the held-out 15% test split ({distributions.split.test_size} responses).
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs font-semibold text-slate-500 uppercase">Test Accuracy</span>
            <div className="text-2xl font-black text-indigo-700 mt-1">
              {(metrics.accuracy * 100).toFixed(1)}%
            </div>
            <span className="text-[11px] text-slate-400">Exact label match</span>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs font-semibold text-slate-500 uppercase">Macro F1</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{metrics.macro_f1}</div>
            <span className="text-[11px] text-slate-400">Unweighted mean F1</span>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs font-semibold text-slate-500 uppercase">Weighted F1</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{metrics.weighted_f1}</div>
            <span className="text-[11px] text-slate-400">Support weighted F1</span>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs font-semibold text-slate-500 uppercase">Balanced Accuracy</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{metrics.balanced_accuracy}</div>
            <span className="text-[11px] text-slate-400">Macro recall average</span>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs font-semibold text-slate-500 uppercase">Cohen's Kappa</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{metrics.cohen_kappa}</div>
            <span className="text-[11px] text-slate-400">Inter-rater chance agreement</span>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs font-semibold text-slate-500 uppercase">MCC</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{metrics.mcc}</div>
            <span className="text-[11px] text-slate-400">Matthews correlation</span>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs font-semibold text-slate-500 uppercase">Macro ROC-AUC</span>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {metrics.roc_auc_macro_ovr !== null ? metrics.roc_auc_macro_ovr : 'N/A'}
            </div>
            <span className="text-[11px] text-slate-400">One-vs-Rest area</span>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs font-semibold text-slate-500 uppercase">Train / Val Acc</span>
            <div className="text-lg font-black text-slate-800 mt-1">
              {(metrics.train_accuracy * 100).toFixed(1)}% / {(metrics.val_accuracy * 100).toFixed(1)}%
            </div>
            <span className="text-[11px] text-slate-400">Training split accuracy</span>
          </div>
        </div>

        {/* Cross validation summary */}
        {metrics.cross_validation && (
          <div className="p-4 rounded-lg bg-indigo-50/40 border border-indigo-100 text-xs text-indigo-950 mt-4">
            <span className="font-bold">5-Fold Cross Validation Check: </span>
            {metrics.cross_validation.performed ? (
              <span>
                Mean Accuracy: {(metrics.cross_validation.mean_accuracy! * 100).toFixed(1)}% ±{' '}
                {(metrics.cross_validation.sd_accuracy! * 100).toFixed(1)}% | Mean Macro F1:{' '}
                {metrics.cross_validation.mean_macro_f1} ± {metrics.cross_validation.sd_macro_f1}
              </span>
            ) : (
              <span className="text-slate-600">Skipped ({metrics.cross_validation.reason})</span>
            )}
          </div>
        )}
      </section>

      {/* 6. Per-Class Table */}
      <section className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
          6. Per-Class Performance Breakdown
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-slate-200">
            <thead>
              <tr className="bg-slate-100 text-slate-800">
                <th className="p-2 border border-slate-200">Profile</th>
                <th className="p-2 border border-slate-200">Precision</th>
                <th className="p-2 border border-slate-200">Recall</th>
                <th className="p-2 border border-slate-200">F1-Score</th>
                <th className="p-2 border border-slate-200">Support (Test)</th>
              </tr>
            </thead>
            <tbody>
              {metrics.per_class.map((pc) => (
                <tr key={pc.profile_id}>
                  <td className="p-2 border border-slate-200 font-semibold text-slate-900">
                    {pc.profile_id}. {pc.name}
                  </td>
                  <td className="p-2 border border-slate-200 font-mono">{pc.precision}</td>
                  <td className="p-2 border border-slate-200 font-mono">{pc.recall}</td>
                  <td className="p-2 border border-slate-200 font-mono font-bold">{pc.f1}</td>
                  <td className="p-2 border border-slate-200 font-mono">{pc.support}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 7. Confusion Matrix */}
      <section className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
          7. Confusion Matrix (Held-out Test Split)
        </h3>
        <p className="text-xs text-slate-500">
          Row indicates actual prototype rule label; column indicates model predicted profile. Diagonal entries represent correct classifications.
        </p>
        <Heatmap
          matrix={metrics.confusion_matrix.matrix}
          rowLabels={metrics.confusion_matrix.labels}
          colLabels={metrics.confusion_matrix.labels}
        />
      </section>

      {/* 8. Global Feature Importance */}
      <section className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
          8. Global TabNet Feature Importance (Top 15 Items)
        </h3>
        <p className="text-xs text-slate-500">
          Calculated from average attention masks across the entire training split.
        </p>
        <BarChart
          data={feature_importance.slice(0, 15).map((fi) => ({
            label: `[${fi.quotient}] ${fi.short}`,
            value: Math.round(fi.importance * 100),
            color: '#6366f1'
          }))}
          orientation="horizontal"
          max={100}
          valueFormatter={(v) => `${v}%`}
        />
      </section>

      {/* 9. Training Curves */}
      <section className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
          9. Training Learning Curves
        </h3>
        <p className="text-xs text-slate-500">
          Per-epoch training loss and validation accuracy throughout the training duration.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <LineChart
              title="Training Loss per Epoch"
              series={[
                {
                  name: 'Train Loss',
                  color: '#ef4444',
                  points: metrics.history.loss
                }
              ]}
              yLabel="Cross-Entropy + Sparsity Loss"
            />
          </div>
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <LineChart
              title="Validation Accuracy per Epoch"
              series={[
                {
                  name: 'Val Accuracy',
                  color: '#10b981',
                  points: metrics.history.val_accuracy
                }
              ]}
              yLabel="Validation Accuracy"
            />
          </div>
        </div>
      </section>

      {/* 10. Metric Glossary */}
      <section className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
          10. Metric Definitions Glossary
        </h3>
        <div className="space-y-2 text-xs">
          <details className="p-3 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer">
            <summary className="font-semibold text-slate-800">Accuracy & Balanced Accuracy</summary>
            <p className="mt-2 text-slate-600 leading-relaxed">
              <strong>Accuracy:</strong> Proportion of total correct predictions: (TP + TN) / Total.
              <br />
              <strong>Balanced Accuracy:</strong> Arithmetic mean of recall across every class, avoiding distortion from majority classes in imbalanced distributions.
            </p>
          </details>
          <details className="p-3 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer">
            <summary className="font-semibold text-slate-800">Precision, Recall & F1-Score</summary>
            <p className="mt-2 text-slate-600 leading-relaxed">
              <strong>Precision:</strong> TP / (TP + FP) — proportion of predicted positives that were true.
              <br />
              <strong>Recall:</strong> TP / (TP + FN) — proportion of true positives correctly identified.
              <br />
              <strong>F1-Score:</strong> Harmonic mean of precision and recall: 2 * (P * R) / (P + R).
              <br />
              <strong>Macro F1:</strong> Simple average of F1-scores across all classes without weighting by sample size.
            </p>
          </details>
          <details className="p-3 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer">
            <summary className="font-semibold text-slate-800">Cohen's Kappa & Matthews Correlation (MCC)</summary>
            <p className="mt-2 text-slate-600 leading-relaxed">
              <strong>Cohen's Kappa:</strong> Measures inter-rater agreement between predicted and true labels beyond chance agreement.
              <br />
              <strong>MCC:</strong> Correlation coefficient between observed and predicted binary classifications, balanced even with very different class sizes (-1 to +1).
            </p>
          </details>
          <details className="p-3 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer">
            <summary className="font-semibold text-slate-800">One-vs-Rest ROC-AUC</summary>
            <p className="mt-2 text-slate-600 leading-relaxed">
              <strong>ROC-AUC (Macro OVR):</strong> Computes Area Under the Receiver Operating Characteristic curve for each profile against all other profiles combined, then averages across classes.
            </p>
          </details>
        </div>
      </section>
    </div>
  );
};

