import type { CodeEvalSourceCodeLanguage } from "@/src/features/evals/utils/code-eval-template-starter-examples";

export type CodeEvalHoverDocs = Record<string, string>;

const TYPESCRIPT_SCORE_DOC = `type Score =
  | (ScoreBase & { dataType: "NUMERIC"; value: number })
  | (ScoreBase & { dataType: "BOOLEAN"; value: boolean })
  | (ScoreBase & { dataType: "CATEGORICAL"; value: string })
  | (ScoreBase & { dataType: "TEXT"; value: string });

type ScoreBase = {
  name: string;
  comment?: string;
  configId?: string | null;
  metadata?: Record<string, unknown>;
}

EvalBear 评估器（TypeScript）返回的评分。约定在编辑器顶部显示且已锁定。`;

const PYTHON_SCORE_DOC = `@dataclass
class Score:
    value: int | float | str | bool
    name: str
    data_type: str | None = None
    comment: str | None = None
    config_id: str | None = None
    metadata: dict[str, Any] | None = None

EvalBear 评估器（Python）返回的评分。`;

export const TYPESCRIPT_CODE_EVAL_HOVER_DOCS = {
  evaluate: `function evaluate(ctx: EvaluationContext): EvaluationResult

The TypeScript function EvalBear executes for each matched target observation.`,
  ctx: `parameter ctx: EvaluationContext

EvalBear 传递给评估的 TypeScript 值。`,
  EvaluationContext: `type EvaluationContext = {
  observation: {
    input: any;
    output: any;
    metadata: any;
  };
  experiment:
    | {
        itemExpectedOutput: any;
        itemMetadata: any;
      }
    | undefined;
}

EvalBear 传递给 TypeScript 评估器的数据。定义在编辑器顶部显示且已锁定。`,
  observation: `property EvaluationContext.observation: {
  input: any;
  output: any;
  metadata: any;
}

The observation selected by the evaluator target.`,
  experiment: `property EvaluationContext.experiment?: {
  itemExpectedOutput: any;
  itemMetadata: any;
}

评估器在实验上运行时存在的实验项数据。`,
  input: `property observation.input: any

观察上记录的输入。`,
  output: `property observation.output: any

观察上记录的输出。`,
  metadata: `property observation.metadata: any
property Score.metadata?: Record<string, unknown>

观察上记录的元数据，或随返回评分存储的额外元数据。`,
  itemExpectedOutput: `property experiment.itemExpectedOutput: any

实验项的预期输出。`,
  itemMetadata: `property experiment.itemMetadata: any

实验项的元数据。`,
  EvaluationResult: `type EvaluationResult = {
  scores: Score[];
}

evaluate 返回的值。`,
  Score: TYPESCRIPT_SCORE_DOC,
  scores: `property EvaluationResult.scores: Score[]

为目标观察创建的一个或多个 EvalBear 评分。`,
  dataType: `property Score.dataType: "NUMERIC" | "BOOLEAN" | "CATEGORICAL" | "TEXT"

EvalBear 评分数据类型。`,
  value: `property Score.value: number | string | boolean

评分值。允许的值取决于 dataType：NUMERIC 使用数字，BOOLEAN 使用布尔值，CATEGORICAL 或 TEXT 使用字符串。`,
  name: `property Score.name: string

评分名称。`,
  comment: `property Score.comment?: string

与评分一起存储的推理或解释。`,
  configId: `property Score.configId?: string | null

要附加到评分的评分配置 ID。`,
} satisfies CodeEvalHoverDocs;

export const PYTHON_CODE_EVAL_HOVER_DOCS = {
  evaluate: `def evaluate(ctx: EvaluationContext) -> EvaluationResult

EvalBear 为每个匹配的目标观察执行的 Python 函数。`,
  ctx: `parameter ctx: EvaluationContext

EvalBear 传递给评估的 Python 数据类值。`,
  Any: `typing.Any

用于 JSON 类型的评估器值，其具体类型取决于目标观察。`,
  dataclass: `dataclasses.dataclass

用于描述 Python 评估器上下文和结果类。`,
  ObservationContext: `@dataclass
class ObservationContext:
    input: Any = None
    output: Any = None
    metadata: Any = None

评估器目标选择的观察。`,
  ExperimentContext: `@dataclass
class ExperimentContext:
    item_expected_output: Any = None
    item_metadata: Any = None

评估器在实验上运行时存在的实验项数据。`,
  EvaluationContext: `@dataclass
class EvaluationContext:
    observation: ObservationContext
    experiment: ExperimentContext | None = None

EvalBear 传递给 Python 评估器的数据。`,
  EvaluationResult: `@dataclass
class EvaluationResult:
    scores: list[Score]

evaluate 返回的值。`,
  Score: PYTHON_SCORE_DOC,
  observation: `property ctx.observation: ObservationContext

评估器目标选择的观察。`,
  experiment: `property ctx.experiment: ExperimentContext | None

评估器在实验上运行时存在的实验项数据。`,
  input: `property observation.input: Any

观察上记录的输入。`,
  output: `property observation.output: Any

观察上记录的输出。`,
  metadata: `property observation.metadata or score.metadata

观察元数据在评估器上下文中可用。评分元数据存储返回评分的额外详情。`,
  item_expected_output: `property experiment.item_expected_output: Any

实验项的预期输出。`,
  item_metadata: `property experiment.item_metadata: Any

实验项的元数据。`,
  scores: `property result.scores: list[Score]

为目标观察创建的一个或多个 EvalBear 评分。`,
  data_type: `property score.data_type: str | None

EvalBear 评分数据类型。使用 NUMERIC、BOOLEAN、CATEGORICAL 或 TEXT。`,
  value: `property score.value: int | float | str | bool

评分值。允许的值取决于 data_type：NUMERIC 使用数字，BOOLEAN 使用布尔值，CATEGORICAL 或 TEXT 使用字符串。`,
  name: `property score.name: str

评分名称。`,
  comment: `property score.comment: str | None

与评分一起存储的推理或解释。`,
  config_id: `property score.config_id: str | None

要附加到评分的评分配置 ID。`,
} satisfies CodeEvalHoverDocs;

export function getCodeEvalHoverDocs(
  sourceCodeLanguage: CodeEvalSourceCodeLanguage,
): CodeEvalHoverDocs {
  return sourceCodeLanguage === "PYTHON"
    ? PYTHON_CODE_EVAL_HOVER_DOCS
    : TYPESCRIPT_CODE_EVAL_HOVER_DOCS;
}
