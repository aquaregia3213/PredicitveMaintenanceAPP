# Instructions for AI Coding Model: Update Predictive Maintenance Dashboard Website

You are updating an existing website with two pages: **Analytics Dashboard** and **About the Model**.
Use the exact data below — sourced directly from IBM Watson AutoAI (Pipeline 5: Snap Random Forest
Classifier) — to correct, complete, and enrich both pages. Do not invent numbers. Do not round
differently than shown. If a value below conflicts with a placeholder already on the site, **replace
the placeholder with the value below.**

---

## 0. Source of truth (model identity)

- Project: `Predictive_Maintenance`
- Pipeline: **Pipeline 5** (Rank 1 on leaderboard)
- Algorithm: **Batched Tree Ensemble Classifier (Snap Random Forest Classifier)**
- Specialization: `INCR` (incremental learning)
- Enhancements: `HPO-1`, `FE`, `+2`
- Prediction column: `Failure Type`
- Number of features used by pipeline: **5**
- Number of evaluation instances: **1000**
- Model created on: **29/06/2026, 11:05:19**
- Powered by: IBM watsonx.ai (AutoAI)

---

## 1. Model Evaluation Metrics — Holdout vs Cross-Validation

Render this as a proper comparison table (Holdout column vs Cross-validation column), not just single
numbers. Currently the dashboard only shows Holdout-style numbers under slightly wrong labels — fix so
"F1 macro" is NOT mislabeled as "F1 Macro Score = 99.52" (that number in the existing dashboard is wrong;
correct F1 macro is 0.797, not 0.9952 — do not confuse F1 macro with weighted F1).

| Measure | Holdout score | Cross-validation score |
|---|---|---|
| Precision macro | 0.797 | 0.783 |
| Accuracy | 0.996 | 0.995 |
| Recall macro | 0.797 | 0.770 |
| Weighted precision | 0.994 | 0.994 |
| F1 macro | 0.797 | 0.774 |
| Weighted F1 measure | 0.995 | 0.994 |
| Weighted recall | 0.996 | 0.995 |
| Log loss | 0.080 | 0.090 |

### Important correction / nuance to display prominently
This is a **highly imbalanced multi-class dataset** (96.6% "No Failure"). Because of this:
- **Accuracy (99.6%) and weighted metrics (~0.994–0.996) look excellent but are inflated** by the
  dominant "No Failure" class.
- **Macro-averaged metrics (Precision macro 0.797, Recall macro 0.797, F1 macro 0.797)** are the
  more honest measure of how well the model detects the *rare failure classes*, and they are noticeably
  lower.
- The About page and the dashboard summary cards MUST explain this distinction in plain language (see
  Section 6, "About" copy). Do not present only the 99%+ numbers without this caveat — that would be
  misleading to anyone reading the dashboard.

### Top summary cards (the 5 KPI cards at the top of Analytics page)
Replace current card values with the **actual Holdout scores**:

| Card label | Correct value | Subtext |
|---|---|---|
| Model Accuracy | **99.6%** | AutoAI Champion (Holdout) |
| F1 Macro Score | **0.797** | Macro-averaged (rare-class honest score) |
| Model Precision (macro) | **79.7%** | False-positive control across all classes |
| Model Recall (macro) | **79.7%** | False-negative safety across all classes |
| AutoAI Optim. Time | keep existing 18.4s if no better source exists; otherwise mark as "N/A — not available from export" | Leaderboard run |

Add a 6th small card or footnote: **"Weighted F1: 0.995 · Weighted Precision: 0.994 · Weighted Recall: 0.996"**
so viewers can see both macro and weighted side-by-side rather than only one.

---

## 2. Confusion Matrix (add this as a new chart/table on Analytics page — it is currently missing)

Render as a 6x6 heatmap/table exactly as follows (rows = Observed, columns = Predicted):

| Observed \ Predicted | Heat Dissipation Failure | No Failure | Overstrain Failure | Power Failure | Random Failures | Tool Wear Failure | % Correct |
|---|---|---|---|---|---|---|---|
| Heat Dissipation Failure | 10 | 0 | 1 | 0 | 0 | 0 | 90.9% |
| No Failure | 0 | 965 | 0 | 0 | 0 | 0 | 100.0% |
| Overstrain Failure | 1 | 0 | 7 | 0 | 0 | 0 | 87.5% |
| Power Failure | 0 | 0 | 0 | 10 | 0 | 0 | 100.0% |
| Random Failures | 0 | 2 | 0 | 0 | 0 | 0 | **0.0%** |
| Tool Wear Failure | 0 | 0 | 0 | 0 | 0 | 4 | 100.0% |
| **% correct (column)** | 90.9% | 99.8% | 87.5% | 100.0% | 0.0% | 100.0% | **99.6% overall** |

