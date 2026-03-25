# Score Summary Notes

File: `docs/score_summary_template.csv`

## Field Notes

1. `passed_hard_gates`: TRUE only when all hard gates are TRUE.
2. `total_score`: weighted final score out of 100.
3. `business_score`: out of 35.
4. `model_score`: out of 45.
5. `engineering_score`: out of 20.
6. `*_rate` fields: use 0-1 decimal format.
7. `p95_latency_ms`: integer milliseconds.
8. `hard_gate_*`: TRUE/FALSE per gate.

## Recommended Update Flow

1. Fill metrics from `scoring_template.csv` aggregation.
2. Fill hard gates from benchmark threshold checks.
3. Add top 3 failures and next 3 fixes.
4. Keep one row per benchmark run.
