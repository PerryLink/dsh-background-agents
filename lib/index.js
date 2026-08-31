import { createRequire } from "node:module";
import Schema from "@deepseek-ai/schemastery";
import { SessionId } from "@deepseek-ai/dsh-session";
import { boundContextSummary, createUserMessage } from "@deepseek-ai/dsh-llm";
import { SubagentError, finalAssistantOutput } from "@deepseek-ai/dsh-subagent";
import { defineTool } from "@deepseek-ai/dsh-tools";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { Service } from "@deepseek-ai/cordis";
import { defineDomain, domainTable } from "@deepseek-ai/dsh-storage-domain";
//#region \0rolldown/runtime.js
var __commonJSMin = (cb, mod) => () => (mod || (cb((mod = { exports: {} }).exports, mod), cb = null), mod.exports);
//#endregion
//#region src/events.ts
/**
* The plugin-owned durable fact event: `background-agents/fact`, appended to
* the PARENT session log as a log-only record stamped with the envelope's
* `ignorable: true` marker. The harness opened this surface in the plugin's
* baseline (`Session.append(type, data, { ignorable: true })`, see
* ARCHITECTURE.md): readers that do not know the type skip the record
* instead of refusing the log, so older harness builds and older plugin
* versions keep loading parents written by this one.
*
* The fact channel carries the structured lifecycle facts (registered /
* message / stop / progress / archived) that the `backgroundAgents`
* projection folds into dashboard rows. It is deliberately separate from
* the model-visible channels — injected `user/message` notices and official
* `subagent-settled` accounts — so dashboard facts never depend on parsing
* human-readable text back apart. Legacy logs (v0.2.0 and earlier) carry the
* facts only through `tool/result` replay metadata and notice text; the
* projection folds both channels (see `projection.ts`).
*
* @module dsh-background-agents/events
*/
/** The log-only fact event type this plugin appends to parent sessions. */
const FACT_EVENT = "background-agents/fact";
//#endregion
//#region src/metrics.ts
/** Empty accumulator: no open turn, no token samples. */
const emptyTurnMetricState = {
	startAt: null,
	usageByStep: {}
};
/**
* Fold one child session event into the accumulator. Returns the next state
* plus, at `turn/end`, the completed turn's observation (with the state reset
* to empty for the next turn).
* @param state - the prior accumulator state.
* @param event - one child session event (already owned by the lifecycle observer).
* @returns the next state and, at `turn/end`, the observation.
*/
function foldTurnMetrics(state, event) {
	switch (event.type) {
		case "turn/start": return { state: {
			startAt: event.time,
			usageByStep: {}
		} };
		case "assistant/message": {
			const usage = event.data.usage;
			if (usage === void 0) return { state };
			return { state: {
				...state,
				usageByStep: {
					...state.usageByStep,
					[event.data.step]: {
						inputTokens: usage.inputTokens,
						outputTokens: usage.outputTokens
					}
				}
			} };
		}
		case "turn/end": {
			const usages = Object.values(state.usageByStep);
			const observation = {
				turn: event.data.turn,
				durationMs: state.startAt === null ? null : Math.max(0, event.time - state.startAt),
				inputTokens: usages.length === 0 ? null : usages.reduce((sum, usage) => sum + usage.inputTokens, 0),
				outputTokens: usages.length === 0 ? null : usages.reduce((sum, usage) => sum + usage.outputTokens, 0),
				error: event.data.reason.kind === "error"
			};
			return {
				state: emptyTurnMetricState,
				observation
			};
		}
		default: return { state };
	}
}
//#endregion
//#region node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/helpers/util.cjs
var require_util = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.getParsedType = exports.ZodParsedType = exports.objectUtil = exports.util = void 0;
	var util;
	(function(util) {
		util.assertEqual = (_) => {};
		function assertIs(_arg) {}
		util.assertIs = assertIs;
		function assertNever(_x) {
			throw new Error();
		}
		util.assertNever = assertNever;
		util.arrayToEnum = (items) => {
			const obj = {};
			for (const item of items) obj[item] = item;
			return obj;
		};
		util.getValidEnumValues = (obj) => {
			const validKeys = util.objectKeys(obj).filter((k) => typeof obj[obj[k]] !== "number");
			const filtered = {};
			for (const k of validKeys) filtered[k] = obj[k];
			return util.objectValues(filtered);
		};
		util.objectValues = (obj) => {
			return util.objectKeys(obj).map(function(e) {
				return obj[e];
			});
		};
		util.objectKeys = typeof Object.keys === "function" ? (obj) => Object.keys(obj) : (object) => {
			const keys = [];
			for (const key in object) if (Object.prototype.hasOwnProperty.call(object, key)) keys.push(key);
			return keys;
		};
		util.find = (arr, checker) => {
			for (const item of arr) if (checker(item)) return item;
		};
		util.isInteger = typeof Number.isInteger === "function" ? (val) => Number.isInteger(val) : (val) => typeof val === "number" && Number.isFinite(val) && Math.floor(val) === val;
		function joinValues(array, separator = " | ") {
			return array.map((val) => typeof val === "string" ? `'${val}'` : val).join(separator);
		}
		util.joinValues = joinValues;
		util.jsonStringifyReplacer = (_, value) => {
			if (typeof value === "bigint") return value.toString();
			return value;
		};
	})(util || (exports.util = util = {}));
	var objectUtil;
	(function(objectUtil) {
		objectUtil.mergeShapes = (first, second) => {
			return {
				...first,
				...second
			};
		};
	})(objectUtil || (exports.objectUtil = objectUtil = {}));
	exports.ZodParsedType = util.arrayToEnum([
		"string",
		"nan",
		"number",
		"integer",
		"float",
		"boolean",
		"date",
		"bigint",
		"symbol",
		"function",
		"undefined",
		"null",
		"array",
		"object",
		"unknown",
		"promise",
		"void",
		"never",
		"map",
		"set"
	]);
	const getParsedType = (data) => {
		switch (typeof data) {
			case "undefined": return exports.ZodParsedType.undefined;
			case "string": return exports.ZodParsedType.string;
			case "number": return Number.isNaN(data) ? exports.ZodParsedType.nan : exports.ZodParsedType.number;
			case "boolean": return exports.ZodParsedType.boolean;
			case "function": return exports.ZodParsedType.function;
			case "bigint": return exports.ZodParsedType.bigint;
			case "symbol": return exports.ZodParsedType.symbol;
			case "object":
				if (Array.isArray(data)) return exports.ZodParsedType.array;
				if (data === null) return exports.ZodParsedType.null;
				if (data.then && typeof data.then === "function" && data.catch && typeof data.catch === "function") return exports.ZodParsedType.promise;
				if (typeof Map !== "undefined" && data instanceof Map) return exports.ZodParsedType.map;
				if (typeof Set !== "undefined" && data instanceof Set) return exports.ZodParsedType.set;
				if (typeof Date !== "undefined" && data instanceof Date) return exports.ZodParsedType.date;
				return exports.ZodParsedType.object;
			default: return exports.ZodParsedType.unknown;
		}
	};
	exports.getParsedType = getParsedType;
}));
//#endregion
//#region node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/ZodError.cjs
var require_ZodError = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.ZodError = exports.quotelessJson = exports.ZodIssueCode = void 0;
	const util_js_1 = require_util();
	exports.ZodIssueCode = util_js_1.util.arrayToEnum([
		"invalid_type",
		"invalid_literal",
		"custom",
		"invalid_union",
		"invalid_union_discriminator",
		"invalid_enum_value",
		"unrecognized_keys",
		"invalid_arguments",
		"invalid_return_type",
		"invalid_date",
		"invalid_string",
		"too_small",
		"too_big",
		"invalid_intersection_types",
		"not_multiple_of",
		"not_finite"
	]);
	const quotelessJson = (obj) => {
		return JSON.stringify(obj, null, 2).replace(/"([^"]+)":/g, "$1:");
	};
	exports.quotelessJson = quotelessJson;
	var ZodError = class ZodError extends Error {
		get errors() {
			return this.issues;
		}
		constructor(issues) {
			super();
			this.issues = [];
			this.addIssue = (sub) => {
				this.issues = [...this.issues, sub];
			};
			this.addIssues = (subs = []) => {
				this.issues = [...this.issues, ...subs];
			};
			const actualProto = new.target.prototype;
			if (Object.setPrototypeOf) Object.setPrototypeOf(this, actualProto);
			else this.__proto__ = actualProto;
			this.name = "ZodError";
			this.issues = issues;
		}
		format(_mapper) {
			const mapper = _mapper || function(issue) {
				return issue.message;
			};
			const fieldErrors = { _errors: [] };
			const processError = (error) => {
				for (const issue of error.issues) if (issue.code === "invalid_union") issue.unionErrors.map(processError);
				else if (issue.code === "invalid_return_type") processError(issue.returnTypeError);
				else if (issue.code === "invalid_arguments") processError(issue.argumentsError);
				else if (issue.path.length === 0) fieldErrors._errors.push(mapper(issue));
				else {
					let curr = fieldErrors;
					let i = 0;
					while (i < issue.path.length) {
						const el = issue.path[i];
						if (!(i === issue.path.length - 1)) curr[el] = curr[el] || { _errors: [] };
						else {
							curr[el] = curr[el] || { _errors: [] };
							curr[el]._errors.push(mapper(issue));
						}
						curr = curr[el];
						i++;
					}
				}
			};
			processError(this);
			return fieldErrors;
		}
		static assert(value) {
			if (!(value instanceof ZodError)) throw new Error(`Not a ZodError: ${value}`);
		}
		toString() {
			return this.message;
		}
		get message() {
			return JSON.stringify(this.issues, util_js_1.util.jsonStringifyReplacer, 2);
		}
		get isEmpty() {
			return this.issues.length === 0;
		}
		flatten(mapper = (issue) => issue.message) {
			const fieldErrors = {};
			const formErrors = [];
			for (const sub of this.issues) if (sub.path.length > 0) {
				const firstEl = sub.path[0];
				fieldErrors[firstEl] = fieldErrors[firstEl] || [];
				fieldErrors[firstEl].push(mapper(sub));
			} else formErrors.push(mapper(sub));
			return {
				formErrors,
				fieldErrors
			};
		}
		get formErrors() {
			return this.flatten();
		}
	};
	exports.ZodError = ZodError;
	ZodError.create = (issues) => {
		return new ZodError(issues);
	};
}));
//#endregion
//#region node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/locales/en.cjs
var require_en = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	const ZodError_js_1 = require_ZodError();
	const util_js_1 = require_util();
	const errorMap = (issue, _ctx) => {
		let message;
		switch (issue.code) {
			case ZodError_js_1.ZodIssueCode.invalid_type:
				if (issue.received === util_js_1.ZodParsedType.undefined) message = "Required";
				else message = `Expected ${issue.expected}, received ${issue.received}`;
				break;
			case ZodError_js_1.ZodIssueCode.invalid_literal:
				message = `Invalid literal value, expected ${JSON.stringify(issue.expected, util_js_1.util.jsonStringifyReplacer)}`;
				break;
			case ZodError_js_1.ZodIssueCode.unrecognized_keys:
				message = `Unrecognized key(s) in object: ${util_js_1.util.joinValues(issue.keys, ", ")}`;
				break;
			case ZodError_js_1.ZodIssueCode.invalid_union:
				message = `Invalid input`;
				break;
			case ZodError_js_1.ZodIssueCode.invalid_union_discriminator:
				message = `Invalid discriminator value. Expected ${util_js_1.util.joinValues(issue.options)}`;
				break;
			case ZodError_js_1.ZodIssueCode.invalid_enum_value:
				message = `Invalid enum value. Expected ${util_js_1.util.joinValues(issue.options)}, received '${issue.received}'`;
				break;
			case ZodError_js_1.ZodIssueCode.invalid_arguments:
				message = `Invalid function arguments`;
				break;
			case ZodError_js_1.ZodIssueCode.invalid_return_type:
				message = `Invalid function return type`;
				break;
			case ZodError_js_1.ZodIssueCode.invalid_date:
				message = `Invalid date`;
				break;
			case ZodError_js_1.ZodIssueCode.invalid_string:
				if (typeof issue.validation === "object") {
					if ("includes" in issue.validation) {
						message = `Invalid input: must include "${issue.validation.includes}"`;
						if (typeof issue.validation.position === "number") message = `${message} at one or more positions greater than or equal to ${issue.validation.position}`;
					} else if ("startsWith" in issue.validation) message = `Invalid input: must start with "${issue.validation.startsWith}"`;
					else if ("endsWith" in issue.validation) message = `Invalid input: must end with "${issue.validation.endsWith}"`;
					else util_js_1.util.assertNever(issue.validation);
				} else if (issue.validation !== "regex") message = `Invalid ${issue.validation}`;
				else message = "Invalid";
				break;
			case ZodError_js_1.ZodIssueCode.too_small:
				if (issue.type === "array") message = `Array must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `more than`} ${issue.minimum} element(s)`;
				else if (issue.type === "string") message = `String must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `over`} ${issue.minimum} character(s)`;
				else if (issue.type === "number") message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
				else if (issue.type === "bigint") message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
				else if (issue.type === "date") message = `Date must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${new Date(Number(issue.minimum))}`;
				else message = "Invalid input";
				break;
			case ZodError_js_1.ZodIssueCode.too_big:
				if (issue.type === "array") message = `Array must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `less than`} ${issue.maximum} element(s)`;
				else if (issue.type === "string") message = `String must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `under`} ${issue.maximum} character(s)`;
				else if (issue.type === "number") message = `Number must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
				else if (issue.type === "bigint") message = `BigInt must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
				else if (issue.type === "date") message = `Date must be ${issue.exact ? `exactly` : issue.inclusive ? `smaller than or equal to` : `smaller than`} ${new Date(Number(issue.maximum))}`;
				else message = "Invalid input";
				break;
			case ZodError_js_1.ZodIssueCode.custom:
				message = `Invalid input`;
				break;
			case ZodError_js_1.ZodIssueCode.invalid_intersection_types:
				message = `Intersection results could not be merged`;
				break;
			case ZodError_js_1.ZodIssueCode.not_multiple_of:
				message = `Number must be a multiple of ${issue.multipleOf}`;
				break;
			case ZodError_js_1.ZodIssueCode.not_finite:
				message = "Number must be finite";
				break;
			default:
				message = _ctx.defaultError;
				util_js_1.util.assertNever(issue);
		}
		return { message };
	};
	exports.default = errorMap;
}));
//#endregion
//#region node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/errors.cjs
var require_errors = /* @__PURE__ */ __commonJSMin(((exports) => {
	var __importDefault = exports && exports.__importDefault || function(mod) {
		return mod && mod.__esModule ? mod : { "default": mod };
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.defaultErrorMap = void 0;
	exports.setErrorMap = setErrorMap;
	exports.getErrorMap = getErrorMap;
	const en_js_1 = __importDefault(require_en());
	exports.defaultErrorMap = en_js_1.default;
	let overrideErrorMap = en_js_1.default;
	function setErrorMap(map) {
		overrideErrorMap = map;
	}
	function getErrorMap() {
		return overrideErrorMap;
	}
}));
//#endregion
//#region node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/helpers/parseUtil.cjs
var require_parseUtil = /* @__PURE__ */ __commonJSMin(((exports) => {
	var __importDefault = exports && exports.__importDefault || function(mod) {
		return mod && mod.__esModule ? mod : { "default": mod };
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.isAsync = exports.isValid = exports.isDirty = exports.isAborted = exports.OK = exports.DIRTY = exports.INVALID = exports.ParseStatus = exports.EMPTY_PATH = exports.makeIssue = void 0;
	exports.addIssueToContext = addIssueToContext;
	const errors_js_1 = require_errors();
	const en_js_1 = __importDefault(require_en());
	const makeIssue = (params) => {
		const { data, path, errorMaps, issueData } = params;
		const fullPath = [...path, ...issueData.path || []];
		const fullIssue = {
			...issueData,
			path: fullPath
		};
		if (issueData.message !== void 0) return {
			...issueData,
			path: fullPath,
			message: issueData.message
		};
		let errorMessage = "";
		const maps = errorMaps.filter((m) => !!m).slice().reverse();
		for (const map of maps) errorMessage = map(fullIssue, {
			data,
			defaultError: errorMessage
		}).message;
		return {
			...issueData,
			path: fullPath,
			message: errorMessage
		};
	};
	exports.makeIssue = makeIssue;
	exports.EMPTY_PATH = [];
	function addIssueToContext(ctx, issueData) {
		const overrideMap = (0, errors_js_1.getErrorMap)();
		const issue = (0, exports.makeIssue)({
			issueData,
			data: ctx.data,
			path: ctx.path,
			errorMaps: [
				ctx.common.contextualErrorMap,
				ctx.schemaErrorMap,
				overrideMap,
				overrideMap === en_js_1.default ? void 0 : en_js_1.default
			].filter((x) => !!x)
		});
		ctx.common.issues.push(issue);
	}
	exports.ParseStatus = class ParseStatus {
		constructor() {
			this.value = "valid";
		}
		dirty() {
			if (this.value === "valid") this.value = "dirty";
		}
		abort() {
			if (this.value !== "aborted") this.value = "aborted";
		}
		static mergeArray(status, results) {
			const arrayValue = [];
			for (const s of results) {
				if (s.status === "aborted") return exports.INVALID;
				if (s.status === "dirty") status.dirty();
				arrayValue.push(s.value);
			}
			return {
				status: status.value,
				value: arrayValue
			};
		}
		static async mergeObjectAsync(status, pairs) {
			const syncPairs = [];
			for (const pair of pairs) {
				const key = await pair.key;
				const value = await pair.value;
				syncPairs.push({
					key,
					value
				});
			}
			return ParseStatus.mergeObjectSync(status, syncPairs);
		}
		static mergeObjectSync(status, pairs) {
			const finalObject = {};
			for (const pair of pairs) {
				const { key, value } = pair;
				if (key.status === "aborted") return exports.INVALID;
				if (value.status === "aborted") return exports.INVALID;
				if (key.status === "dirty") status.dirty();
				if (value.status === "dirty") status.dirty();
				if (key.value !== "__proto__" && (typeof value.value !== "undefined" || pair.alwaysSet)) finalObject[key.value] = value.value;
			}
			return {
				status: status.value,
				value: finalObject
			};
		}
	};
	exports.INVALID = Object.freeze({ status: "aborted" });
	const DIRTY = (value) => ({
		status: "dirty",
		value
	});
	exports.DIRTY = DIRTY;
	const OK = (value) => ({
		status: "valid",
		value
	});
	exports.OK = OK;
	const isAborted = (x) => x.status === "aborted";
	exports.isAborted = isAborted;
	const isDirty = (x) => x.status === "dirty";
	exports.isDirty = isDirty;
	const isValid = (x) => x.status === "valid";
	exports.isValid = isValid;
	const isAsync = (x) => typeof Promise !== "undefined" && x instanceof Promise;
	exports.isAsync = isAsync;
}));
//#endregion
//#region node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/helpers/typeAliases.cjs
var require_typeAliases = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
}));
//#endregion
//#region node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/helpers/errorUtil.cjs
var require_errorUtil = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.errorUtil = void 0;
	var errorUtil;
	(function(errorUtil) {
		errorUtil.errToObj = (message) => typeof message === "string" ? { message } : message || {};
		errorUtil.toString = (message) => typeof message === "string" ? message : message?.message;
	})(errorUtil || (exports.errorUtil = errorUtil = {}));
}));
//#endregion
//#region node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/types.cjs
var require_types = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.discriminatedUnion = exports.date = exports.boolean = exports.bigint = exports.array = exports.any = exports.coerce = exports.ZodFirstPartyTypeKind = exports.late = exports.ZodSchema = exports.Schema = exports.ZodReadonly = exports.ZodPipeline = exports.ZodBranded = exports.BRAND = exports.ZodNaN = exports.ZodCatch = exports.ZodDefault = exports.ZodNullable = exports.ZodOptional = exports.ZodTransformer = exports.ZodEffects = exports.ZodPromise = exports.ZodNativeEnum = exports.ZodEnum = exports.ZodLiteral = exports.ZodLazy = exports.ZodFunction = exports.ZodSet = exports.ZodMap = exports.ZodRecord = exports.ZodTuple = exports.ZodIntersection = exports.ZodDiscriminatedUnion = exports.ZodUnion = exports.ZodObject = exports.ZodArray = exports.ZodVoid = exports.ZodNever = exports.ZodUnknown = exports.ZodAny = exports.ZodNull = exports.ZodUndefined = exports.ZodSymbol = exports.ZodDate = exports.ZodBoolean = exports.ZodBigInt = exports.ZodNumber = exports.ZodString = exports.ZodType = void 0;
	exports.NEVER = exports.void = exports.unknown = exports.union = exports.undefined = exports.tuple = exports.transformer = exports.symbol = exports.string = exports.strictObject = exports.set = exports.record = exports.promise = exports.preprocess = exports.pipeline = exports.ostring = exports.optional = exports.onumber = exports.oboolean = exports.object = exports.number = exports.nullable = exports.null = exports.never = exports.nativeEnum = exports.nan = exports.map = exports.literal = exports.lazy = exports.intersection = exports.instanceof = exports.function = exports.enum = exports.effect = void 0;
	exports.datetimeRegex = datetimeRegex;
	exports.custom = custom;
	const ZodError_js_1 = require_ZodError();
	const errors_js_1 = require_errors();
	const errorUtil_js_1 = require_errorUtil();
	const parseUtil_js_1 = require_parseUtil();
	const util_js_1 = require_util();
	var ParseInputLazyPath = class {
		constructor(parent, value, path, key) {
			this._cachedPath = [];
			this.parent = parent;
			this.data = value;
			this._path = path;
			this._key = key;
		}
		get path() {
			if (!this._cachedPath.length) {
				if (Array.isArray(this._key)) this._cachedPath.push(...this._path, ...this._key);
				else this._cachedPath.push(...this._path, this._key);
			}
			return this._cachedPath;
		}
	};
	const handleResult = (ctx, result) => {
		if ((0, parseUtil_js_1.isValid)(result)) return {
			success: true,
			data: result.value
		};
		else {
			if (!ctx.common.issues.length) throw new Error("Validation failed but no issues detected.");
			return {
				success: false,
				get error() {
					if (this._error) return this._error;
					const error = new ZodError_js_1.ZodError(ctx.common.issues);
					this._error = error;
					return this._error;
				}
			};
		}
	};
	function processCreateParams(params) {
		if (!params) return {};
		const { errorMap, invalid_type_error, required_error, description } = params;
		if (errorMap && (invalid_type_error || required_error)) throw new Error(`Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`);
		if (errorMap) return {
			errorMap,
			description
		};
		const customMap = (iss, ctx) => {
			const { message } = params;
			if (iss.code === "invalid_enum_value") return { message: message ?? ctx.defaultError };
			if (typeof ctx.data === "undefined") return { message: message ?? required_error ?? ctx.defaultError };
			if (iss.code !== "invalid_type") return { message: ctx.defaultError };
			return { message: message ?? invalid_type_error ?? ctx.defaultError };
		};
		return {
			errorMap: customMap,
			description
		};
	}
	var ZodType = class {
		get description() {
			return this._def.description;
		}
		_getType(input) {
			return (0, util_js_1.getParsedType)(input.data);
		}
		_getOrReturnCtx(input, ctx) {
			return ctx || {
				common: input.parent.common,
				data: input.data,
				parsedType: (0, util_js_1.getParsedType)(input.data),
				schemaErrorMap: this._def.errorMap,
				path: input.path,
				parent: input.parent
			};
		}
		_processInputParams(input) {
			return {
				status: new parseUtil_js_1.ParseStatus(),
				ctx: {
					common: input.parent.common,
					data: input.data,
					parsedType: (0, util_js_1.getParsedType)(input.data),
					schemaErrorMap: this._def.errorMap,
					path: input.path,
					parent: input.parent
				}
			};
		}
		_parseSync(input) {
			const result = this._parse(input);
			if ((0, parseUtil_js_1.isAsync)(result)) throw new Error("Synchronous parse encountered promise.");
			return result;
		}
		_parseAsync(input) {
			const result = this._parse(input);
			return Promise.resolve(result);
		}
		parse(data, params) {
			const result = this.safeParse(data, params);
			if (result.success) return result.data;
			throw result.error;
		}
		safeParse(data, params) {
			const ctx = {
				common: {
					issues: [],
					async: params?.async ?? false,
					contextualErrorMap: params?.errorMap
				},
				path: params?.path || [],
				schemaErrorMap: this._def.errorMap,
				parent: null,
				data,
				parsedType: (0, util_js_1.getParsedType)(data)
			};
			const result = this._parseSync({
				data,
				path: ctx.path,
				parent: ctx
			});
			return handleResult(ctx, result);
		}
		"~validate"(data) {
			const ctx = {
				common: {
					issues: [],
					async: !!this["~standard"].async
				},
				path: [],
				schemaErrorMap: this._def.errorMap,
				parent: null,
				data,
				parsedType: (0, util_js_1.getParsedType)(data)
			};
			if (!this["~standard"].async) try {
				const result = this._parseSync({
					data,
					path: [],
					parent: ctx
				});
				return (0, parseUtil_js_1.isValid)(result) ? { value: result.value } : { issues: ctx.common.issues };
			} catch (err) {
				if (err?.message?.toLowerCase()?.includes("encountered")) this["~standard"].async = true;
				ctx.common = {
					issues: [],
					async: true
				};
			}
			return this._parseAsync({
				data,
				path: [],
				parent: ctx
			}).then((result) => (0, parseUtil_js_1.isValid)(result) ? { value: result.value } : { issues: ctx.common.issues });
		}
		async parseAsync(data, params) {
			const result = await this.safeParseAsync(data, params);
			if (result.success) return result.data;
			throw result.error;
		}
		async safeParseAsync(data, params) {
			const ctx = {
				common: {
					issues: [],
					contextualErrorMap: params?.errorMap,
					async: true
				},
				path: params?.path || [],
				schemaErrorMap: this._def.errorMap,
				parent: null,
				data,
				parsedType: (0, util_js_1.getParsedType)(data)
			};
			const maybeAsyncResult = this._parse({
				data,
				path: ctx.path,
				parent: ctx
			});
			const result = await ((0, parseUtil_js_1.isAsync)(maybeAsyncResult) ? maybeAsyncResult : Promise.resolve(maybeAsyncResult));
			return handleResult(ctx, result);
		}
		refine(check, message) {
			const getIssueProperties = (val) => {
				if (typeof message === "string" || typeof message === "undefined") return { message };
				else if (typeof message === "function") return message(val);
				else return message;
			};
			return this._refinement((val, ctx) => {
				const result = check(val);
				const setError = () => ctx.addIssue({
					code: ZodError_js_1.ZodIssueCode.custom,
					...getIssueProperties(val)
				});
				if (typeof Promise !== "undefined" && result instanceof Promise) return result.then((data) => {
					if (!data) {
						setError();
						return false;
					} else return true;
				});
				if (!result) {
					setError();
					return false;
				} else return true;
			});
		}
		refinement(check, refinementData) {
			return this._refinement((val, ctx) => {
				if (!check(val)) {
					ctx.addIssue(typeof refinementData === "function" ? refinementData(val, ctx) : refinementData);
					return false;
				} else return true;
			});
		}
		_refinement(refinement) {
			return new ZodEffects({
				schema: this,
				typeName: ZodFirstPartyTypeKind.ZodEffects,
				effect: {
					type: "refinement",
					refinement
				}
			});
		}
		superRefine(refinement) {
			return this._refinement(refinement);
		}
		constructor(def) {
			/** Alias of safeParseAsync */
			this.spa = this.safeParseAsync;
			this._def = def;
			this.parse = this.parse.bind(this);
			this.safeParse = this.safeParse.bind(this);
			this.parseAsync = this.parseAsync.bind(this);
			this.safeParseAsync = this.safeParseAsync.bind(this);
			this.spa = this.spa.bind(this);
			this.refine = this.refine.bind(this);
			this.refinement = this.refinement.bind(this);
			this.superRefine = this.superRefine.bind(this);
			this.optional = this.optional.bind(this);
			this.nullable = this.nullable.bind(this);
			this.nullish = this.nullish.bind(this);
			this.array = this.array.bind(this);
			this.promise = this.promise.bind(this);
			this.or = this.or.bind(this);
			this.and = this.and.bind(this);
			this.transform = this.transform.bind(this);
			this.brand = this.brand.bind(this);
			this.default = this.default.bind(this);
			this.catch = this.catch.bind(this);
			this.describe = this.describe.bind(this);
			this.pipe = this.pipe.bind(this);
			this.readonly = this.readonly.bind(this);
			this.isNullable = this.isNullable.bind(this);
			this.isOptional = this.isOptional.bind(this);
			this["~standard"] = {
				version: 1,
				vendor: "zod",
				validate: (data) => this["~validate"](data)
			};
		}
		optional() {
			return ZodOptional.create(this, this._def);
		}
		nullable() {
			return ZodNullable.create(this, this._def);
		}
		nullish() {
			return this.nullable().optional();
		}
		array() {
			return ZodArray.create(this);
		}
		promise() {
			return ZodPromise.create(this, this._def);
		}
		or(option) {
			return ZodUnion.create([this, option], this._def);
		}
		and(incoming) {
			return ZodIntersection.create(this, incoming, this._def);
		}
		transform(transform) {
			return new ZodEffects({
				...processCreateParams(this._def),
				schema: this,
				typeName: ZodFirstPartyTypeKind.ZodEffects,
				effect: {
					type: "transform",
					transform
				}
			});
		}
		default(def) {
			const defaultValueFunc = typeof def === "function" ? def : () => def;
			return new ZodDefault({
				...processCreateParams(this._def),
				innerType: this,
				defaultValue: defaultValueFunc,
				typeName: ZodFirstPartyTypeKind.ZodDefault
			});
		}
		brand() {
			return new ZodBranded({
				typeName: ZodFirstPartyTypeKind.ZodBranded,
				type: this,
				...processCreateParams(this._def)
			});
		}
		catch(def) {
			const catchValueFunc = typeof def === "function" ? def : () => def;
			return new ZodCatch({
				...processCreateParams(this._def),
				innerType: this,
				catchValue: catchValueFunc,
				typeName: ZodFirstPartyTypeKind.ZodCatch
			});
		}
		describe(description) {
			const This = this.constructor;
			return new This({
				...this._def,
				description
			});
		}
		pipe(target) {
			return ZodPipeline.create(this, target);
		}
		readonly() {
			return ZodReadonly.create(this);
		}
		isOptional() {
			return this.safeParse(void 0).success;
		}
		isNullable() {
			return this.safeParse(null).success;
		}
	};
	exports.ZodType = ZodType;
	exports.Schema = ZodType;
	exports.ZodSchema = ZodType;
	const cuidRegex = /^c[^\s-]{8,}$/i;
	const cuid2Regex = /^[0-9a-z]+$/;
	const ulidRegex = /^[0-9A-HJKMNP-TV-Z]{26}$/i;
	const uuidRegex = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i;
	const nanoidRegex = /^[a-z0-9_-]{21}$/i;
	const jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
	const durationRegex = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/;
	const emailRegex = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i;
	const _emojiRegex = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
	let emojiRegex;
	const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
	const ipv4CidrRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/;
	const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
	const ipv6CidrRegex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
	const base64Regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
	const base64urlRegex = /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/;
	const dateRegexSource = `((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))`;
	const dateRegex = new RegExp(`^${dateRegexSource}$`);
	function timeRegexSource(args) {
		let secondsRegexSource = `[0-5]\\d`;
		if (args.precision) secondsRegexSource = `${secondsRegexSource}\\.\\d{${args.precision}}`;
		else if (args.precision == null) secondsRegexSource = `${secondsRegexSource}(\\.\\d+)?`;
		const secondsQuantifier = args.precision ? "+" : "?";
		return `([01]\\d|2[0-3]):[0-5]\\d(:${secondsRegexSource})${secondsQuantifier}`;
	}
	function timeRegex(args) {
		return new RegExp(`^${timeRegexSource(args)}$`);
	}
	function datetimeRegex(args) {
		let regex = `${dateRegexSource}T${timeRegexSource(args)}`;
		const opts = [];
		opts.push(args.local ? `Z?` : `Z`);
		if (args.offset) opts.push(`([+-]\\d{2}:?\\d{2})`);
		regex = `${regex}(${opts.join("|")})`;
		return new RegExp(`^${regex}$`);
	}
	function isValidIP(ip, version) {
		if ((version === "v4" || !version) && ipv4Regex.test(ip)) return true;
		if ((version === "v6" || !version) && ipv6Regex.test(ip)) return true;
		return false;
	}
	function isValidJWT(jwt, alg) {
		if (!jwtRegex.test(jwt)) return false;
		try {
			const [header] = jwt.split(".");
			if (!header) return false;
			const base64 = header.replace(/-/g, "+").replace(/_/g, "/").padEnd(header.length + (4 - header.length % 4) % 4, "=");
			const decoded = JSON.parse(atob(base64));
			if (typeof decoded !== "object" || decoded === null) return false;
			if ("typ" in decoded && decoded?.typ !== "JWT") return false;
			if (!decoded.alg) return false;
			if (alg && decoded.alg !== alg) return false;
			return true;
		} catch {
			return false;
		}
	}
	function isValidCidr(ip, version) {
		if ((version === "v4" || !version) && ipv4CidrRegex.test(ip)) return true;
		if ((version === "v6" || !version) && ipv6CidrRegex.test(ip)) return true;
		return false;
	}
	var ZodString = class ZodString extends ZodType {
		_parse(input) {
			if (this._def.coerce) input.data = String(input.data);
			if (this._getType(input) !== util_js_1.ZodParsedType.string) {
				const ctx = this._getOrReturnCtx(input);
				(0, parseUtil_js_1.addIssueToContext)(ctx, {
					code: ZodError_js_1.ZodIssueCode.invalid_type,
					expected: util_js_1.ZodParsedType.string,
					received: ctx.parsedType
				});
				return parseUtil_js_1.INVALID;
			}
			const status = new parseUtil_js_1.ParseStatus();
			let ctx = void 0;
			for (const check of this._def.checks) if (check.kind === "min") {
				if (input.data.length < check.value) {
					ctx = this._getOrReturnCtx(input, ctx);
					(0, parseUtil_js_1.addIssueToContext)(ctx, {
						code: ZodError_js_1.ZodIssueCode.too_small,
						minimum: check.value,
						type: "string",
						inclusive: true,
						exact: false,
						message: check.message
					});
					status.dirty();
				}
			} else if (check.kind === "max") {
				if (input.data.length > check.value) {
					ctx = this._getOrReturnCtx(input, ctx);
					(0, parseUtil_js_1.addIssueToContext)(ctx, {
						code: ZodError_js_1.ZodIssueCode.too_big,
						maximum: check.value,
						type: "string",
						inclusive: true,
						exact: false,
						message: check.message
					});
					status.dirty();
				}
			} else if (check.kind === "length") {
				const tooBig = input.data.length > check.value;
				const tooSmall = input.data.length < check.value;
				if (tooBig || tooSmall) {
					ctx = this._getOrReturnCtx(input, ctx);
					if (tooBig) (0, parseUtil_js_1.addIssueToContext)(ctx, {
						code: ZodError_js_1.ZodIssueCode.too_big,
						maximum: check.value,
						type: "string",
						inclusive: true,
						exact: true,
						message: check.message
					});
					else if (tooSmall) (0, parseUtil_js_1.addIssueToContext)(ctx, {
						code: ZodError_js_1.ZodIssueCode.too_small,
						minimum: check.value,
						type: "string",
						inclusive: true,
						exact: true,
						message: check.message
					});
					status.dirty();
				}
			} else if (check.kind === "email") {
				if (!emailRegex.test(input.data)) {
					ctx = this._getOrReturnCtx(input, ctx);
					(0, parseUtil_js_1.addIssueToContext)(ctx, {
						validation: "email",
						code: ZodError_js_1.ZodIssueCode.invalid_string,
						message: check.message
					});
					status.dirty();
				}
			} else if (check.kind === "emoji") {
				if (!emojiRegex) emojiRegex = new RegExp(_emojiRegex, "u");
				if (!emojiRegex.test(input.data)) {
					ctx = this._getOrReturnCtx(input, ctx);
					(0, parseUtil_js_1.addIssueToContext)(ctx, {
						validation: "emoji",
						code: ZodError_js_1.ZodIssueCode.invalid_string,
						message: check.message
					});
					status.dirty();
				}
			} else if (check.kind === "uuid") {
				if (!uuidRegex.test(input.data)) {
					ctx = this._getOrReturnCtx(input, ctx);
					(0, parseUtil_js_1.addIssueToContext)(ctx, {
						validation: "uuid",
						code: ZodError_js_1.ZodIssueCode.invalid_string,
						message: check.message
					});
					status.dirty();
				}
			} else if (check.kind === "nanoid") {
				if (!nanoidRegex.test(input.data)) {
					ctx = this._getOrReturnCtx(input, ctx);
					(0, parseUtil_js_1.addIssueToContext)(ctx, {
						validation: "nanoid",
						code: ZodError_js_1.ZodIssueCode.invalid_string,
						message: check.message
					});
					status.dirty();
				}
			} else if (check.kind === "cuid") {
				if (!cuidRegex.test(input.data)) {
					ctx = this._getOrReturnCtx(input, ctx);
					(0, parseUtil_js_1.addIssueToContext)(ctx, {
						validation: "cuid",
						code: ZodError_js_1.ZodIssueCode.invalid_string,
						message: check.message
					});
					status.dirty();
				}
			} else if (check.kind === "cuid2") {
				if (!cuid2Regex.test(input.data)) {
					ctx = this._getOrReturnCtx(input, ctx);
					(0, parseUtil_js_1.addIssueToContext)(ctx, {
						validation: "cuid2",
						code: ZodError_js_1.ZodIssueCode.invalid_string,
						message: check.message
					});
					status.dirty();
				}
			} else if (check.kind === "ulid") {
				if (!ulidRegex.test(input.data)) {
					ctx = this._getOrReturnCtx(input, ctx);
					(0, parseUtil_js_1.addIssueToContext)(ctx, {
						validation: "ulid",
						code: ZodError_js_1.ZodIssueCode.invalid_string,
						message: check.message
					});
					status.dirty();
				}
			} else if (check.kind === "url") try {
				new URL(input.data);
			} catch {
				ctx = this._getOrReturnCtx(input, ctx);
				(0, parseUtil_js_1.addIssueToContext)(ctx, {
					validation: "url",
					code: ZodError_js_1.ZodIssueCode.invalid_string,
					message: check.message
				});
				status.dirty();
			}
			else if (check.kind === "regex") {
				check.regex.lastIndex = 0;
				if (!check.regex.test(input.data)) {
					ctx = this._getOrReturnCtx(input, ctx);
					(0, parseUtil_js_1.addIssueToContext)(ctx, {
						validation: "regex",
						code: ZodError_js_1.ZodIssueCode.invalid_string,
						message: check.message
					});
					status.dirty();
				}
			} else if (check.kind === "trim") input.data = input.data.trim();
			else if (check.kind === "includes") {
				if (!input.data.includes(check.value, check.position)) {
					ctx = this._getOrReturnCtx(input, ctx);
					(0, parseUtil_js_1.addIssueToContext)(ctx, {
						code: ZodError_js_1.ZodIssueCode.invalid_string,
						validation: {
							includes: check.value,
							position: check.position
						},
						message: check.message
					});
					status.dirty();
				}
			} else if (check.kind === "toLowerCase") input.data = input.data.toLowerCase();
			else if (check.kind === "toUpperCase") input.data = input.data.toUpperCase();
			else if (check.kind === "startsWith") {
				if (!input.data.startsWith(check.value)) {
					ctx = this._getOrReturnCtx(input, ctx);
					(0, parseUtil_js_1.addIssueToContext)(ctx, {
						code: ZodError_js_1.ZodIssueCode.invalid_string,
						validation: { startsWith: check.value },
						message: check.message
					});
					status.dirty();
				}
			} else if (check.kind === "endsWith") {
				if (!input.data.endsWith(check.value)) {
					ctx = this._getOrReturnCtx(input, ctx);
					(0, parseUtil_js_1.addIssueToContext)(ctx, {
						code: ZodError_js_1.ZodIssueCode.invalid_string,
						validation: { endsWith: check.value },
						message: check.message
					});
					status.dirty();
				}
			} else if (check.kind === "datetime") {
				if (!datetimeRegex(check).test(input.data)) {
					ctx = this._getOrReturnCtx(input, ctx);
					(0, parseUtil_js_1.addIssueToContext)(ctx, {
						code: ZodError_js_1.ZodIssueCode.invalid_string,
						validation: "datetime",
						message: check.message
					});
					status.dirty();
				}
			} else if (check.kind === "date") {
				if (!dateRegex.test(input.data)) {
					ctx = this._getOrReturnCtx(input, ctx);
					(0, parseUtil_js_1.addIssueToContext)(ctx, {
						code: ZodError_js_1.ZodIssueCode.invalid_string,
						validation: "date",
						message: check.message
					});
					status.dirty();
				}
			} else if (check.kind === "time") {
				if (!timeRegex(check).test(input.data)) {
					ctx = this._getOrReturnCtx(input, ctx);
					(0, parseUtil_js_1.addIssueToContext)(ctx, {
						code: ZodError_js_1.ZodIssueCode.invalid_string,
						validation: "time",
						message: check.message
					});
					status.dirty();
				}
			} else if (check.kind === "duration") {
				if (!durationRegex.test(input.data)) {
					ctx = this._getOrReturnCtx(input, ctx);
					(0, parseUtil_js_1.addIssueToContext)(ctx, {
						validation: "duration",
						code: ZodError_js_1.ZodIssueCode.invalid_string,
						message: check.message
					});
					status.dirty();
				}
			} else if (check.kind === "ip") {
				if (!isValidIP(input.data, check.version)) {
					ctx = this._getOrReturnCtx(input, ctx);
					(0, parseUtil_js_1.addIssueToContext)(ctx, {
						validation: "ip",
						code: ZodError_js_1.ZodIssueCode.invalid_string,
						message: check.message
					});
					status.dirty();
				}
			} else if (check.kind === "jwt") {
				if (!isValidJWT(input.data, check.alg)) {
					ctx = this._getOrReturnCtx(input, ctx);
					(0, parseUtil_js_1.addIssueToContext)(ctx, {
						validation: "jwt",
						code: ZodError_js_1.ZodIssueCode.invalid_string,
						message: check.message
					});
					status.dirty();
				}
			} else if (check.kind === "cidr") {
				if (!isValidCidr(input.data, check.version)) {
					ctx = this._getOrReturnCtx(input, ctx);
					(0, parseUtil_js_1.addIssueToContext)(ctx, {
						validation: "cidr",
						code: ZodError_js_1.ZodIssueCode.invalid_string,
						message: check.message
					});
					status.dirty();
				}
			} else if (check.kind === "base64") {
				if (!base64Regex.test(input.data)) {
					ctx = this._getOrReturnCtx(input, ctx);
					(0, parseUtil_js_1.addIssueToContext)(ctx, {
						validation: "base64",
						code: ZodError_js_1.ZodIssueCode.invalid_string,
						message: check.message
					});
					status.dirty();
				}
			} else if (check.kind === "base64url") {
				if (!base64urlRegex.test(input.data)) {
					ctx = this._getOrReturnCtx(input, ctx);
					(0, parseUtil_js_1.addIssueToContext)(ctx, {
						validation: "base64url",
						code: ZodError_js_1.ZodIssueCode.invalid_string,
						message: check.message
					});
					status.dirty();
				}
			} else util_js_1.util.assertNever(check);
			return {
				status: status.value,
				value: input.data
			};
		}
		_regex(regex, validation, message) {
			return this.refinement((data) => regex.test(data), {
				validation,
				code: ZodError_js_1.ZodIssueCode.invalid_string,
				...errorUtil_js_1.errorUtil.errToObj(message)
			});
		}
		_addCheck(check) {
			return new ZodString({
				...this._def,
				checks: [...this._def.checks, check]
			});
		}
		email(message) {
			return this._addCheck({
				kind: "email",
				...errorUtil_js_1.errorUtil.errToObj(message)
			});
		}
		url(message) {
			return this._addCheck({
				kind: "url",
				...errorUtil_js_1.errorUtil.errToObj(message)
			});
		}
		emoji(message) {
			return this._addCheck({
				kind: "emoji",
				...errorUtil_js_1.errorUtil.errToObj(message)
			});
		}
		uuid(message) {
			return this._addCheck({
				kind: "uuid",
				...errorUtil_js_1.errorUtil.errToObj(message)
			});
		}
		nanoid(message) {
			return this._addCheck({
				kind: "nanoid",
				...errorUtil_js_1.errorUtil.errToObj(message)
			});
		}
		cuid(message) {
			return this._addCheck({
				kind: "cuid",
				...errorUtil_js_1.errorUtil.errToObj(message)
			});
		}
		cuid2(message) {
			return this._addCheck({
				kind: "cuid2",
				...errorUtil_js_1.errorUtil.errToObj(message)
			});
		}
		ulid(message) {
			return this._addCheck({
				kind: "ulid",
				...errorUtil_js_1.errorUtil.errToObj(message)
			});
		}
		base64(message) {
			return this._addCheck({
				kind: "base64",
				...errorUtil_js_1.errorUtil.errToObj(message)
			});
		}
		base64url(message) {
			return this._addCheck({
				kind: "base64url",
				...errorUtil_js_1.errorUtil.errToObj(message)
			});
		}
		jwt(options) {
			return this._addCheck({
				kind: "jwt",
				...errorUtil_js_1.errorUtil.errToObj(options)
			});
		}
		ip(options) {
			return this._addCheck({
				kind: "ip",
				...errorUtil_js_1.errorUtil.errToObj(options)
			});
		}
		cidr(options) {
			return this._addCheck({
				kind: "cidr",
				...errorUtil_js_1.errorUtil.errToObj(options)
			});
		}
		datetime(options) {
			if (typeof options === "string") return this._addCheck({
				kind: "datetime",
				precision: null,
				offset: false,
				local: false,
				message: options
			});
			return this._addCheck({
				kind: "datetime",
				precision: typeof options?.precision === "undefined" ? null : options?.precision,
				offset: options?.offset ?? false,
				local: options?.local ?? false,
				...errorUtil_js_1.errorUtil.errToObj(options?.message)
			});
		}
		date(message) {
			return this._addCheck({
				kind: "date",
				message
			});
		}
		time(options) {
			if (typeof options === "string") return this._addCheck({
				kind: "time",
				precision: null,
				message: options
			});
			return this._addCheck({
				kind: "time",
				precision: typeof options?.precision === "undefined" ? null : options?.precision,
				...errorUtil_js_1.errorUtil.errToObj(options?.message)
			});
		}
		duration(message) {
			return this._addCheck({
				kind: "duration",
				...errorUtil_js_1.errorUtil.errToObj(message)
			});
		}
		regex(regex, message) {
			return this._addCheck({
				kind: "regex",
				regex,
				...errorUtil_js_1.errorUtil.errToObj(message)
			});
		}
		includes(value, options) {
			return this._addCheck({
				kind: "includes",
				value,
				position: options?.position,
				...errorUtil_js_1.errorUtil.errToObj(options?.message)
			});
		}
		startsWith(value, message) {
			return this._addCheck({
				kind: "startsWith",
				value,
				...errorUtil_js_1.errorUtil.errToObj(message)
			});
		}
		endsWith(value, message) {
			return this._addCheck({
				kind: "endsWith",
				value,
				...errorUtil_js_1.errorUtil.errToObj(message)
			});
		}
		min(minLength, message) {
			return this._addCheck({
				kind: "min",
				value: minLength,
				...errorUtil_js_1.errorUtil.errToObj(message)
			});
		}
		max(maxLength, message) {
			return this._addCheck({
				kind: "max",
				value: maxLength,
				...errorUtil_js_1.errorUtil.errToObj(message)
			});
		}
		length(len, message) {
			return this._addCheck({
				kind: "length",
				value: len,
				...errorUtil_js_1.errorUtil.errToObj(message)
			});
		}
		/**
		* Equivalent to `.min(1)`
		*/
		nonempty(message) {
			return this.min(1, errorUtil_js_1.errorUtil.errToObj(message));
		}
		trim() {
			return new ZodString({
				...this._def,
				checks: [...this._def.checks, { kind: "trim" }]
			});
		}
		toLowerCase() {
			return new ZodString({
				...this._def,
				checks: [...this._def.checks, { kind: "toLowerCase" }]
			});
		}
		toUpperCase() {
			return new ZodString({
				...this._def,
				checks: [...this._def.checks, { kind: "toUpperCase" }]
			});
		}
		get isDatetime() {
			return !!this._def.checks.find((ch) => ch.kind === "datetime");
		}
		get isDate() {
			return !!this._def.checks.find((ch) => ch.kind === "date");
		}
		get isTime() {
			return !!this._def.checks.find((ch) => ch.kind === "time");
		}
		get isDuration() {
			return !!this._def.checks.find((ch) => ch.kind === "duration");
		}
		get isEmail() {
			return !!this._def.checks.find((ch) => ch.kind === "email");
		}
		get isURL() {
			return !!this._def.checks.find((ch) => ch.kind === "url");
		}
		get isEmoji() {
			return !!this._def.checks.find((ch) => ch.kind === "emoji");
		}
		get isUUID() {
			return !!this._def.checks.find((ch) => ch.kind === "uuid");
		}
		get isNANOID() {
			return !!this._def.checks.find((ch) => ch.kind === "nanoid");
		}
		get isCUID() {
			return !!this._def.checks.find((ch) => ch.kind === "cuid");
		}
		get isCUID2() {
			return !!this._def.checks.find((ch) => ch.kind === "cuid2");
		}
		get isULID() {
			return !!this._def.checks.find((ch) => ch.kind === "ulid");
		}
		get isIP() {
			return !!this._def.checks.find((ch) => ch.kind === "ip");
		}
		get isCIDR() {
			return !!this._def.checks.find((ch) => ch.kind === "cidr");
		}
		get isBase64() {
			return !!this._def.checks.find((ch) => ch.kind === "base64");
		}
		get isBase64url() {
			return !!this._def.checks.find((ch) => ch.kind === "base64url");
		}
		get minLength() {
			let min = null;
			for (const ch of this._def.checks) if (ch.kind === "min") {
				if (min === null || ch.value > min) min = ch.value;
			}
			return min;
		}
		get maxLength() {
			let max = null;
			for (const ch of this._def.checks) if (ch.kind === "max") {
				if (max === null || ch.value < max) max = ch.value;
			}
			return max;
		}
	};
	exports.ZodString = ZodString;
	ZodString.create = (params) => {
		return new ZodString({
			checks: [],
			typeName: ZodFirstPartyTypeKind.ZodString,
			coerce: params?.coerce ?? false,
			...processCreateParams(params)
		});
	};
	function floatSafeRemainder(val, step) {
		const valDecCount = (val.toString().split(".")[1] || "").length;
		const stepDecCount = (step.toString().split(".")[1] || "").length;
		const decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;
		return Number.parseInt(val.toFixed(decCount).replace(".", "")) % Number.parseInt(step.toFixed(decCount).replace(".", "")) / 10 ** decCount;
	}
	var ZodNumber = class ZodNumber extends ZodType {
		constructor() {
			super(...arguments);
			this.min = this.gte;
			this.max = this.lte;
			this.step = this.multipleOf;
		}
		_parse(input) {
			if (this._def.coerce) input.data = Number(input.data);
			if (this._getType(input) !== util_js_1.ZodParsedType.number) {
				const ctx = this._getOrReturnCtx(input);
				(0, parseUtil_js_1.addIssueToContext)(ctx, {
					code: ZodError_js_1.ZodIssueCode.invalid_type,
					expected: util_js_1.ZodParsedType.number,
					received: ctx.parsedType
				});
				return parseUtil_js_1.INVALID;
			}
			let ctx = void 0;
			const status = new parseUtil_js_1.ParseStatus();
			for (const check of this._def.checks) if (check.kind === "int") {
				if (!util_js_1.util.isInteger(input.data)) {
					ctx = this._getOrReturnCtx(input, ctx);
					(0, parseUtil_js_1.addIssueToContext)(ctx, {
						code: ZodError_js_1.ZodIssueCode.invalid_type,
						expected: "integer",
						received: "float",
						message: check.message
					});
					status.dirty();
				}
			} else if (check.kind === "min") {
				if (check.inclusive ? input.data < check.value : input.data <= check.value) {
					ctx = this._getOrReturnCtx(input, ctx);
					(0, parseUtil_js_1.addIssueToContext)(ctx, {
						code: ZodError_js_1.ZodIssueCode.too_small,
						minimum: check.value,
						type: "number",
						inclusive: check.inclusive,
						exact: false,
						message: check.message
					});
					status.dirty();
				}
			} else if (check.kind === "max") {
				if (check.inclusive ? input.data > check.value : input.data >= check.value) {
					ctx = this._getOrReturnCtx(input, ctx);
					(0, parseUtil_js_1.addIssueToContext)(ctx, {
						code: ZodError_js_1.ZodIssueCode.too_big,
						maximum: check.value,
						type: "number",
						inclusive: check.inclusive,
						exact: false,
						message: check.message
					});
					status.dirty();
				}
			} else if (check.kind === "multipleOf") {
				if (floatSafeRemainder(input.data, check.value) !== 0) {
					ctx = this._getOrReturnCtx(input, ctx);
					(0, parseUtil_js_1.addIssueToContext)(ctx, {
						code: ZodError_js_1.ZodIssueCode.not_multiple_of,
						multipleOf: check.value,
						message: check.message
					});
					status.dirty();
				}
			} else if (check.kind === "finite") {
				if (!Number.isFinite(input.data)) {
					ctx = this._getOrReturnCtx(input, ctx);
					(0, parseUtil_js_1.addIssueToContext)(ctx, {
						code: ZodError_js_1.ZodIssueCode.not_finite,
						message: check.message
					});
					status.dirty();
				}
			} else util_js_1.util.assertNever(check);
			return {
				status: status.value,
				value: input.data
			};
		}
		gte(value, message) {
			return this.setLimit("min", value, true, errorUtil_js_1.errorUtil.toString(message));
		}
		gt(value, message) {
			return this.setLimit("min", value, false, errorUtil_js_1.errorUtil.toString(message));
		}
		lte(value, message) {
			return this.setLimit("max", value, true, errorUtil_js_1.errorUtil.toString(message));
		}
		lt(value, message) {
			return this.setLimit("max", value, false, errorUtil_js_1.errorUtil.toString(message));
		}
		setLimit(kind, value, inclusive, message) {
			return new ZodNumber({
				...this._def,
				checks: [...this._def.checks, {
					kind,
					value,
					inclusive,
					message: errorUtil_js_1.errorUtil.toString(message)
				}]
			});
		}
		_addCheck(check) {
			return new ZodNumber({
				...this._def,
				checks: [...this._def.checks, check]
			});
		}
		int(message) {
			return this._addCheck({
				kind: "int",
				message: errorUtil_js_1.errorUtil.toString(message)
			});
		}
		positive(message) {
			return this._addCheck({
				kind: "min",
				value: 0,
				inclusive: false,
				message: errorUtil_js_1.errorUtil.toString(message)
			});
		}
		negative(message) {
			return this._addCheck({
				kind: "max",
				value: 0,
				inclusive: false,
				message: errorUtil_js_1.errorUtil.toString(message)
			});
		}
		nonpositive(message) {
			return this._addCheck({
				kind: "max",
				value: 0,
				inclusive: true,
				message: errorUtil_js_1.errorUtil.toString(message)
			});
		}
		nonnegative(message) {
			return this._addCheck({
				kind: "min",
				value: 0,
				inclusive: true,
				message: errorUtil_js_1.errorUtil.toString(message)
			});
		}
		multipleOf(value, message) {
			return this._addCheck({
				kind: "multipleOf",
				value,
				message: errorUtil_js_1.errorUtil.toString(message)
			});
		}
		finite(message) {
			return this._addCheck({
				kind: "finite",
				message: errorUtil_js_1.errorUtil.toString(message)
			});
		}
		safe(message) {
			return this._addCheck({
				kind: "min",
				inclusive: true,
				value: Number.MIN_SAFE_INTEGER,
				message: errorUtil_js_1.errorUtil.toString(message)
			})._addCheck({
				kind: "max",
				inclusive: true,
				value: Number.MAX_SAFE_INTEGER,
				message: errorUtil_js_1.errorUtil.toString(message)
			});
		}
		get minValue() {
			let min = null;
			for (const ch of this._def.checks) if (ch.kind === "min") {
				if (min === null || ch.value > min) min = ch.value;
			}
			return min;
		}
		get maxValue() {
			let max = null;
			for (const ch of this._def.checks) if (ch.kind === "max") {
				if (max === null || ch.value < max) max = ch.value;
			}
			return max;
		}
		get isInt() {
			return !!this._def.checks.find((ch) => ch.kind === "int" || ch.kind === "multipleOf" && util_js_1.util.isInteger(ch.value));
		}
		get isFinite() {
			let max = null;
			let min = null;
			for (const ch of this._def.checks) if (ch.kind === "finite" || ch.kind === "int" || ch.kind === "multipleOf") return true;
			else if (ch.kind === "min") {
				if (min === null || ch.value > min) min = ch.value;
			} else if (ch.kind === "max") {
				if (max === null || ch.value < max) max = ch.value;
			}
			return Number.isFinite(min) && Number.isFinite(max);
		}
	};
	exports.ZodNumber = ZodNumber;
	ZodNumber.create = (params) => {
		return new ZodNumber({
			checks: [],
			typeName: ZodFirstPartyTypeKind.ZodNumber,
			coerce: params?.coerce || false,
			...processCreateParams(params)
		});
	};
	var ZodBigInt = class ZodBigInt extends ZodType {
		constructor() {
			super(...arguments);
			this.min = this.gte;
			this.max = this.lte;
		}
		_parse(input) {
			if (this._def.coerce) try {
				input.data = BigInt(input.data);
			} catch {
				return this._getInvalidInput(input);
			}
			if (this._getType(input) !== util_js_1.ZodParsedType.bigint) return this._getInvalidInput(input);
			let ctx = void 0;
			const status = new parseUtil_js_1.ParseStatus();
			for (const check of this._def.checks) if (check.kind === "min") {
				if (check.inclusive ? input.data < check.value : input.data <= check.value) {
					ctx = this._getOrReturnCtx(input, ctx);
					(0, parseUtil_js_1.addIssueToContext)(ctx, {
						code: ZodError_js_1.ZodIssueCode.too_small,
						type: "bigint",
						minimum: check.value,
						inclusive: check.inclusive,
						message: check.message
					});
					status.dirty();
				}
			} else if (check.kind === "max") {
				if (check.inclusive ? input.data > check.value : input.data >= check.value) {
					ctx = this._getOrReturnCtx(input, ctx);
					(0, parseUtil_js_1.addIssueToContext)(ctx, {
						code: ZodError_js_1.ZodIssueCode.too_big,
						type: "bigint",
						maximum: check.value,
						inclusive: check.inclusive,
						message: check.message
					});
					status.dirty();
				}
			} else if (check.kind === "multipleOf") {
				if (input.data % check.value !== BigInt(0)) {
					ctx = this._getOrReturnCtx(input, ctx);
					(0, parseUtil_js_1.addIssueToContext)(ctx, {
						code: ZodError_js_1.ZodIssueCode.not_multiple_of,
						multipleOf: check.value,
						message: check.message
					});
					status.dirty();
				}
			} else util_js_1.util.assertNever(check);
			return {
				status: status.value,
				value: input.data
			};
		}
		_getInvalidInput(input) {
			const ctx = this._getOrReturnCtx(input);
			(0, parseUtil_js_1.addIssueToContext)(ctx, {
				code: ZodError_js_1.ZodIssueCode.invalid_type,
				expected: util_js_1.ZodParsedType.bigint,
				received: ctx.parsedType
			});
			return parseUtil_js_1.INVALID;
		}
		gte(value, message) {
			return this.setLimit("min", value, true, errorUtil_js_1.errorUtil.toString(message));
		}
		gt(value, message) {
			return this.setLimit("min", value, false, errorUtil_js_1.errorUtil.toString(message));
		}
		lte(value, message) {
			return this.setLimit("max", value, true, errorUtil_js_1.errorUtil.toString(message));
		}
		lt(value, message) {
			return this.setLimit("max", value, false, errorUtil_js_1.errorUtil.toString(message));
		}
		setLimit(kind, value, inclusive, message) {
			return new ZodBigInt({
				...this._def,
				checks: [...this._def.checks, {
					kind,
					value,
					inclusive,
					message: errorUtil_js_1.errorUtil.toString(message)
				}]
			});
		}
		_addCheck(check) {
			return new ZodBigInt({
				...this._def,
				checks: [...this._def.checks, check]
			});
		}
		positive(message) {
			return this._addCheck({
				kind: "min",
				value: BigInt(0),
				inclusive: false,
				message: errorUtil_js_1.errorUtil.toString(message)
			});
		}
		negative(message) {
			return this._addCheck({
				kind: "max",
				value: BigInt(0),
				inclusive: false,
				message: errorUtil_js_1.errorUtil.toString(message)
			});
		}
		nonpositive(message) {
			return this._addCheck({
				kind: "max",
				value: BigInt(0),
				inclusive: true,
				message: errorUtil_js_1.errorUtil.toString(message)
			});
		}
		nonnegative(message) {
			return this._addCheck({
				kind: "min",
				value: BigInt(0),
				inclusive: true,
				message: errorUtil_js_1.errorUtil.toString(message)
			});
		}
		multipleOf(value, message) {
			return this._addCheck({
				kind: "multipleOf",
				value,
				message: errorUtil_js_1.errorUtil.toString(message)
			});
		}
		get minValue() {
			let min = null;
			for (const ch of this._def.checks) if (ch.kind === "min") {
				if (min === null || ch.value > min) min = ch.value;
			}
			return min;
		}
		get maxValue() {
			let max = null;
			for (const ch of this._def.checks) if (ch.kind === "max") {
				if (max === null || ch.value < max) max = ch.value;
			}
			return max;
		}
	};
	exports.ZodBigInt = ZodBigInt;
	ZodBigInt.create = (params) => {
		return new ZodBigInt({
			checks: [],
			typeName: ZodFirstPartyTypeKind.ZodBigInt,
			coerce: params?.coerce ?? false,
			...processCreateParams(params)
		});
	};
	var ZodBoolean = class extends ZodType {
		_parse(input) {
			if (this._def.coerce) input.data = Boolean(input.data);
			if (this._getType(input) !== util_js_1.ZodParsedType.boolean) {
				const ctx = this._getOrReturnCtx(input);
				(0, parseUtil_js_1.addIssueToContext)(ctx, {
					code: ZodError_js_1.ZodIssueCode.invalid_type,
					expected: util_js_1.ZodParsedType.boolean,
					received: ctx.parsedType
				});
				return parseUtil_js_1.INVALID;
			}
			return (0, parseUtil_js_1.OK)(input.data);
		}
	};
	exports.ZodBoolean = ZodBoolean;
	ZodBoolean.create = (params) => {
		return new ZodBoolean({
			typeName: ZodFirstPartyTypeKind.ZodBoolean,
			coerce: params?.coerce || false,
			...processCreateParams(params)
		});
	};
	var ZodDate = class ZodDate extends ZodType {
		_parse(input) {
			if (this._def.coerce) input.data = new Date(input.data);
			if (this._getType(input) !== util_js_1.ZodParsedType.date) {
				const ctx = this._getOrReturnCtx(input);
				(0, parseUtil_js_1.addIssueToContext)(ctx, {
					code: ZodError_js_1.ZodIssueCode.invalid_type,
					expected: util_js_1.ZodParsedType.date,
					received: ctx.parsedType
				});
				return parseUtil_js_1.INVALID;
			}
			if (Number.isNaN(input.data.getTime())) {
				const ctx = this._getOrReturnCtx(input);
				(0, parseUtil_js_1.addIssueToContext)(ctx, { code: ZodError_js_1.ZodIssueCode.invalid_date });
				return parseUtil_js_1.INVALID;
			}
			const status = new parseUtil_js_1.ParseStatus();
			let ctx = void 0;
			for (const check of this._def.checks) if (check.kind === "min") {
				if (input.data.getTime() < check.value) {
					ctx = this._getOrReturnCtx(input, ctx);
					(0, parseUtil_js_1.addIssueToContext)(ctx, {
						code: ZodError_js_1.ZodIssueCode.too_small,
						message: check.message,
						inclusive: true,
						exact: false,
						minimum: check.value,
						type: "date"
					});
					status.dirty();
				}
			} else if (check.kind === "max") {
				if (input.data.getTime() > check.value) {
					ctx = this._getOrReturnCtx(input, ctx);
					(0, parseUtil_js_1.addIssueToContext)(ctx, {
						code: ZodError_js_1.ZodIssueCode.too_big,
						message: check.message,
						inclusive: true,
						exact: false,
						maximum: check.value,
						type: "date"
					});
					status.dirty();
				}
			} else util_js_1.util.assertNever(check);
			return {
				status: status.value,
				value: new Date(input.data.getTime())
			};
		}
		_addCheck(check) {
			return new ZodDate({
				...this._def,
				checks: [...this._def.checks, check]
			});
		}
		min(minDate, message) {
			return this._addCheck({
				kind: "min",
				value: minDate.getTime(),
				message: errorUtil_js_1.errorUtil.toString(message)
			});
		}
		max(maxDate, message) {
			return this._addCheck({
				kind: "max",
				value: maxDate.getTime(),
				message: errorUtil_js_1.errorUtil.toString(message)
			});
		}
		get minDate() {
			let min = null;
			for (const ch of this._def.checks) if (ch.kind === "min") {
				if (min === null || ch.value > min) min = ch.value;
			}
			return min != null ? new Date(min) : null;
		}
		get maxDate() {
			let max = null;
			for (const ch of this._def.checks) if (ch.kind === "max") {
				if (max === null || ch.value < max) max = ch.value;
			}
			return max != null ? new Date(max) : null;
		}
	};
	exports.ZodDate = ZodDate;
	ZodDate.create = (params) => {
		return new ZodDate({
			checks: [],
			coerce: params?.coerce || false,
			typeName: ZodFirstPartyTypeKind.ZodDate,
			...processCreateParams(params)
		});
	};
	var ZodSymbol = class extends ZodType {
		_parse(input) {
			if (this._getType(input) !== util_js_1.ZodParsedType.symbol) {
				const ctx = this._getOrReturnCtx(input);
				(0, parseUtil_js_1.addIssueToContext)(ctx, {
					code: ZodError_js_1.ZodIssueCode.invalid_type,
					expected: util_js_1.ZodParsedType.symbol,
					received: ctx.parsedType
				});
				return parseUtil_js_1.INVALID;
			}
			return (0, parseUtil_js_1.OK)(input.data);
		}
	};
	exports.ZodSymbol = ZodSymbol;
	ZodSymbol.create = (params) => {
		return new ZodSymbol({
			typeName: ZodFirstPartyTypeKind.ZodSymbol,
			...processCreateParams(params)
		});
	};
	var ZodUndefined = class extends ZodType {
		_parse(input) {
			if (this._getType(input) !== util_js_1.ZodParsedType.undefined) {
				const ctx = this._getOrReturnCtx(input);
				(0, parseUtil_js_1.addIssueToContext)(ctx, {
					code: ZodError_js_1.ZodIssueCode.invalid_type,
					expected: util_js_1.ZodParsedType.undefined,
					received: ctx.parsedType
				});
				return parseUtil_js_1.INVALID;
			}
			return (0, parseUtil_js_1.OK)(input.data);
		}
	};
	exports.ZodUndefined = ZodUndefined;
	ZodUndefined.create = (params) => {
		return new ZodUndefined({
			typeName: ZodFirstPartyTypeKind.ZodUndefined,
			...processCreateParams(params)
		});
	};
	var ZodNull = class extends ZodType {
		_parse(input) {
			if (this._getType(input) !== util_js_1.ZodParsedType.null) {
				const ctx = this._getOrReturnCtx(input);
				(0, parseUtil_js_1.addIssueToContext)(ctx, {
					code: ZodError_js_1.ZodIssueCode.invalid_type,
					expected: util_js_1.ZodParsedType.null,
					received: ctx.parsedType
				});
				return parseUtil_js_1.INVALID;
			}
			return (0, parseUtil_js_1.OK)(input.data);
		}
	};
	exports.ZodNull = ZodNull;
	ZodNull.create = (params) => {
		return new ZodNull({
			typeName: ZodFirstPartyTypeKind.ZodNull,
			...processCreateParams(params)
		});
	};
	var ZodAny = class extends ZodType {
		constructor() {
			super(...arguments);
			this._any = true;
		}
		_parse(input) {
			return (0, parseUtil_js_1.OK)(input.data);
		}
	};
	exports.ZodAny = ZodAny;
	ZodAny.create = (params) => {
		return new ZodAny({
			typeName: ZodFirstPartyTypeKind.ZodAny,
			...processCreateParams(params)
		});
	};
	var ZodUnknown = class extends ZodType {
		constructor() {
			super(...arguments);
			this._unknown = true;
		}
		_parse(input) {
			return (0, parseUtil_js_1.OK)(input.data);
		}
	};
	exports.ZodUnknown = ZodUnknown;
	ZodUnknown.create = (params) => {
		return new ZodUnknown({
			typeName: ZodFirstPartyTypeKind.ZodUnknown,
			...processCreateParams(params)
		});
	};
	var ZodNever = class extends ZodType {
		_parse(input) {
			const ctx = this._getOrReturnCtx(input);
			(0, parseUtil_js_1.addIssueToContext)(ctx, {
				code: ZodError_js_1.ZodIssueCode.invalid_type,
				expected: util_js_1.ZodParsedType.never,
				received: ctx.parsedType
			});
			return parseUtil_js_1.INVALID;
		}
	};
	exports.ZodNever = ZodNever;
	ZodNever.create = (params) => {
		return new ZodNever({
			typeName: ZodFirstPartyTypeKind.ZodNever,
			...processCreateParams(params)
		});
	};
	var ZodVoid = class extends ZodType {
		_parse(input) {
			if (this._getType(input) !== util_js_1.ZodParsedType.undefined) {
				const ctx = this._getOrReturnCtx(input);
				(0, parseUtil_js_1.addIssueToContext)(ctx, {
					code: ZodError_js_1.ZodIssueCode.invalid_type,
					expected: util_js_1.ZodParsedType.void,
					received: ctx.parsedType
				});
				return parseUtil_js_1.INVALID;
			}
			return (0, parseUtil_js_1.OK)(input.data);
		}
	};
	exports.ZodVoid = ZodVoid;
	ZodVoid.create = (params) => {
		return new ZodVoid({
			typeName: ZodFirstPartyTypeKind.ZodVoid,
			...processCreateParams(params)
		});
	};
	var ZodArray = class ZodArray extends ZodType {
		_parse(input) {
			const { ctx, status } = this._processInputParams(input);
			const def = this._def;
			if (ctx.parsedType !== util_js_1.ZodParsedType.array) {
				(0, parseUtil_js_1.addIssueToContext)(ctx, {
					code: ZodError_js_1.ZodIssueCode.invalid_type,
					expected: util_js_1.ZodParsedType.array,
					received: ctx.parsedType
				});
				return parseUtil_js_1.INVALID;
			}
			if (def.exactLength !== null) {
				const tooBig = ctx.data.length > def.exactLength.value;
				const tooSmall = ctx.data.length < def.exactLength.value;
				if (tooBig || tooSmall) {
					(0, parseUtil_js_1.addIssueToContext)(ctx, {
						code: tooBig ? ZodError_js_1.ZodIssueCode.too_big : ZodError_js_1.ZodIssueCode.too_small,
						minimum: tooSmall ? def.exactLength.value : void 0,
						maximum: tooBig ? def.exactLength.value : void 0,
						type: "array",
						inclusive: true,
						exact: true,
						message: def.exactLength.message
					});
					status.dirty();
				}
			}
			if (def.minLength !== null) {
				if (ctx.data.length < def.minLength.value) {
					(0, parseUtil_js_1.addIssueToContext)(ctx, {
						code: ZodError_js_1.ZodIssueCode.too_small,
						minimum: def.minLength.value,
						type: "array",
						inclusive: true,
						exact: false,
						message: def.minLength.message
					});
					status.dirty();
				}
			}
			if (def.maxLength !== null) {
				if (ctx.data.length > def.maxLength.value) {
					(0, parseUtil_js_1.addIssueToContext)(ctx, {
						code: ZodError_js_1.ZodIssueCode.too_big,
						maximum: def.maxLength.value,
						type: "array",
						inclusive: true,
						exact: false,
						message: def.maxLength.message
					});
					status.dirty();
				}
			}
			if (ctx.common.async) return Promise.all([...ctx.data].map((item, i) => {
				return def.type._parseAsync(new ParseInputLazyPath(ctx, item, ctx.path, i));
			})).then((result) => {
				return parseUtil_js_1.ParseStatus.mergeArray(status, result);
			});
			const result = [...ctx.data].map((item, i) => {
				return def.type._parseSync(new ParseInputLazyPath(ctx, item, ctx.path, i));
			});
			return parseUtil_js_1.ParseStatus.mergeArray(status, result);
		}
		get element() {
			return this._def.type;
		}
		min(minLength, message) {
			return new ZodArray({
				...this._def,
				minLength: {
					value: minLength,
					message: errorUtil_js_1.errorUtil.toString(message)
				}
			});
		}
		max(maxLength, message) {
			return new ZodArray({
				...this._def,
				maxLength: {
					value: maxLength,
					message: errorUtil_js_1.errorUtil.toString(message)
				}
			});
		}
		length(len, message) {
			return new ZodArray({
				...this._def,
				exactLength: {
					value: len,
					message: errorUtil_js_1.errorUtil.toString(message)
				}
			});
		}
		nonempty(message) {
			return this.min(1, message);
		}
	};
	exports.ZodArray = ZodArray;
	ZodArray.create = (schema, params) => {
		return new ZodArray({
			type: schema,
			minLength: null,
			maxLength: null,
			exactLength: null,
			typeName: ZodFirstPartyTypeKind.ZodArray,
			...processCreateParams(params)
		});
	};
	function deepPartialify(schema) {
		if (schema instanceof ZodObject) {
			const newShape = {};
			for (const key in schema.shape) {
				const fieldSchema = schema.shape[key];
				newShape[key] = ZodOptional.create(deepPartialify(fieldSchema));
			}
			return new ZodObject({
				...schema._def,
				shape: () => newShape
			});
		} else if (schema instanceof ZodArray) return new ZodArray({
			...schema._def,
			type: deepPartialify(schema.element)
		});
		else if (schema instanceof ZodOptional) return ZodOptional.create(deepPartialify(schema.unwrap()));
		else if (schema instanceof ZodNullable) return ZodNullable.create(deepPartialify(schema.unwrap()));
		else if (schema instanceof ZodTuple) return ZodTuple.create(schema.items.map((item) => deepPartialify(item)));
		else return schema;
	}
	var ZodObject = class ZodObject extends ZodType {
		constructor() {
			super(...arguments);
			this._cached = null;
			/**
			* @deprecated In most cases, this is no longer needed - unknown properties are now silently stripped.
			* If you want to pass through unknown properties, use `.passthrough()` instead.
			*/
			this.nonstrict = this.passthrough;
			/**
			* @deprecated Use `.extend` instead
			*  */
			this.augment = this.extend;
		}
		_getCached() {
			if (this._cached !== null) return this._cached;
			const shape = this._def.shape();
			const keys = util_js_1.util.objectKeys(shape);
			this._cached = {
				shape,
				keys
			};
			return this._cached;
		}
		_parse(input) {
			if (this._getType(input) !== util_js_1.ZodParsedType.object) {
				const ctx = this._getOrReturnCtx(input);
				(0, parseUtil_js_1.addIssueToContext)(ctx, {
					code: ZodError_js_1.ZodIssueCode.invalid_type,
					expected: util_js_1.ZodParsedType.object,
					received: ctx.parsedType
				});
				return parseUtil_js_1.INVALID;
			}
			const { status, ctx } = this._processInputParams(input);
			const { shape, keys: shapeKeys } = this._getCached();
			const extraKeys = [];
			if (!(this._def.catchall instanceof ZodNever && this._def.unknownKeys === "strip")) {
				for (const key in ctx.data) if (!shapeKeys.includes(key)) extraKeys.push(key);
			}
			const pairs = [];
			for (const key of shapeKeys) {
				const keyValidator = shape[key];
				const value = ctx.data[key];
				pairs.push({
					key: {
						status: "valid",
						value: key
					},
					value: keyValidator._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
					alwaysSet: key in ctx.data
				});
			}
			if (this._def.catchall instanceof ZodNever) {
				const unknownKeys = this._def.unknownKeys;
				if (unknownKeys === "passthrough") for (const key of extraKeys) pairs.push({
					key: {
						status: "valid",
						value: key
					},
					value: {
						status: "valid",
						value: ctx.data[key]
					}
				});
				else if (unknownKeys === "strict") {
					if (extraKeys.length > 0) {
						(0, parseUtil_js_1.addIssueToContext)(ctx, {
							code: ZodError_js_1.ZodIssueCode.unrecognized_keys,
							keys: extraKeys
						});
						status.dirty();
					}
				} else if (unknownKeys === "strip") {} else throw new Error(`Internal ZodObject error: invalid unknownKeys value.`);
			} else {
				const catchall = this._def.catchall;
				for (const key of extraKeys) {
					const value = ctx.data[key];
					pairs.push({
						key: {
							status: "valid",
							value: key
						},
						value: catchall._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
						alwaysSet: key in ctx.data
					});
				}
			}
			if (ctx.common.async) return Promise.resolve().then(async () => {
				const syncPairs = [];
				for (const pair of pairs) {
					const key = await pair.key;
					const value = await pair.value;
					syncPairs.push({
						key,
						value,
						alwaysSet: pair.alwaysSet
					});
				}
				return syncPairs;
			}).then((syncPairs) => {
				return parseUtil_js_1.ParseStatus.mergeObjectSync(status, syncPairs);
			});
			else return parseUtil_js_1.ParseStatus.mergeObjectSync(status, pairs);
		}
		get shape() {
			return this._def.shape();
		}
		strict(message) {
			errorUtil_js_1.errorUtil.errToObj;
			return new ZodObject({
				...this._def,
				unknownKeys: "strict",
				...message !== void 0 ? { errorMap: (issue, ctx) => {
					const defaultError = this._def.errorMap?.(issue, ctx).message ?? ctx.defaultError;
					if (issue.code === "unrecognized_keys") return { message: errorUtil_js_1.errorUtil.errToObj(message).message ?? defaultError };
					return { message: defaultError };
				} } : {}
			});
		}
		strip() {
			return new ZodObject({
				...this._def,
				unknownKeys: "strip"
			});
		}
		passthrough() {
			return new ZodObject({
				...this._def,
				unknownKeys: "passthrough"
			});
		}
		extend(augmentation) {
			return new ZodObject({
				...this._def,
				shape: () => ({
					...this._def.shape(),
					...augmentation
				})
			});
		}
		/**
		* Prior to zod@1.0.12 there was a bug in the
		* inferred type of merged objects. Please
		* upgrade if you are experiencing issues.
		*/
		merge(merging) {
			return new ZodObject({
				unknownKeys: merging._def.unknownKeys,
				catchall: merging._def.catchall,
				shape: () => ({
					...this._def.shape(),
					...merging._def.shape()
				}),
				typeName: ZodFirstPartyTypeKind.ZodObject
			});
		}
		setKey(key, schema) {
			return this.augment({ [key]: schema });
		}
		catchall(index) {
			return new ZodObject({
				...this._def,
				catchall: index
			});
		}
		pick(mask) {
			const shape = {};
			for (const key of util_js_1.util.objectKeys(mask)) if (mask[key] && this.shape[key]) shape[key] = this.shape[key];
			return new ZodObject({
				...this._def,
				shape: () => shape
			});
		}
		omit(mask) {
			const shape = {};
			for (const key of util_js_1.util.objectKeys(this.shape)) if (!mask[key]) shape[key] = this.shape[key];
			return new ZodObject({
				...this._def,
				shape: () => shape
			});
		}
		/**
		* @deprecated
		*/
		deepPartial() {
			return deepPartialify(this);
		}
		partial(mask) {
			const newShape = {};
			for (const key of util_js_1.util.objectKeys(this.shape)) {
				const fieldSchema = this.shape[key];
				if (mask && !mask[key]) newShape[key] = fieldSchema;
				else newShape[key] = fieldSchema.optional();
			}
			return new ZodObject({
				...this._def,
				shape: () => newShape
			});
		}
		required(mask) {
			const newShape = {};
			for (const key of util_js_1.util.objectKeys(this.shape)) if (mask && !mask[key]) newShape[key] = this.shape[key];
			else {
				let newField = this.shape[key];
				while (newField instanceof ZodOptional) newField = newField._def.innerType;
				newShape[key] = newField;
			}
			return new ZodObject({
				...this._def,
				shape: () => newShape
			});
		}
		keyof() {
			return createZodEnum(util_js_1.util.objectKeys(this.shape));
		}
	};
	exports.ZodObject = ZodObject;
	ZodObject.create = (shape, params) => {
		return new ZodObject({
			shape: () => shape,
			unknownKeys: "strip",
			catchall: ZodNever.create(),
			typeName: ZodFirstPartyTypeKind.ZodObject,
			...processCreateParams(params)
		});
	};
	ZodObject.strictCreate = (shape, params) => {
		return new ZodObject({
			shape: () => shape,
			unknownKeys: "strict",
			catchall: ZodNever.create(),
			typeName: ZodFirstPartyTypeKind.ZodObject,
			...processCreateParams(params)
		});
	};
	ZodObject.lazycreate = (shape, params) => {
		return new ZodObject({
			shape,
			unknownKeys: "strip",
			catchall: ZodNever.create(),
			typeName: ZodFirstPartyTypeKind.ZodObject,
			...processCreateParams(params)
		});
	};
	var ZodUnion = class extends ZodType {
		_parse(input) {
			const { ctx } = this._processInputParams(input);
			const options = this._def.options;
			function handleResults(results) {
				for (const result of results) if (result.result.status === "valid") return result.result;
				for (const result of results) if (result.result.status === "dirty") {
					ctx.common.issues.push(...result.ctx.common.issues);
					return result.result;
				}
				const unionErrors = results.map((result) => new ZodError_js_1.ZodError(result.ctx.common.issues));
				(0, parseUtil_js_1.addIssueToContext)(ctx, {
					code: ZodError_js_1.ZodIssueCode.invalid_union,
					unionErrors
				});
				return parseUtil_js_1.INVALID;
			}
			if (ctx.common.async) return Promise.all(options.map(async (option) => {
				const childCtx = {
					...ctx,
					common: {
						...ctx.common,
						issues: []
					},
					parent: null
				};
				return {
					result: await option._parseAsync({
						data: ctx.data,
						path: ctx.path,
						parent: childCtx
					}),
					ctx: childCtx
				};
			})).then(handleResults);
			else {
				let dirty = void 0;
				const issues = [];
				for (const option of options) {
					const childCtx = {
						...ctx,
						common: {
							...ctx.common,
							issues: []
						},
						parent: null
					};
					const result = option._parseSync({
						data: ctx.data,
						path: ctx.path,
						parent: childCtx
					});
					if (result.status === "valid") return result;
					else if (result.status === "dirty" && !dirty) dirty = {
						result,
						ctx: childCtx
					};
					if (childCtx.common.issues.length) issues.push(childCtx.common.issues);
				}
				if (dirty) {
					ctx.common.issues.push(...dirty.ctx.common.issues);
					return dirty.result;
				}
				const unionErrors = issues.map((issues) => new ZodError_js_1.ZodError(issues));
				(0, parseUtil_js_1.addIssueToContext)(ctx, {
					code: ZodError_js_1.ZodIssueCode.invalid_union,
					unionErrors
				});
				return parseUtil_js_1.INVALID;
			}
		}
		get options() {
			return this._def.options;
		}
	};
	exports.ZodUnion = ZodUnion;
	ZodUnion.create = (types, params) => {
		return new ZodUnion({
			options: types,
			typeName: ZodFirstPartyTypeKind.ZodUnion,
			...processCreateParams(params)
		});
	};
	const getDiscriminator = (type) => {
		if (type instanceof ZodLazy) return getDiscriminator(type.schema);
		else if (type instanceof ZodEffects) return getDiscriminator(type.innerType());
		else if (type instanceof ZodLiteral) return [type.value];
		else if (type instanceof ZodEnum) return type.options;
		else if (type instanceof ZodNativeEnum) return util_js_1.util.objectValues(type.enum);
		else if (type instanceof ZodDefault) return getDiscriminator(type._def.innerType);
		else if (type instanceof ZodUndefined) return [void 0];
		else if (type instanceof ZodNull) return [null];
		else if (type instanceof ZodOptional) return [void 0, ...getDiscriminator(type.unwrap())];
		else if (type instanceof ZodNullable) return [null, ...getDiscriminator(type.unwrap())];
		else if (type instanceof ZodBranded) return getDiscriminator(type.unwrap());
		else if (type instanceof ZodReadonly) return getDiscriminator(type.unwrap());
		else if (type instanceof ZodCatch) return getDiscriminator(type._def.innerType);
		else return [];
	};
	var ZodDiscriminatedUnion = class ZodDiscriminatedUnion extends ZodType {
		_parse(input) {
			const { ctx } = this._processInputParams(input);
			if (ctx.parsedType !== util_js_1.ZodParsedType.object) {
				(0, parseUtil_js_1.addIssueToContext)(ctx, {
					code: ZodError_js_1.ZodIssueCode.invalid_type,
					expected: util_js_1.ZodParsedType.object,
					received: ctx.parsedType
				});
				return parseUtil_js_1.INVALID;
			}
			const discriminator = this.discriminator;
			const discriminatorValue = ctx.data[discriminator];
			const option = this.optionsMap.get(discriminatorValue);
			if (!option) {
				(0, parseUtil_js_1.addIssueToContext)(ctx, {
					code: ZodError_js_1.ZodIssueCode.invalid_union_discriminator,
					options: Array.from(this.optionsMap.keys()),
					path: [discriminator]
				});
				return parseUtil_js_1.INVALID;
			}
			if (ctx.common.async) return option._parseAsync({
				data: ctx.data,
				path: ctx.path,
				parent: ctx
			});
			else return option._parseSync({
				data: ctx.data,
				path: ctx.path,
				parent: ctx
			});
		}
		get discriminator() {
			return this._def.discriminator;
		}
		get options() {
			return this._def.options;
		}
		get optionsMap() {
			return this._def.optionsMap;
		}
		/**
		* The constructor of the discriminated union schema. Its behaviour is very similar to that of the normal z.union() constructor.
		* However, it only allows a union of objects, all of which need to share a discriminator property. This property must
		* have a different value for each object in the union.
		* @param discriminator the name of the discriminator property
		* @param types an array of object schemas
		* @param params
		*/
		static create(discriminator, options, params) {
			const optionsMap = /* @__PURE__ */ new Map();
			for (const type of options) {
				const discriminatorValues = getDiscriminator(type.shape[discriminator]);
				if (!discriminatorValues.length) throw new Error(`A discriminator value for key \`${discriminator}\` could not be extracted from all schema options`);
				for (const value of discriminatorValues) {
					if (optionsMap.has(value)) throw new Error(`Discriminator property ${String(discriminator)} has duplicate value ${String(value)}`);
					optionsMap.set(value, type);
				}
			}
			return new ZodDiscriminatedUnion({
				typeName: ZodFirstPartyTypeKind.ZodDiscriminatedUnion,
				discriminator,
				options,
				optionsMap,
				...processCreateParams(params)
			});
		}
	};
	exports.ZodDiscriminatedUnion = ZodDiscriminatedUnion;
	function mergeValues(a, b) {
		const aType = (0, util_js_1.getParsedType)(a);
		const bType = (0, util_js_1.getParsedType)(b);
		if (a === b) return {
			valid: true,
			data: a
		};
		else if (aType === util_js_1.ZodParsedType.object && bType === util_js_1.ZodParsedType.object) {
			const bKeys = util_js_1.util.objectKeys(b);
			const sharedKeys = util_js_1.util.objectKeys(a).filter((key) => bKeys.indexOf(key) !== -1);
			const newObj = {
				...a,
				...b
			};
			for (const key of sharedKeys) {
				const sharedValue = mergeValues(a[key], b[key]);
				if (!sharedValue.valid) return { valid: false };
				newObj[key] = sharedValue.data;
			}
			return {
				valid: true,
				data: newObj
			};
		} else if (aType === util_js_1.ZodParsedType.array && bType === util_js_1.ZodParsedType.array) {
			if (a.length !== b.length) return { valid: false };
			const newArray = [];
			for (let index = 0; index < a.length; index++) {
				const itemA = a[index];
				const itemB = b[index];
				const sharedValue = mergeValues(itemA, itemB);
				if (!sharedValue.valid) return { valid: false };
				newArray.push(sharedValue.data);
			}
			return {
				valid: true,
				data: newArray
			};
		} else if (aType === util_js_1.ZodParsedType.date && bType === util_js_1.ZodParsedType.date && +a === +b) return {
			valid: true,
			data: a
		};
		else return { valid: false };
	}
	var ZodIntersection = class extends ZodType {
		_parse(input) {
			const { status, ctx } = this._processInputParams(input);
			const handleParsed = (parsedLeft, parsedRight) => {
				if ((0, parseUtil_js_1.isAborted)(parsedLeft) || (0, parseUtil_js_1.isAborted)(parsedRight)) return parseUtil_js_1.INVALID;
				const merged = mergeValues(parsedLeft.value, parsedRight.value);
				if (!merged.valid) {
					(0, parseUtil_js_1.addIssueToContext)(ctx, { code: ZodError_js_1.ZodIssueCode.invalid_intersection_types });
					return parseUtil_js_1.INVALID;
				}
				if ((0, parseUtil_js_1.isDirty)(parsedLeft) || (0, parseUtil_js_1.isDirty)(parsedRight)) status.dirty();
				return {
					status: status.value,
					value: merged.data
				};
			};
			if (ctx.common.async) return Promise.all([this._def.left._parseAsync({
				data: ctx.data,
				path: ctx.path,
				parent: ctx
			}), this._def.right._parseAsync({
				data: ctx.data,
				path: ctx.path,
				parent: ctx
			})]).then(([left, right]) => handleParsed(left, right));
			else return handleParsed(this._def.left._parseSync({
				data: ctx.data,
				path: ctx.path,
				parent: ctx
			}), this._def.right._parseSync({
				data: ctx.data,
				path: ctx.path,
				parent: ctx
			}));
		}
	};
	exports.ZodIntersection = ZodIntersection;
	ZodIntersection.create = (left, right, params) => {
		return new ZodIntersection({
			left,
			right,
			typeName: ZodFirstPartyTypeKind.ZodIntersection,
			...processCreateParams(params)
		});
	};
	var ZodTuple = class ZodTuple extends ZodType {
		_parse(input) {
			const { status, ctx } = this._processInputParams(input);
			if (ctx.parsedType !== util_js_1.ZodParsedType.array) {
				(0, parseUtil_js_1.addIssueToContext)(ctx, {
					code: ZodError_js_1.ZodIssueCode.invalid_type,
					expected: util_js_1.ZodParsedType.array,
					received: ctx.parsedType
				});
				return parseUtil_js_1.INVALID;
			}
			if (ctx.data.length < this._def.items.length) {
				(0, parseUtil_js_1.addIssueToContext)(ctx, {
					code: ZodError_js_1.ZodIssueCode.too_small,
					minimum: this._def.items.length,
					inclusive: true,
					exact: false,
					type: "array"
				});
				return parseUtil_js_1.INVALID;
			}
			if (!this._def.rest && ctx.data.length > this._def.items.length) {
				(0, parseUtil_js_1.addIssueToContext)(ctx, {
					code: ZodError_js_1.ZodIssueCode.too_big,
					maximum: this._def.items.length,
					inclusive: true,
					exact: false,
					type: "array"
				});
				status.dirty();
			}
			const items = [...ctx.data].map((item, itemIndex) => {
				const schema = this._def.items[itemIndex] || this._def.rest;
				if (!schema) return null;
				return schema._parse(new ParseInputLazyPath(ctx, item, ctx.path, itemIndex));
			}).filter((x) => !!x);
			if (ctx.common.async) return Promise.all(items).then((results) => {
				return parseUtil_js_1.ParseStatus.mergeArray(status, results);
			});
			else return parseUtil_js_1.ParseStatus.mergeArray(status, items);
		}
		get items() {
			return this._def.items;
		}
		rest(rest) {
			return new ZodTuple({
				...this._def,
				rest
			});
		}
	};
	exports.ZodTuple = ZodTuple;
	ZodTuple.create = (schemas, params) => {
		if (!Array.isArray(schemas)) throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
		return new ZodTuple({
			items: schemas,
			typeName: ZodFirstPartyTypeKind.ZodTuple,
			rest: null,
			...processCreateParams(params)
		});
	};
	var ZodRecord = class ZodRecord extends ZodType {
		get keySchema() {
			return this._def.keyType;
		}
		get valueSchema() {
			return this._def.valueType;
		}
		_parse(input) {
			const { status, ctx } = this._processInputParams(input);
			if (ctx.parsedType !== util_js_1.ZodParsedType.object) {
				(0, parseUtil_js_1.addIssueToContext)(ctx, {
					code: ZodError_js_1.ZodIssueCode.invalid_type,
					expected: util_js_1.ZodParsedType.object,
					received: ctx.parsedType
				});
				return parseUtil_js_1.INVALID;
			}
			const pairs = [];
			const keyType = this._def.keyType;
			const valueType = this._def.valueType;
			for (const key in ctx.data) pairs.push({
				key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, key)),
				value: valueType._parse(new ParseInputLazyPath(ctx, ctx.data[key], ctx.path, key)),
				alwaysSet: key in ctx.data
			});
			if (ctx.common.async) return parseUtil_js_1.ParseStatus.mergeObjectAsync(status, pairs);
			else return parseUtil_js_1.ParseStatus.mergeObjectSync(status, pairs);
		}
		get element() {
			return this._def.valueType;
		}
		static create(first, second, third) {
			if (second instanceof ZodType) return new ZodRecord({
				keyType: first,
				valueType: second,
				typeName: ZodFirstPartyTypeKind.ZodRecord,
				...processCreateParams(third)
			});
			return new ZodRecord({
				keyType: ZodString.create(),
				valueType: first,
				typeName: ZodFirstPartyTypeKind.ZodRecord,
				...processCreateParams(second)
			});
		}
	};
	exports.ZodRecord = ZodRecord;
	var ZodMap = class extends ZodType {
		get keySchema() {
			return this._def.keyType;
		}
		get valueSchema() {
			return this._def.valueType;
		}
		_parse(input) {
			const { status, ctx } = this._processInputParams(input);
			if (ctx.parsedType !== util_js_1.ZodParsedType.map) {
				(0, parseUtil_js_1.addIssueToContext)(ctx, {
					code: ZodError_js_1.ZodIssueCode.invalid_type,
					expected: util_js_1.ZodParsedType.map,
					received: ctx.parsedType
				});
				return parseUtil_js_1.INVALID;
			}
			const keyType = this._def.keyType;
			const valueType = this._def.valueType;
			const pairs = [...ctx.data.entries()].map(([key, value], index) => {
				return {
					key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, [index, "key"])),
					value: valueType._parse(new ParseInputLazyPath(ctx, value, ctx.path, [index, "value"]))
				};
			});
			if (ctx.common.async) {
				const finalMap = /* @__PURE__ */ new Map();
				return Promise.resolve().then(async () => {
					for (const pair of pairs) {
						const key = await pair.key;
						const value = await pair.value;
						if (key.status === "aborted" || value.status === "aborted") return parseUtil_js_1.INVALID;
						if (key.status === "dirty" || value.status === "dirty") status.dirty();
						finalMap.set(key.value, value.value);
					}
					return {
						status: status.value,
						value: finalMap
					};
				});
			} else {
				const finalMap = /* @__PURE__ */ new Map();
				for (const pair of pairs) {
					const key = pair.key;
					const value = pair.value;
					if (key.status === "aborted" || value.status === "aborted") return parseUtil_js_1.INVALID;
					if (key.status === "dirty" || value.status === "dirty") status.dirty();
					finalMap.set(key.value, value.value);
				}
				return {
					status: status.value,
					value: finalMap
				};
			}
		}
	};
	exports.ZodMap = ZodMap;
	ZodMap.create = (keyType, valueType, params) => {
		return new ZodMap({
			valueType,
			keyType,
			typeName: ZodFirstPartyTypeKind.ZodMap,
			...processCreateParams(params)
		});
	};
	var ZodSet = class ZodSet extends ZodType {
		_parse(input) {
			const { status, ctx } = this._processInputParams(input);
			if (ctx.parsedType !== util_js_1.ZodParsedType.set) {
				(0, parseUtil_js_1.addIssueToContext)(ctx, {
					code: ZodError_js_1.ZodIssueCode.invalid_type,
					expected: util_js_1.ZodParsedType.set,
					received: ctx.parsedType
				});
				return parseUtil_js_1.INVALID;
			}
			const def = this._def;
			if (def.minSize !== null) {
				if (ctx.data.size < def.minSize.value) {
					(0, parseUtil_js_1.addIssueToContext)(ctx, {
						code: ZodError_js_1.ZodIssueCode.too_small,
						minimum: def.minSize.value,
						type: "set",
						inclusive: true,
						exact: false,
						message: def.minSize.message
					});
					status.dirty();
				}
			}
			if (def.maxSize !== null) {
				if (ctx.data.size > def.maxSize.value) {
					(0, parseUtil_js_1.addIssueToContext)(ctx, {
						code: ZodError_js_1.ZodIssueCode.too_big,
						maximum: def.maxSize.value,
						type: "set",
						inclusive: true,
						exact: false,
						message: def.maxSize.message
					});
					status.dirty();
				}
			}
			const valueType = this._def.valueType;
			function finalizeSet(elements) {
				const parsedSet = /* @__PURE__ */ new Set();
				for (const element of elements) {
					if (element.status === "aborted") return parseUtil_js_1.INVALID;
					if (element.status === "dirty") status.dirty();
					parsedSet.add(element.value);
				}
				return {
					status: status.value,
					value: parsedSet
				};
			}
			const elements = [...ctx.data.values()].map((item, i) => valueType._parse(new ParseInputLazyPath(ctx, item, ctx.path, i)));
			if (ctx.common.async) return Promise.all(elements).then((elements) => finalizeSet(elements));
			else return finalizeSet(elements);
		}
		min(minSize, message) {
			return new ZodSet({
				...this._def,
				minSize: {
					value: minSize,
					message: errorUtil_js_1.errorUtil.toString(message)
				}
			});
		}
		max(maxSize, message) {
			return new ZodSet({
				...this._def,
				maxSize: {
					value: maxSize,
					message: errorUtil_js_1.errorUtil.toString(message)
				}
			});
		}
		size(size, message) {
			return this.min(size, message).max(size, message);
		}
		nonempty(message) {
			return this.min(1, message);
		}
	};
	exports.ZodSet = ZodSet;
	ZodSet.create = (valueType, params) => {
		return new ZodSet({
			valueType,
			minSize: null,
			maxSize: null,
			typeName: ZodFirstPartyTypeKind.ZodSet,
			...processCreateParams(params)
		});
	};
	var ZodFunction = class ZodFunction extends ZodType {
		constructor() {
			super(...arguments);
			this.validate = this.implement;
		}
		_parse(input) {
			const { ctx } = this._processInputParams(input);
			if (ctx.parsedType !== util_js_1.ZodParsedType.function) {
				(0, parseUtil_js_1.addIssueToContext)(ctx, {
					code: ZodError_js_1.ZodIssueCode.invalid_type,
					expected: util_js_1.ZodParsedType.function,
					received: ctx.parsedType
				});
				return parseUtil_js_1.INVALID;
			}
			function makeArgsIssue(args, error) {
				return (0, parseUtil_js_1.makeIssue)({
					data: args,
					path: ctx.path,
					errorMaps: [
						ctx.common.contextualErrorMap,
						ctx.schemaErrorMap,
						(0, errors_js_1.getErrorMap)(),
						errors_js_1.defaultErrorMap
					].filter((x) => !!x),
					issueData: {
						code: ZodError_js_1.ZodIssueCode.invalid_arguments,
						argumentsError: error
					}
				});
			}
			function makeReturnsIssue(returns, error) {
				return (0, parseUtil_js_1.makeIssue)({
					data: returns,
					path: ctx.path,
					errorMaps: [
						ctx.common.contextualErrorMap,
						ctx.schemaErrorMap,
						(0, errors_js_1.getErrorMap)(),
						errors_js_1.defaultErrorMap
					].filter((x) => !!x),
					issueData: {
						code: ZodError_js_1.ZodIssueCode.invalid_return_type,
						returnTypeError: error
					}
				});
			}
			const params = { errorMap: ctx.common.contextualErrorMap };
			const fn = ctx.data;
			if (this._def.returns instanceof ZodPromise) {
				const me = this;
				return (0, parseUtil_js_1.OK)(async function(...args) {
					const error = new ZodError_js_1.ZodError([]);
					const parsedArgs = await me._def.args.parseAsync(args, params).catch((e) => {
						error.addIssue(makeArgsIssue(args, e));
						throw error;
					});
					const result = await Reflect.apply(fn, this, parsedArgs);
					return await me._def.returns._def.type.parseAsync(result, params).catch((e) => {
						error.addIssue(makeReturnsIssue(result, e));
						throw error;
					});
				});
			} else {
				const me = this;
				return (0, parseUtil_js_1.OK)(function(...args) {
					const parsedArgs = me._def.args.safeParse(args, params);
					if (!parsedArgs.success) throw new ZodError_js_1.ZodError([makeArgsIssue(args, parsedArgs.error)]);
					const result = Reflect.apply(fn, this, parsedArgs.data);
					const parsedReturns = me._def.returns.safeParse(result, params);
					if (!parsedReturns.success) throw new ZodError_js_1.ZodError([makeReturnsIssue(result, parsedReturns.error)]);
					return parsedReturns.data;
				});
			}
		}
		parameters() {
			return this._def.args;
		}
		returnType() {
			return this._def.returns;
		}
		args(...items) {
			return new ZodFunction({
				...this._def,
				args: ZodTuple.create(items).rest(ZodUnknown.create())
			});
		}
		returns(returnType) {
			return new ZodFunction({
				...this._def,
				returns: returnType
			});
		}
		implement(func) {
			return this.parse(func);
		}
		strictImplement(func) {
			return this.parse(func);
		}
		static create(args, returns, params) {
			return new ZodFunction({
				args: args ? args : ZodTuple.create([]).rest(ZodUnknown.create()),
				returns: returns || ZodUnknown.create(),
				typeName: ZodFirstPartyTypeKind.ZodFunction,
				...processCreateParams(params)
			});
		}
	};
	exports.ZodFunction = ZodFunction;
	var ZodLazy = class extends ZodType {
		get schema() {
			return this._def.getter();
		}
		_parse(input) {
			const { ctx } = this._processInputParams(input);
			return this._def.getter()._parse({
				data: ctx.data,
				path: ctx.path,
				parent: ctx
			});
		}
	};
	exports.ZodLazy = ZodLazy;
	ZodLazy.create = (getter, params) => {
		return new ZodLazy({
			getter,
			typeName: ZodFirstPartyTypeKind.ZodLazy,
			...processCreateParams(params)
		});
	};
	var ZodLiteral = class extends ZodType {
		_parse(input) {
			if (input.data !== this._def.value) {
				const ctx = this._getOrReturnCtx(input);
				(0, parseUtil_js_1.addIssueToContext)(ctx, {
					received: ctx.data,
					code: ZodError_js_1.ZodIssueCode.invalid_literal,
					expected: this._def.value
				});
				return parseUtil_js_1.INVALID;
			}
			return {
				status: "valid",
				value: input.data
			};
		}
		get value() {
			return this._def.value;
		}
	};
	exports.ZodLiteral = ZodLiteral;
	ZodLiteral.create = (value, params) => {
		return new ZodLiteral({
			value,
			typeName: ZodFirstPartyTypeKind.ZodLiteral,
			...processCreateParams(params)
		});
	};
	function createZodEnum(values, params) {
		return new ZodEnum({
			values,
			typeName: ZodFirstPartyTypeKind.ZodEnum,
			...processCreateParams(params)
		});
	}
	var ZodEnum = class ZodEnum extends ZodType {
		_parse(input) {
			if (typeof input.data !== "string") {
				const ctx = this._getOrReturnCtx(input);
				const expectedValues = this._def.values;
				(0, parseUtil_js_1.addIssueToContext)(ctx, {
					expected: util_js_1.util.joinValues(expectedValues),
					received: ctx.parsedType,
					code: ZodError_js_1.ZodIssueCode.invalid_type
				});
				return parseUtil_js_1.INVALID;
			}
			if (!this._cache) this._cache = new Set(this._def.values);
			if (!this._cache.has(input.data)) {
				const ctx = this._getOrReturnCtx(input);
				const expectedValues = this._def.values;
				(0, parseUtil_js_1.addIssueToContext)(ctx, {
					received: ctx.data,
					code: ZodError_js_1.ZodIssueCode.invalid_enum_value,
					options: expectedValues
				});
				return parseUtil_js_1.INVALID;
			}
			return (0, parseUtil_js_1.OK)(input.data);
		}
		get options() {
			return this._def.values;
		}
		get enum() {
			const enumValues = {};
			for (const val of this._def.values) enumValues[val] = val;
			return enumValues;
		}
		get Values() {
			const enumValues = {};
			for (const val of this._def.values) enumValues[val] = val;
			return enumValues;
		}
		get Enum() {
			const enumValues = {};
			for (const val of this._def.values) enumValues[val] = val;
			return enumValues;
		}
		extract(values, newDef = this._def) {
			return ZodEnum.create(values, {
				...this._def,
				...newDef
			});
		}
		exclude(values, newDef = this._def) {
			return ZodEnum.create(this.options.filter((opt) => !values.includes(opt)), {
				...this._def,
				...newDef
			});
		}
	};
	exports.ZodEnum = ZodEnum;
	ZodEnum.create = createZodEnum;
	var ZodNativeEnum = class extends ZodType {
		_parse(input) {
			const nativeEnumValues = util_js_1.util.getValidEnumValues(this._def.values);
			const ctx = this._getOrReturnCtx(input);
			if (ctx.parsedType !== util_js_1.ZodParsedType.string && ctx.parsedType !== util_js_1.ZodParsedType.number) {
				const expectedValues = util_js_1.util.objectValues(nativeEnumValues);
				(0, parseUtil_js_1.addIssueToContext)(ctx, {
					expected: util_js_1.util.joinValues(expectedValues),
					received: ctx.parsedType,
					code: ZodError_js_1.ZodIssueCode.invalid_type
				});
				return parseUtil_js_1.INVALID;
			}
			if (!this._cache) this._cache = new Set(util_js_1.util.getValidEnumValues(this._def.values));
			if (!this._cache.has(input.data)) {
				const expectedValues = util_js_1.util.objectValues(nativeEnumValues);
				(0, parseUtil_js_1.addIssueToContext)(ctx, {
					received: ctx.data,
					code: ZodError_js_1.ZodIssueCode.invalid_enum_value,
					options: expectedValues
				});
				return parseUtil_js_1.INVALID;
			}
			return (0, parseUtil_js_1.OK)(input.data);
		}
		get enum() {
			return this._def.values;
		}
	};
	exports.ZodNativeEnum = ZodNativeEnum;
	ZodNativeEnum.create = (values, params) => {
		return new ZodNativeEnum({
			values,
			typeName: ZodFirstPartyTypeKind.ZodNativeEnum,
			...processCreateParams(params)
		});
	};
	var ZodPromise = class extends ZodType {
		unwrap() {
			return this._def.type;
		}
		_parse(input) {
			const { ctx } = this._processInputParams(input);
			if (ctx.parsedType !== util_js_1.ZodParsedType.promise && ctx.common.async === false) {
				(0, parseUtil_js_1.addIssueToContext)(ctx, {
					code: ZodError_js_1.ZodIssueCode.invalid_type,
					expected: util_js_1.ZodParsedType.promise,
					received: ctx.parsedType
				});
				return parseUtil_js_1.INVALID;
			}
			const promisified = ctx.parsedType === util_js_1.ZodParsedType.promise ? ctx.data : Promise.resolve(ctx.data);
			return (0, parseUtil_js_1.OK)(promisified.then((data) => {
				return this._def.type.parseAsync(data, {
					path: ctx.path,
					errorMap: ctx.common.contextualErrorMap
				});
			}));
		}
	};
	exports.ZodPromise = ZodPromise;
	ZodPromise.create = (schema, params) => {
		return new ZodPromise({
			type: schema,
			typeName: ZodFirstPartyTypeKind.ZodPromise,
			...processCreateParams(params)
		});
	};
	var ZodEffects = class extends ZodType {
		innerType() {
			return this._def.schema;
		}
		sourceType() {
			return this._def.schema._def.typeName === ZodFirstPartyTypeKind.ZodEffects ? this._def.schema.sourceType() : this._def.schema;
		}
		_parse(input) {
			const { status, ctx } = this._processInputParams(input);
			const effect = this._def.effect || null;
			const checkCtx = {
				addIssue: (arg) => {
					(0, parseUtil_js_1.addIssueToContext)(ctx, arg);
					if (arg.fatal) status.abort();
					else status.dirty();
				},
				get path() {
					return ctx.path;
				}
			};
			checkCtx.addIssue = checkCtx.addIssue.bind(checkCtx);
			if (effect.type === "preprocess") {
				const processed = effect.transform(ctx.data, checkCtx);
				if (ctx.common.async) return Promise.resolve(processed).then(async (processed) => {
					if (status.value === "aborted") return parseUtil_js_1.INVALID;
					const result = await this._def.schema._parseAsync({
						data: processed,
						path: ctx.path,
						parent: ctx
					});
					if (result.status === "aborted") return parseUtil_js_1.INVALID;
					if (result.status === "dirty") return (0, parseUtil_js_1.DIRTY)(result.value);
					if (status.value === "dirty") return (0, parseUtil_js_1.DIRTY)(result.value);
					return result;
				});
				else {
					if (status.value === "aborted") return parseUtil_js_1.INVALID;
					const result = this._def.schema._parseSync({
						data: processed,
						path: ctx.path,
						parent: ctx
					});
					if (result.status === "aborted") return parseUtil_js_1.INVALID;
					if (result.status === "dirty") return (0, parseUtil_js_1.DIRTY)(result.value);
					if (status.value === "dirty") return (0, parseUtil_js_1.DIRTY)(result.value);
					return result;
				}
			}
			if (effect.type === "refinement") {
				const executeRefinement = (acc) => {
					const result = effect.refinement(acc, checkCtx);
					if (ctx.common.async) return Promise.resolve(result);
					if (result instanceof Promise) throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
					return acc;
				};
				if (ctx.common.async === false) {
					const inner = this._def.schema._parseSync({
						data: ctx.data,
						path: ctx.path,
						parent: ctx
					});
					if (inner.status === "aborted") return parseUtil_js_1.INVALID;
					if (inner.status === "dirty") status.dirty();
					executeRefinement(inner.value);
					return {
						status: status.value,
						value: inner.value
					};
				} else return this._def.schema._parseAsync({
					data: ctx.data,
					path: ctx.path,
					parent: ctx
				}).then((inner) => {
					if (inner.status === "aborted") return parseUtil_js_1.INVALID;
					if (inner.status === "dirty") status.dirty();
					return executeRefinement(inner.value).then(() => {
						return {
							status: status.value,
							value: inner.value
						};
					});
				});
			}
			if (effect.type === "transform") {
				if (ctx.common.async === false) {
					const base = this._def.schema._parseSync({
						data: ctx.data,
						path: ctx.path,
						parent: ctx
					});
					if (!(0, parseUtil_js_1.isValid)(base)) return parseUtil_js_1.INVALID;
					const result = effect.transform(base.value, checkCtx);
					if (result instanceof Promise) throw new Error(`Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.`);
					return {
						status: status.value,
						value: result
					};
				} else return this._def.schema._parseAsync({
					data: ctx.data,
					path: ctx.path,
					parent: ctx
				}).then((base) => {
					if (!(0, parseUtil_js_1.isValid)(base)) return parseUtil_js_1.INVALID;
					return Promise.resolve(effect.transform(base.value, checkCtx)).then((result) => ({
						status: status.value,
						value: result
					}));
				});
			}
			util_js_1.util.assertNever(effect);
		}
	};
	exports.ZodEffects = ZodEffects;
	exports.ZodTransformer = ZodEffects;
	ZodEffects.create = (schema, effect, params) => {
		return new ZodEffects({
			schema,
			typeName: ZodFirstPartyTypeKind.ZodEffects,
			effect,
			...processCreateParams(params)
		});
	};
	ZodEffects.createWithPreprocess = (preprocess, schema, params) => {
		return new ZodEffects({
			schema,
			effect: {
				type: "preprocess",
				transform: preprocess
			},
			typeName: ZodFirstPartyTypeKind.ZodEffects,
			...processCreateParams(params)
		});
	};
	var ZodOptional = class extends ZodType {
		_parse(input) {
			if (this._getType(input) === util_js_1.ZodParsedType.undefined) return (0, parseUtil_js_1.OK)(void 0);
			return this._def.innerType._parse(input);
		}
		unwrap() {
			return this._def.innerType;
		}
	};
	exports.ZodOptional = ZodOptional;
	ZodOptional.create = (type, params) => {
		return new ZodOptional({
			innerType: type,
			typeName: ZodFirstPartyTypeKind.ZodOptional,
			...processCreateParams(params)
		});
	};
	var ZodNullable = class extends ZodType {
		_parse(input) {
			if (this._getType(input) === util_js_1.ZodParsedType.null) return (0, parseUtil_js_1.OK)(null);
			return this._def.innerType._parse(input);
		}
		unwrap() {
			return this._def.innerType;
		}
	};
	exports.ZodNullable = ZodNullable;
	ZodNullable.create = (type, params) => {
		return new ZodNullable({
			innerType: type,
			typeName: ZodFirstPartyTypeKind.ZodNullable,
			...processCreateParams(params)
		});
	};
	var ZodDefault = class extends ZodType {
		_parse(input) {
			const { ctx } = this._processInputParams(input);
			let data = ctx.data;
			if (ctx.parsedType === util_js_1.ZodParsedType.undefined) data = this._def.defaultValue();
			return this._def.innerType._parse({
				data,
				path: ctx.path,
				parent: ctx
			});
		}
		removeDefault() {
			return this._def.innerType;
		}
	};
	exports.ZodDefault = ZodDefault;
	ZodDefault.create = (type, params) => {
		return new ZodDefault({
			innerType: type,
			typeName: ZodFirstPartyTypeKind.ZodDefault,
			defaultValue: typeof params.default === "function" ? params.default : () => params.default,
			...processCreateParams(params)
		});
	};
	var ZodCatch = class extends ZodType {
		_parse(input) {
			const { ctx } = this._processInputParams(input);
			const newCtx = {
				...ctx,
				common: {
					...ctx.common,
					issues: []
				}
			};
			const result = this._def.innerType._parse({
				data: newCtx.data,
				path: newCtx.path,
				parent: { ...newCtx }
			});
			if ((0, parseUtil_js_1.isAsync)(result)) return result.then((result) => {
				return {
					status: "valid",
					value: result.status === "valid" ? result.value : this._def.catchValue({
						get error() {
							return new ZodError_js_1.ZodError(newCtx.common.issues);
						},
						input: newCtx.data
					})
				};
			});
			else return {
				status: "valid",
				value: result.status === "valid" ? result.value : this._def.catchValue({
					get error() {
						return new ZodError_js_1.ZodError(newCtx.common.issues);
					},
					input: newCtx.data
				})
			};
		}
		removeCatch() {
			return this._def.innerType;
		}
	};
	exports.ZodCatch = ZodCatch;
	ZodCatch.create = (type, params) => {
		return new ZodCatch({
			innerType: type,
			typeName: ZodFirstPartyTypeKind.ZodCatch,
			catchValue: typeof params.catch === "function" ? params.catch : () => params.catch,
			...processCreateParams(params)
		});
	};
	var ZodNaN = class extends ZodType {
		_parse(input) {
			if (this._getType(input) !== util_js_1.ZodParsedType.nan) {
				const ctx = this._getOrReturnCtx(input);
				(0, parseUtil_js_1.addIssueToContext)(ctx, {
					code: ZodError_js_1.ZodIssueCode.invalid_type,
					expected: util_js_1.ZodParsedType.nan,
					received: ctx.parsedType
				});
				return parseUtil_js_1.INVALID;
			}
			return {
				status: "valid",
				value: input.data
			};
		}
	};
	exports.ZodNaN = ZodNaN;
	ZodNaN.create = (params) => {
		return new ZodNaN({
			typeName: ZodFirstPartyTypeKind.ZodNaN,
			...processCreateParams(params)
		});
	};
	exports.BRAND = Symbol("zod_brand");
	var ZodBranded = class extends ZodType {
		_parse(input) {
			const { ctx } = this._processInputParams(input);
			const data = ctx.data;
			return this._def.type._parse({
				data,
				path: ctx.path,
				parent: ctx
			});
		}
		unwrap() {
			return this._def.type;
		}
	};
	exports.ZodBranded = ZodBranded;
	var ZodPipeline = class ZodPipeline extends ZodType {
		_parse(input) {
			const { status, ctx } = this._processInputParams(input);
			if (ctx.common.async) {
				const handleAsync = async () => {
					const inResult = await this._def.in._parseAsync({
						data: ctx.data,
						path: ctx.path,
						parent: ctx
					});
					if (inResult.status === "aborted") return parseUtil_js_1.INVALID;
					if (inResult.status === "dirty") {
						status.dirty();
						return (0, parseUtil_js_1.DIRTY)(inResult.value);
					} else return this._def.out._parseAsync({
						data: inResult.value,
						path: ctx.path,
						parent: ctx
					});
				};
				return handleAsync();
			} else {
				const inResult = this._def.in._parseSync({
					data: ctx.data,
					path: ctx.path,
					parent: ctx
				});
				if (inResult.status === "aborted") return parseUtil_js_1.INVALID;
				if (inResult.status === "dirty") {
					status.dirty();
					return {
						status: "dirty",
						value: inResult.value
					};
				} else return this._def.out._parseSync({
					data: inResult.value,
					path: ctx.path,
					parent: ctx
				});
			}
		}
		static create(a, b) {
			return new ZodPipeline({
				in: a,
				out: b,
				typeName: ZodFirstPartyTypeKind.ZodPipeline
			});
		}
	};
	exports.ZodPipeline = ZodPipeline;
	var ZodReadonly = class extends ZodType {
		_parse(input) {
			const result = this._def.innerType._parse(input);
			const freeze = (data) => {
				if ((0, parseUtil_js_1.isValid)(data)) data.value = Object.freeze(data.value);
				return data;
			};
			return (0, parseUtil_js_1.isAsync)(result) ? result.then((data) => freeze(data)) : freeze(result);
		}
		unwrap() {
			return this._def.innerType;
		}
	};
	exports.ZodReadonly = ZodReadonly;
	ZodReadonly.create = (type, params) => {
		return new ZodReadonly({
			innerType: type,
			typeName: ZodFirstPartyTypeKind.ZodReadonly,
			...processCreateParams(params)
		});
	};
	function cleanParams(params, data) {
		const p = typeof params === "function" ? params(data) : typeof params === "string" ? { message: params } : params;
		return typeof p === "string" ? { message: p } : p;
	}
	function custom(check, _params = {}, fatal) {
		if (check) return ZodAny.create().superRefine((data, ctx) => {
			const r = check(data);
			if (r instanceof Promise) return r.then((r) => {
				if (!r) {
					const params = cleanParams(_params, data);
					const _fatal = params.fatal ?? fatal ?? true;
					ctx.addIssue({
						code: "custom",
						...params,
						fatal: _fatal
					});
				}
			});
			if (!r) {
				const params = cleanParams(_params, data);
				const _fatal = params.fatal ?? fatal ?? true;
				ctx.addIssue({
					code: "custom",
					...params,
					fatal: _fatal
				});
			}
		});
		return ZodAny.create();
	}
	exports.late = { object: ZodObject.lazycreate };
	var ZodFirstPartyTypeKind;
	(function(ZodFirstPartyTypeKind) {
		ZodFirstPartyTypeKind["ZodString"] = "ZodString";
		ZodFirstPartyTypeKind["ZodNumber"] = "ZodNumber";
		ZodFirstPartyTypeKind["ZodNaN"] = "ZodNaN";
		ZodFirstPartyTypeKind["ZodBigInt"] = "ZodBigInt";
		ZodFirstPartyTypeKind["ZodBoolean"] = "ZodBoolean";
		ZodFirstPartyTypeKind["ZodDate"] = "ZodDate";
		ZodFirstPartyTypeKind["ZodSymbol"] = "ZodSymbol";
		ZodFirstPartyTypeKind["ZodUndefined"] = "ZodUndefined";
		ZodFirstPartyTypeKind["ZodNull"] = "ZodNull";
		ZodFirstPartyTypeKind["ZodAny"] = "ZodAny";
		ZodFirstPartyTypeKind["ZodUnknown"] = "ZodUnknown";
		ZodFirstPartyTypeKind["ZodNever"] = "ZodNever";
		ZodFirstPartyTypeKind["ZodVoid"] = "ZodVoid";
		ZodFirstPartyTypeKind["ZodArray"] = "ZodArray";
		ZodFirstPartyTypeKind["ZodObject"] = "ZodObject";
		ZodFirstPartyTypeKind["ZodUnion"] = "ZodUnion";
		ZodFirstPartyTypeKind["ZodDiscriminatedUnion"] = "ZodDiscriminatedUnion";
		ZodFirstPartyTypeKind["ZodIntersection"] = "ZodIntersection";
		ZodFirstPartyTypeKind["ZodTuple"] = "ZodTuple";
		ZodFirstPartyTypeKind["ZodRecord"] = "ZodRecord";
		ZodFirstPartyTypeKind["ZodMap"] = "ZodMap";
		ZodFirstPartyTypeKind["ZodSet"] = "ZodSet";
		ZodFirstPartyTypeKind["ZodFunction"] = "ZodFunction";
		ZodFirstPartyTypeKind["ZodLazy"] = "ZodLazy";
		ZodFirstPartyTypeKind["ZodLiteral"] = "ZodLiteral";
		ZodFirstPartyTypeKind["ZodEnum"] = "ZodEnum";
		ZodFirstPartyTypeKind["ZodEffects"] = "ZodEffects";
		ZodFirstPartyTypeKind["ZodNativeEnum"] = "ZodNativeEnum";
		ZodFirstPartyTypeKind["ZodOptional"] = "ZodOptional";
		ZodFirstPartyTypeKind["ZodNullable"] = "ZodNullable";
		ZodFirstPartyTypeKind["ZodDefault"] = "ZodDefault";
		ZodFirstPartyTypeKind["ZodCatch"] = "ZodCatch";
		ZodFirstPartyTypeKind["ZodPromise"] = "ZodPromise";
		ZodFirstPartyTypeKind["ZodBranded"] = "ZodBranded";
		ZodFirstPartyTypeKind["ZodPipeline"] = "ZodPipeline";
		ZodFirstPartyTypeKind["ZodReadonly"] = "ZodReadonly";
	})(ZodFirstPartyTypeKind || (exports.ZodFirstPartyTypeKind = ZodFirstPartyTypeKind = {}));
	const instanceOfType = (cls, params = { message: `Input not instance of ${cls.name}` }) => custom((data) => data instanceof cls, params);
	exports.instanceof = instanceOfType;
	const stringType = ZodString.create;
	exports.string = stringType;
	const numberType = ZodNumber.create;
	exports.number = numberType;
	exports.nan = ZodNaN.create;
	exports.bigint = ZodBigInt.create;
	const booleanType = ZodBoolean.create;
	exports.boolean = booleanType;
	exports.date = ZodDate.create;
	exports.symbol = ZodSymbol.create;
	exports.undefined = ZodUndefined.create;
	exports.null = ZodNull.create;
	exports.any = ZodAny.create;
	exports.unknown = ZodUnknown.create;
	exports.never = ZodNever.create;
	exports.void = ZodVoid.create;
	exports.array = ZodArray.create;
	exports.object = ZodObject.create;
	exports.strictObject = ZodObject.strictCreate;
	exports.union = ZodUnion.create;
	exports.discriminatedUnion = ZodDiscriminatedUnion.create;
	exports.intersection = ZodIntersection.create;
	exports.tuple = ZodTuple.create;
	exports.record = ZodRecord.create;
	exports.map = ZodMap.create;
	exports.set = ZodSet.create;
	exports.function = ZodFunction.create;
	exports.lazy = ZodLazy.create;
	exports.literal = ZodLiteral.create;
	exports.enum = ZodEnum.create;
	exports.nativeEnum = ZodNativeEnum.create;
	exports.promise = ZodPromise.create;
	const effectsType = ZodEffects.create;
	exports.effect = effectsType;
	exports.transformer = effectsType;
	exports.optional = ZodOptional.create;
	exports.nullable = ZodNullable.create;
	exports.preprocess = ZodEffects.createWithPreprocess;
	exports.pipeline = ZodPipeline.create;
	const ostring = () => stringType().optional();
	exports.ostring = ostring;
	const onumber = () => numberType().optional();
	exports.onumber = onumber;
	const oboolean = () => booleanType().optional();
	exports.oboolean = oboolean;
	exports.coerce = {
		string: ((arg) => ZodString.create({
			...arg,
			coerce: true
		})),
		number: ((arg) => ZodNumber.create({
			...arg,
			coerce: true
		})),
		boolean: ((arg) => ZodBoolean.create({
			...arg,
			coerce: true
		})),
		bigint: ((arg) => ZodBigInt.create({
			...arg,
			coerce: true
		})),
		date: ((arg) => ZodDate.create({
			...arg,
			coerce: true
		}))
	};
	exports.NEVER = parseUtil_js_1.INVALID;
}));
//#endregion
//#region node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/external.cjs
var require_external = /* @__PURE__ */ __commonJSMin(((exports) => {
	var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
		if (k2 === void 0) k2 = k;
		var desc = Object.getOwnPropertyDescriptor(m, k);
		if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) desc = {
			enumerable: true,
			get: function() {
				return m[k];
			}
		};
		Object.defineProperty(o, k2, desc);
	}) : (function(o, m, k, k2) {
		if (k2 === void 0) k2 = k;
		o[k2] = m[k];
	}));
	var __exportStar = exports && exports.__exportStar || function(m, exports$2) {
		for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports$2, p)) __createBinding(exports$2, m, p);
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	__exportStar(require_errors(), exports);
	__exportStar(require_parseUtil(), exports);
	__exportStar(require_typeAliases(), exports);
	__exportStar(require_util(), exports);
	__exportStar(require_types(), exports);
	__exportStar(require_ZodError(), exports);
}));
//#endregion
//#region src/projection-schema.ts
var import_zod = (/* @__PURE__ */ __commonJSMin(((exports) => {
	var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
		if (k2 === void 0) k2 = k;
		var desc = Object.getOwnPropertyDescriptor(m, k);
		if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) desc = {
			enumerable: true,
			get: function() {
				return m[k];
			}
		};
		Object.defineProperty(o, k2, desc);
	}) : (function(o, m, k, k2) {
		if (k2 === void 0) k2 = k;
		o[k2] = m[k];
	}));
	var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? (function(o, v) {
		Object.defineProperty(o, "default", {
			enumerable: true,
			value: v
		});
	}) : function(o, v) {
		o["default"] = v;
	});
	var __importStar = exports && exports.__importStar || function(mod) {
		if (mod && mod.__esModule) return mod;
		var result = {};
		if (mod != null) {
			for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
		}
		__setModuleDefault(result, mod);
		return result;
	};
	var __exportStar = exports && exports.__exportStar || function(m, exports$1) {
		for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports$1, p)) __createBinding(exports$1, m, p);
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.z = void 0;
	const z = __importStar(require_external());
	exports.z = z;
	__exportStar(require_external(), exports);
	exports.default = z;
})))();
/** Durable lifecycle state of one background agent, folded from the parent log. */
const backgroundAgentEntrySchema = import_zod.z.object({
	/** Durable child session id (the `agentId` every tool returns). */
	agentId: import_zod.z.string().min(1),
	/** Creation label persisted with the child. */
	label: import_zod.z.string(),
	/**
	* Last folded lifecycle fact: `running` while registrations/messages/progress
	* keep landing, `inactive` after the child's activation settled (folded from
	* the official `subagent-settled` notice), `archived` after the idle sweep.
	*/
	activity: import_zod.z.enum([
		"running",
		"inactive",
		"archived"
	]),
	/** Accepted deliveries to the child: the initial task plus every follow-up. */
	messageCount: import_zod.z.number().int().nonnegative(),
	/** Last progress or settle summary, when one was recorded. */
	lastMessage: import_zod.z.string().optional(),
	/** Epoch ms of the registration fact. */
	createdAt: import_zod.z.number().int().nonnegative(),
	/** Epoch ms of the last folded fact for this agent. */
	lastActiveAt: import_zod.z.number().int().nonnegative(),
	/** Epoch ms of the idle-sweep archive fact, when the row is parked. */
	archivedAt: import_zod.z.number().int().nonnegative().optional(),
	/** Epoch ms of the latest interrupt request, when one was recorded. */
	stopRequestedAt: import_zod.z.number().int().nonnegative().optional(),
	/**
	* Aggregated per-agent cost/status totals, present once at least one
	* `metrics` fact has folded. Absent = no turn has been observed yet (or the
	* observability capture is disabled), so consumers render it as "unknown".
	*/
	metrics: import_zod.z.object({
		/** Completed child turns that reported a metric sample. */
		turnCount: import_zod.z.number().int().nonnegative(),
		/** Summed turn wall time over reported turns, ms. */
		totalDurationMs: import_zod.z.number().nonnegative(),
		/** Summed uncached input tokens; null until a turn reports token accounting. */
		inputTokens: import_zod.z.number().int().nonnegative().nullable(),
		/** Summed output tokens; null until a turn reports token accounting. */
		outputTokens: import_zod.z.number().int().nonnegative().nullable(),
		/** Failed turns (`turn/end` with `reason.kind === 'error'`). */
		errorCount: import_zod.z.number().int().nonnegative()
	}).strict().optional()
}).strict();
/** The whole wire value of the `backgroundAgents` projection unit. */
const backgroundAgentsSchema = import_zod.z.object({ agents: import_zod.z.array(backgroundAgentEntrySchema) }).strict();
/**
* Guard an opaque projection value (the client reads projection cells as
* unknown because it cannot merge the host's `SessionProjectionMap`).
* @param value - the opaque cell value.
* @returns the typed projection, or undefined when the cell is absent or invalid.
*/
function isBackgroundAgentsProjection(value) {
	const parsed = backgroundAgentsSchema.safeParse(value);
	return parsed.success ? parsed.data : void 0;
}
//#endregion
//#region src/vocabulary.ts
/**
* Durable vocabulary of dsh-background-agents: the canonical notice-line
* format carried by model-visible injections and the replay metadata the
* four tools attach to their `tool/result` events. Both channels use ONLY
* event types the harness already knows (`user/message`, `tool/result`), so
* the facts survive persistence reloads and the `backgroundAgents`
* projection folds them back out of the parent log — the same discipline as
* model-visible ⟺ logged, applied to dashboard state.
*
* @module dsh-background-agents/vocabulary
*/
/** The producer tag stamped on every model-visible notice and replay meta this plugin writes. */
const PLUGIN = "dsh-background-agents";
/** Prefix that opens every injected notice line, carrying the durable child agent id. */
const NOTICE_PREFIX = "[background-agent ";
/**
* Join one injected notice line from the child id, the fact kind, and the
* human text. The projection folds the line back apart; the model reads the
* whole line verbatim.
* @param agentId - durable child session id.
* @param kind - which lifecycle fact the line states.
* @param text - human-readable account.
* @returns the canonical notice line.
*/
function noticeLine(agentId, kind, text) {
	return `${NOTICE_PREFIX}${agentId}] ${kind}: ${text}`;
}
/**
* Parse the canonical notice head. Returns undefined for any line this
* plugin did not produce, so foreign plugin notices never fold into the
* projection.
* @param text - one injected notice line.
* @returns the head, or undefined when the line is not this plugin's format.
*/
function parseNotice(text) {
	if (!text.startsWith("[background-agent ")) return void 0;
	const close = text.indexOf("]", 18);
	if (close === -1) return void 0;
	const agentId = text.slice(18, close);
	if (agentId === "") return void 0;
	const rest = text.slice(close + 1);
	if (rest.startsWith(" progress: ")) return {
		agentId,
		kind: "progress",
		text: rest.slice(11)
	};
	if (rest.startsWith(" archived: ")) return {
		agentId,
		kind: "archived",
		text: rest.slice(11)
	};
}
/**
* Runtime-guard one opaque `tool/result.meta` value as this plugin's metadata.
* The meta channel is tool-private JSON, so the projection validates before
* folding rather than trusting shape by position.
* @param value - the opaque meta value.
* @returns the typed meta, or undefined when another tool wrote it.
*/
function isBackgroundAgentsMeta(value) {
	if (typeof value !== "object" || value === null || Array.isArray(value)) return void 0;
	const candidate = value;
	if (candidate.plugin !== "dsh-background-agents") return void 0;
	if (typeof candidate.agentId !== "string" || candidate.agentId === "") return void 0;
	switch (candidate.action) {
		case "registered": return typeof candidate.label === "string" ? {
			plugin: PLUGIN,
			action: "registered",
			agentId: candidate.agentId,
			label: candidate.label
		} : void 0;
		case "message": return typeof candidate.messageId === "string" ? {
			plugin: PLUGIN,
			action: "message",
			agentId: candidate.agentId,
			messageId: candidate.messageId
		} : void 0;
		case "stop": return {
			plugin: PLUGIN,
			action: "stop",
			agentId: candidate.agentId
		};
		default: return;
	}
}
//#endregion
//#region src/lifecycle.ts
/**
* The in-memory tracked-children registry.
*/
var BackgroundAgentLifecycle = class {
	children = /* @__PURE__ */ new Map();
	/** Track one accepted child, replacing any stale record under the same id. */
	register(childId, parentSessionId, label, now) {
		const existing = this.children.get(childId);
		this.children.set(childId, {
			childId,
			parentSessionId,
			label: label === "" ? existing?.label ?? "" : label,
			createdAt: existing?.createdAt ?? now,
			lastActivityAt: now,
			lastReportAt: existing?.lastReportAt ?? -1,
			archived: false,
			turnMetrics: existing?.turnMetrics ?? emptyTurnMetricState
		});
	}
	/** Record one observed child-session event. */
	touch(childId, at) {
		const child = this.children.get(childId);
		if (child === void 0) return;
		child.lastActivityAt = at;
	}
	/** Record one emitted progress report (throttle watermark). */
	noteReport(childId, at) {
		const child = this.children.get(childId);
		if (child === void 0) return;
		child.lastReportAt = at;
	}
	/** Mark archived; archived children leave the live observation set. */
	archive(childId) {
		const child = this.children.get(childId);
		if (child === void 0) return;
		child.archived = true;
	}
	/** Drop a stale cache entry (the parent log keeps the durable facts). */
	delete(childId) {
		this.children.delete(childId);
	}
	get(childId) {
		return this.children.get(childId);
	}
	has(childId) {
		return this.children.has(childId);
	}
	/** Live non-archived children of one parent, in registration order. */
	activeFor(parentSessionId) {
		return [...this.children.values()].filter((child) => !child.archived && child.parentSessionId === parentSessionId);
	}
	/** Every tracked child, archived included (the sweep iterates this). */
	all() {
		return [...this.children.values()];
	}
	/** Live non-archived count for one parent (the fallback cap when listing fails). */
	activeCountFor(parentSessionId) {
		return this.activeFor(parentSessionId).length;
	}
};
/**
* One line of a session's last assistant text, empty when it produced none.
* Accepts any event-log carrier so both live sessions and persistence
* inspections can serve the same fold.
* @param session - the event-log carrier.
* @param options.allowReasoning - when true and the selected output carries no
*   text block, fall back to the reasoning blocks (a thinking model's last
*   message may be reasoning-only). Off by default: progress lines never
*   inject reasoning into the parent.
* @param options.reasoning - set by the caller to observe which source the
*   fold used (text when the fallback was not needed).
*/
function sessionLastText(session, options = {}) {
	const output = finalAssistantOutput(session.events);
	if (output === void 0) return "";
	const text = output.filter((block) => block.type === "text").map((block) => block.text).join("").trim();
	if (text !== "" || options.allowReasoning !== true) return text;
	const reasoning = output.filter((block) => block.type === "reasoning").map((block) => block.text).join("").trim();
	if (options.reasoning !== void 0) options.reasoning.used = reasoning !== "";
	return reasoning;
}
/** One line of the child's last assistant text, empty when it produced none. */
function childLastText(sessions, childId) {
	const session = sessions.get(childId);
	if (session === void 0) return "";
	return sessionLastText(session);
}
/** Bound one line to the configured report cap with an explicit ellipsis. */
function boundLine(line, max) {
	const trimmed = line.replaceAll(/\s+/g, " ").trim();
	return trimmed.length <= max ? trimmed : `${trimmed.slice(0, max - 1)}…`;
}
/**
* Report one completed child turn into the parent: a model-visible injected
* notice (source `{ kind: 'plugin', plugin: 'dsh-background-agents' }`) whose
* canonical prefix lets the projection fold the durable fact back out of the
* parent log. Honours the per-child throttle and the parent's presence.
* `wakeup` delivery starts a parent turn through `Agent.followup` (queued
* when the parent is busy); `quiet` delivery appends to the parent's next
* request through `Agent.inject`.
* @returns true when a report was emitted.
*/
function reportProgress(agents, sessions, config, lifecycle, child, now, facts) {
	if (!config.autoReport || child.archived) return false;
	if (child.lastReportAt >= 0 && now - child.lastReportAt < config.reportThrottleMs) return false;
	const parent = agents.get(child.parentSessionId);
	if (parent === void 0) return false;
	const text = childLastText(sessions, child.childId);
	const line = text === "" ? `${child.label} completed a turn (no assistant output)` : `${child.label} completed a turn: ${boundLine(text, config.reportSummaryMaxChars)}`;
	const message = createUserMessage({
		content: [{
			type: "text",
			text: noticeLine(child.childId, "progress", line)
		}],
		source: {
			kind: "plugin",
			plugin: PLUGIN,
			form: "notice",
			summary: boundContextSummary(`${child.label} progress`)
		}
	});
	if (config.reportDelivery === "wakeup") parent.followup(message);
	else parent.inject(message);
	facts.append(parent.session, FACT_EVENT, {
		kind: "progress",
		agentId: child.childId,
		text: line
	});
	lifecycle.noteReport(child.childId, now);
	return true;
}
/**
* Archive one idle child: inject the archived notice into the live parent and
* request interruption of a resident activation. The stop request is exactly
* the official `interrupt` semantics — fire and return; teardown belongs to
* the continuation manager. A child whose live agent is mid-turn is left
* alone (a long tool execution emits no session events and would otherwise
* read as idle).
*/
function archiveChild(ctx, agents, config, lifecycle, child, facts) {
	const parent = agents.get(child.parentSessionId);
	const liveChild = agents.get(child.childId);
	if (liveChild?.status === "running") return;
	if (parent !== void 0) parent.inject(createUserMessage({
		content: [{
			type: "text",
			text: noticeLine(child.childId, "archived", `${child.label} archived: idle for ${config.idleTimeoutMinutes} minutes; send bg_message to wake it or start a new background_agent`)
		}],
		source: {
			kind: "plugin",
			plugin: PLUGIN,
			form: "notice",
			summary: boundContextSummary(`${child.label} archived (idle timeout)`)
		}
	}));
	if (liveChild !== void 0 && parent !== void 0) try {
		ctx.subagents.interrupt(child.childId, {
			kind: "ancestor",
			agent: parent
		});
	} catch (error) {
		ctx.logger("background-agents").warn(`idle archive interrupt failed: ${String(error)}`);
	}
	if (parent !== void 0) facts.append(parent.session, FACT_EVENT, {
		kind: "archived",
		agentId: child.childId
	});
	lifecycle.archive(child.childId);
}
/**
* One sweep pass: archive quiet children past the idle window and drop cache
* entries whose parent and child agents are both gone (the parent log keeps
* the durable facts). Throwing archive notices are contained per child so one
* failure never skips a sibling.
*/
function sweepIdle(ctx, agents, config, lifecycle, now, facts) {
	const timeoutMs = config.idleTimeoutMinutes * 6e4;
	for (const child of lifecycle.all()) {
		if (child.archived) {
			lifecycle.delete(child.childId);
			continue;
		}
		if (config.autoArchive && now - child.lastActivityAt >= timeoutMs) {
			try {
				archiveChild(ctx, agents, config, lifecycle, child, facts);
			} catch (error) {
				ctx.logger("background-agents").warn(`idle archive failed for ${child.childId}: ${String(error)}`);
			}
			continue;
		}
		if (agents.get(child.childId) === void 0 && agents.get(child.parentSessionId) === void 0) lifecycle.delete(child.childId);
	}
}
/** Read the parent's projection value and return the archived agent ids, guarded. */
function archivedIdsFor(ctx, parent) {
	const registry = ctx.get("sessionProjections");
	if (registry === void 0) return [];
	return isBackgroundAgentsProjection(registry.snapshot(parent.session).values.backgroundAgents)?.agents.filter((entry) => entry.activity === "archived").map((entry) => entry.agentId) ?? [];
}
/**
* Count one parent's non-archived background agents for the cap. The durable
* listing is authoritative; when it is unavailable (projections or session
* store missing), the live registry is the honest fallback and the next
* start proceeds against it.
* @returns the current count, or undefined when the durable listing threw.
*/
async function countBackgroundAgents(ctx, parent, lifecycle, signal) {
	let entries;
	try {
		entries = await ctx.subagents.listChildren(parent.id, signal);
	} catch (error) {
		if (error instanceof SubagentError) return lifecycle.activeCountFor(parent.id);
		throw error;
	}
	const archivedIds = new Set(archivedIdsFor(ctx, parent));
	let count = 0;
	for (const entry of entries) {
		if (entry.kind !== "child" || entry.mode !== "continuable") continue;
		if (archivedIds.has(entry.id)) continue;
		count += 1;
	}
	return count;
}
/** The idle sweep timer, owned by the caller's effect. */
function startIdleSweep(ctx, agents, config, lifecycle, facts) {
	const timer = setInterval(() => {
		try {
			sweepIdle(ctx, agents, config, lifecycle, Date.now(), facts);
		} catch (error) {
			ctx.logger("background-agents").warn(`idle sweep pass failed: ${String(error)}`);
		}
	}, config.idleSweepIntervalMs);
	return () => {
		clearInterval(timer);
	};
}
//#endregion
//#region src/projection.ts
/**
* The `backgroundAgents` session-projection unit: folds the parent session's
* log into the dashboard value the Web UI and `bg_list` consume. The fold
* reads ONLY event types the harness already knows —
* `tool/result` replay metadata (registration / message / stop facts written
* by this plugin's tools) and `user/message` (this plugin's injected notices
* plus the official `subagent-settled` account) — so the value reconstructs
* from the durable log on every reopen without any custom session event. The
* `metrics` fact kind aggregates per-agent cost/status totals (tokens, turn
* wall time, error count) into each row's optional `metrics` field.
*
* @module dsh-background-agents/projection
*/
/** Concatenate the text blocks of one user-role message. */
function messageText(message) {
	return message.content.filter((block) => block.type === "text").map((block) => block.text).join("");
}
/** Merge one delta over the present entry or the base; `delta` wins field by field. */
function merge(agentId, entry, delta) {
	return {
		agentId,
		label: delta.label ?? entry.label,
		activity: delta.activity ?? entry.activity,
		messageCount: delta.messageCount ?? entry.messageCount,
		createdAt: delta.createdAt ?? entry.createdAt,
		lastActiveAt: delta.lastActiveAt ?? entry.lastActiveAt,
		source: delta.source ?? entry.source,
		...delta.lastMessage !== void 0 || entry.lastMessage !== void 0 ? { lastMessage: delta.lastMessage ?? entry.lastMessage } : {},
		...delta.archivedAt !== void 0 || entry.archivedAt !== void 0 ? { archivedAt: delta.archivedAt ?? entry.archivedAt } : {},
		...delta.stopRequestedAt !== void 0 || entry.stopRequestedAt !== void 0 ? { stopRequestedAt: delta.stopRequestedAt ?? entry.stopRequestedAt } : {},
		...delta.metrics !== void 0 || entry.metrics !== void 0 ? { metrics: delta.metrics ?? entry.metrics } : {}
	};
}
/**
* Fold one `metrics` fact into the row's aggregated totals. Token totals stay
* `null` until a turn reports them (a `null` sample contributes nothing), so a
* partially-reporting adapter never fabricates a count.
*/
function foldMetrics(current, fact) {
	return {
		turnCount: (current?.turnCount ?? 0) + 1,
		totalDurationMs: (current?.totalDurationMs ?? 0) + (fact.durationMs ?? 0),
		inputTokens: fact.inputTokens === null ? current?.inputTokens ?? null : (current?.inputTokens ?? 0) + fact.inputTokens,
		outputTokens: fact.outputTokens === null ? current?.outputTokens ?? null : (current?.outputTokens ?? 0) + fact.outputTokens,
		errorCount: (current?.errorCount ?? 0) + (fact.error ? 1 : 0)
	};
}
/** Return a new state whose entry for `agentId` carries `delta`; `base` fills unknown agents. */
function upsert(state, agentId, delta, base) {
	if (state.entries.some((entry) => entry.agentId === agentId)) return { entries: state.entries.map((entry) => entry.agentId === agentId ? merge(agentId, entry, delta) : entry) };
	const created = {
		agentId,
		...base
	};
	return { entries: [...state.entries, merge(agentId, created, delta)] };
}
/** The base for a row opened by a fact whose own payload carries no full identity. */
function factBase(at) {
	return {
		label: "",
		activity: "running",
		messageCount: 0,
		createdAt: at,
		lastActiveAt: at,
		source: "event"
	};
}
/**
* The registered projection unit. `stateVersion` bumps whenever the fold
* semantics or the serialized state fields change, so persisted checkpoint
* rows from an older unit refold instead of replaying into garbage.
*/
const backgroundAgentsProjectionDefinition = {
	key: "backgroundAgents",
	stateSchema: import_zod.z.object({ entries: import_zod.z.array(backgroundAgentEntrySchema.extend({ source: import_zod.z.enum(["legacy", "event"]) }).strict()) }).strict(),
	init: () => ({ entries: [] }),
	apply(state, event) {
		switch (event.type) {
			case FACT_EVENT: {
				const fact = event.data;
				const existing = state.entries.find((entry) => entry.agentId === fact.agentId);
				switch (fact.kind) {
					case "registered": return upsert(state, fact.agentId, {
						label: fact.label,
						activity: "running",
						messageCount: 1,
						createdAt: event.time,
						lastActiveAt: event.time,
						source: "event"
					}, factBase(event.time));
					case "message": return upsert(state, fact.agentId, {
						activity: "running",
						messageCount: (existing?.messageCount ?? 0) + 1,
						lastActiveAt: event.time,
						source: "event"
					}, factBase(event.time));
					case "stop":
						if (existing === void 0) return state;
						return upsert(state, fact.agentId, {
							stopRequestedAt: event.time,
							lastActiveAt: event.time,
							source: "event"
						}, factBase(event.time));
					case "progress":
						if (existing === void 0) return state;
						return upsert(state, fact.agentId, {
							activity: "running",
							lastMessage: fact.text,
							lastActiveAt: event.time,
							source: "event"
						}, factBase(event.time));
					case "archived":
						if (existing === void 0) return state;
						return upsert(state, fact.agentId, {
							activity: "archived",
							archivedAt: event.time,
							lastActiveAt: event.time,
							source: "event"
						}, factBase(event.time));
					case "metrics":
						if (existing === void 0) return state;
						return upsert(state, fact.agentId, {
							metrics: foldMetrics(existing.metrics, fact),
							source: "event"
						}, factBase(event.time));
					/* v8 ignore next 2 -- the closed union is total by construction. */
					default: return state;
				}
			}
			case "tool/result": {
				const meta = isBackgroundAgentsMeta(event.data.meta);
				if (meta === void 0) return state;
				if (state.entries.some((entry) => entry.agentId === meta.agentId && entry.source === "event")) return state;
				const shared = { lastActiveAt: event.time };
				const emptyBase = {
					label: "",
					activity: "running",
					messageCount: 0,
					createdAt: event.time,
					lastActiveAt: event.time,
					source: "legacy"
				};
				switch (meta.action) {
					case "registered": return upsert(state, meta.agentId, {
						label: meta.label,
						activity: "running",
						messageCount: 1,
						createdAt: event.time,
						...shared
					}, emptyBase);
					case "message": {
						const entry = state.entries.find((candidate) => candidate.agentId === meta.agentId);
						return upsert(state, meta.agentId, {
							activity: "running",
							messageCount: (entry?.messageCount ?? 0) + 1,
							...shared
						}, emptyBase);
					}
					case "stop":
						if (!state.entries.some((entry) => entry.agentId === meta.agentId)) return state;
						return upsert(state, meta.agentId, {
							stopRequestedAt: event.time,
							...shared
						}, emptyBase);
					/* v8 ignore next 2 -- the guard's closed switch is total by construction. */
					default: return state;
				}
			}
			case "user/message": {
				const source = event.data.source;
				if (source.kind === "plugin" && source.plugin === "dsh-background-agents" && source.form === "notice") {
					const head = parseNotice(messageText(event.data));
					if (head === void 0) return state;
					const entry = state.entries.find((candidate) => candidate.agentId === head.agentId);
					if (entry === void 0 || entry.source === "event") return state;
					const emptyBase = {
						label: "",
						activity: "running",
						messageCount: 0,
						createdAt: event.time,
						lastActiveAt: event.time,
						source: "legacy"
					};
					if (head.kind === "progress") return upsert(state, head.agentId, {
						activity: "running",
						lastMessage: head.text,
						lastActiveAt: event.time
					}, emptyBase);
					return upsert(state, head.agentId, {
						activity: "archived",
						archivedAt: event.time,
						lastActiveAt: event.time
					}, emptyBase);
				}
				if (source.kind === "subagent-settled") {
					if (!state.entries.some((entry) => entry.agentId === source.senderSessionId)) return state;
					return upsert(state, source.senderSessionId, {
						activity: "inactive",
						lastMessage: source.summary,
						lastActiveAt: event.time
					}, {
						label: "",
						activity: "inactive",
						messageCount: 0,
						createdAt: event.time,
						lastActiveAt: event.time,
						source: "legacy"
					});
				}
				return state;
			}
			default: return state;
		}
	},
	wire: {
		viewSchema: backgroundAgentsSchema,
		view: (state) => ({ agents: state.entries.map((entry) => {
			const { source: _source, ...wire } = entry;
			return wire;
		}).sort((a, b) => a.createdAt !== b.createdAt ? a.createdAt - b.createdAt : a.agentId < b.agentId ? -1 : 1) })
	},
	stateVersion: 3
};
//#endregion
//#region src/tools.ts
/** First line of a task description, used as the default creation label. */
function firstLine(text) {
	const cut = text.indexOf("\n");
	return (cut === -1 ? text : text.slice(0, cut)).trim();
}
/** Bound one display label with an explicit ellipsis. */
function boundLabel(text, max) {
	const trimmed = text.trim();
	return trimmed.length <= max ? trimmed : `${trimmed.slice(0, max - 1)}…`;
}
/** Resolve the creation label: the optional argument, else the task's first line. */
function labelOf(args, config) {
	const explicit = args.label?.trim();
	return boundLabel(explicit === void 0 || explicit === "" ? firstLine(args.task) : explicit, config.maxLabelChars);
}
/**
* Validate one `tool_filter` argument against the deployment allowlist. The
* official descriptor rejects a filter without at least one of `allow`/`deny`,
* so the tool fails fast with the same rule plus the allowlist check.
* @param raw - the raw argument (already JSON-validated by defineTool).
* @param config - the deployment policy carrying `allowedChildTools`.
* @returns the trimmed filter, or undefined when the caller passed none.
*/
function validateToolFilter(raw, config) {
	if (raw === void 0) return void 0;
	const allow = raw.allow?.filter((name) => name.trim() !== "");
	const deny = raw.deny?.filter((name) => name.trim() !== "");
	if ((allow === void 0 || allow.length === 0) && (deny === void 0 || deny.length === 0)) throw new Error("tool_filter must declare allow and/or deny with at least one tool name");
	const limit = config.allowedChildTools;
	if (limit !== void 0 && limit.length > 0) {
		for (const name of [...allow ?? [], ...deny ?? []]) if (!limit.includes(name)) throw new Error(`tool_filter names "${name}", outside allowedChildTools: ${limit.join(", ")}`);
	}
	return {
		...allow !== void 0 && allow.length > 0 ? { allow } : {},
		...deny !== void 0 && deny.length > 0 ? { deny } : {}
	};
}
/**
* Validate one `max_depth` argument against the deployment ceiling. The seam
* enforces the same non-negative-safe-integer rule at start; the tool fails
* fast first and adds the configured ceiling.
*/
function validateMaxDepth(raw, config) {
	if (raw === void 0) return void 0;
	if (!Number.isSafeInteger(raw) || raw < 0) throw new Error(`max_depth must be a non-negative safe integer, got ${String(raw)}`);
	if (config.maxChildDepth !== void 0 && raw > config.maxChildDepth) throw new Error(`max_depth ${raw} exceeds the configured maxChildDepth=${config.maxChildDepth}`);
	return raw;
}
/** Read one parent's projection facts, guarded against an unmounted registry. */
function factsFor(ctx, parent) {
	const registry = ctx.get("sessionProjections");
	if (registry === void 0) return /* @__PURE__ */ new Map();
	const value = registry.snapshot(parent.session).values.backgroundAgents;
	const projection = isBackgroundAgentsProjection(value);
	return new Map((projection?.agents ?? []).map((entry) => [entry.agentId, entry]));
}
/**
* Build one bg_list row from a catalog entry's identity, overlaying the
* parent's projection facts and the live agent registry. Kept separate from
* the listing loops because `SubagentDescendantListEntry` is a strict
* superset of `SubagentListEntry`: forming their union would let TypeScript
* reduce the descendant members away, erasing `parentId`/`depth`.
*/
function buildRow(ctx, facts, id, label) {
	const fact = facts.get(id);
	const row = {
		agentId: id,
		label,
		mode: "continuable",
		activity: fact === void 0 ? activityOf(ctx, id, fallbackFact(id)) : activityOf(ctx, id, fact)
	};
	if (fact !== void 0) {
		if (fact.messageCount !== void 0) row.messageCount = fact.messageCount;
		if (fact.lastMessage !== void 0) row.lastMessage = fact.lastMessage;
		if (fact.createdAt !== void 0) row.createdAt = fact.createdAt;
		if (fact.lastActiveAt !== void 0) row.lastActiveAt = fact.lastActiveAt;
	}
	return row;
}
/** Derive one row's activity from the durable fact and the live agent registry. */
function activityOf(ctx, agentId, fact) {
	const live = ctx.agents.get(SessionId(agentId));
	if (fact.activity === "archived") return "archived";
	if (live?.status === "running") return "running";
	if (live !== void 0) return "idle";
	if (fact.activity === "inactive") return "settled";
	return "ready";
}
/**
* Register the four background-agent tools.
* @param ctx - context carrying tools, subagents, and the agent registry.
* @param config - provider, cap, and label bound.
* @param lifecycle - the live tracked-children registry.
*/
function registerBackgroundAgentTools(ctx, config, lifecycle, facts) {
	const startGates = /* @__PURE__ */ new Map();
	ctx.tools.register(defineTool({
		name: "background_agent",
		description: "Start a background agent: a durable child agent session that keeps working while this conversation continues. It receives the task as its first message, runs it in its own context, and returns a stable agent id immediately. Track it with bg_list, watch its progress lines appear in this conversation (autoReport), send it more work any time with bg_message, read its settled result text with bg_result, and request a stop with bg_stop. Progress summaries are injected into this conversation after each of its turns and its final outcome arrives as a notice when it settles. Use this for long-running or parallel objectives you want to steer over time. Optionally scope the child: tool_filter removes tools from its view (never grants new ones), persona gives it a dedicated system-prompt persona, and max_depth caps its further delegation.",
		parameters: {
			task: {
				type: "string",
				required: true,
				description: "The complete task for the background agent, delivered as its first message. It does not share this conversation's context, so include everything it needs."
			},
			label: {
				type: "string",
				description: "Optional short display label (defaults to the task's first line, bounded by maxLabelChars)."
			},
			tool_filter: {
				type: "object",
				additionalProperties: false,
				description: "Optional tool scoping for the child: keep only the listed tools (allow) or remove them (deny). At least one of allow/deny with a tool name is required. Names must come from the deployment allowlist when one is configured (allowedChildTools). This can only restrict — never grant.",
				properties: {
					allow: {
						type: "array",
						items: { type: "string" },
						description: "Global tool names that stay visible to the child; everything else is removed."
					},
					deny: {
						type: "array",
						items: { type: "string" },
						description: "Global tool names removed from the child's visibility."
					}
				}
			},
			persona: {
				type: "string",
				description: "Optional per-child persona: a dedicated system-prompt section shadowing the deployment persona for this child alone."
			},
			max_depth: {
				type: "number",
				description: "Optional absolute cap on this child's further delegation depth (non-negative integer). Bounded by the configured maxChildDepth ceiling."
			}
		},
		output: {
			schema: {
				type: "object",
				additionalProperties: false,
				properties: {
					agentId: {
						type: "string",
						required: true
					},
					messageId: {
						type: "string",
						required: true
					}
				}
			},
			render: (_args, value) => [{
				type: "text",
				text: `started background agent ${value.agentId}`
			}],
			presentationMeta: (args, value) => ({
				plugin: PLUGIN,
				action: "registered",
				agentId: value.agentId,
				label: labelOf(args, config)
			})
		},
		isConcurrencySafe: () => true,
		async execute(args, exec) {
			const parent = exec.agent;
			if (!parent) throw new Error("background_agent requires a calling agent (exec.agent was undefined)");
			const provider = ctx.subagents.getProvider(config.provider);
			if (provider === void 0) throw new Error(`no subagent provider registered for "${config.provider}" — load a continuable-capable provider`);
			if (provider.prepareContinuable === void 0) throw new Error(`subagent provider "${config.provider}" does not support continuable children`);
			const previous = startGates.get(parent.id) ?? Promise.resolve();
			let releaseGate = () => {};
			const gate = new Promise((resolve) => {
				releaseGate = resolve;
			});
			startGates.set(parent.id, gate);
			try {
				await previous;
				if (await countBackgroundAgents(ctx, parent, lifecycle, exec.signal) >= config.maxBackgroundAgents) throw new Error(`background agent limit reached: maxBackgroundAgents=${config.maxBackgroundAgents} non-archived agents; bg_stop one or wait for one to settle before starting more`);
				const task = args.task.trim();
				if (task === "") throw new Error("background_agent requires a non-empty task");
				const label = labelOf(args, config);
				const toolFilter = validateToolFilter(args.tool_filter, config);
				const maxDepth = validateMaxDepth(args.max_depth, config);
				const persona = args.persona === void 0 || args.persona.trim() === "" ? void 0 : args.persona.trim();
				const agentOptions = config.childProvider !== void 0 || config.childModel !== void 0 ? {
					...config.childProvider !== void 0 ? { provider: config.childProvider } : {},
					...config.childModel !== void 0 ? { model: config.childModel } : {}
				} : void 0;
				const started = await ctx.subagents.startContinuable({
					provider: config.provider,
					label,
					request: {
						prompt: [{
							type: "text",
							text: task
						}],
						parent,
						...toolFilter !== void 0 ? { toolFilter } : {},
						...persona !== void 0 ? { persona } : {},
						...maxDepth !== void 0 ? { maxDepth } : {},
						...agentOptions !== void 0 ? { agentOptions } : {}
					},
					signal: exec.signal
				});
				lifecycle.register(started.childId, parent.id, label, Date.now());
				facts.append(parent.session, FACT_EVENT, {
					kind: "registered",
					agentId: started.childId,
					label
				});
				return {
					agentId: started.childId,
					messageId: started.messageId
				};
			} finally {
				releaseGate();
				if (startGates.get(parent.id) === gate) startGates.delete(parent.id);
			}
		}
	}));
	ctx.tools.register(defineTool({
		name: "bg_message",
		description: "Send a message to a background agent by its agent id, continuing the same conversation. It becomes the agent's next turn: if it is still working, the message waits until its current turn finishes. This call returns no answer from the agent — only confirmation that the message was delivered — so use it to give it more work, correct its direction, or wake a settled agent. A failure means the message was NOT delivered.",
		parameters: {
			agent_id: {
				type: "string",
				required: true,
				description: "The agent id returned when the background agent was started."
			},
			message: {
				type: "string",
				required: true,
				description: "The message to deliver to the background agent."
			}
		},
		output: {
			schema: {
				type: "object",
				additionalProperties: false,
				properties: { messageId: {
					type: "string",
					required: true
				} }
			},
			render: (args, _value) => [{
				type: "text",
				text: `message queued as the next turn for background agent ${args.agent_id}`
			}],
			presentationMeta: (args, value) => ({
				plugin: PLUGIN,
				action: "message",
				agentId: args.agent_id,
				messageId: value.messageId
			})
		},
		isConcurrencySafe: () => true,
		async execute(args, exec) {
			const parent = exec.agent;
			if (!parent) throw new Error("bg_message requires a calling agent (exec.agent was undefined)");
			const message = args.message.trim();
			if (message === "") throw new Error("bg_message requires a non-empty message");
			const childId = SessionId(args.agent_id);
			const messageId = await ctx.subagents.followup(parent, childId, [{
				type: "text",
				text: message
			}], {
				source: {
					kind: "coordinator",
					form: "relay",
					senderSessionId: parent.id
				},
				signal: exec.signal
			});
			lifecycle.register(childId, parent.id, "", Date.now());
			facts.append(parent.session, FACT_EVENT, {
				kind: "message",
				agentId: childId,
				messageId
			});
			return { messageId };
		}
	}));
	ctx.tools.register(defineTool({
		name: "bg_list",
		description: "List the background agents of this conversation with their durable ids, labels, activity, message counts, and last activity time. The listing merges the official child catalog (which recovers persisted children after a restart) with this plugin's dashboard facts. Activity comes from the live registry: running means the agent is working right now, idle means it is loaded but between turns, ready means it exists only in storage (resumable via bg_message), settled means its activation ended, and archived means the idle sweep parked it. Children the catalog could not read are reported as diagnostics instead of being dropped. With recursive: true the listing is the descendant tree (every row gains parentId and depth), where only direct children carry the dashboard facts. When the catalog itself is unavailable the result is an explicit unrecoverable marker, never a fabricated empty list.",
		parameters: { recursive: {
			type: "boolean",
			description: "List the whole descendant tree of this conversation (rows gain parentId and depth) instead of direct children only. Defaults to false."
		} },
		output: {
			schema: { oneOf: [{
				type: "object",
				additionalProperties: false,
				properties: {
					kind: {
						type: "string",
						required: true,
						const: "listing"
					},
					agents: {
						type: "array",
						required: true,
						items: {
							type: "object",
							additionalProperties: false,
							properties: {
								agentId: {
									type: "string",
									required: true
								},
								label: {
									type: "string",
									required: true
								},
								mode: {
									type: "string",
									required: true,
									const: "continuable"
								},
								activity: {
									type: "string",
									required: true,
									enum: [
										"running",
										"idle",
										"ready",
										"settled",
										"archived"
									]
								},
								parentId: { type: "string" },
								depth: { type: "number" },
								messageCount: { type: "number" },
								lastMessage: { type: "string" },
								createdAt: { type: "number" },
								lastActiveAt: { type: "number" }
							}
						}
					},
					diagnostics: {
						type: "array",
						required: true,
						items: {
							type: "object",
							additionalProperties: false,
							properties: {
								agentId: {
									type: "string",
									required: true
								},
								reason: {
									type: "string",
									required: true,
									enum: [
										"corrupt",
										"unsupported",
										"unavailable"
									]
								}
							}
						}
					}
				}
			}, {
				type: "object",
				additionalProperties: false,
				properties: {
					kind: {
						type: "string",
						required: true,
						const: "unrecoverable"
					},
					code: {
						type: "string",
						required: true
					},
					message: {
						type: "string",
						required: true
					}
				}
			}] },
			render: (_args, value) => {
				if (value.kind === "unrecoverable") return [{
					type: "text",
					text: `background agent listing unrecoverable: ${value.code}: ${value.message}`
				}];
				const lines = value.agents.map((agent) => `${agent.agentId} [${agent.activity}]${agent.messageCount === void 0 ? "" : ` messages=${agent.messageCount}`} — ${agent.label}`);
				const diagnostics = value.diagnostics.map((entry) => `${entry.agentId} [diagnostic: ${entry.reason}]`);
				const text = [...lines, ...diagnostics].join("\n");
				return [{
					type: "text",
					text: text === "" ? "(no background agents)" : text
				}];
			}
		},
		isConcurrencySafe: () => true,
		async execute(args, exec) {
			const parent = exec.agent;
			if (!parent) throw new Error("bg_list requires a calling agent (exec.agent was undefined)");
			const facts = factsFor(ctx, parent);
			const agents = [];
			const diagnostics = [];
			if (args.recursive === true) {
				let entries;
				try {
					entries = await ctx.subagents.listDescendants(parent.id, exec.signal);
				} catch (error) {
					if (error instanceof SubagentError) return {
						kind: "unrecoverable",
						code: error.code,
						message: error.message
					};
					throw error;
				}
				for (const entry of entries) {
					if (entry.kind === "diagnostic") {
						diagnostics.push({
							agentId: entry.id,
							reason: entry.reason
						});
						continue;
					}
					if (entry.mode !== "continuable") continue;
					const row = buildRow(ctx, facts, entry.id, entry.label);
					row.parentId = entry.parentId;
					row.depth = entry.depth;
					agents.push(row);
				}
			} else {
				let entries;
				try {
					entries = await ctx.subagents.listChildren(parent.id, exec.signal);
				} catch (error) {
					if (error instanceof SubagentError) return {
						kind: "unrecoverable",
						code: error.code,
						message: error.message
					};
					throw error;
				}
				for (const entry of entries) {
					if (entry.kind === "diagnostic") {
						diagnostics.push({
							agentId: entry.id,
							reason: entry.reason
						});
						continue;
					}
					if (entry.mode !== "continuable") continue;
					agents.push(buildRow(ctx, facts, entry.id, entry.label));
				}
			}
			return {
				kind: "listing",
				agents,
				diagnostics
			};
		}
	}));
	ctx.tools.register(defineTool({
		name: "bg_result",
		description: "Read the latest result of a background agent by its agent id: the final assistant output text of its child session (reasoning blocks when the final message carried no text, flagged with textSource), plus its label and current activity. The official settled notice only carries a summary, so use this to fetch the full closing text of a settled agent, or the latest output of one that is still working. An agent id that is not one of this conversation's tracked children is an error.",
		parameters: { agent_id: {
			type: "string",
			required: true,
			description: "The agent id returned when the background agent was started."
		} },
		output: {
			schema: {
				type: "object",
				additionalProperties: false,
				properties: {
					agentId: {
						type: "string",
						required: true
					},
					label: { type: "string" },
					activity: {
						type: "string",
						required: true,
						enum: [
							"running",
							"idle",
							"ready",
							"settled",
							"archived"
						]
					},
					text: { type: "string" },
					truncated: {
						type: "boolean",
						description: "True when the text was ellipsized by resultMaxChars."
					},
					textSource: {
						type: "string",
						enum: ["reasoning"],
						description: "Present only when the selected output carried no text block and the text is the reasoning fallback."
					}
				}
			},
			render: (_args, value) => [{
				type: "text",
				text: value.text === void 0 ? `background agent ${value.agentId} has produced no assistant output yet` : value.textSource === "reasoning" ? `background agent ${value.agentId} reasoning (no final text): ${value.text}` : value.text
			}]
		},
		isConcurrencySafe: () => true,
		async execute(args, exec) {
			const parent = exec.agent;
			if (!parent) throw new Error("bg_result requires a calling agent (exec.agent was undefined)");
			const childId = SessionId(args.agent_id);
			let known = factsFor(ctx, parent).has(childId);
			if (!known) try {
				known = (await ctx.subagents.listChildren(parent.id, exec.signal)).some((entry) => entry.kind === "child" && entry.mode === "continuable" && entry.id === childId);
			} catch (error) {
				if (!(error instanceof SubagentError)) throw error;
			}
			if (!known) throw new Error(`background agent ${childId} is not one of this conversation's tracked children`);
			const fact = factsFor(ctx, parent).get(childId) ?? fallbackFact(childId);
			let session = ctx.sessions.get(childId);
			if (session === void 0) {
				const persistence = ctx.get("sessionPersistence");
				if (persistence !== void 0) session = await persistence.load(childId);
			}
			const reasoning = { used: false };
			const text = session === void 0 ? "" : sessionLastText(session, {
				allowReasoning: true,
				reasoning
			});
			const truncated = text.length > config.resultMaxChars;
			const capped = truncated ? `${text.slice(0, config.resultMaxChars - 1)}…` : text;
			return {
				agentId: childId,
				...fact.label === "" ? {} : { label: fact.label },
				activity: activityOf(ctx, childId, fact),
				...capped === "" ? {} : { text: capped },
				...truncated ? { truncated: true } : {},
				...reasoning.used ? { textSource: "reasoning" } : {}
			};
		}
	}));
	ctx.tools.register(defineTool({
		name: "bg_stop",
		description: "Request a stop of a background agent's current turn by its agent id. Only the current turn stops: messages already queued for the agent stay parked until a later bg_message, and the agent itself stays available for follow-ups. This is a request, not a kill — the official control plane finishes the teardown, so the agent may keep running briefly. Stopping an already-settled agent is accepted. An agent id that is not one of this conversation's children reports not-found without touching anything.",
		parameters: { agent_id: {
			type: "string",
			required: true,
			description: "The agent id returned when the background agent was started."
		} },
		output: {
			schema: {
				type: "object",
				additionalProperties: false,
				properties: {
					outcome: {
						type: "string",
						required: true,
						enum: ["interrupt-requested", "not-found"]
					},
					agentId: {
						type: "string",
						required: true
					}
				}
			},
			render: (_args, value) => [{
				type: "text",
				text: value.outcome === "not-found" ? `background agent ${value.agentId} is not one of this conversation's children — nothing stopped` : `stop requested for background agent ${value.agentId}`
			}],
			presentationMeta: (args) => ({
				plugin: PLUGIN,
				action: "stop",
				agentId: args.agent_id
			})
		},
		isConcurrencySafe: () => true,
		async execute(args, exec) {
			const parent = exec.agent;
			if (!parent) throw new Error("bg_stop requires a calling agent (exec.agent was undefined)");
			const childId = SessionId(args.agent_id);
			let known = true;
			try {
				known = (await ctx.subagents.listChildren(parent.id, exec.signal)).some((entry) => entry.kind === "child" && entry.mode === "continuable" && entry.id === childId);
			} catch (error) {
				if (!(error instanceof SubagentError)) throw error;
			}
			if (!known) return {
				outcome: "not-found",
				agentId: childId
			};
			ctx.subagents.interrupt(childId, {
				kind: "ancestor",
				agent: parent
			});
			facts.append(parent.session, FACT_EVENT, {
				kind: "stop",
				agentId: childId
			});
			return {
				outcome: "interrupt-requested",
				agentId: childId
			};
		}
	}));
}
/** A fact-shaped fallback so rows without projection facts still resolve an activity. */
function fallbackFact(agentId) {
	const at = 0;
	return {
		activity: "running",
		agentId,
		label: "",
		messageCount: 0,
		createdAt: at,
		lastActiveAt: at
	};
}
//#endregion
//#region src/audit.ts
/**
* Host-capability detection for the `ignorable` envelope-marker surface
* that every log-only plugin fact event depends on.
*
* `Session.append(type, data, { ignorable: true })` stamps the envelope
* marker on host builds that expose the surface (harness master
* `@deepseek-ai/dsh-session`); every released rc line through `0.1.0-rc.8`
* silently drops the options bag, so fact events land unmarked and stricter
* hosts refuse to resume those sessions (`SessionFormatUnsupportedError`).
* The fact appender detects the host before polluting a log: the installed
* peer version is checked against the known-unmarked lines first, and an
* unknown (unresolvable) version is verified by probing the FIRST
* appended event's returned envelope. The same discipline lives in
* `dsh-permission-rules` and `dsh-auto-review`.
* @module dsh-background-agents/audit
*/
/**
* Whether an `append` call actually honored the `ignorable` marker: the
* logged event returned by the host carries `ignorable === true` on
* marker-aware builds and nothing on pre-marker builds. `false` (or any
* non-event return) means the host dropped the marker and the event landed
* unmarked — the appender then degrades instead of polluting further logs.
* @param result - the return value of the fact append.
* @returns true only when the marker is present on the returned envelope.
*/
function isMarkedAuditEvent(result) {
	return typeof result === "object" && result !== null && result.ignorable === true;
}
/**
* Whether a `@deepseek-ai/dsh-session` version line predates the
* `ignorable` envelope-marker surface: every released rc line through
* `0.1.0-rc.8` silently drops the marker from `Session.append` options
* (the stamping fix exists on harness master only — no release carries it
* yet), and the `0.1.1-rc` line regressed the same way (verified on
* `0.1.1-rc.2`), so fact events written by those builds land unmarked and
* break resume on stricter hosts. The gate therefore treats
* `0.1.1-rc.1`–`rc.8` as known-unmarked too; over-refusal is harmless
* because `allowUnmarkedFacts: true` opts back in. Extend the bound when a
* new rc line ships that still drops the marker. Non-matching (later rc,
* stable, or unresolvable) versions are treated as possibly-marker-aware
* and verified by the append probe.
* @param version - the installed peer version string.
* @returns true for the known-unmarked rc.1–rc.8 lines of `0.1.0` and `0.1.1`.
*/
function isUnmarkedHostVersion(version) {
	const match = /^0\.1\.[01]-rc\.(\d+)$/.exec(version.trim());
	if (match === null) return false;
	return Number(match[1]) <= 8;
}
/**
* The installed `@deepseek-ai/dsh-session` version, or `null` when
* unresolvable (falls back to the append probe).
* @returns the version string, or null when the peer cannot be resolved.
*/
function peerSessionVersion() {
	try {
		const pkg = createRequire(import.meta.url)("@deepseek-ai/dsh-session/package.json");
		return typeof pkg.version === "string" ? pkg.version : null;
	} catch {
		return null;
	}
}
/**
* Classify an installed `@deepseek-ai/dsh-session` version for log-only
* fact events: `forbidden` at `0.1.2-alpha.1` and later, `append` on the
* earlier rc lines, `unknown` for unresolvable versions.
* @param version - the installed peer version string.
* @returns the fact-event policy for that host line.
*/
function factEventPolicyForVersion(version) {
	const match = /^(\d+)\.(\d+)\.(\d+)/.exec(version.trim());
	if (match === null) return "unknown";
	const major = Number(match[1]);
	const minor = Number(match[2]);
	const patch = Number(match[3]);
	if (major > 0 || minor > 1 || minor === 1 && patch >= 2) return "forbidden";
	return "append";
}
//#endregion
//#region src/facts.ts
/**
* Host-gated fact appender. One instance per plugin mount, shared by the
* lifecycle observers, the four tools, and the room hub.
*/
var FactAppender = class {
	allowUnmarked;
	warn;
	fallback;
	support = "unknown";
	policy = "unknown";
	warned = false;
	warnedForbidden = false;
	constructor(allowUnmarked, warn, fallback) {
		this.allowUnmarked = allowUnmarked;
		this.warn = warn;
		this.fallback = fallback;
	}
	/**
	* Append one log-only fact, requesting the envelope's `ignorable: true`
	* marker. On hosts whose event vocabulary forbids the fact events
	* (`0.1.2-alpha.1+`) the record is routed to the fallback sink instead
	* of the session log; on pre-marker rc hosts (and after a failed probe)
	* the append is skipped so the session log stays loadable everywhere. On 0.1.2-alpha.2 the envelope field is restored for stored-log read compatibility only - its Session.append still cannot stamp the marker, so the gate behavior is unchanged.
	* Append failures are contained: a fact hiccup never disturbs the
	* caller's operation.
	* @param session - the session whose log carries the fact.
	* @param type - the fact event type.
	* @param data - the fact payload.
	*/
	append(session, type, data) {
		if (!this.factEventsAllowed()) {
			this.fallback?.(type, data);
			return;
		}
		if (!this.mayAppend()) return;
		try {
			const result = session.append(type, data, { ignorable: true });
			this.probe(result);
		} catch (error) {
			this.warn(`fact append failed: ${String(error)}`);
		}
	}
	/** Whether the host's event vocabulary still accepts the log-only fact events; the pre-check runs once. */
	factEventsAllowed() {
		if (this.policy === "unknown") {
			const version = peerSessionVersion();
			if (version !== null) this.policy = factEventPolicyForVersion(version);
		}
		if (this.policy !== "forbidden") return true;
		if (!this.warnedForbidden) {
			this.warnedForbidden = true;
			this.warn("this host fails closed on the session event vocabulary (0.1.2-alpha.1+), so log-only fact events cannot be written to the session log 鈥?fact records are routed to the logger/panel channel instead");
		}
		return false;
	}
	/** Whether the host stamps the marker (or the dangerous opt-in is set); the pre-check runs once. */
	mayAppend() {
		if (this.allowUnmarked) return true;
		if (this.support === "unsupported") return false;
		if (this.support === "unknown") {
			const version = peerSessionVersion();
			if (version !== null && isUnmarkedHostVersion(version)) {
				this.support = "unsupported";
				this.warnOnce();
				return false;
			}
		}
		return true;
	}
	/** After the first append on an unversioned host, probe the returned envelope for the marker. */
	probe(result) {
		if (this.support !== "unknown" || this.allowUnmarked) return;
		if (isMarkedAuditEvent(result)) this.support = "supported";
		else {
			this.support = "unsupported";
			this.warnOnce();
		}
	}
	/** One-time warning that fact appends were disabled to keep session logs loadable. */
	warnOnce() {
		if (this.warned) return;
		this.warned = true;
		this.warn("this host drops the ignorable marker on log-only fact events (Session.append predates it), which would make sessions unresumable on stricter harness builds 鈥?fact appends are disabled and the projections degrade to an empty fold; set allowUnmarkedFacts: true to opt back in, and repair already-polluted logs with scripts/repair-session-logs.mjs from dsh-permission-rules");
	}
};
//#endregion
//#region src/inbound.ts
/**
* Cross-ecosystem inbound (P2): a minimal newline-delimited JSON-RPC 2.0
* bridge over stdio that lets external agent runtimes — OpenAI Agents SDK,
* CrewAI, and similar — publish into a team room.
*
* This is a JSON-RPC direct-connect minimal set, not the official ACP wire
* protocol: full ACP compatibility waits for the upstream seam. The bridge
* exposes one seam ({@link InboundCoordinator.registerInboundAdapter}) that
* returns a disposer, and one concrete adapter ({@link StdioJsonRpcInbound})
* that spawns a runtime command and listens on its stdout.
*
* Wire shape (one JSON notification per line on the child's stdout):
*
* - `jsonrpc` is always `"2.0"`; `method` is the event name
*   (`agent_started` | `agent_message` | `agent_finished`).
* - `params` carries the payload: `name` (the external agent's display
*   name), `room` (the team-room id), `traceId` (the correlation id),
*   `status` (`ok` | `error`, only meaningful on `agent_finished`),
*   `message` (the text), and optional `usage` token accounting.
*
* Mapping onto the team room's existing surfaces (see {@link deliveriesFor}):
* `agent_started` opens a task-board card, `agent_message` posts to the
* message bus, and `agent_finished` closes the card and posts the outcome.
* Every invalid message fails closed: it is dropped and a JSON-RPC error
* response is written back to the child's stdin. The owning fiber disposes
* the adapter (kills the child, removes listeners) through the returned
* disposer; an unspawnable command degrades to a logged warning and a
* dormant bridge.
*
* @module dsh-background-agents/inbound
*/
/** The three recognized inbound event names (the JSON-RPC `method`). */
const INBOUND_METHODS = [
	"agent_started",
	"agent_message",
	"agent_finished"
];
/** Optional token accounting the runtime may report on `agent_finished`. */
const inboundUsageSchema = import_zod.z.object({
	/** Un-cached input tokens of the finished run. */
	inputTokens: import_zod.z.number().int().nonnegative(),
	/** Output tokens of the finished run. */
	outputTokens: import_zod.z.number().int().nonnegative()
}).strict();
/**
* The `params` payload every inbound notification carries. `name` is the
* external agent's display name; `room` the team-room id; `traceId` the
* correlation id; `status` the ok/error outcome (only `agent_finished`);
* `message` the text (required for `agent_message`); `usage` optional token
* accounting. `.strict()` rejects unknown fields — fail-closed by default.
*/
const inboundParamsSchema = import_zod.z.object({
	name: import_zod.z.string().min(1).max(200),
	room: import_zod.z.string().min(1),
	traceId: import_zod.z.string().min(1),
	status: import_zod.z.enum(["ok", "error"]).optional(),
	message: import_zod.z.string().optional(),
	usage: inboundUsageSchema.optional()
}).strict();
/**
* Parse one newline-delimited stdin line as a JSON-RPC 2.0 request or
* notification. Malformed JSON and non-conforming envelopes fail closed with
* a stable JSON-RPC error code; the caller reports the error back.
* @param line - one raw line (whitespace tolerated).
* @returns the parsed request, or a protocol error with its response id.
*/
function parseInboundLine(line) {
	let value;
	try {
		value = JSON.parse(line);
	} catch {
		return {
			ok: false,
			id: null,
			code: -32700,
			message: "Parse error: not valid JSON"
		};
	}
	if (typeof value !== "object" || value === null || Array.isArray(value)) return {
		ok: false,
		id: null,
		code: -32600,
		message: "Invalid Request: not a JSON-RPC object"
	};
	const record = value;
	if (record.jsonrpc !== "2.0") return {
		ok: false,
		id: toId(record.id),
		code: -32600,
		message: "Invalid Request: jsonrpc must be \"2.0\""
	};
	if (typeof record.method !== "string" || record.method === "") return {
		ok: false,
		id: toId(record.id),
		code: -32600,
		message: "Invalid Request: method must be a non-empty string"
	};
	return {
		ok: true,
		request: {
			method: record.method,
			params: record.params,
			id: toId(record.id)
		}
	};
}
/**
* Validate a parsed request's method and params and map them to a normalized
* {@link InboundEvent}. Unknown methods and invalid params fail closed with a
* stable JSON-RPC error code.
* @param request - the parsed request from {@link parseInboundLine}.
* @returns the normalized event, or an error to report back.
*/
function mapInboundEvent(request) {
	if (!INBOUND_METHODS.includes(request.method)) return {
		ok: false,
		code: -32601,
		message: `Method not found: ${request.method} (expected ${INBOUND_METHODS.join(" | ")})`
	};
	const method = request.method;
	const parsed = inboundParamsSchema.safeParse(request.params);
	if (!parsed.success) return {
		ok: false,
		code: -32602,
		message: `Invalid params: ${zodIssueText(parsed.error)}`
	};
	const params = parsed.data;
	const base = {
		name: params.name,
		roomId: params.room,
		traceId: params.traceId
	};
	switch (method) {
		case "agent_started": return {
			ok: true,
			event: {
				method,
				...base,
				...params.message === void 0 ? {} : { message: params.message }
			}
		};
		case "agent_message":
			if (params.message === void 0) return {
				ok: false,
				code: -32602,
				message: "Invalid params: message is required for agent_message"
			};
			return {
				ok: true,
				event: {
					method,
					...base,
					message: params.message
				}
			};
		case "agent_finished": return {
			ok: true,
			event: {
				method,
				...base,
				status: params.status ?? "ok",
				...params.message === void 0 ? {} : { message: params.message },
				...params.usage === void 0 ? {} : { usage: params.usage }
			}
		};
	}
}
/**
* Map one normalized event to the team room's existing surfaces. The result
* is a list of room writes the host executes in order against the `RoomHub`.
* @param event - the normalized inbound event.
* @returns the ordered room deliveries for the event.
*/
function deliveriesFor(event) {
	switch (event.method) {
		case "agent_started": return [{
			kind: "task-open",
			roomId: event.roomId,
			traceId: event.traceId,
			title: `${event.name} (${event.traceId})`
		}];
		case "agent_message": return [{
			kind: "bus-post",
			roomId: event.roomId,
			traceId: event.traceId,
			text: `[${event.name}] ${event.message}`
		}];
		case "agent_finished": return [{
			kind: "task-close",
			roomId: event.roomId,
			traceId: event.traceId,
			status: event.status
		}, {
			kind: "bus-post",
			roomId: event.roomId,
			traceId: event.traceId,
			text: `[${event.name}] finished (${event.status})${event.message === void 0 ? "" : `: ${event.message}`}`
		}];
	}
}
/**
* Serialize one JSON-RPC 2.0 error response. `id` is echoed when the request
* carried one; null otherwise (best-effort observability for a notification,
* which the JSON-RPC spec would normally not answer).
* @param id - the request id to echo (or null).
* @param code - the JSON-RPC error code.
* @param message - the human-readable error text.
* @returns one serialized error response line (no trailing newline).
*/
function jsonRpcErrorResponse(id, code, message) {
	return JSON.stringify({
		jsonrpc: "2.0",
		error: {
			code,
			message
		},
		id
	});
}
/**
* The stdio JSON-RPC inbound adapter: spawns a runtime command and listens
* for newline-delimited JSON-RPC notifications on its stdout. Invalid lines
* are dropped (fail-closed) and answered with a JSON-RPC error on the child's
* stdin. Start/stop are owned entirely by the returned disposer.
*/
var StdioJsonRpcInbound = class {
	command;
	logger;
	spawnFn;
	child;
	attempted = false;
	disposed = false;
	/**
	* @param command - the runtime launch command (spawned with a shell).
	* @param logger - where lifecycle and rejection lines are logged.
	* @param spawnFn - injectable spawn for tests; defaults to `node:child_process` spawn.
	*/
	constructor(command, logger = console, spawnFn = spawn) {
		this.command = command;
		this.logger = logger;
		this.spawnFn = spawnFn;
	}
	/**
	* Spawn the runtime and begin listening. A spawn failure degrades to a
	* logged warning and a no-op disposer (the bridge stays dormant).
	* @param sink - the delivery target for mapped events.
	* @returns the stop disposer (kills the child; further output is ignored).
	*/
	start(sink) {
		if (this.attempted) throw new Error("StdioJsonRpcInbound: start() called twice");
		this.attempted = true;
		let child;
		try {
			child = this.spawnFn(this.command, {
				shell: true,
				stdio: [
					"pipe",
					"pipe",
					"pipe"
				]
			});
		} catch (error) {
			this.logger.warn(`inbound: cannot spawn "${this.command}" (${String(error)}); the stdio bridge is dormant`);
			return () => {};
		}
		this.child = child;
		this.disposed = false;
		let pending = "";
		const onStdout = (chunk) => {
			if (this.disposed) return;
			pending += typeof chunk === "string" ? chunk : chunk.toString();
			let index = pending.indexOf("\n");
			while (index !== -1) {
				const line = pending.slice(0, index);
				pending = pending.slice(index + 1);
				this.handleLine(line, sink);
				index = pending.indexOf("\n");
			}
		};
		const onStderr = (chunk) => {
			if (this.disposed) return;
			this.logger.debug?.(`inbound: runtime stderr: ${(typeof chunk === "string" ? chunk : chunk.toString()).trim()}`);
		};
		const onError = (error) => {
			if (this.disposed) return;
			this.logger.warn(`inbound: runtime error: ${String(error)}`);
		};
		const onClose = (code, signal) => {
			if (this.disposed) return;
			this.logger.info(`inbound: runtime exited (code ${String(code)}, signal ${String(signal)}); bridge stopped`);
		};
		child.stdout?.on("data", onStdout);
		child.stderr?.on("data", onStderr);
		child.on("error", onError);
		child.on("close", onClose);
		return () => this.stop();
	}
	/** Stop the adapter: kill the child if still running; further output is ignored. Idempotent. */
	stop() {
		if (this.disposed) return;
		this.disposed = true;
		const child = this.child;
		this.child = void 0;
		if (child !== void 0 && child.exitCode === null && child.signalCode === null) child.kill();
	}
	/** Decode one line, emit a mapped event, or report the failure back (fail-closed). */
	handleLine(line, sink) {
		const trimmed = line.trim();
		if (trimmed === "") return;
		const parsed = parseInboundLine(trimmed);
		if (parsed.ok !== true) {
			this.writeResponse(parsed.id, parsed.code, parsed.message);
			this.logger.warn(`inbound: dropped line: ${parsed.message}`);
			return;
		}
		const decoded = mapInboundEvent(parsed.request);
		if (decoded.ok !== true) {
			this.writeResponse(parsed.request.id, decoded.code, decoded.message);
			this.logger.warn(`inbound: dropped ${parsed.request.method}: ${decoded.message}`);
			return;
		}
		try {
			const result = sink(decoded.event);
			if (result instanceof Promise) result.catch((error) => {
				this.logger.warn(`inbound: sink rejected ${decoded.event.method}: ${String(error)}`);
			});
		} catch (error) {
			this.logger.warn(`inbound: sink threw ${decoded.event.method}: ${String(error)}`);
		}
	}
	/** Best-effort write of one JSON-RPC error response to the child's stdin. */
	writeResponse(id, code, message) {
		const stdin = this.child?.stdin;
		if (stdin === void 0 || stdin === null) return;
		try {
			stdin.write(jsonRpcErrorResponse(id, code, message) + "\n");
		} catch {}
	}
};
/**
* The inbound adapter provider seam: registers adapters and owns their
* disposers. Every registration returns a disposer that stops and unregisters
* exactly that adapter; {@link stopAll} stops every registered adapter.
*/
var InboundCoordinator = class {
	stops = /* @__PURE__ */ new Set();
	/**
	* Register one adapter for a sink and start it. Returns a disposer that
	* stops the adapter and drops it from the registry (idempotent).
	* @param adapter - the adapter to start.
	* @param sink - the delivery target the adapter emits into.
	* @returns the stop-and-unregister disposer.
	*/
	registerInboundAdapter(adapter, sink) {
		const stop = adapter.start(sink);
		let stopped = false;
		const disposer = () => {
			if (stopped) return;
			stopped = true;
			try {
				stop();
			} finally {
				this.stops.delete(disposer);
			}
		};
		this.stops.add(disposer);
		return disposer;
	}
	/** Stop every registered adapter (idempotent). */
	stopAll() {
		for (const stop of [...this.stops]) stop();
		this.stops.clear();
	}
};
/** Read one JSON-RPC id field: a string, a number, or null when absent. */
function toId(value) {
	return typeof value === "string" || typeof value === "number" ? value : null;
}
/** Flatten a zod error into one stable, human-readable message. */
function zodIssueText(error) {
	return error.issues.map((issue) => `${issue.path.length === 0 ? "(root)" : issue.path.join(".")}: ${issue.message}`).join("; ");
}
//#endregion
//#region src/room/schema.ts
/**
* Pure wire vocabulary of the team-room domain: zod schemas for every stored
* record, shared by the domain spec (durable boundary validation), the
* `teamRoom` session projection (wire value), and the client bundle guard.
* All times are epoch ms; ids are plain strings.
*
* @module dsh-background-agents/room/schema
*/
/** One member slot of a room: an independent session registered into the team. */
const roomMemberSchema = import_zod.z.object({
	/** Durable member session id (each member is its own session). */
	sessionId: import_zod.z.string().min(1),
	/** `owner` created the room; `member` joined it. */
	role: import_zod.z.enum(["owner", "member"]),
	/** Epoch ms of registration. */
	joinedAt: import_zod.z.number().int().nonnegative(),
	/**
	* Bus seq up to which this member's session log has received the
	* model-visible delivery (0 = none yet). The offline outbox cursor.
	*/
	lastDeliveredSeq: import_zod.z.number().int().nonnegative(),
	/**
	* Timeline seq up to which this member's session log carries the log-only
	* facts (-1 = none yet). The offline fact-replay cursor.
	*/
	lastFactSeq: import_zod.z.number().int().min(-1)
}).strict();
/** The durable room record: membership plus the two append cursors. */
const roomRecordSchema = import_zod.z.object({
	roomId: import_zod.z.string().min(1),
	name: import_zod.z.string().min(1),
	createdAt: import_zod.z.number().int().nonnegative(),
	/** Registration-order member list (each member is an independent session). */
	members: import_zod.z.array(roomMemberSchema),
	/** Next bus seq to mint (monotonic per room; the ordering authority). */
	busNext: import_zod.z.number().int().nonnegative(),
	/** Next timeline seq to mint. */
	timelineNext: import_zod.z.number().int().nonnegative()
}).strict();
/** One message on the room bus: broadcast, or directed when `toSessionId` is set. */
const busMessageSchema = import_zod.z.object({
	roomId: import_zod.z.string().min(1),
	/** Monotonic per-room seq: the bus order every reader agrees on. */
	seq: import_zod.z.number().int().nonnegative(),
	senderSessionId: import_zod.z.string().min(1),
	/** Directed delivery target; absent = broadcast to every member. */
	toSessionId: import_zod.z.string().min(1).optional(),
	text: import_zod.z.string(),
	createdAt: import_zod.z.number().int().nonnegative()
}).strict();
/** One task-board card: todo / in-progress / done plus its assignee. */
const taskRecordSchema = import_zod.z.object({
	roomId: import_zod.z.string().min(1),
	taskId: import_zod.z.string().min(1),
	title: import_zod.z.string().min(1),
	description: import_zod.z.string(),
	status: import_zod.z.enum([
		"todo",
		"in-progress",
		"done"
	]),
	/** Assignee member session id; null = unassigned. */
	assigneeSessionId: import_zod.z.string().nullable(),
	createdBy: import_zod.z.string().min(1),
	createdAt: import_zod.z.number().int().nonnegative(),
	updatedAt: import_zod.z.number().int().nonnegative(),
	completedAt: import_zod.z.number().int().nonnegative().optional()
}).strict();
/** Timeline kinds the room appends; the shared event stream. */
const timelineKindSchema = import_zod.z.enum([
	"room-created",
	"member-joined",
	"member-left",
	"message-posted",
	"message-directed",
	"task-created",
	"task-claimed",
	"task-assigned",
	"task-completed"
]);
/** One shared timeline event (append-only per room). */
const timelineEventSchema = import_zod.z.object({
	roomId: import_zod.z.string().min(1),
	/** Monotonic per-room seq; the timeline order. */
	seq: import_zod.z.number().int().nonnegative(),
	kind: timelineKindSchema,
	at: import_zod.z.number().int().nonnegative(),
	/** Kind-specific payload; plain lossless JSON. */
	data: import_zod.z.record(import_zod.z.unknown())
}).strict();
/** One member row as the fold serves it. */
const roomViewMemberSchema = import_zod.z.object({
	sessionId: import_zod.z.string().min(1),
	role: import_zod.z.enum(["owner", "member"]),
	joinedAt: import_zod.z.number().int().nonnegative()
}).strict();
/** One task row as the fold serves it. */
const roomViewTaskSchema = import_zod.z.object({
	taskId: import_zod.z.string().min(1),
	title: import_zod.z.string(),
	description: import_zod.z.string(),
	status: import_zod.z.enum([
		"todo",
		"in-progress",
		"done"
	]),
	assigneeSessionId: import_zod.z.string().nullable(),
	createdBy: import_zod.z.string(),
	createdAt: import_zod.z.number().int().nonnegative(),
	updatedAt: import_zod.z.number().int().nonnegative()
}).strict();
/** One room as the fold serves it. */
const roomViewSchema = import_zod.z.object({
	roomId: import_zod.z.string().min(1),
	name: import_zod.z.string(),
	createdAt: import_zod.z.number().int().nonnegative(),
	members: import_zod.z.array(roomViewMemberSchema),
	tasks: import_zod.z.array(roomViewTaskSchema),
	timeline: import_zod.z.array(timelineEventSchema)
}).strict();
/** The whole `teamRoom` projection value: every room this session belongs to. */
const teamRoomViewSchema = import_zod.z.object({ rooms: import_zod.z.array(roomViewSchema) }).strict();
//#endregion
//#region src/room/domain.ts
/**
* The `team_rooms` storage-domain declaration: rooms, the message bus, the
* task board, and the shared timeline as four KV tables over the harness's
* own storage layer (SQLite or JSONL backend — the deployment chooses; the
* plugin adds no service of its own). Records are validated at the durable
* boundary by the same zod schemas the projection and the client share.
*
* The domain's single write chain is the ordering authority: every bus
* append and cursor bump queues on it, so concurrent posters can never
* interleave a read-modify-write.
*
* @module dsh-background-agents/room/domain
*/
/**
* The domain spec: identity, format version, and the four declared tables.
* The same schemas validate every record at the durable read boundary.
*/
const teamRoomsDomainSpec = defineDomain({
	name: "team_rooms",
	version: 1,
	tables: {
		rooms: domainTable(roomRecordSchema),
		bus: domainTable(busMessageSchema),
		tasks: domainTable(taskRecordSchema),
		timeline: domainTable(timelineEventSchema)
	}
});
//#endregion
//#region src/room/events.ts
/** The log-only fact event type this plugin appends to member sessions. */
const TEAM_ROOM_FACT = "team-room/fact";
//#endregion
//#region src/room/hub.ts
/**
* RoomHub: the host-side service behind team rooms. It opens the
* `team_rooms` storage domain, owns every room mutation (membership, the
* message bus, the task board, the timeline), and drives delivery:
*
* - every write queues on ONE hub chain (the domain's single write chain is
*   the ordering authority — concurrent posters cannot interleave a
*   read-modify-write, and bus seqs mint strictly in commit order);
* - model-visible delivery goes through the official inbox
*   (`agent.followup` wakes live members; offline members receive their
*   backlog through `agent.inject` when their session next starts), so every
*   model-visible room message is a durable `user/message` event in the
*   member's own session log — model-visible ⟺ recorded;
* - the shared timeline mirrors into every member's log as log-only
*   `team-room/fact` events (ignorable), so the `teamRoom` projection
*   reconstructs the room view from each member's own durable log;
* - per-member delivery is at-least-once and ordered: a crash between bus
*   commit and delivery re-delivers on catch-up (the cursor only advances
*   after delivery), and per-member chains serialize delivery order.
*
* @module dsh-background-agents/room/hub
*/
/** A domain-level rejection with a stable code; tools and commands render it. */
var RoomError = class extends Error {
	code;
	constructor(code, message) {
		super(message);
		this.code = code;
		this.name = "RoomError";
	}
};
const roomKey = (roomId) => roomId;
const appendKey = (roomId, seq) => `${roomId}/${seq}`;
const seqOf = (key) => Number(String(key).slice(String(key).lastIndexOf("/") + 1));
/**
* The team-room service. Constructed in apply() with the validated room
* policy once the storage domain is available; {@link open} opens the
* `team_rooms` storage domain and the owning fiber closes it.
*/
var RoomHub = class extends Service {
	config;
	agents;
	sessions;
	facts;
	rooms;
	bus;
	tasks;
	timeline;
	/** One write chain: every mutation (create/join/post/task) queues here. */
	tail = Promise.resolve();
	/** Per-room delivery chains: posts to one room serialize delivery order. */
	roomChains = /* @__PURE__ */ new Map();
	/** Per-member delivery chains: live delivery and catch-up never interleave. */
	memberChains = /* @__PURE__ */ new Map();
	/** Resolves once the storage domain is open (or failed); gates every operation. */
	ready;
	readyResolve = () => {};
	initError;
	constructor(ctx, config, agents, sessions, facts) {
		super(ctx, "roomHub");
		this.config = config;
		this.agents = agents;
		this.sessions = sessions;
		this.facts = facts;
		this.ready = new Promise((resolve) => {
			this.readyResolve = resolve;
		});
	}
	/**
	* Open the `team_rooms` storage domain and load its four tables. Called
	* once by the mount site after the storage domain becomes available; every
	* hub operation gates on this resolution. A failed open fails every
	* operation loud through {@link requireRooms} instead of hanging — and a
	* STUCK open (a storage provider whose open promise never settles) is cut
	* off by the `roomOpenTimeoutMs` timer so `/room` commands still settle
	* with a `store-unavailable` error instead of never emitting
	* `command/done`.
	*/
	async open() {
		let timer;
		const timeout = new Promise((_, reject) => {
			timer = setTimeout(() => {
				reject(new RoomError("store-unavailable", `the team_rooms storage domain did not open within ${this.config.roomOpenTimeoutMs} ms (the storage provider may be missing or stuck) — /room and the room_* tools are disabled for this profile`));
			}, this.config.roomOpenTimeoutMs);
		});
		const openPromise = this.ctx.storageDomain.open(teamRoomsDomainSpec);
		openPromise.then((domain) => {
			if (this.initError !== void 0) domain.close();
		}, () => {});
		try {
			const domain = await Promise.race([openPromise, timeout]);
			clearTimeout(timer);
			if (this.initError !== void 0) return;
			try {
				this.ctx.effect(() => () => {
					domain.close();
				}, "dsh-background-agents: team_rooms domain close");
			} catch (effectError) {
				domain.close();
				throw effectError;
			}
			this.rooms = domain.table("rooms");
			this.bus = domain.table("bus");
			this.tasks = domain.table("tasks");
			this.timeline = domain.table("timeline");
		} catch (error) {
			this.initError = error;
			throw error;
		} finally {
			clearTimeout(timer);
			this.readyResolve();
		}
	}
	/** One room record, or undefined. */
	async room(roomId) {
		await this.ready;
		return this.requireRooms().get(roomKey(roomId));
	}
	/** Every room one session is a member of, in creation order. */
	async roomsOfMember(sessionId) {
		await this.ready;
		return [...this.requireRooms().entries()].map(([, record]) => record).filter((record) => record.members.some((member) => member.sessionId === sessionId));
	}
	/** All rooms (used by the command surface for the roster). */
	async allRooms() {
		await this.ready;
		return [...this.requireRooms().entries()].map(([, record]) => record);
	}
	/** Bus messages of one room with seq > since, in seq order. */
	async busMessages(roomId, since = 0) {
		await this.ready;
		return [...this.requireBus().entries()].map(([, message]) => message).filter((message) => message.roomId === roomId && message.seq > since).sort((a, b) => a.seq - b.seq);
	}
	/** The task board of one room, creation order. */
	async tasksOf(roomId) {
		await this.ready;
		return [...this.requireTasks().entries()].map(([, task]) => task).filter((task) => task.roomId === roomId).sort((a, b) => a.createdAt - b.createdAt);
	}
	/** The timeline of one room with seq > since, in seq order. */
	async timelineOf(roomId, since = 0) {
		await this.ready;
		return [...this.requireTimeline().entries()].map(([, event]) => event).filter((event) => event.roomId === roomId && event.seq > since).sort((a, b) => a.seq - b.seq);
	}
	/** The member slot of one session in one room, or undefined. */
	memberOf(room, sessionId) {
		return room.members.find((member) => member.sessionId === sessionId);
	}
	/**
	* Create one room; the creator becomes its owner member. Enforces the
	* profile-wide `maxRooms` cap inside the write chain.
	*/
	createRoom(sessionId, name, now = Date.now()) {
		return this.enqueue(async () => {
			const rooms = this.requireRooms();
			const trimmed = name.trim();
			if (trimmed === "") throw new RoomError("empty-name", "room name must not be empty");
			if (rooms.size >= this.config.maxRooms) throw new RoomError("room-cap", `room limit reached: maxRooms=${this.config.maxRooms}`);
			const roomId = randomUUID();
			const record = {
				roomId,
				name: trimmed,
				createdAt: now,
				members: [{
					sessionId,
					role: "owner",
					joinedAt: now,
					lastDeliveredSeq: 0,
					lastFactSeq: -1
				}],
				busNext: 0,
				timelineNext: 0
			};
			await rooms.put(roomKey(roomId), record);
			const event = this.timelineEvent(roomId, 0, "room-created", now, { sessionId });
			await this.requireTimeline().put(appendKey(roomId, event.seq), event);
			const current = await rooms.update(roomKey(roomId), (latest) => ({
				...latest,
				timelineNext: 1
			}));
			this.appendFactTo(sessionId, this.joinFact(current, [], [event]));
			this.injectBrief(sessionId, current);
			return current;
		});
	}
	/**
	* Register one session as a member of an existing room (cross-session
	* membership). Enforces the per-room and per-member caps inside the chain.
	*/
	joinRoom(sessionId, roomId, now = Date.now()) {
		return this.enqueue(async () => {
			const rooms = this.requireRooms();
			const record = this.requireRoom(roomId);
			if (this.memberOf(record, sessionId) !== void 0) return record;
			if (record.members.length >= this.config.maxMembersPerRoom) throw new RoomError("member-cap", `room ${roomId} is full: maxMembersPerRoom=${this.config.maxMembersPerRoom}`);
			if ((await this.roomsOfMember(sessionId)).length >= this.config.maxRoomsPerMember) throw new RoomError("membership-cap", `membership limit reached: maxRoomsPerMember=${this.config.maxRoomsPerMember}`);
			const member = {
				sessionId,
				role: "member",
				joinedAt: now,
				lastDeliveredSeq: record.busNext,
				lastFactSeq: record.timelineNext - 1
			};
			const event = this.timelineEvent(roomId, record.timelineNext, "member-joined", now, {
				sessionId,
				role: member.role
			});
			await this.requireTimeline().put(appendKey(roomId, event.seq), event);
			const next = {
				...record,
				members: [...record.members, member],
				timelineNext: record.timelineNext + 1
			};
			await rooms.put(roomKey(roomId), next);
			this.appendFactTo(sessionId, this.joinFact(next, await this.tasksOf(roomId), await this.timelineOf(roomId)));
			this.broadcastFact(next, {
				kind: "member-joined",
				roomId,
				sessionId,
				role: member.role,
				joinedAt: now,
				timelineSeq: event.seq
			});
			this.injectBrief(sessionId, next);
			return next;
		});
	}
	/** Remove one member. The owner leaving deletes the room. */
	leaveRoom(sessionId, roomId, now = Date.now()) {
		return this.enqueue(async () => {
			const rooms = this.requireRooms();
			const record = this.requireRoom(roomId);
			const member = this.memberOf(record, sessionId);
			if (member === void 0) return record;
			if (member.role === "owner" && record.members.length > 1) throw new RoomError("owner-leave", "the owner cannot leave while other members remain; delete the room instead (/room delete)");
			if (record.members.length <= 1) {
				await rooms.delete(roomKey(roomId));
				await this.purgeRoom(roomId);
				return;
			}
			const event = this.timelineEvent(roomId, record.timelineNext, "member-left", now, { sessionId });
			await this.requireTimeline().put(appendKey(roomId, event.seq), event);
			const next = {
				...record,
				members: record.members.filter((candidate) => candidate.sessionId !== sessionId),
				timelineNext: record.timelineNext + 1
			};
			await rooms.put(roomKey(roomId), next);
			this.broadcastFact(next, {
				kind: "member-left",
				roomId,
				sessionId,
				timelineSeq: event.seq
			});
			return next;
		});
	}
	/** Owner-only room deletion. */
	deleteRoom(sessionId, roomId) {
		return this.enqueue(async () => {
			const record = this.requireRoom(roomId);
			if (this.memberOf(record, sessionId)?.role !== "owner") throw new RoomError("not-owner", `room ${roomId}: only the owner can delete the room`);
			await this.requireRooms().delete(roomKey(roomId));
			await this.purgeRoom(roomId);
		});
	}
	/**
	* Post one message onto the bus: broadcast, or directed when `toSessionId`
	* names a member. Runs on the per-room delivery chain so per-member
	* delivery order always equals bus seq order, and commits the store write
	* before any delivery (cursors advance only after delivery — at-least-once).
	*/
	postMessage(input, now = Date.now()) {
		return this.onRoomChain(input.roomId, async () => {
			const text = input.text.trim();
			if (text === "") throw new RoomError("empty-message", "room message must not be empty");
			if (text.length > this.config.maxMessageChars) throw new RoomError("message-too-long", `room message exceeds maxMessageChars=${this.config.maxMessageChars}`);
			const posted = await this.enqueue(async () => {
				const rooms = this.requireRooms();
				const record = this.requireRoom(input.roomId);
				if (this.memberOf(record, input.senderSessionId) === void 0) throw new RoomError("not-member", `session ${input.senderSessionId} is not a member of room ${input.roomId}`);
				if (input.toSessionId !== void 0 && this.memberOf(record, input.toSessionId) === void 0) throw new RoomError("unknown-target", `session ${input.toSessionId} is not a member of room ${input.roomId}`);
				const message = {
					roomId: input.roomId,
					seq: record.busNext,
					senderSessionId: input.senderSessionId,
					...input.toSessionId === void 0 ? {} : { toSessionId: input.toSessionId },
					text,
					createdAt: now
				};
				await this.requireBus().put(appendKey(input.roomId, message.seq), message);
				const event = this.timelineEvent(input.roomId, record.timelineNext, input.toSessionId === void 0 ? "message-posted" : "message-directed", now, {
					seq: message.seq,
					senderSessionId: input.senderSessionId,
					text,
					...input.toSessionId === void 0 ? {} : { toSessionId: input.toSessionId }
				});
				await this.requireTimeline().put(appendKey(input.roomId, event.seq), event);
				const next = {
					...record,
					busNext: record.busNext + 1,
					timelineNext: record.timelineNext + 1
				};
				await rooms.put(roomKey(input.roomId), next);
				await this.pruneRoom(input.roomId, next);
				return {
					record: next,
					message,
					event
				};
			});
			await this.deliverPosted(posted.record, posted.message, posted.event);
			await this.advanceCursors(posted.record, posted.message, posted.event);
			return {
				roomId: posted.message.roomId,
				seq: posted.message.seq,
				senderSessionId: posted.message.senderSessionId,
				...posted.message.toSessionId === void 0 ? {} : { toSessionId: posted.message.toSessionId },
				text: posted.message.text,
				createdAt: posted.message.createdAt
			};
		});
	}
	/** Create a task on the board (assignee optional; default unassigned). */
	createTask(input, now = Date.now()) {
		return this.enqueue(async () => {
			const record = this.requireRoom(input.roomId);
			if (this.memberOf(record, input.bySessionId) === void 0) throw new RoomError("not-member", `session ${input.bySessionId} is not a member of room ${input.roomId}`);
			if (input.assigneeSessionId !== void 0 && this.memberOf(record, input.assigneeSessionId) === void 0) throw new RoomError("unknown-target", `session ${input.assigneeSessionId} is not a member of room ${input.roomId}`);
			const title = input.title.trim();
			if (title === "") throw new RoomError("empty-title", "task title must not be empty");
			const task = {
				roomId: input.roomId,
				taskId: randomUUID(),
				title,
				description: (input.description ?? "").trim(),
				status: "todo",
				assigneeSessionId: input.assigneeSessionId ?? null,
				createdBy: input.bySessionId,
				createdAt: now,
				updatedAt: now
			};
			await this.requireTasks().put(appendKey(input.roomId, task.taskId), task);
			const event = this.timelineEvent(input.roomId, record.timelineNext, "task-created", now, {
				taskId: task.taskId,
				title: task.title
			});
			await this.requireTimeline().put(appendKey(input.roomId, event.seq), event);
			return {
				task,
				next: await this.requireRooms().update(roomKey(input.roomId), (current) => ({
					...current,
					timelineNext: current.timelineNext + 1
				})),
				event
			};
		}).then(async ({ task, next, event }) => {
			this.broadcastFact(next, this.taskCreatedFact(task, event.seq));
			await this.advanceFactsForLive(next, event.seq);
			return task;
		});
	}
	/** Claim a task for the calling member (in-progress + assignee). */
	claimTask(input, now = Date.now()) {
		return this.mutateTask(input, now, "claim");
	}
	/**
	* Hand a task to another member. Callers outside a tool (the /room command)
	* are the user themselves; the room_transfer_task TOOL gates this same
	* mutation behind the approval service.
	*/
	assignTask(input, now = Date.now()) {
		return this.mutateTask(input, now, "assign");
	}
	/** Complete a task (done). Only the assignee or the owner may complete it. */
	completeTask(input, now = Date.now()) {
		return this.mutateTask(input, now, "complete");
	}
	/**
	* Deliver everything a member missed while offline: the log-only facts
	* (shared timeline) and the model-visible bus backlog, both in store order.
	* Runs on the member's delivery chain so a live post cannot interleave.
	* Idempotent: cursors make a second call a no-op.
	*/
	catchUp(sessionId) {
		return this.onMemberChain(sessionId, async () => {
			const rooms = this.requireRooms();
			const agent = this.agents.get(sessionId);
			const session = this.sessions.get(sessionId);
			if (session === void 0) return;
			for (const [, record] of rooms.entries()) {
				const member = this.memberOf(record, sessionId);
				if (member === void 0) continue;
				for (const event of await this.timelineOf(record.roomId, member.lastFactSeq)) {
					const fact = this.factFromTimeline(record, event);
					if (fact !== void 0) this.facts.append(session, TEAM_ROOM_FACT, fact);
				}
				const backlog = (await this.busMessages(record.roomId, member.lastDeliveredSeq)).filter((message) => message.senderSessionId !== sessionId);
				if (agent !== void 0) for (const message of backlog) agent.inject(this.roomUserMessage(record, message));
				await this.enqueue(async () => {
					await this.requireRooms().update(roomKey(record.roomId), (current) => {
						if (current.members.find((candidate) => candidate.sessionId === sessionId) === void 0) return current;
						return {
							...current,
							members: current.members.map((candidate) => candidate.sessionId === sessionId ? {
								...candidate,
								lastFactSeq: Math.max(candidate.lastFactSeq, current.timelineNext - 1),
								lastDeliveredSeq: Math.max(candidate.lastDeliveredSeq, current.busNext - 1)
							} : candidate)
						};
					});
				});
				if (this.config.injectRoomBrief) this.injectBrief(sessionId, record);
			}
		});
	}
	/**
	* The member brief: a SHORT injected paragraph that starts with the
	* one-line role statement (Minimal-persona style) and names the room id,
	* the member count, and the collaboration tools. Injected on join and on
	* every session start (resume included), as a durable user message — the
	* member's model sees exactly what the member's log records.
	*/
	injectBrief(sessionId, room) {
		if (!this.config.injectRoomBrief) return;
		const agent = this.agents.get(sessionId);
		if (agent === void 0) return;
		agent.inject(createUserMessage({
			content: [{
				type: "text",
				text: this.briefText(room)
			}],
			source: {
				kind: "plugin",
				plugin: PLUGIN,
				form: "notice",
				summary: boundContextSummary(`team room ${room.name}`)
			}
		}));
	}
	/** Build the minimal brief paragraph for one room. */
	briefText(room) {
		const others = room.members.filter((member) => member.sessionId !== "").length;
		return [
			`You are a helpful assistant in team room ${room.name}.`,
			`Room id: ${room.roomId}. Members: ${others} other session(s); each member is an independent session.`,
			"Collaborate with room_post (broadcast or direct a message), room_list_tasks, room_claim_task, room_create_task, room_transfer_task, room_complete_task, and room_list_rooms.",
			"You are notified here when room messages arrive. Keep your room turns brief and prefer your own session for private work."
		].join(" ");
	}
	/**
	* Queue one mutation on the single write chain; rejections are contained.
	* The previous tail is captured SYNCHRONOUSLY: reading `this.tail` after
	* `ready` resolves would see the just-assigned tail (a promise that settles
	* with this very result) and deadlock the whole write chain — the exact
	* hang that left `/room create` without a `command/done`.
	*/
	enqueue(job) {
		const previous = this.tail;
		const result = this.ready.then(() => previous).then(job);
		this.tail = result.then(() => {}, () => {});
		return result;
	}
	/** Serialize work per room (delivery order = bus order). */
	onRoomChain(roomId, job) {
		const result = (this.roomChains.get(roomId) ?? Promise.resolve()).then(job, job);
		const slot = result.then(() => {}, () => {});
		this.roomChains.set(roomId, slot);
		return result.finally(() => {
			if (this.roomChains.get(roomId) === slot) this.roomChains.delete(roomId);
		});
	}
	/** Serialize delivery per member (live delivery vs catch-up). */
	onMemberChain(sessionId, job) {
		const key = String(sessionId);
		const result = (this.memberChains.get(key) ?? Promise.resolve()).then(job, job);
		const slot = result.then(() => {}, () => {});
		this.memberChains.set(key, slot);
		return result.finally(() => {
			if (this.memberChains.get(key) === slot) this.memberChains.delete(key);
		});
	}
	/** One task-board mutation shared by claim/assign/complete. */
	mutateTask(input, now, operation) {
		return this.enqueue(async () => {
			const record = this.requireRoom(input.roomId);
			const byMember = this.memberOf(record, input.bySessionId);
			if (byMember === void 0) throw new RoomError("not-member", `session ${input.bySessionId} is not a member of room ${input.roomId}`);
			const tasks = this.requireTasks();
			const current = tasks.get(appendKey(input.roomId, input.taskId));
			if (current === void 0) throw new RoomError("unknown-task", `room ${input.roomId} has no task ${input.taskId}`);
			if (operation === "complete" && current.status === "done") return {
				done: true,
				task: current
			};
			if (operation === "complete" && current.assigneeSessionId !== input.bySessionId && byMember.role !== "owner") throw new RoomError("not-assignee", `task ${input.taskId}: only the assignee or the room owner can complete it`);
			const target = operation === "assign" ? this.memberOf(record, input.toSessionId) : void 0;
			if (operation === "assign" && target === void 0) throw new RoomError("unknown-target", `session ${input.toSessionId} is not a member of room ${input.roomId}`);
			const next = {
				...current,
				status: operation === "complete" ? "done" : "in-progress",
				assigneeSessionId: operation === "assign" ? input.toSessionId : operation === "claim" ? input.bySessionId : current.assigneeSessionId,
				updatedAt: now,
				...operation === "complete" ? { completedAt: now } : {}
			};
			await tasks.put(appendKey(input.roomId, input.taskId), next);
			const kind = operation === "complete" ? "task-completed" : operation === "assign" ? "task-assigned" : "task-claimed";
			const event = this.timelineEvent(input.roomId, record.timelineNext, kind, now, {
				taskId: input.taskId,
				...next.assigneeSessionId === null ? {} : { assigneeSessionId: next.assigneeSessionId },
				...operation === "assign" ? { bySessionId: input.bySessionId } : {}
			});
			await this.requireTimeline().put(appendKey(input.roomId, event.seq), event);
			return {
				done: false,
				task: next,
				nextRoom: await this.requireRooms().update(roomKey(input.roomId), (room) => ({
					...room,
					timelineNext: room.timelineNext + 1
				})),
				event
			};
		}).then(async (result) => {
			if (result.done) return result.task;
			const { task, nextRoom, event } = result;
			const fact = this.taskMutationFact(operation, task, event.seq, input.bySessionId);
			this.broadcastFact(nextRoom, fact);
			await this.advanceFactsForLive(nextRoom, event.seq);
			if (operation === "assign") await this.postMessage({
				roomId: input.roomId,
				senderSessionId: input.bySessionId,
				toSessionId: input.toSessionId,
				text: `Task assigned to you: ${task.title}`
			}, now);
			return task;
		});
	}
	/** Append the room-joined snapshot fact to one session's live log. */
	appendFactTo(sessionId, fact) {
		const session = this.sessions.get(sessionId);
		if (session === void 0) return;
		this.facts.append(session, TEAM_ROOM_FACT, fact);
	}
	/** Append one fact to every LIVE member session (offline members catch up). */
	broadcastFact(room, fact) {
		for (const member of room.members) this.appendFactTo(SessionId(member.sessionId), fact);
	}
	/** Deliver one posted message's fact + model-visible copy, per member. */
	async deliverPosted(room, message, event) {
		const fact = {
			kind: "message-posted",
			roomId: message.roomId,
			seq: message.seq,
			timelineSeq: event.seq,
			senderSessionId: message.senderSessionId,
			...message.toSessionId === void 0 ? {} : { toSessionId: message.toSessionId },
			text: message.text,
			createdAt: message.createdAt
		};
		for (const member of room.members) {
			const memberId = SessionId(member.sessionId);
			const isRecipient = message.toSessionId === void 0 ? member.sessionId !== message.senderSessionId : member.sessionId === message.toSessionId;
			await this.onMemberChain(memberId, async () => {
				if (this.sessions.get(memberId) !== void 0) this.appendFactTo(memberId, fact);
				if (isRecipient) {
					const agent = this.agents.get(memberId);
					if (agent !== void 0) agent.followup(this.roomUserMessage(room, message));
				}
			});
		}
	}
	/** Advance delivery cursors for the members that just received the post. */
	async advanceCursors(room, message, event) {
		await this.enqueue(async () => {
			await this.requireRooms().update(roomKey(room.roomId), (current) => ({
				...current,
				members: current.members.map((member) => {
					const memberId = SessionId(member.sessionId);
					const gotFact = this.sessions.get(memberId) !== void 0;
					const gotDelivery = message.toSessionId === void 0 ? member.sessionId !== message.senderSessionId : member.sessionId === message.toSessionId;
					const wasLive = this.sessions.get(memberId) !== void 0;
					return {
						...member,
						...gotFact ? { lastFactSeq: event.seq } : {},
						...gotDelivery && wasLive ? { lastDeliveredSeq: message.seq } : {}
					};
				})
			}));
		});
	}
	/** Advance the fact cursor for every member whose session is live now. */
	async advanceFactsForLive(room, timelineSeq) {
		await this.enqueue(async () => {
			await this.requireRooms().update(roomKey(room.roomId), (current) => ({
				...current,
				members: current.members.map((member) => this.sessions.get(SessionId(member.sessionId)) === void 0 ? member : {
					...member,
					lastFactSeq: timelineSeq
				})
			}));
		});
	}
	/** One model-visible delivery: a durable user message with a room header. */
	roomUserMessage(room, message) {
		const direction = message.toSessionId === void 0 ? "broadcast" : "to you";
		return createUserMessage({
			content: [{
				type: "text",
				text: `[team-room ${room.roomId}] ${message.senderSessionId} (${direction}): ${message.text}`
			}],
			source: {
				kind: "plugin",
				plugin: PLUGIN,
				form: "relay"
			}
		});
	}
	/** The room-joined snapshot fact. */
	joinFact(room, tasks, timeline) {
		return {
			kind: "room-joined",
			roomId: room.roomId,
			name: room.name,
			createdAt: room.createdAt,
			members: room.members,
			tasks,
			timeline
		};
	}
	/** Rebuild the fact one timeline event corresponds to (catch-up replay). */
	factFromTimeline(room, event) {
		const data = event.data;
		switch (event.kind) {
			case "room-created": return;
			case "member-joined": return {
				kind: "member-joined",
				roomId: room.roomId,
				sessionId: String(data.sessionId),
				role: data.role === "owner" ? "owner" : "member",
				joinedAt: Number(event.at),
				timelineSeq: event.seq
			};
			case "member-left": return {
				kind: "member-left",
				roomId: room.roomId,
				sessionId: String(data.sessionId),
				timelineSeq: event.seq
			};
			case "message-posted":
			case "message-directed": {
				const message = this.requireBus().get(appendKey(room.roomId, Number(data.seq)));
				if (message === void 0) return void 0;
				return {
					kind: "message-posted",
					roomId: room.roomId,
					seq: message.seq,
					timelineSeq: event.seq,
					senderSessionId: message.senderSessionId,
					...message.toSessionId === void 0 ? {} : { toSessionId: message.toSessionId },
					text: message.text,
					createdAt: message.createdAt
				};
			}
			case "task-created": {
				const task = this.requireTasks().get(appendKey(room.roomId, String(data.taskId)));
				if (task === void 0) return void 0;
				return this.taskCreatedFact(task, event.seq);
			}
			case "task-claimed": {
				const task = this.requireTasks().get(appendKey(room.roomId, String(data.taskId)));
				if (task === void 0) return void 0;
				return {
					kind: "task-claimed",
					roomId: room.roomId,
					taskId: task.taskId,
					assigneeSessionId: String(data.assigneeSessionId ?? task.assigneeSessionId ?? ""),
					at: event.at,
					timelineSeq: event.seq
				};
			}
			case "task-assigned": {
				const task = this.requireTasks().get(appendKey(room.roomId, String(data.taskId)));
				if (task === void 0) return void 0;
				return {
					kind: "task-assigned",
					roomId: room.roomId,
					taskId: task.taskId,
					assigneeSessionId: String(data.assigneeSessionId ?? task.assigneeSessionId ?? ""),
					bySessionId: String(data.bySessionId),
					at: event.at,
					timelineSeq: event.seq
				};
			}
			case "task-completed": return {
				kind: "task-completed",
				roomId: room.roomId,
				taskId: String(data.taskId),
				at: event.at,
				timelineSeq: event.seq
			};
			/* v8 ignore next 2 -- the closed union is total by construction. */
			default: return;
		}
	}
	taskCreatedFact(task, timelineSeq) {
		return {
			kind: "task-created",
			roomId: task.roomId,
			taskId: task.taskId,
			title: task.title,
			description: task.description,
			assigneeSessionId: task.assigneeSessionId,
			createdBy: task.createdBy,
			createdAt: task.createdAt,
			timelineSeq
		};
	}
	taskMutationFact(operation, task, timelineSeq, bySessionId) {
		if (operation === "complete") return {
			kind: "task-completed",
			roomId: task.roomId,
			taskId: task.taskId,
			at: task.updatedAt,
			timelineSeq
		};
		if (operation === "assign") return {
			kind: "task-assigned",
			roomId: task.roomId,
			taskId: task.taskId,
			assigneeSessionId: task.assigneeSessionId,
			bySessionId,
			at: task.updatedAt,
			timelineSeq
		};
		return {
			kind: "task-claimed",
			roomId: task.roomId,
			taskId: task.taskId,
			assigneeSessionId: task.assigneeSessionId,
			at: task.updatedAt,
			timelineSeq
		};
	}
	timelineEvent(roomId, seq, kind, at, data) {
		return {
			roomId,
			seq,
			kind,
			at,
			data
		};
	}
	/** Retention pruning: bus, timeline, and completed tasks. */
	async pruneRoom(roomId, record) {
		const bus = this.requireBus();
		for (const [key] of bus.entries()) {
			if (!String(key).startsWith(`${roomId}/`)) continue;
			if (seqOf(key) <= record.busNext - 1 - this.config.busRetention) await bus.delete(key);
		}
		const timeline = this.requireTimeline();
		for (const [key] of timeline.entries()) {
			if (!String(key).startsWith(`${roomId}/`)) continue;
			if (seqOf(key) <= record.timelineNext - 1 - this.config.timelineRetention) await timeline.delete(key);
		}
		const tasks = this.requireTasks();
		const done = (await this.tasksOf(roomId)).filter((task) => task.status === "done").sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0));
		for (const task of done.slice(this.config.taskRetention)) await tasks.delete(appendKey(roomId, task.taskId));
	}
	/** Delete every bus/task/timeline row of a deleted room. */
	async purgeRoom(roomId) {
		for (const table of [
			this.requireBus(),
			this.requireTasks(),
			this.requireTimeline()
		]) for (const [key] of table.entries()) if (String(key).startsWith(`${roomId}/`)) await table.delete(key);
	}
	requireRoom(roomId) {
		const record = this.requireRooms().get(roomKey(roomId));
		if (record === void 0) throw new RoomError("unknown-room", `room ${roomId} does not exist`);
		return record;
	}
	requireRooms() {
		if (this.initError !== void 0) throw this.initError;
		if (this.rooms === void 0) throw new Error("room hub is not started yet");
		return this.rooms;
	}
	requireBus() {
		if (this.initError !== void 0) throw this.initError;
		if (this.bus === void 0) throw new Error("room hub is not started yet");
		return this.bus;
	}
	requireTasks() {
		if (this.initError !== void 0) throw this.initError;
		if (this.tasks === void 0) throw new Error("room hub is not started yet");
		return this.tasks;
	}
	requireTimeline() {
		if (this.initError !== void 0) throw this.initError;
		if (this.timeline === void 0) throw new Error("room hub is not started yet");
		return this.timeline;
	}
};
//#endregion
//#region src/room/commands.ts
const USAGE = "Usage: /room [create <name>|join <roomId>|leave [roomId]|list|send [roomId] <text>|tasks [roomId]|task add <roomId> <title>|task assign <roomId> <task> <member|me>|task claim <roomId> <task>|task done <roomId> <task>|delete <roomId>]";
/** Resolve `me` and raw session ids to a member session id; `me` = the caller. */
function memberRef(token, self) {
	if (token === "me") return self;
	if (token === "") return void 0;
	return SessionId(token);
}
/** Resolve a task ref: the exact task id, or a 1-based index into the board. */
async function resolveTask(hub, roomId, ref) {
	const board = await hub.tasksOf(roomId);
	const byId = board.find((task) => task.taskId === ref);
	if (byId !== void 0) return byId;
	const index = Number(ref);
	if (!Number.isSafeInteger(index) || index < 1) throw new RoomError("unknown-task", `room ${roomId}: "${ref}" is neither a task id nor a board position`);
	const byIndex = board[index - 1];
	if (byIndex === void 0) throw new RoomError("unknown-task", `room ${roomId}: board position ${index} is out of range (${board.length} tasks)`);
	return byIndex;
}
/** Split a line into whitespace-separated tokens (the room grammar is word-based). */
function tokens(raw) {
	return raw.trim().split(/\s+/u).filter((token) => token !== "");
}
/** Parse the subcommand grammar; unknown shapes answer a usage error. */
function parseRoomCommand(rawInput) {
	const words = tokens(rawInput);
	if (words.length === 0) return { kind: "overview" };
	switch ((words[0] ?? "").toLowerCase()) {
		case "create": return words.length >= 2 ? {
			kind: "create",
			name: words.slice(1).join(" ")
		} : { kind: "usage" };
		case "join": return words.length === 2 ? {
			kind: "join",
			roomId: words[1]
		} : { kind: "usage" };
		case "leave": return {
			kind: "leave",
			...words.length === 2 ? { roomId: words[1] } : {}
		};
		case "list": return { kind: "list" };
		case "send":
			if (words.length < 2) return { kind: "usage" };
			return {
				kind: "send",
				first: words[1],
				rest: words.slice(2).join(" ")
			};
		case "tasks": return {
			kind: "tasks",
			...words.length === 2 ? { roomId: words[1] } : {}
		};
		case "task": {
			const sub = (words[1] ?? "").toLowerCase();
			if (sub === "add" && words.length >= 4) return {
				kind: "task-add",
				roomId: words[2],
				title: words.slice(3).join(" ")
			};
			if (sub === "assign" && words.length === 5) return {
				kind: "task-assign",
				roomId: words[2],
				task: words[3],
				member: words[4]
			};
			if (sub === "claim" && words.length === 4) return {
				kind: "task-claim",
				roomId: words[2],
				task: words[3]
			};
			if (sub === "done" && words.length === 4) return {
				kind: "task-done",
				roomId: words[2],
				task: words[3]
			};
			return { kind: "usage" };
		}
		case "delete": return words.length === 2 ? {
			kind: "delete",
			roomId: words[1]
		} : { kind: "usage" };
		default: return { kind: "usage" };
	}
}
/** Render one room's board. */
async function renderTasks(hub, roomId, title) {
	const lines = (await hub.tasksOf(roomId)).map((task, index) => `${index + 1}. ${task.taskId} [${task.status}]${task.assigneeSessionId === null ? "" : ` → ${task.assigneeSessionId}`} — ${task.title}`);
	return {
		kind: "success",
		text: [title, ...lines.length === 0 ? ["(no tasks on the board)"] : lines].join("\n")
	};
}
/** Render the caller's membership overview. */
async function renderOverview(hub, sessionId) {
	const rooms = await hub.roomsOfMember(sessionId);
	return {
		kind: "success",
		text: [...rooms.length === 0 ? ["You are not a member of any team room.", ""] : rooms.map((room) => `${room.roomId} "${room.name}" — ${room.members.length} members (you: ${room.members.find((member) => member.sessionId === sessionId)?.role ?? "member"})`), USAGE].join("\n")
	};
}
/** Resolve the target room: explicit id, or the caller's single membership. */
async function resolveRoom(hub, sessionId, roomId) {
	if (roomId !== void 0 && roomId !== "") return roomId;
	const rooms = await hub.roomsOfMember(sessionId);
	if (rooms.length === 1) return rooms[0].roomId;
	throw new RoomError("ambiguous-room", `this session belongs to ${rooms.length} rooms; name the room id (${rooms.map((room) => room.roomId).join(", ")})`);
}
/** Execute one parsed command against the durable room store. */
async function executeRoomCommand(hub, sessionId, command) {
	switch (command.kind) {
		case "overview": return await renderOverview(hub, sessionId);
		case "create": {
			const room = await hub.createRoom(sessionId, command.name);
			return {
				kind: "success",
				text: `Room created: ${room.roomId} "${room.name}" — you are the owner. Share the room id so other sessions can /room join ${room.roomId}.`
			};
		}
		case "join": {
			const room = await hub.joinRoom(sessionId, command.roomId);
			return {
				kind: "success",
				text: `Joined room ${room.roomId} "${room.name}" (${room.members.length} members). /room send <text> posts to the room.`
			};
		}
		case "leave": {
			const roomId = await resolveRoom(hub, sessionId, command.roomId);
			return {
				kind: "success",
				text: await hub.leaveRoom(sessionId, roomId) === void 0 ? `Left room ${roomId}; the last member leaving deleted the room.` : `Left room ${roomId}.`
			};
		}
		case "list": return await renderOverview(hub, sessionId);
		case "send": {
			const targeted = command.rest !== "" && (await hub.room(command.first))?.members.some((member) => member.sessionId === sessionId) === true;
			const roomId = targeted ? command.first : await resolveRoom(hub, sessionId);
			const text = targeted ? command.rest : `${command.first}${command.rest === "" ? "" : ` ${command.rest}`}`;
			return {
				kind: "success",
				text: `Sent to room ${roomId} (seq ${(await hub.postMessage({
					roomId,
					senderSessionId: sessionId,
					text
				})).seq}).`
			};
		}
		case "tasks": {
			const roomId = await resolveRoom(hub, sessionId, command.roomId);
			return await renderTasks(hub, roomId, `Tasks of room ${roomId}:`);
		}
		case "task-add": {
			const task = await hub.createTask({
				roomId: command.roomId,
				bySessionId: sessionId,
				title: command.title
			});
			return {
				kind: "success",
				text: `Task created: ${task.taskId} [todo] — ${task.title} (/room task claim ${command.roomId} ${task.taskId})`
			};
		}
		case "task-assign": {
			const target = memberRef(command.member, sessionId);
			if (target === void 0) return {
				kind: "error",
				text: "assignee must be \"me\" or a member session id"
			};
			return {
				kind: "success",
				text: `Task ${(await hub.assignTask({
					roomId: command.roomId,
					bySessionId: sessionId,
					taskId: (await resolveTask(hub, command.roomId, command.task)).taskId,
					toSessionId: target
				})).taskId} handed to ${target} (in-progress). The assignee was notified.`
			};
		}
		case "task-claim": {
			const task = await hub.claimTask({
				roomId: command.roomId,
				bySessionId: sessionId,
				taskId: (await resolveTask(hub, command.roomId, command.task)).taskId
			});
			return {
				kind: "success",
				text: `Claimed task ${task.taskId} [in-progress] — ${task.title} (assignee: you).`
			};
		}
		case "task-done": {
			const task = await hub.completeTask({
				roomId: command.roomId,
				bySessionId: sessionId,
				taskId: (await resolveTask(hub, command.roomId, command.task)).taskId
			});
			return {
				kind: "success",
				text: `Task ${task.taskId} completed [done] — ${task.title}.`
			};
		}
		case "delete":
			await hub.deleteRoom(sessionId, command.roomId);
			return {
				kind: "success",
				text: `Room ${command.roomId} deleted.`
			};
		/* v8 ignore next 2 -- the closed union is total by construction. */
		default: return {
			kind: "error",
			text: USAGE
		};
	}
}
/**
* Register the `/room` command when the harness composes the command
* registry. The handler runs outside any model turn, so it performs the
* mutations directly (the typing user is the authorizer). The command surface
* is optional: without it the room_* tools still work from the model side.
* @returns the exact command disposer, or undefined when no command registry
*   is composed.
*/
function registerRoomCommand(ctx, hub) {
	const commands = ctx.get("commands");
	if (commands === void 0) return void 0;
	return commands.register({
		name: "room",
		description: "manage team rooms: create, join, list, send messages, and work the shared task board",
		input: { hint: "[create <name>|join <roomId>|leave|list|send <text>|tasks|task add|assign|claim|done|delete]" },
		handler: async (invocation) => {
			const sessionId = invocation.agent.id;
			const command = parseRoomCommand(invocation.rawInput);
			if (command.kind === "usage") return {
				kind: "error",
				text: USAGE
			};
			try {
				return await executeRoomCommand(hub, sessionId, command);
			} catch (error) {
				if (error instanceof RoomError) return {
					kind: "error",
					text: `${error.code}: ${error.message}`
				};
				throw error;
			}
		}
	});
}
//#endregion
//#region src/room/tools.ts
/** Resolve the optional approval service; fail closed when absent. */
function approvalOf(ctx) {
	return ctx.get("approval");
}
/**
* Ask the approval seam for one sensitive room operation. A missing service,
* a missing answerer, a rejection, or an abort all fail closed with the same
* stable error, so the caller never guesses an outcome.
*/
async function requireApproval(approval, req) {
	if (approval === void 0) throw new RoomError("approval-unavailable", "room operation requires approval but no approval service is composed — failing closed");
	const outcome = await approval.request(req);
	if (outcome !== "allowed-once") throw new RoomError("approval-denied", `room operation not approved (outcome: ${outcome}); nothing changed`);
}
/** Build one room-list row from the durable record. */
async function roomRow(hub, sessionId, roomId, name, createdAt) {
	const room = await hub.room(roomId);
	if (room === void 0) return void 0;
	const tasks = await hub.tasksOf(roomId);
	const member = room.members.find((candidate) => candidate.sessionId === sessionId);
	if (member === void 0) return void 0;
	return {
		roomId,
		name,
		createdAt,
		memberCount: room.members.length,
		openTasks: tasks.filter((task) => task.status === "todo").length,
		inProgressTasks: tasks.filter((task) => task.status === "in-progress").length,
		doneTasks: tasks.filter((task) => task.status === "done").length,
		members: room.members.map((candidate) => ({
			sessionId: candidate.sessionId,
			role: candidate.role
		})),
		myRole: member.role
	};
}
/**
* Register the eight room tools.
* @param ctx - context carrying tools and the optional approval service.
* @param hub - the room service owning the durable state.
*/
function registerRoomTools(ctx, hub) {
	ctx.tools.register(defineTool({
		name: "room_list_rooms",
		description: "List every team room this session belongs to: room ids, names, member rosters (each member is an independent session), and task-board counts. Rooms persist across DSH restarts and sessions. Use the returned room_id with the other room_* tools.",
		parameters: {},
		output: {
			schema: {
				type: "object",
				additionalProperties: false,
				properties: { rooms: {
					type: "array",
					required: true,
					items: {
						type: "object",
						additionalProperties: false,
						properties: {
							roomId: {
								type: "string",
								required: true
							},
							name: {
								type: "string",
								required: true
							},
							createdAt: {
								type: "number",
								required: true
							},
							memberCount: {
								type: "number",
								required: true
							},
							openTasks: {
								type: "number",
								required: true
							},
							inProgressTasks: {
								type: "number",
								required: true
							},
							doneTasks: {
								type: "number",
								required: true
							},
							members: {
								type: "array",
								required: true,
								items: {
									type: "object",
									additionalProperties: false,
									properties: {
										sessionId: {
											type: "string",
											required: true
										},
										role: {
											type: "string",
											required: true,
											enum: ["owner", "member"]
										}
									}
								}
							},
							myRole: {
								type: "string",
								required: true,
								enum: ["owner", "member"]
							}
						}
					}
				} }
			},
			render: (_args, value) => [{
				type: "text",
				text: value.rooms.length === 0 ? "(this session is not a member of any team room)" : value.rooms.map((room) => `${room.roomId} "${room.name}" — ${room.memberCount} members, ${room.openTasks} open / ${room.inProgressTasks} in-progress / ${room.doneTasks} done (you: ${room.myRole})`).join("\n")
			}]
		},
		isConcurrencySafe: () => true,
		async execute(_args, exec) {
			const agent = exec.agent;
			if (!agent) throw new Error("room_list_rooms requires a calling agent (exec.agent was undefined)");
			const rooms = await hub.roomsOfMember(agent.id);
			const rows = [];
			for (const room of rooms) {
				const row = await roomRow(hub, agent.id, room.roomId, room.name, room.createdAt);
				if (row !== void 0) rows.push(row);
			}
			return { rooms: rows };
		}
	}));
	ctx.tools.register(defineTool({
		name: "room_post",
		description: "Post one message onto a team room's message bus. Without `to`, the message broadcasts to every member (except you — your own turn already records it); with `to`, it is a directed message delivered only to that member session. Live members are woken with the message as their next turn; offline members receive it when their session next starts. Every message is durable: it lands on the shared room timeline and in each recipient's session log.",
		parameters: {
			room_id: {
				type: "string",
				required: true,
				description: "The room id from room_list_rooms."
			},
			text: {
				type: "string",
				required: true,
				description: "The message text (bounded by maxMessageChars)."
			},
			to: {
				type: "string",
				description: "Optional member session id for a directed message; omit to broadcast to every member."
			}
		},
		output: {
			schema: {
				type: "object",
				additionalProperties: false,
				properties: {
					roomId: {
						type: "string",
						required: true
					},
					seq: {
						type: "number",
						required: true
					}
				}
			},
			render: (args, value) => [{
				type: "text",
				text: args.to === void 0 ? `posted to room ${value.roomId} (broadcast, seq ${value.seq})` : `posted to room ${value.roomId} for ${args.to} (directed, seq ${value.seq})`
			}],
			presentationMeta: (_args, value) => ({
				plugin: PLUGIN,
				action: "room-message",
				roomId: value.roomId,
				seq: value.seq
			})
		},
		isConcurrencySafe: () => true,
		async execute(args, exec) {
			const agent = exec.agent;
			if (!agent) throw new Error("room_post requires a calling agent (exec.agent was undefined)");
			const posted = await hub.postMessage({
				roomId: String(args.room_id),
				senderSessionId: agent.id,
				text: String(args.text),
				...args.to === void 0 ? {} : { toSessionId: SessionId(String(args.to)) }
			});
			return {
				roomId: posted.roomId,
				seq: posted.seq
			};
		}
	}));
	ctx.tools.register(defineTool({
		name: "room_read",
		description: "Read the message-bus history of one team room (seq > since, in order). Use it to catch up on a room conversation, e.g. right after joining, or to review what other members posted while you were busy.",
		parameters: {
			room_id: {
				type: "string",
				required: true,
				description: "The room id from room_list_rooms."
			},
			since: {
				type: "number",
				description: "Only messages with seq > since. Defaults to 0 (the whole retained window)."
			}
		},
		output: {
			schema: {
				type: "object",
				additionalProperties: false,
				properties: { messages: {
					type: "array",
					required: true,
					items: {
						type: "object",
						additionalProperties: false,
						properties: {
							seq: {
								type: "number",
								required: true
							},
							senderSessionId: {
								type: "string",
								required: true
							},
							toSessionId: { type: "string" },
							text: {
								type: "string",
								required: true
							},
							createdAt: {
								type: "number",
								required: true
							}
						}
					}
				} }
			},
			render: (_args, value) => [{
				type: "text",
				text: value.messages.length === 0 ? "(no room messages in the retained window)" : value.messages.map((message) => `#${message.seq} ${message.senderSessionId}${message.toSessionId === void 0 ? "" : ` → ${message.toSessionId}`}: ${message.text}`).join("\n")
			}]
		},
		isConcurrencySafe: () => true,
		async execute(args, exec) {
			const agent = exec.agent;
			if (!agent) throw new Error("room_read requires a calling agent (exec.agent was undefined)");
			const roomId = String(args.room_id);
			if ((await hub.room(roomId))?.members.some((member) => member.sessionId === agent.id) !== true) throw new RoomError("not-member", `this session is not a member of room ${roomId}`);
			const since = typeof args.since === "number" && Number.isSafeInteger(args.since) && args.since >= 0 ? args.since : 0;
			return { messages: (await hub.busMessages(roomId, since)).map((message) => ({
				seq: message.seq,
				senderSessionId: message.senderSessionId,
				...message.toSessionId === void 0 ? {} : { toSessionId: message.toSessionId },
				text: message.text,
				createdAt: message.createdAt
			})) };
		}
	}));
	ctx.tools.register(defineTool({
		name: "room_list_tasks",
		description: "List one team room's shared task board: every task with its status (todo / in-progress / done), assignee session id, and timestamps. The board is shared and durable — any member may claim an unassigned task with room_claim_task.",
		parameters: { room_id: {
			type: "string",
			required: true,
			description: "The room id from room_list_rooms."
		} },
		output: {
			schema: {
				type: "object",
				additionalProperties: false,
				properties: { tasks: {
					type: "array",
					required: true,
					items: {
						type: "object",
						additionalProperties: false,
						properties: {
							taskId: {
								type: "string",
								required: true
							},
							title: {
								type: "string",
								required: true
							},
							description: {
								type: "string",
								required: true
							},
							status: {
								type: "string",
								required: true,
								enum: [
									"todo",
									"in-progress",
									"done"
								]
							},
							assigneeSessionId: { type: "string" },
							createdBy: {
								type: "string",
								required: true
							},
							createdAt: {
								type: "number",
								required: true
							},
							updatedAt: {
								type: "number",
								required: true
							}
						}
					}
				} }
			},
			render: (_args, value) => [{
				type: "text",
				text: value.tasks.length === 0 ? "(no tasks on the board)" : value.tasks.map((task) => `${task.taskId} [${task.status}]${task.assigneeSessionId === void 0 ? "" : ` → ${task.assigneeSessionId}`} — ${task.title}`).join("\n")
			}]
		},
		isConcurrencySafe: () => true,
		async execute(args, exec) {
			const agent = exec.agent;
			if (!agent) throw new Error("room_list_tasks requires a calling agent (exec.agent was undefined)");
			const roomId = String(args.room_id);
			if ((await hub.room(roomId))?.members.some((member) => member.sessionId === agent.id) !== true) throw new RoomError("not-member", `this session is not a member of room ${roomId}`);
			return { tasks: (await hub.tasksOf(roomId)).map((task) => ({
				taskId: task.taskId,
				title: task.title,
				description: task.description,
				status: task.status,
				...task.assigneeSessionId === null ? {} : { assigneeSessionId: task.assigneeSessionId },
				createdBy: task.createdBy,
				createdAt: task.createdAt,
				updatedAt: task.updatedAt
			})) };
		}
	}));
	ctx.tools.register(defineTool({
		name: "room_create_task",
		description: "Create one task on a team room's shared board. Leave `assignee` empty for an unassigned task any member can claim, or name a member session id to assign it directly. The task is durable and every member sees it on the board and the timeline.",
		parameters: {
			room_id: {
				type: "string",
				required: true,
				description: "The room id from room_list_rooms."
			},
			title: {
				type: "string",
				required: true,
				description: "Short task title (the board row)."
			},
			description: {
				type: "string",
				description: "Optional task details."
			},
			assignee: {
				type: "string",
				description: "Optional member session id to assign the task to; omit to leave it unassigned."
			}
		},
		output: {
			schema: {
				type: "object",
				additionalProperties: false,
				properties: {
					taskId: {
						type: "string",
						required: true
					},
					status: {
						type: "string",
						required: true,
						const: "todo"
					}
				}
			},
			render: (args, value) => [{
				type: "text",
				text: `task ${value.taskId} created on room ${args.room_id}${args.assignee === void 0 ? "" : ` for ${args.assignee}`}`
			}],
			presentationMeta: (args, value) => ({
				plugin: PLUGIN,
				action: "room-task-created",
				roomId: String(args.room_id),
				taskId: value.taskId
			})
		},
		isConcurrencySafe: () => true,
		async execute(args, exec) {
			const agent = exec.agent;
			if (!agent) throw new Error("room_create_task requires a calling agent (exec.agent was undefined)");
			return {
				taskId: (await hub.createTask({
					roomId: String(args.room_id),
					bySessionId: agent.id,
					title: String(args.title),
					...args.description === void 0 ? {} : { description: String(args.description) },
					...args.assignee === void 0 ? {} : { assigneeSessionId: SessionId(String(args.assignee)) }
				})).taskId,
				status: "todo"
			};
		}
	}));
	ctx.tools.register(defineTool({
		name: "room_claim_task",
		description: "Claim one unassigned task on a team room's board for this session: it becomes in-progress with you as the assignee. Every member sees the claim on the timeline. Only the assignee (or the room owner) may later complete it; hand it to another member with room_transfer_task.",
		parameters: {
			room_id: {
				type: "string",
				required: true,
				description: "The room id from room_list_rooms."
			},
			task_id: {
				type: "string",
				required: true,
				description: "The task id from room_list_tasks."
			}
		},
		output: {
			schema: {
				type: "object",
				additionalProperties: false,
				properties: {
					taskId: {
						type: "string",
						required: true
					},
					status: {
						type: "string",
						required: true,
						const: "in-progress"
					},
					assigneeSessionId: {
						type: "string",
						required: true
					}
				}
			},
			render: (args, value) => [{
				type: "text",
				text: `claimed task ${value.taskId} on room ${args.room_id} (in-progress, assignee ${value.assigneeSessionId})`
			}],
			presentationMeta: (args, value) => ({
				plugin: PLUGIN,
				action: "room-task-claimed",
				roomId: String(args.room_id),
				taskId: value.taskId
			})
		},
		isConcurrencySafe: () => true,
		async execute(args, exec) {
			const agent = exec.agent;
			if (!agent) throw new Error("room_claim_task requires a calling agent (exec.agent was undefined)");
			const task = await hub.claimTask({
				roomId: String(args.room_id),
				bySessionId: agent.id,
				taskId: String(args.task_id)
			});
			return {
				taskId: task.taskId,
				status: "in-progress",
				assigneeSessionId: task.assigneeSessionId
			};
		}
	}));
	ctx.tools.register(defineTool({
		name: "room_transfer_task",
		description: "Hand one task to another member session. This is a cross-member handoff, so it goes through the approval flow: the request fails closed unless the user approves it. On approval, the task becomes in-progress under the new assignee, the handoff lands on the timeline, and the receiving member is woken with a directed message.",
		parameters: {
			room_id: {
				type: "string",
				required: true,
				description: "The room id from room_list_rooms."
			},
			task_id: {
				type: "string",
				required: true,
				description: "The task id from room_list_tasks."
			},
			to: {
				type: "string",
				required: true,
				description: "The member session id that receives the task."
			}
		},
		output: {
			schema: {
				type: "object",
				additionalProperties: false,
				properties: {
					taskId: {
						type: "string",
						required: true
					},
					assigneeSessionId: {
						type: "string",
						required: true
					},
					approved: {
						type: "boolean",
						required: true,
						const: true
					}
				}
			},
			render: (_args, value) => [{
				type: "text",
				text: `task ${value.taskId} handed to ${value.assigneeSessionId} (approved)`
			}],
			presentationMeta: (_args, value) => ({
				plugin: PLUGIN,
				action: "room-task-assigned",
				roomId: String(_args.room_id),
				taskId: value.taskId
			})
		},
		isConcurrencySafe: () => true,
		async execute(args, exec) {
			const agent = exec.agent;
			if (!agent) throw new Error("room_transfer_task requires a calling agent (exec.agent was undefined)");
			await requireApproval(approvalOf(ctx), {
				agent,
				toolName: "room_transfer_task",
				...exec.callId === void 0 ? {} : { callId: exec.callId },
				reason: `hand task ${String(args.task_id)} in room ${String(args.room_id)} to member ${String(args.to)}`,
				signal: exec.signal
			});
			const task = await hub.assignTask({
				roomId: String(args.room_id),
				bySessionId: agent.id,
				taskId: String(args.task_id),
				toSessionId: SessionId(String(args.to))
			});
			return {
				taskId: task.taskId,
				assigneeSessionId: task.assigneeSessionId,
				approved: true
			};
		}
	}));
	ctx.tools.register(defineTool({
		name: "room_complete_task",
		description: "Mark one task done. Only the task's assignee or the room owner may complete it; every member sees the completion on the timeline.",
		parameters: {
			room_id: {
				type: "string",
				required: true,
				description: "The room id from room_list_rooms."
			},
			task_id: {
				type: "string",
				required: true,
				description: "The task id from room_list_tasks."
			}
		},
		output: {
			schema: {
				type: "object",
				additionalProperties: false,
				properties: {
					taskId: {
						type: "string",
						required: true
					},
					status: {
						type: "string",
						required: true,
						const: "done"
					}
				}
			},
			render: (args, value) => [{
				type: "text",
				text: `task ${value.taskId} completed on room ${args.room_id}`
			}],
			presentationMeta: (args, value) => ({
				plugin: PLUGIN,
				action: "room-task-completed",
				roomId: String(args.room_id),
				taskId: value.taskId
			})
		},
		isConcurrencySafe: () => true,
		async execute(args, exec) {
			const agent = exec.agent;
			if (!agent) throw new Error("room_complete_task requires a calling agent (exec.agent was undefined)");
			return {
				taskId: (await hub.completeTask({
					roomId: String(args.room_id),
					bySessionId: agent.id,
					taskId: String(args.task_id)
				})).taskId,
				status: "done"
			};
		}
	}));
}
//#endregion
//#region src/room/projection.ts
/** Hard fold bound: `done` tasks kept per room in the projection value. */
const DONE_TASK_FOLD_BOUND = 100;
/** Upsert one room view without mutating the incoming state. */
function withRoom(state, roomId, patch) {
	if (!state.rooms.some((room) => room.roomId === roomId)) return state;
	return { rooms: state.rooms.map((room) => room.roomId === roomId ? patch(room) : room) };
}
/** Append one timeline entry (dedupe by seq) and drop the oldest past the bound. */
function appendTimeline(timeline, event) {
	if (timeline.some((existing) => existing.seq === event.seq)) return timeline;
	return [...timeline, event].sort((a, b) => a.seq - b.seq).slice(-1e3);
}
/** Upsert one task row (status/assignee deltas merge over the present row). */
function patchTask(room, taskId, patch) {
	if (!room.tasks.some((task) => task.taskId === taskId)) return room;
	return {
		...room,
		tasks: room.tasks.map((task) => task.taskId === taskId ? patch(task) : task)
	};
}
/**
* Fold one `team-room/fact` into the per-session state.
* @param state - the prior fold state.
* @param event - the fact event (already typed by the discriminator).
* @returns the next state; same reference when the event changes nothing.
*/
function applyFact(state, event) {
	const fact = event.data;
	switch (fact.kind) {
		case "room-joined": {
			if (state.rooms.some((room) => room.roomId === fact.roomId)) return state;
			const room = {
				roomId: fact.roomId,
				name: fact.name,
				createdAt: fact.createdAt,
				members: fact.members.map((member) => ({
					sessionId: member.sessionId,
					role: member.role,
					joinedAt: member.joinedAt
				})),
				tasks: fact.tasks.map((task) => ({
					taskId: task.taskId,
					title: task.title,
					description: task.description,
					status: task.status,
					assigneeSessionId: task.assigneeSessionId,
					createdBy: task.createdBy,
					createdAt: task.createdAt,
					updatedAt: task.updatedAt
				})),
				timeline: [...fact.timeline].sort((a, b) => a.seq - b.seq).slice(-1e3)
			};
			return { rooms: [...state.rooms, room] };
		}
		case "member-joined": return withRoom(state, fact.roomId, (room) => {
			if (room.members.some((member) => member.sessionId === fact.sessionId)) return room;
			return {
				...room,
				members: [...room.members, {
					sessionId: fact.sessionId,
					role: fact.role,
					joinedAt: fact.joinedAt
				}],
				timeline: appendTimeline(room.timeline, {
					roomId: fact.roomId,
					seq: fact.timelineSeq,
					kind: "member-joined",
					at: event.time,
					data: {
						sessionId: fact.sessionId,
						role: fact.role
					}
				})
			};
		});
		case "member-left": return withRoom(state, fact.roomId, (room) => ({
			...room,
			members: room.members.filter((member) => member.sessionId !== fact.sessionId),
			timeline: appendTimeline(room.timeline, {
				roomId: fact.roomId,
				seq: fact.timelineSeq,
				kind: "member-left",
				at: event.time,
				data: { sessionId: fact.sessionId }
			})
		}));
		case "message-posted": return withRoom(state, fact.roomId, (room) => ({
			...room,
			timeline: appendTimeline(room.timeline, {
				roomId: fact.roomId,
				seq: fact.timelineSeq,
				kind: fact.toSessionId === void 0 ? "message-posted" : "message-directed",
				at: event.time,
				data: {
					seq: fact.seq,
					senderSessionId: fact.senderSessionId,
					...fact.toSessionId === void 0 ? {} : { toSessionId: fact.toSessionId },
					text: fact.text
				}
			})
		}));
		case "task-created":
			if (!state.rooms.some((room) => room.roomId === fact.roomId)) return state;
			return withRoom(state, fact.roomId, (room) => {
				if (room.tasks.some((task) => task.taskId === fact.taskId)) return room;
				const task = {
					roomId: fact.roomId,
					taskId: fact.taskId,
					title: fact.title,
					description: fact.description,
					status: "todo",
					assigneeSessionId: fact.assigneeSessionId,
					createdBy: fact.createdBy,
					createdAt: fact.createdAt,
					updatedAt: fact.createdAt
				};
				return {
					...room,
					tasks: [...room.tasks, task],
					timeline: appendTimeline(room.timeline, {
						roomId: fact.roomId,
						seq: fact.timelineSeq,
						kind: "task-created",
						at: event.time,
						data: {
							taskId: fact.taskId,
							title: fact.title
						}
					})
				};
			});
		case "task-claimed": return withRoom(state, fact.roomId, (room) => ({
			...patchTask(room, fact.taskId, (task) => ({
				...task,
				status: "in-progress",
				assigneeSessionId: fact.assigneeSessionId,
				updatedAt: fact.at
			})),
			timeline: appendTimeline(room.timeline, {
				roomId: fact.roomId,
				seq: fact.timelineSeq,
				kind: "task-claimed",
				at: event.time,
				data: {
					taskId: fact.taskId,
					assigneeSessionId: fact.assigneeSessionId
				}
			})
		}));
		case "task-assigned": return withRoom(state, fact.roomId, (room) => ({
			...patchTask(room, fact.taskId, (task) => ({
				...task,
				status: "in-progress",
				assigneeSessionId: fact.assigneeSessionId,
				updatedAt: fact.at
			})),
			timeline: appendTimeline(room.timeline, {
				roomId: fact.roomId,
				seq: fact.timelineSeq,
				kind: "task-assigned",
				at: event.time,
				data: {
					taskId: fact.taskId,
					assigneeSessionId: fact.assigneeSessionId,
					bySessionId: fact.bySessionId
				}
			})
		}));
		case "task-completed":
			if (!state.rooms.some((room) => room.roomId === fact.roomId)) return state;
			return withRoom(state, fact.roomId, (room) => ({
				...patchTask(room, fact.taskId, (task) => ({
					...task,
					status: "done",
					updatedAt: fact.at
				})),
				timeline: appendTimeline(room.timeline, {
					roomId: fact.roomId,
					seq: fact.timelineSeq,
					kind: "task-completed",
					at: event.time,
					data: { taskId: fact.taskId }
				})
			}));
		/* v8 ignore next 2 -- the closed union is total by construction. */
		default: return state;
	}
}
/** Cap the done-task backlog per room, newest first. */
function capDoneTasks(room) {
	const done = room.tasks.filter((task) => task.status === "done").sort((a, b) => b.updatedAt - a.updatedAt).slice(0, DONE_TASK_FOLD_BOUND);
	if (done.length === room.tasks.filter((task) => task.status === "done").length) return room;
	const kept = new Set(done.map((task) => task.taskId));
	return {
		...room,
		tasks: room.tasks.filter((task) => task.status !== "done" || kept.has(task.taskId))
	};
}
/** The registered projection unit. */
const teamRoomProjectionDefinition = {
	key: "teamRoom",
	stateSchema: teamRoomViewSchema,
	init: () => ({ rooms: [] }),
	apply(state, event) {
		if (event.type !== "team-room/fact") return state;
		return applyFact(state, event);
	},
	wire: {
		viewSchema: teamRoomViewSchema,
		view: (state) => ({ rooms: state.rooms.map(capDoneTasks) })
	},
	stateVersion: 1
};
//#endregion
//#region src/index.ts
const name = "background-agents";
/** Hard service dependencies: tools, the subagent runtime, the agent registry, and the session store. */
const inject = [
	"tools",
	"subagents",
	"agents",
	"sessions"
];
/**
* The single source of truth for every optional policy default: the schema
* materializes from it and apply() falls back to it, so the two can never
* drift apart.
*/
const DEFAULTS = {
	autoReport: true,
	reportThrottleMs: 15e3,
	reportSummaryMaxChars: 300,
	resultMaxChars: 4e3,
	maxBackgroundAgents: 4,
	autoArchive: true,
	idleTimeoutMinutes: 120,
	idleSweepIntervalMs: 6e4,
	maxLabelChars: 120,
	reportDelivery: "quiet",
	maxRooms: 16,
	maxMembersPerRoom: 8,
	maxRoomsPerMember: 4,
	busRetention: 200,
	timelineRetention: 500,
	taskRetention: 50,
	maxMessageChars: 4e3,
	injectRoomBrief: true,
	roomOpenTimeoutMs: 15e3,
	allowUnmarkedFacts: false,
	observability: true,
	inbound: { enabled: false }
};
const Config = Schema.object({
	provider: Schema.string().required(),
	autoReport: Schema.boolean().default(DEFAULTS.autoReport),
	reportThrottleMs: Schema.natural().max(Number.MAX_SAFE_INTEGER).default(DEFAULTS.reportThrottleMs),
	reportSummaryMaxChars: Schema.natural().max(Number.MAX_SAFE_INTEGER).default(DEFAULTS.reportSummaryMaxChars),
	resultMaxChars: Schema.natural().min(1).max(Number.MAX_SAFE_INTEGER).default(DEFAULTS.resultMaxChars),
	maxBackgroundAgents: Schema.natural().max(Number.MAX_SAFE_INTEGER).default(DEFAULTS.maxBackgroundAgents),
	autoArchive: Schema.boolean().default(DEFAULTS.autoArchive),
	idleTimeoutMinutes: Schema.natural().min(1).max(Number.MAX_SAFE_INTEGER).default(DEFAULTS.idleTimeoutMinutes),
	idleSweepIntervalMs: Schema.natural().min(1).max(Number.MAX_SAFE_INTEGER).default(DEFAULTS.idleSweepIntervalMs),
	maxLabelChars: Schema.natural().max(Number.MAX_SAFE_INTEGER).default(DEFAULTS.maxLabelChars),
	reportDelivery: Schema.union([Schema.const("quiet"), Schema.const("wakeup")]).default(DEFAULTS.reportDelivery),
	childProvider: Schema.string(),
	childModel: Schema.string(),
	maxChildDepth: Schema.natural(),
	allowedChildTools: Schema.array(Schema.string()),
	maxRooms: Schema.natural().max(Number.MAX_SAFE_INTEGER).default(DEFAULTS.maxRooms),
	maxMembersPerRoom: Schema.natural().min(2).max(Number.MAX_SAFE_INTEGER).default(DEFAULTS.maxMembersPerRoom),
	maxRoomsPerMember: Schema.natural().min(1).max(Number.MAX_SAFE_INTEGER).default(DEFAULTS.maxRoomsPerMember),
	busRetention: Schema.natural().min(1).max(Number.MAX_SAFE_INTEGER).default(DEFAULTS.busRetention),
	timelineRetention: Schema.natural().min(1).max(Number.MAX_SAFE_INTEGER).default(DEFAULTS.timelineRetention),
	taskRetention: Schema.natural().max(Number.MAX_SAFE_INTEGER).default(DEFAULTS.taskRetention),
	maxMessageChars: Schema.natural().min(1).max(Number.MAX_SAFE_INTEGER).default(DEFAULTS.maxMessageChars),
	injectRoomBrief: Schema.boolean().default(DEFAULTS.injectRoomBrief),
	roomOpenTimeoutMs: Schema.natural().min(1).max(Number.MAX_SAFE_INTEGER).default(DEFAULTS.roomOpenTimeoutMs),
	allowUnmarkedFacts: Schema.boolean().default(DEFAULTS.allowUnmarkedFacts),
	observability: Schema.boolean().default(DEFAULTS.observability),
	inbound: Schema.object({
		enabled: Schema.boolean().default(DEFAULTS.inbound.enabled),
		command: Schema.string()
	})
});
/**
* Mount the four tools, the `backgroundAgents` projection unit, the
* throttled turn observer, and the idle-archive sweep.
* @param ctx - context carrying tools, subagents, and the agent registry.
* @param config - provider and lifecycle policy (Schemastery-validated).
*/
function apply(ctx, config) {
	const policy = {
		provider: config.provider,
		autoReport: config.autoReport ?? DEFAULTS.autoReport,
		reportThrottleMs: config.reportThrottleMs ?? DEFAULTS.reportThrottleMs,
		reportSummaryMaxChars: config.reportSummaryMaxChars ?? DEFAULTS.reportSummaryMaxChars,
		resultMaxChars: config.resultMaxChars ?? DEFAULTS.resultMaxChars,
		maxBackgroundAgents: config.maxBackgroundAgents ?? DEFAULTS.maxBackgroundAgents,
		autoArchive: config.autoArchive ?? DEFAULTS.autoArchive,
		idleTimeoutMinutes: config.idleTimeoutMinutes ?? DEFAULTS.idleTimeoutMinutes,
		idleSweepIntervalMs: config.idleSweepIntervalMs ?? DEFAULTS.idleSweepIntervalMs,
		maxLabelChars: config.maxLabelChars ?? DEFAULTS.maxLabelChars,
		reportDelivery: config.reportDelivery ?? DEFAULTS.reportDelivery,
		childProvider: config.childProvider,
		childModel: config.childModel,
		maxChildDepth: config.maxChildDepth,
		allowedChildTools: config.allowedChildTools,
		observability: config.observability ?? DEFAULTS.observability
	};
	const roomPolicy = {
		maxRooms: config.maxRooms ?? DEFAULTS.maxRooms,
		maxMembersPerRoom: config.maxMembersPerRoom ?? DEFAULTS.maxMembersPerRoom,
		maxRoomsPerMember: config.maxRoomsPerMember ?? DEFAULTS.maxRoomsPerMember,
		busRetention: config.busRetention ?? DEFAULTS.busRetention,
		timelineRetention: config.timelineRetention ?? DEFAULTS.timelineRetention,
		taskRetention: config.taskRetention ?? DEFAULTS.taskRetention,
		maxMessageChars: config.maxMessageChars ?? DEFAULTS.maxMessageChars,
		injectRoomBrief: config.injectRoomBrief ?? DEFAULTS.injectRoomBrief,
		roomOpenTimeoutMs: config.roomOpenTimeoutMs ?? DEFAULTS.roomOpenTimeoutMs
	};
	if (policy.provider.trim() === "") throw new Error("dsh-background-agents: `provider` must name a registered subagent provider");
	const registeredProvider = ctx.subagents.getProvider(policy.provider);
	if (registeredProvider !== void 0 && registeredProvider.prepareContinuable === void 0) throw new Error(`dsh-background-agents: subagent provider "${policy.provider}" cannot serve continuable children (no prepareContinuable capability)`);
	if (registeredProvider === void 0) ctx.logger("background-agents").info(`subagent provider "${policy.provider}" not registered yet; background_agent will fail until it appears`);
	const lifecycle = new BackgroundAgentLifecycle();
	const facts = new FactAppender(config.allowUnmarkedFacts ?? DEFAULTS.allowUnmarkedFacts, (message) => ctx.logger("background-agents").warn(message), (type) => ctx.logger("background-agents").info("fact %s recorded (log-only fact events are disabled on this host)", type));
	if (ctx.get("storageDomain") === void 0) {
		ctx.logger("background-agents").info("team rooms disabled: no storage domain composed (add @deepseek-ai/dsh-storage-domain to enable the /room command and the room_* tools)");
		if (config.inbound?.enabled) ctx.logger("background-agents").warn("cross-ecosystem inbound disabled: enabled but no storage domain composed (team rooms are required)");
	}
	ctx.inject(["storageDomain"], (roomCtx) => {
		const hub = new RoomHub(roomCtx, roomPolicy, roomCtx.agents, roomCtx.sessions, facts);
		hub.open().catch((error) => {
			roomCtx.logger("background-agents").error(`team room store failed to open: ${String(error)}`);
		});
		registerRoomTools(roomCtx, hub);
		roomCtx.effect(() => registerRoomCommand(roomCtx, hub) ?? (() => {}), "dsh-background-agents: /room command");
		roomCtx.on("agent/session-start", ({ agent }) => {
			hub.catchUp(agent.id).catch((error) => {
				roomCtx.logger("background-agents").warn(`room catch-up failed for ${agent.id}: ${String(error)}`);
			});
		});
		if (config.inbound?.enabled) {
			const command = config.inbound.command?.trim();
			if (command === void 0 || command === "") roomCtx.logger("background-agents").warn("inbound.enabled is true but inbound.command is empty; the stdio bridge stays dormant");
			else {
				const coordinator = new InboundCoordinator();
				const logger = roomCtx.logger("background-agents");
				roomCtx.effect(() => coordinator.registerInboundAdapter(new StdioJsonRpcInbound(command, logger), inboundRoomSink(hub, logger)), "dsh-background-agents: stdio JSON-RPC inbound bridge");
			}
		}
	});
	ctx.on("session/event", (session, event) => {
		const child = lifecycle.get(session.id);
		if (child === void 0) return;
		lifecycle.touch(session.id, event.time);
		if (policy.observability) {
			const folded = foldTurnMetrics(child.turnMetrics, event);
			child.turnMetrics = folded.state;
			if (folded.observation !== void 0) {
				const parent = ctx.agents.get(child.parentSessionId);
				if (parent !== void 0) facts.append(parent.session, FACT_EVENT, {
					kind: "metrics",
					agentId: child.childId,
					...folded.observation
				});
			}
		}
		if (event.type !== "turn/end") return;
		try {
			reportProgress(ctx.agents, ctx.sessions, policy, lifecycle, child, event.time, facts);
		} catch (error) {
			ctx.logger("background-agents").warn(`progress report failed for ${child.childId}: ${String(error)}`);
		}
	});
	ctx.effect(() => startIdleSweep(ctx, ctx.agents, policy, lifecycle, facts), "dsh-background-agents: idle sweep");
	ctx.inject(["sessionProjections"], (projectionCtx) => {
		projectionCtx.sessionProjections.register(backgroundAgentsProjectionDefinition);
		projectionCtx.sessionProjections.register(teamRoomProjectionDefinition);
	});
	registerBackgroundAgentTools(ctx, policy, lifecycle, facts);
	ctx.inject(["systemPrompt"], (promptCtx) => {
		promptCtx.systemPrompt.section({
			name: "tool:background-agents",
			order: 107,
			text: "Track every background agent id you start. You are notified in-session when a background agent completes a turn (autoReport) and when it settles — do not busy-poll bg_list. Keep working on independent steps, use bg_message to steer an agent instead of waiting for it, read settled results with bg_result, and bg_stop agents that stopped mattering."
		});
		promptCtx.systemPrompt.section({
			name: "tool:team-rooms",
			order: 108,
			text: "When this session is a member of a team room, room messages are delivered into this conversation automatically — do not busy-poll room_read. Keep room turns brief: room_post sends messages, room_list_tasks/room_claim_task work the shared board, and room_transfer_task asks approval before handing a task to another member."
		});
	});
}
/**
* The room half of the inbound bridge: execute {@link deliveriesFor} against
* the team room's task board and message bus. External runtimes are not DSH
* sessions, so the room owner's member session stands in as the sender; a
* room with no owner member drops the event (fail-closed). The `traceId →
* taskId` map lets `agent_finished` close the card `agent_started` opened.
* @param hub - the room service owning the durable state.
* @param logger - where bridge rejection lines are logged.
* @returns the sink the stdio adapter emits normalized events into.
*/
function inboundRoomSink(hub, logger) {
	const openTasks = /* @__PURE__ */ new Map();
	return async (event) => {
		const sender = await ownerSessionOf(hub, event.roomId);
		if (sender === void 0) {
			logger.warn(`inbound: room ${event.roomId} has no owner member; dropped ${event.method} (fail-closed)`);
			return;
		}
		try {
			for (const delivery of deliveriesFor(event)) switch (delivery.kind) {
				case "task-open": {
					const task = await hub.createTask({
						roomId: delivery.roomId,
						bySessionId: sender,
						title: delivery.title
					});
					openTasks.set(delivery.traceId, task.taskId);
					break;
				}
				case "bus-post":
					await hub.postMessage({
						roomId: delivery.roomId,
						senderSessionId: sender,
						text: delivery.text
					});
					break;
				case "task-close": {
					const taskId = openTasks.get(delivery.traceId);
					if (taskId !== void 0) {
						await hub.completeTask({
							roomId: delivery.roomId,
							bySessionId: sender,
							taskId
						});
						openTasks.delete(delivery.traceId);
					}
					break;
				}
			}
		} catch (error) {
			logger.warn(`inbound: delivery for ${event.method} failed: ${String(error)}`);
		}
	};
}
/** Resolve the room's owner member session id (the bridge sender), or undefined. */
async function ownerSessionOf(hub, roomId) {
	const owner = (await hub.room(roomId))?.members.find((member) => member.role === "owner");
	return owner === void 0 ? void 0 : SessionId(owner.sessionId);
}
//#endregion
export { Config, DEFAULTS, apply, inject, name };