Color scale: blue (less correct) → green (more correct), matching original IBM UI style.

**Callout to add near this chart:** "Random Failures" class has 0% detection accuracy in this holdout
set (both instances were misclassified as 'No Failure'). This is the model's weakest point and should
be flagged as a known limitation, not hidden.

---

## 3. Three multi-line charts from `Details.pdf` — ADD ALL THREE with a written summary/conclusion under each

These three charts are currently **NOT on the website** and must be added as new chart components on the
Analytics page (or a new "Model Diagnostics" section). Each has 4 colored lines representing the 4
minority failure classes evaluated at multiple thresholds (colors approx: green, red/pink, teal, dark
maroon — these correspond to 4 of the failure-type classes; exact class-to-color legend was not labeled
in the export, so label lines generically as "Class A/B/C/D" unless the AI model can infer them from
context, and note this ambiguity in a small caption).

### 3.1 Precision vs Threshold
- X-axis: Threshold (0 to 1, step 0.1)
- Y-axis: Precision (0 to 1)
- Behavior: One line (green) stays flat near 1.0 across nearly all thresholds. One line (red/pink)
  rises steeply from ~0.83 at threshold 0.1 to ~1.0 by threshold 0.6–0.8, then drops slightly near 1.0.
  Two lines (teal and dark maroon) are volatile — both start around 0.65–0.70 at threshold 0.1, peak
  around 0.8–0.87 at threshold 0.4–0.6, then diverge sharply: the dark maroon line collapses steeply
  to ~0.22 by threshold 0.9 (a major precision breakdown at high thresholds), while the teal line
  declines more gradually to ~0.63 by threshold 1.0.

**Required written conclusion to place under this chart:**
> "Precision is highly threshold-dependent for the minority failure classes. One class maintains
> near-perfect precision regardless of threshold, but at least one other class (dark maroon)
> collapses to just ~22% precision at high thresholds (0.9), meaning at stricter decision boundaries
> this class produces mostly false positives. This indicates the optimal classification threshold is
> not one-size-fits-all across failure types — a threshold tuned for one failure class may severely
> hurt precision for another."

### 3.2 Precision vs Recall
- X-axis: Recall (0 to 1)
- Y-axis: Precision (0 to 1)
- Behavior: One line (green) stays near precision = 1.0 across almost the entire recall range up to
  recall = 1. Most other lines (red, teal, dark maroon, blue) show precision holding near/above 0.8
  until recall approaches ~0.9–1.0, at which point precision **drops sharply/vertically** — falling as
  low as 0.0–0.5 at recall = 1.0 for several classes (particularly a steep vertical drop visible for
  multiple classes right at recall=1).

**Required written conclusion to place under this chart:**
> "There is a clear precision–recall trade-off for the rarer failure classes: pushing recall to 100%
> (catching every true failure of that type) causes precision to collapse for most classes, meaning
> the model would generate substantially more false alarms if tuned to never miss a failure. Only one
> class sustains high precision even at full recall. This confirms the earlier macro-metric finding —
> the model performs excellently on the majority class but trades off precision heavily when trying to
> catch every rare-class failure."

### 3.3 ROC Curve (True Positive Rate vs False Positive Rate)
- X-axis: False Positive Rate (1 − specificity), 0 to 1
- Y-axis: True Positive Rate (sensitivity), 0 to 1
- Behavior: A green line and a dark red/maroon line rise almost immediately to TPR = 1.0 at very low
  FPR (near-perfect classifiers for their respective classes, hugging the top-left corner). A blue line
  rises more gradually, reaching TPR ≈ 0.83 by FPR ≈ 0.05, then climbing gradually to 1.0 — a good but
  less sharp curve. A magenta/pink line tracks close to the diagonal (the "no skill" reference line)
  for most of its range before rising steeply only near FPR = 1 — indicating near-random performance
  for that class across most of the threshold range.

**Required written conclusion to place under this chart:**
> "ROC analysis shows a split in class-level performance: two failure classes are classified almost
> perfectly (curves hug the top-left corner), one class performs reasonably well but with a more
> gradual trade-off between true and false positive rates, and one class performs close to random
> guessing (its curve tracks near the diagonal reference line) until very high false-positive rates.
> This uneven performance across classes is consistent with the small sample sizes for rare failure
> types (as few as 18–45 examples in the dataset) and should be treated as the primary weakness of this
> model."

