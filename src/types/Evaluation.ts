export type GroundTruthEntry = {
	claim: string;
	expectedVerdict: Verdict;
};

export type Verdict =
	| "True"
	| "False"
	| "Partially True"
	| "Cannot Determine from Sources";