**Overall 3-chart combined takeaway (add as a boxed callout at the end of this diagnostics section):**
> "Across all three diagnostic charts, the pattern is consistent: this model's 99.6% headline accuracy
> is driven almost entirely by the dominant 'No Failure' class. For the minority failure types —
> especially Random Failures and Tool Wear Failure, which have the fewest training examples — precision
> and recall are far more volatile and threshold-sensitive. Anyone deploying this model in production
> should tune the decision threshold per failure class rather than using a single global threshold, and
> should treat predictions for low-sample classes with more caution."

---

## 4. Feature Importance Chart (already partially on site — verify/correct)

Bar chart, ranked descending, horizontal bars:

| Feature | Relative importance (rank order, longest bar first) |
|---|---|
| Torque | Highest (longest bar, ~40+ units) |
| Tool Wear | 2nd highest |
| RPM (Rotational speed) | 3rd |
| Temp Diff (ΔT) | 4th |
| Air Temp | 5th |
| Process Temp | Lowest |

Axis: 0 to 45 (approx scale shown in source chart).
Label the chart "XGBoost Feature Importance Weights (AutoAI)" — keep as-is, this is already correct on
the current site, just verify the six-feature ranking above is exactly reflected (Torque must be
clearly the longest bar, Process Temp clearly the shortest).

Note: this 6-feature importance chart used for ranking is a **different, larger feature set** than the
"Number of features: 5" used by the actual deployed Pipeline 5 model info panel — the model info panel
counts the AutoAI-generated/transformed features fed into Snap Random Forest, not the raw engineered
features shown in this chart. Add a small footnote clarifying this so it isn't read as a contradiction:
> "Note: the AutoAI pipeline uses 5 transformed/engineered features internally; the chart above ranks
> importance of the underlying raw sensor signals that feed those engineered features."

---

## 5. Failure Code Distribution + Dataset Breakdown (verify existing numbers — these are correct, keep them)

Failure code distribution (donut chart), confirmed counts:

| Failure Type | Count | % |
|---|---|---|
| Heat Dissipation (HDF) | 115 | 33.9% |
| Power Failure (PWF) | 95 | 28.0% |
| Tool Wear (TWF) | 45 | 13.3% |
| Overstrain (OSF) | 98 | 28.9% |
| Random (RNF) | 18 | 5.3% |

(Note: these percentages are % of *failure* rows only, they will not sum with "No Failure" — this is
percentage-of-failures breakdown, not percentage of full dataset. Keep this framing clear in the chart
subtitle: "Proportion of failures classified in the entire dataset" — i.e., among only the failed units.)

Dataset breakdown summary cards (confirm unchanged):

| Metric | Value | Note |
|---|---|---|
| Telemetry record rows | 10,000 rows | 100% Volume |
| Healthy samples | 9,661 rows | 96.6% Ratio |
| Critical anomalies | 339 rows | 3.39% Ratio |

**Grade filter (L / M / H) — currently the filter buttons exist ("All Grades", "Grade L", "Grade M",
"Grade H") but functionality/data per grade may not be implemented.** The AI model must:
1. Compute the above KPI cards, donut chart, and confusion-matrix-adjacent stats **separately per
   Product ID grade** (Product ID prefix L / M / H in the source CSV — L = Low, M = Medium, H = High
   quality variant) by filtering the underlying `predictive_maintenance.csv` on the `Type` column
   (values: L, M, H).
2. Wire the existing Grade L / Grade M / Grade H buttons so clicking them actually re-filters all charts
   on the page (donut chart, KPI cards, dataset breakdown cards) to that subset of rows, and "All Grades
   (10k)" resets to the full dataset.
3. If per-grade breakdown of the confusion matrix / precision-recall / ROC charts (Section 2 and 3) is
   not computable from available exported data (since those are IBM AutoAI holdout evaluation outputs,
   not something recomputable per grade without retraining), leave those diagnostic charts showing
   "All Grades" data only, and add a small note: "Diagnostic charts (confusion matrix, precision/recall,
   ROC) reflect the full holdout set and are not currently split by grade."

---

## 6. Friction Bounds: Torque vs Rotational Speed chart (verify — keep, but check axis logic)

- X-axis: Rotational speed (rpm), range shown ~1200–2800
- Two lines: "Fatigue Torque (Nm)" (dashed red) and "Optimal Torque Profile (Nm)" (solid black)
- Y-axis: appears to go 0–80 in the combined dashboard view
- Behavior: both lines decline as RPM increases (inverse relationship — higher speed, lower sustainable
  torque), with the Fatigue Torque (red dashed) line consistently sitting slightly above the Optimal
  Torque Profile (solid black) line, meaning there's a small safety margin between the two at every RPM
  level, narrowing at higher RPM.

Keep this chart, but add a one-line caption/conclusion:
> "As rotational speed increases, the safe torque envelope narrows — the margin between the fatigue
> limit and the optimal operating profile shrinks at higher RPM, meaning failures are more likely if
> torque isn't reduced proportionally at high speeds."

---

## 7. Page-by-page structure required

### PAGE 1 — "Analytics & Performance" (Analytics Dashboard)
Must contain, top to bottom, in this order:
1. Header + Grade filter buttons (All / L / M / H) — must be functional (see Section 5)
2. KPI summary cards (Section 1)
3. Failure Code Distribution donut + Friction Bounds chart (existing — keep, add caption from Section 6)
4. **NEW: Confusion Matrix** (Section 2)
5. **NEW: Model Diagnostics section** with all 3 multi-line charts + individual conclusions + combined
   takeaway callout (Section 3)
6. Feature Importance chart + Dataset Breakdown cards (existing — keep, add footnote from Section 4)

### PAGE 2 — "About the Model" (new or existing page — populate fully)
Must contain:
1. **Model identity block** (Section 0): algorithm name, pipeline rank, specialization, enhancements,
   prediction target, creation date, "Powered by IBM watsonx.ai"
2. **Plain-language explanation** of what the model does: predicts one of 6 outcomes (No Failure, Heat
   Dissipation Failure, Power Failure, Overstrain Failure, Tool Wear Failure, Random Failures) for a
   manufacturing machine based on 5 sensor-derived engineered features, with Torque and Tool Wear being
   the most influential raw signals.
3. **Honest limitations section** (required, do not omit) covering:
   - Severe class imbalance (96.6% no-failure) inflates headline accuracy
   - Macro metrics (~0.797) are more representative of true rare-class performance than accuracy
   - "Random Failures" class had 0% detection in the confusion matrix holdout
   - Precision/recall trade-offs are threshold- and class-dependent (reference the 3 diagnostic charts)
   - Small sample sizes for rare classes (18–45 examples) limit reliability of those class-level metrics
4. **Methodology block**: trained via IBM watsonx.ai AutoAI, Pipeline 5 selected as top-ranked by
   holdout accuracy among the leaderboard candidates, algorithm = Snap Random Forest Classifier wrapped
   in a Batched Tree Ensemble, incremental learning (INCR) specialization, hyperparameter optimization
   (HPO-1) and feature engineering (FE) enhancements applied.
5. Link/reference back to the Analytics page's diagnostic charts for supporting evidence.

---

## 8. Chart-creation instructions (general)

- Wherever a chart is described above as "NEW" or "add", the AI model must actually render a chart
  component (not just a text table) using whatever charting library the existing site already uses,
  matching the site's existing visual style (fonts, card borders, color palette — black/cream/serif
  headers, monospace uppercase labels, as seen in the existing "Analytics & Performance" cards).
- All new charts must include: a title, one-sentence subtitle/description (matching the tone of
  existing subtitles like "Proportion of failures classified in the entire dataset"), and — for the
  three multi-line diagnostic charts — the written conclusion paragraphs specified in Section 3 must
  appear directly beneath each chart, not just in a tooltip.
- Do not fabricate a class-color legend for the 3 diagnostic charts if it cannot be reliably inferred;
  instead add the ambiguity caption specified in Section 3.
- Preserve every existing correct number already on the site (Failure Code Distribution counts,
  Dataset Breakdown counts, Feature Importance ranking) — only fix the ones flagged as incorrect in
  Section 1 (the mislabeled "F1 Macro Score = 99.52" card).

---

## 9. Final checklist for the AI model to self-verify before finishing

- [ ] KPI cards show macro metrics (0.797) correctly, not mislabeled weighted metrics
- [ ] Holdout vs Cross-validation comparison table added
- [ ] Confusion matrix rendered with all 36 cells + row/column % correct, including the 0.0% Random
      Failures row
- [ ] All 3 diagnostic multi-line charts (Precision-Threshold, Precision-Recall, ROC) added with
      individual written conclusions AND the combined takeaway callout
- [ ] Feature importance ranking unchanged but footnote about 5 vs 6 features added
- [ ] Grade L/M/H filter buttons functionally wired to re-filter dashboard data
- [ ] About page contains identity block, plain-language explanation, limitations section, and
      methodology block
- [ ] No invented numbers — every statistic traces back to a value explicitly given in this document
